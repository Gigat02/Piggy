// Assalto: regole senza DOM (mappa, truppe, ondata simulata a passi fissi, accampamento).
// Lo stato è JSON: si salva fra un'ondata e l'altra.
import { APIGS, RARITY_ORDER, HIT_KEYS } from './arena-data.js';
import { ASSAULTS, MAX_WAVES, WAVE_TIME, MAP_W, MAP_H, START_GOLD, START_RANCIO, RANCIO_GROWTH, MAX_SQUADS, SQUAD_SLOT_MAX, SPAWN_GAP,
         DEPLOY_COST, BUY_COST, LEVEL_COST, MAX_LEVEL, REROLL, rancioCost, slotCost, CHARM_PRICE, marketOdds,
         DEFENDERS, DEF_POOL, DEF_START, DEF_LEVEL, REINFORCE, FARMHOUSE_HP, FARM_NAMES, ACHARMS_A } from './assault-data.js';

// ---------- casualità riproducibile ----------
function rnd(o) {
  o.rng = (o.rng + 0x6D2B79F5) | 0;
  let t = o.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (o, n) => Math.floor(rnd(o) * n);
const pick = (o, a) => a[ri(o, a.length)];
function weighted(o, items, w) {
  const tot = items.reduce((s, it) => s + w(it), 0);
  let r = rnd(o) * tot;
  for (const it of items) { r -= w(it); if (r < 0) return it; }
  return items[items.length - 1];
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const round1 = (x) => Math.round(x * 10) / 10;
export const fmt = (x) => { const r = round1(x); return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ','); };

// =====================================================================
// Mappa: prato, strade dai cancelli (a sinistra) alla fattoria (a destra), posti per i difensori
// =====================================================================
export const HOUSE = { x: 17, y: 4, w: 3, h: 3 }, TARGET = { x: 16, y: 5 };
const inHouse = (x, y) => x >= HOUSE.x && x < HOUSE.x + HOUSE.w && y >= HOUSE.y && y < HOUSE.y + HOUSE.h;

// Ogni cancello ha la sua corsia, dentro la propria fascia della mappa: le corsie non si sovrappongono
// e si uniscono solo nelle ultime caselle davanti alla porta. Così ogni strada ha i suoi contadini.
export function genMap(seed, assault) {
  const R = { rng: seed | 0 };
  const road = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  const lane = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(-1));
  const mark = (x, y, l) => {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H || inHouse(x, y)) return;
    road[y][x] = true;
    if (lane[y][x] < 0) lane[y][x] = l;
  };
  const nGates = assault === 1 ? 2 : 3;
  const bands = nGates === 2 ? [[1, 4], [6, 9]] : [[1, 2], [4, 6], [8, 9]];
  const JOIN = 13 + ri(R, 2); // colonna in cui le corsie piegano verso la porta
  const gates = [];
  bands.forEach(([lo, hi], l) => {
    let y = lo + ri(R, hi - lo + 1), x = 0;
    gates.push({ x: 0, y });
    mark(0, y, l);
    while (x < JOIN) {
      const len = 2 + ri(R, 3);
      for (let k = 0; k < len && x < JOIN; k++) { x++; mark(x, y, l); }
      if (x >= JOIN || x < 2 || hi === lo || rnd(R) < 0.25) continue;
      // curva dentro la propria fascia
      let ny = lo + ri(R, hi - lo + 1);
      if (ny === y) ny = y > lo ? y - 1 : y + 1;
      while (y !== ny) { y += Math.sign(ny - y); mark(x, y, l); }
    }
    while (y !== TARGET.y) { y += Math.sign(TARGET.y - y); mark(x, y, l); }
    while (x < TARGET.x) { x++; mark(x, y, l); }
  });
  const near = (x, y, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < MAP_H && xx >= 0 && xx < MAP_W && road[yy][xx]) return lane[yy][xx];
    }
    return null;
  };
  const slots = [], decor = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 1; x < MAP_W; x++) {
    if (road[y][x] || inHouse(x, y)) continue;
    const l = near(x, y, 1);
    if (l != null && x >= 2 && x <= 16) slots.push({ x, y, lane: x >= JOIN ? -1 : l });
    else if (near(x, y, 0) == null && rnd(R) < 0.22 && !(x >= 15 && y >= 3 && y <= 7)) decor.push({ x, y, k: pick(R, ['albero', 'albero', 'cespuglio', 'sasso', 'fieno', 'fiori']) });
  }
  const traps = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 4; x < JOIN; x++) if (road[y][x]) traps.push({ x, y, lane: lane[y][x] });
  const map = { seed, road: road.map((r) => r.map((v) => (v ? 1 : 0)).join('')), gates, slots, traps, decor, join: JOIN, name: pick(R, FARM_NAMES) };
  map.paths = gates.map((g) => pathFrom(map, g));
  return map;
}
const isRoad = (map, x, y) => x >= 0 && x < MAP_W && y >= 0 && y < MAP_H && map.road[y][x] === '1';
function bfs(road, from) {
  const d = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(-1));
  const q = [from]; d[from.y][from.x] = 0;
  while (q.length) {
    const c = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + dx, y = c.y + dy;
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H || d[y][x] >= 0) continue;
      const ok = typeof road[y] === 'string' ? road[y][x] === '1' : road[y][x];
      if (!ok) continue;
      d[y][x] = d[c.y][c.x] + 1; q.push({ x, y });
    }
  }
  return d;
}
// Strada più corta da un cancello alla porta della fattoria: punti (centri delle caselle) e lunghezze cumulate.
export function pathFrom(map, g) {
  const d = bfs(map.road, TARGET);
  const pts = [{ x: g.x + 0.5, y: g.y + 0.5 }];
  let c = { x: g.x, y: g.y };
  for (let guard = 0; guard < 400 && !(c.x === TARGET.x && c.y === TARGET.y); guard++) {
    let best = null;
    for (const [dx, dy] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) {
      const x = c.x + dx, y = c.y + dy;
      if (isRoad(map, x, y) && d[y][x] >= 0 && d[y][x] < d[c.y][c.x] && (!best || d[y][x] < d[best.y][best.x])) best = { x, y };
    }
    if (!best) break;
    c = best; pts.push({ x: c.x + 0.5, y: c.y + 0.5 });
  }
  pts.push({ x: HOUSE.x + 0.4, y: TARGET.y + 0.5 }); // la porta
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  return { pts, cum, len: cum[cum.length - 1] };
}
export function posAt(path, s) {
  const { pts, cum } = path;
  if (s <= 0) return { x: pts[0].x, y: pts[0].y, dx: 1 };
  if (s >= path.len) { const p = pts[pts.length - 1]; return { x: p.x, y: p.y, dx: 1 }; }
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: b.x - a.x };
}

// =====================================================================
// Truppe
// =====================================================================
export function roleOf(id) {
  const d = APIGS[id], h = d.hit || {};
  if (h.heal || h.shield) return 'supporto';
  if ((h.burn || h.poison || h.mud || h.stun) && d.atk < 8) return 'untore';
  // i maialini snelli e piccoli corrono, i robusti combattono
  if (d.look.shape === 'lungo' || d.look.shape === 'mini' || (d.crit && d.look.shape !== 'grasso')) return 'corridore';
  return 'guerriero';
}
export const levelMult = (L) => 1 + 0.5 * (L - 1);
export const hasCharm = (run, k) => run.charms.includes(k);
// Statistiche d'assalto di una squadra (tutti i maialini della squadra sono uguali).
export function troopStats(sq, charms = []) {
  const d = APIGS[sq.id], L = sq.level, m = levelMult(L);
  const has = (k) => charms.includes(k);
  const role = roleOf(sq.id);
  const hit = {};
  for (const k of HIT_KEYS) { const v = (d.hit || {})[k] || 0; if (v) hit[k] = Math.max(v, Math.round(v * m)); }
  if (has('braciere') && hit.burn) hit.burn += 2;
  if (has('fiala') && hit.poison) hit.poison += 1;
  if (has('palude') && hit.mud) hit.mud += 2;
  const base = role === 'guerriero' ? 1.6 : role === 'untore' ? 2.2 : role === 'supporto' ? 1.8 : 0;
  const speed = (role === 'corridore' ? 1.6 : role === 'guerriero' ? 0.9 : 1) * (has('corno') ? 1.15 : 1);
  return {
    role, cost: DEPLOY_COST[d.r],
    hp: Math.round(d.hp * 1.5 * (role === 'guerriero' ? 1.3 : 1) * m * (has('stendardo') ? 1.15 : 1)),
    atk: round1(d.atk * 2 * m), cd: d.cd, crit: (d.crit || 0) + (has('mirino') ? 10 : 0),
    range: base, speed: round1(speed),
    siege: Math.round((5 + d.atk * 0.7 + d.hp * 0.12) * m * (role === 'corridore' ? 1.7 : 1)),
    hit,
  };
}

// =====================================================================
// Partita
// =====================================================================
export function newRun(seed) {
  const run = {
    v: 2, seed, rng: seed | 0, assault: 1, wave: 1, gold: START_GOLD, rancioMax: START_RANCIO, rancioBought: 0, slots: MAX_SQUADS,
    squads: [], charms: [], market: [], charmOffer: null, uid: 0, map: null, defs: [], house: null, over: null, last: null,
    stats: { ondate: 0, difensori: 0, arrivati: 0, caduti: 0, danniFattoria: 0, fattorie: 0 },
  };
  startAssault(run);
  return run;
}
export function startAssault(run) {
  const a = run.assault;
  run.map = genMap((run.seed + a * 7907) | 0, a);
  run.wave = 1;
  run.house = { hp: FARMHOUSE_HP[a - 1], max: FARMHOUSE_HP[a - 1] };
  run.defs = [];
  addDefenders(run, DEF_START[a - 1], false);
  rollMarket(run);
}
function defLevel(run) { return DEF_LEVEL[run.assault - 1] + Math.floor((run.wave - 1) / 3); }
export const defMult = (L) => 1 + 0.4 * (L - 1);
// Aggiunge difensori su posti liberi, sparsi lungo le strade.
// lane: corsia da rinforzare (indice del cancello); null = distribuiti a turno su tutte le corsie
function addDefenders(run, n, fresh, focus = null) {
  const pool = DEF_POOL[run.assault - 1], map = run.map;
  const added = [];
  for (let k = 0; k < n; k++) {
    const type = weighted(run, Object.keys(pool), (t) => pool[t]);
    const D = DEFENDERS[type];
    const want = focus != null ? focus : k % map.gates.length;
    const spots = D.trap ? map.traps : map.slots;
    const free = spots.filter((p) => !run.defs.some((d) => d.alive && Math.abs(d.x - (p.x + 0.5)) < 1.1 && Math.abs(d.y - (p.y + 0.5)) < 1.1));
    if (!free.length) continue;
    const mine = free.filter((p) => p.lane === want);
    const p = pick(run, mine.length ? mine : free);
    const L = defLevel(run), mm = defMult(L);
    const def = { uid: ++run.uid, k: type, x: p.x + 0.5, y: p.y + 0.5, L, hp: Math.round((D.hp || 1) * mm), max: Math.round((D.hp || 1) * mm), alive: true, fresh };
    run.defs.push(def);
    added.push(def);
  }
  return added;
}

// ---------- accampamento ----------
export function rollMarket(run) {
  const odds = marketOdds(run.assault, run.wave);
  run.market = Array.from({ length: 4 }, () => {
    const r = weighted(run, RARITY_ORDER, (x) => odds[RARITY_ORDER.indexOf(x)]);
    const ids = Object.keys(APIGS).filter((id) => APIGS[id].r === r);
    return { id: pick(run, ids), price: BUY_COST[r] };
  });
  const free = Object.keys(ACHARMS_A).filter((k) => !run.charms.includes(k));
  run.charmOffer = free.length ? pick(run, free) : null;
}
export function reroll(run) {
  if (run.gold < REROLL) return 'Ghiande insufficienti.';
  run.gold -= REROLL;
  const keep = run.charmOffer;
  rollMarket(run);
  run.charmOffer = keep;
  return null;
}
// Compra dal mercato. Se la squadra c'è già, sale di livello; se il campo è pieno serve `replace` (indice da congedare).
export function buyTroop(run, i, replace = null) {
  const it = run.market[i];
  if (!it || it.sold) return 'Già comprato.';
  if (run.gold < it.price) return 'Ghiande insufficienti.';
  const own = run.squads.find((s) => s.id === it.id);
  if (own) {
    if (own.level >= MAX_LEVEL) return 'Questa squadra è già al livello massimo.';
    own.level++;
  } else {
    if (run.squads.length >= run.slots) {
      if (replace == null) return 'full';
      run.squads.splice(replace, 1);
    }
    run.squads.push({ uid: ++run.uid, id: it.id, level: 1 });
  }
  run.gold -= it.price;
  it.sold = true;
  return null;
}
export function levelUp(run, idx) {
  const sq = run.squads[idx];
  if (!sq || sq.level >= MAX_LEVEL) return 'Livello massimo.';
  const c = LEVEL_COST[sq.level];
  if (run.gold < c) return 'Ghiande insufficienti.';
  run.gold -= c; sq.level++;
  return null;
}
export function dismiss(run, idx) { if (run.squads.length > 1) run.squads.splice(idx, 1); }
export function moveSquad(run, idx, dir) {
  const j = idx + dir;
  if (j < 0 || j >= run.squads.length) return;
  [run.squads[idx], run.squads[j]] = [run.squads[j], run.squads[idx]];
}
export function buyRancio(run) {
  const c = rancioCost(run.rancioBought);
  if (run.gold < c) return 'Ghiande insufficienti.';
  run.gold -= c; run.rancioBought++; run.rancioMax += 2;
  return null;
}
export function buySlot(run) {
  if (run.slots >= SQUAD_SLOT_MAX) return 'Hai già il massimo di squadre.';
  const c = slotCost(run.slots);
  if (run.gold < c) return 'Ghiande insufficienti.';
  run.gold -= c; run.slots++;
  return null;
}
export function buyCharm(run) {
  if (!run.charmOffer) return 'Nessun ciondolo in vendita.';
  if (run.gold < CHARM_PRICE) return 'Ghiande insufficienti.';
  run.gold -= CHARM_PRICE; run.charms.push(run.charmOffer); run.charmOffer = null;
  return null;
}
export const waveRancio = (run) => run.rancioMax + (hasCharm(run, 'pentolone') ? 3 : 0);

// =====================================================================
// Ondata: simulazione a passi fissi (la usa sia l'interfaccia sia il bot di bilanciamento)
// =====================================================================
export const DT = 0.05;
// attacco su più fronti: ogni corsia in più da cui arrivano maialini nella stessa ondata dà +20% ai danni alla fattoria
export const frontBonus = (n) => 1 + 0.2 * Math.max(0, n - 1);
export function startWave(run) {
  for (const d of run.defs) { d.fresh = false; d.burn = 0; d.poison = 0; d.mud = 0; d.stun = 0; d.timer = 0.3 + rnd(run) * 0.8; }
  run.W = {
    t: 0, step: 0, units: [], queue: run.map.gates.map(() => []), nextSpawn: run.map.gates.map(() => 0), used: run.map.gates.map(() => 0), fronts: run.map.gates.map(() => false),
    rancio: waveRancio(run), fx: [], killed: 0, arrived: 0, lost: 0, houseDmg: 0, gold: 0, deployed: 0, done: false,
    squads: run.squads.map((sq) => ({ ...troopStats(sq, run.charms), id: sq.id, uid: sq.uid })),
  };
}
const minCost = (run) => Math.min(...run.W.squads.map((s) => s.cost));
// Mette in coda `n` maialini della squadra `si` al cancello `g`. Restituisce quanti ne ha schierati.
export function deploy(run, si, g, n = 1) {
  const W = run.W, sq = W.squads[si];
  if (!W || W.done || !sq) return 0;
  let k = 0;
  while (k < n && W.rancio >= sq.cost) { W.rancio -= sq.cost; W.queue[g].push(si); W.used[g] += sq.cost; k++; }
  W.deployed += k;
  return k;
}
function spawn(run, si, g) {
  const W = run.W, sq = W.squads[si], path = run.map.paths[g];
  const p = posAt(path, 0);
  W.units.push({
    uid: ++run.uid, si, id: sq.id, role: sq.role, hp: sq.hp, max: sq.hp, atk: sq.atk, cd: sq.cd, crit: sq.crit, hit: sq.hit,
    range: sq.range, speed: sq.speed, siege: sq.siege, g, s: 0, x: p.x, y: p.y, dx: 1, timer: 0.4, stun: 0, shield: 0, alive: true, fighting: false,
  });
}
function hurtUnit(run, u, dmg, from) {
  const W = run.W;
  if (!u.alive) return;
  if (u.role === 'corridore' && rnd(run) < 0.2) { W.fx.push({ k: 'txt', x: u.x, y: u.y, txt: 'schivato!', c: '#2f7fe0' }); return; }
  let a = dmg * (u.role === 'guerriero' ? 0.8 : 1) * (hasCharm(run, 'elmo') ? 0.85 : 1);
  if (u.shield > 0) { const b = Math.min(u.shield, a); u.shield -= b; a -= b; }
  u.hp -= a;
  W.fx.push({ k: 'dmg', x: u.x, y: u.y, v: a, c: '#fff' });
  if (u.hp <= 0) {
    u.alive = false; W.lost++; run.stats.caduti++;
    W.fx.push({ k: 'poof', x: u.x, y: u.y });
  }
}
function hurtDef(run, d, dmg, u) {
  const W = run.W;
  if (!d.alive) return;
  d.hp -= dmg;
  W.fx.push({ k: 'dmg', x: d.x, y: d.y - 0.3, v: dmg, c: '#ffd34d' });
  if (d.hp <= 0) {
    d.alive = false; W.killed++; run.stats.difensori++;
    const g = 2 + d.L;
    W.gold += g;
    W.fx.push({ k: 'kill', x: d.x, y: d.y, txt: `+${g} 🌰` });
  }
}
// un colpo di un maialino a un difensore: danni + effetti per colpo (il critico raddoppia tutto)
function strike(run, u, d) {
  const W = run.W;
  const crit = rnd(run) * 100 < u.crit, cm = crit ? 2 : 1;
  W.fx.push({ k: 'shot', from: { x: u.x, y: u.y }, to: { x: d.x, y: d.y }, c: u.hit.burn ? '#f06a1c' : u.hit.poison ? '#7b3fb0' : u.hit.mud ? '#8a5a33' : '#ffffff', melee: u.range < 2 });
  if (u.atk > 0) hurtDef(run, d, u.atk * cm * (hasCharm(run, 'coppa') ? 1.2 : 1), u);
  if (!d.alive) return;
  if (u.hit.burn) d.burn += u.hit.burn * cm;
  if (u.hit.poison) d.poison += u.hit.poison * cm;
  if (u.hit.mud) d.mud += u.hit.mud * cm;
  if (u.hit.stun && rnd(run) * 100 < u.hit.stun) { d.stun = W.t + 1; W.fx.push({ k: 'txt', x: d.x, y: d.y - 0.5, txt: '💫', c: '#d9a400' }); }
}
const DEF_TARGETABLE = (d) => d.alive && !DEFENDERS[d.k].trap;
export function waveStep(run) {
  const W = run.W, map = run.map;
  if (W.done) return;
  W.step++; W.t = W.step * DT;
  const t = W.t, sec = W.step % 20 === 0;
  // uscita dai cancelli
  W.queue.forEach((q, g) => { if (q.length && t >= W.nextSpawn[g]) { spawn(run, q.shift(), g); W.nextSpawn[g] = t + SPAWN_GAP; } });
  const units = W.units.filter((u) => u.alive);
  const defs = run.defs.filter((d) => d.alive);
  // ---- maialini ----
  for (const u of units) {
    if (!u.alive) continue;
    const stunned = u.stun > t;
    const inRange = u.range ? defs.filter((d) => DEF_TARGETABLE(d) && dist(d, u) <= u.range) : [];
    const target = inRange.sort((a, b) => dist(a, u) - dist(b, u))[0];
    u.fighting = u.role === 'guerriero' && !!target;
    // attacco
    u.timer -= DT;
    if (!stunned && target && u.timer <= 0 && u.role !== 'corridore') { strike(run, u, target); u.timer = u.cd; }
    // supporti: cure e scudi ai vicini
    if (!stunned && u.role === 'supporto' && u.timer <= 0) {
      const mult = hasCharm(run, 'ricettario') ? 1.5 : 1;
      for (const o of units) if (o.alive && dist(o, u) <= u.range) {
        if (u.hit.heal) { const h = Math.min(o.max - o.hp, u.hit.heal * 3 * mult); if (h > 0) { o.hp += h; W.fx.push({ k: 'heal', x: o.x, y: o.y, v: h }); } }
        if (u.hit.shield) o.shield = Math.min(o.max * 0.5, o.shield + u.hit.shield * 3 * mult);
      }
      u.timer = u.cd;
    }
    // movimento
    if (stunned || u.fighting) continue;
    let sp = u.speed;
    for (const d of defs) { const D = DEFENDERS[d.k]; if (D.slow && dist(d, u) <= D.range) { sp *= 1 - D.slow / 100; break; } }
    u.s += sp * DT;
    const path = map.paths[u.g];
    if (u.s >= path.len) {
      u.alive = false;
      W.fronts[u.g] = true;
      const fronts = W.fronts.filter(Boolean).length;
      const dmg = u.siege * (hasCharm(run, 'ariete') ? 1.25 : 1) * frontBonus(fronts);
      run.house.hp = Math.max(0, run.house.hp - dmg);
      W.houseDmg += dmg; W.arrived++; run.stats.arrivati++; run.stats.danniFattoria += dmg;
      W.fx.push({ k: 'house', v: dmg, txt: '' });
      continue;
    }
    const p = posAt(path, u.s);
    u.x = p.x; u.y = p.y; if (Math.abs(p.dx) > 0.01) u.dx = p.dx;
  }
  // ---- difensori ----
  for (const d of defs) {
    if (!d.alive) continue;
    const D = DEFENDERS[d.k], mm = defMult(d.L);
    if (sec) {
      if (d.burn > 0) { hurtDef(run, d, d.burn); d.burn = Math.max(0, d.burn - Math.max(1, Math.round(d.burn * 0.2))); }
      if (d.alive && d.poison > 0 && W.step % 40 === 0) hurtDef(run, d, d.poison);
      if (!d.alive) continue;
    }
    if (d.stun > t) continue;
    d.timer -= DT;
    if (d.timer > 0) continue;
    const slowFire = 1 + Math.min(50, d.mud * 3) / 100;
    const alive = W.units.filter((u) => u.alive);
    if (D.trap) {
      const u = alive.find((v) => dist(v, d) <= 0.45);
      if (u) { u.stun = t + D.stun; hurtUnit(run, u, D.dmg * mm, d); W.fx.push({ k: 'trap', x: d.x, y: d.y }); d.timer = D.cd; }
      continue;
    }
    if (D.heal) {
      const hurt = run.defs.filter((o) => o.alive && o.hp < o.max && dist(o, d) <= D.range).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      if (hurt) { const h = Math.min(hurt.max - hurt.hp, D.heal * mm); hurt.hp += h; W.fx.push({ k: 'heal', x: hurt.x, y: hurt.y, v: h }); d.timer = D.cd * slowFire; }
      continue;
    }
    if (!D.dmg) continue;
    const inR = alive.filter((u) => dist(u, d) <= D.range);
    if (!inR.length) continue;
    // provocazione dei Guerrieri, poi chi è più avanti sulla strada
    inR.sort((a, b) => ((b.role === 'guerriero') - (a.role === 'guerriero')) || (b.s / map.paths[b.g].len - a.s / map.paths[a.g].len));
    const targets = inR.slice(0, D.targets || 1);
    for (const u of targets) {
      W.fx.push({ k: 'shot', from: { x: d.x, y: d.y }, to: { x: u.x, y: u.y }, c: d.k === 'fucile' || d.k === 'doppietta' ? '#fff3a0' : d.k === 'trattore' ? '#c99a5b' : '#e8d9b5', def: d.k });
      hurtUnit(run, u, D.dmg * mm, d);
      if (D.splash) for (const o of alive) if (o !== u && o.alive && dist(o, u) <= D.splash) hurtUnit(run, o, D.dmg * mm * 0.6, d);
      if (D.knock && u.alive) u.s = Math.max(0, u.s - D.knock);
    }
    d.timer = D.cd * slowFire;
  }
  // ---- fine ondata ----
  const nobody = !W.units.some((u) => u.alive) && W.queue.every((q) => !q.length);
  if (run.house.hp <= 0 || t >= WAVE_TIME || (nobody && W.rancio < minCost(run))) W.done = true;
}

// Chiude l'ondata: ghiande, rinforzi, fattoria conquistata o fine partita. Restituisce il riepilogo.
export function endWave(run) {
  const W = run.W;
  const conquered = run.house.hp <= 0;
  const share = W.houseDmg / run.house.max;
  let gold = W.gold + 3 + Math.floor(share * 15) + (conquered ? 15 : 0);
  if (hasCharm(run, 'sacco')) gold = Math.round(gold * 1.25);
  run.gold += gold;
  run.stats.ondate++;
  const sum = { assault: run.assault, farm: run.map.name, wave: run.wave, conquered, killed: W.killed, arrived: W.arrived, lost: W.lost, houseDmg: Math.round(W.houseDmg), gold, reinf: [], over: null };
  run.rancioMax += RANCIO_GROWTH;
  if (conquered) {
    run.stats.fattorie++;
    if (run.assault >= ASSAULTS) run.over = 'win';
    else { run.assault++; startAssault(run); }
  } else if (run.wave >= MAX_WAVES) run.over = 'lose';
  else {
    run.wave++;
    // i contadini rinforzano la strada che hai usato di più
    const tot = W.used.reduce((a, b) => a + b, 0);
    const focus = tot ? W.used.indexOf(Math.max(...W.used)) : null;
    const heavy = tot && Math.max(...W.used) / tot > 0.6;
    sum.focus = focus; sum.heavy = !!heavy;
    sum.reinf = addDefenders(run, REINFORCE[run.assault - 1] + (heavy ? 1 : 0), true, focus).map((d) => d.k);
    run.lastFocus = focus;
    rollMarket(run);
  }
  sum.over = run.over;
  run.last = sum;
  run.W = null;
  return sum;
}

// ---------- utilità per l'interfaccia e il bot ----------
export const pathLen = (run, g) => run.map.paths[g].len;
export function threatOnPath(run, g) {
  const path = run.map.paths[g];
  let thr = 0;
  for (const d of run.defs) {
    if (!d.alive) continue;
    const D = DEFENDERS[d.k];
    if (!D.dmg) continue;
    if (path.pts.some((p) => dist(p, d) <= D.range)) thr += D.dmg / D.cd * defMult(d.L);
  }
  return thr;
}
export { DEFENDERS, MAX_WAVES, ASSAULTS };
