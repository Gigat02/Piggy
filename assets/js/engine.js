// Regole del gioco. Nessun accesso al DOM: lo stato è un oggetto JSON (run),
// così si salva, si annulla e si riprende con una semplice copia.
import { CARDS, RELICS, UPGRADES, PIGS, STARTING_DECK, DAILY_RULES } from './data.js';

export const H = 6;
export const N4 = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // est, sud, ovest, nord (senso orario)
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

export const inb = (D, x, y) => x >= 0 && y >= 0 && x < D.w && y < H;
export const cell = (D, x, y) => D.grid[y * D.w + x];
export const has = (run, id) => run.relics.includes(id);
export const isPig = (run, id) => run.pig === id;
export const rule = (run, id) => !!run.rules && run.rules.includes(id);
export const isRelax = (run) => run.variant === 'relax';
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const xy = (D, i) => ({ x: i % D.w, y: (i / D.w) | 0 });
const same = (a, b) => a.x === b.x && a.y === b.y;

// ---------- casualità riproducibile (il seme vive nello stato) ----------
export function rand(run) {
  run.rng = (run.rng + 0x6D2B79F5) | 0;
  let t = run.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (run, n) => Math.floor(rand(run) * n);
const pick = (run, arr) => arr[ri(run, arr.length)];
function shuffle(run, a) {
  for (let i = a.length - 1; i > 0; i--) { const j = ri(run, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function weighted(run, items, w) {
  const tot = items.reduce((s, it) => s + w(it), 0);
  let r = rand(run) * tot;
  for (const it of items) { r -= w(it); if (r < 0) return it; }
  return items[items.length - 1];
}
// Le due regole della sfida del giorno, uguali per tutti in quella data.
export function dailyRules(seed) {
  const tmp = { rng: seed ^ 0x5bd1e995 };
  const ids = Object.keys(DAILY_RULES);
  const good = ids.filter((id) => DAILY_RULES[id].good), bad = ids.filter((id) => !DAILY_RULES[id].good);
  return [pick(tmp, good), pick(tmp, bad)];
}
export function seedFrom(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h | 0;
}

// ---------- difficoltà: cresce col giorno, e dal 6° si stringe ----------
export function config(day, variant = 'roguelike') {
  const d = day;
  if (variant === 'relax') return {
    w: d < 8 ? 8 : d < 16 ? 9 : 10, turns: 0,
    farmers: d < 1 ? 0 : d < 6 ? 1 : d < 13 ? 2 : 3,
    crows: d < 2 ? 0 : d < 8 ? 1 : 2,
    dogs: d < 4 ? 0 : d < 11 ? 1 : 2,
    geese: 0, bulls: 0, gold: 0, sun: 0, bolt: false, sight: 0, belly: false,
  };
  return {
    w: d < 5 ? 8 : d < 10 ? 9 : d < 15 ? 10 : d < 20 ? 11 : 12,
    turns: 7,
    farmers: d < 1 ? 0 : d < 6 ? 1 : d < 12 ? 2 : 3,
    crows: d < 2 ? 0 : d < 5 ? 1 : d < 10 ? 2 : 3,
    dogs: d < 5 ? 0 : d < 11 ? 1 : 2,
    geese: d < 3 ? 0 : d < 8 ? 1 : 2,
    bulls: d < 9 ? 0 : d < 16 ? 1 : 2,
    gold: d < 3 ? 0 : d < 8 ? 1 : 2,
    sun: d < 2 ? 0 : d < 7 ? 1 : 2,
    bolt: d >= 6,
    sight: d >= 14 ? 1 : 0,
    belly: d >= 7,
  };
}
export const isMarketDay = (day) => day % 3 === 2;

function makeGoals(run, cfg) {
  const d = run.day;
  if (isRelax(run)) {
    const kinds = d === 0 ? ['mele'] : d === 1 ? ['fango'] : rand(run) < 0.6 ? ['mele', 'fango'] : [rand(run) < 0.5 ? 'mele' : 'fango'];
    const ramp = Math.max(0, d - 7) * 0.5, mult = kinds.length === 1 ? 1.4 : 1, g = {};
    if (kinds.includes('mele')) g.mele = Math.round((4 + d * 0.9 + ramp) * mult);
    if (kinds.includes('fango')) g.fango = Math.round((4 + d * 0.8 + ramp) * mult);
    return g;
  }
  let kinds;
  if (d === 0) kinds = ['mele'];
  else if (d === 1) kinds = ['fango'];
  else if (d === 2) kinds = ['mele', 'fango'];
  else {
    const r = rand(run);
    if (cfg.belly && r < 0.4) kinds = ['mele', 'fango', 'pancia'];
    else if (r < 0.7) kinds = ['mele', 'fango'];
    else kinds = [r < 0.85 ? 'mele' : 'fango'];
  }
  const ramp = Math.max(0, d - 4) * 0.9; // dopo il quinto giorno si fa sul serio
  const mult = kinds.length === 1 ? (d < 2 ? 1.25 : 1.6) : kinds.length === 3 ? 0.85 : 1;
  const g = {};
  if (kinds.includes('mele')) g.mele = Math.round((4 + d * 1.3 + ramp) * mult * (rule(run, 'appetito') ? 1.25 : 1));
  if (kinds.includes('fango')) g.fango = Math.round((4 + d * 1.2 + ramp) * mult);
  if (kinds.includes('pancia')) g.pancia = Math.min(run.stats.pancia, 4 + Math.floor((d - 7) / 3));
  return g;
}

// ---------- informazioni ----------
export const goalMet = (D) => (!D.goals.mele || D.mele >= D.goals.mele) && (!D.goals.fango || D.fango >= D.goals.fango)
  && (!D.goals.pancia || D.pancia >= D.goals.pancia);
export const panciaMax = (run) => run.stats.pancia + run.D.panciaExtra + (has(run, 'panciadiferro') ? 3 : 0);
export const handSize = (run) => run.stats.mano + (has(run, 'tartufo') ? 1 : 0) + (rule(run, 'mano') ? 1 : 0);
export const walkable = (D, x, y) => inb(D, x, y) && (cell(D, x, y).t === 'grass' || cell(D, x, y).t === 'mud');
export const score = (run) => run.totals.giorniSuperati * 100 + run.totals.mele + run.totals.fango;
export const FIGHTABLE = ['crow', 'dog', 'goose', 'bull'];
const BLOCKERS = ['farmer', 'dog', 'goose', 'bull'];
export const HP = { crow: 1, dog: 2, goose: 2, bull: 3 };
export const liveFoes = (D, kinds) => D.foes.filter((f) => !f.gone && f.x >= 0 && (!kinds || kinds.includes(f.k)));
export const foeAt = (D, x, y, kinds = BLOCKERS) => liveFoes(D, kinds).find((f) => f.x === x && f.y === y);
const inGas = (D, x, y) => !!D.gas[y * D.w + x];
// dove può mettere piede un animale o un contadino
const canEnter = (D, x, y) => walkable(D, x, y) && !inGas(D, x, y) && !foeAt(D, x, y) && !same(D.pig, { x, y });

// ---------- partita ----------
export function newRun(seed, mode = 'normal', pig = 'rosina', rules = [], variant = 'roguelike') {
  const P = PIGS[pig];
  const relax = variant === 'relax';
  const run = {
    v: 2, seed, mode, pig, rules, variant, rng: seed | 0, day: 0, ghiande: 0, uid: 0,
    hearts: relax ? (pig === 'rosina' ? 3 : 2) : P.hearts, maxHearts: relax ? (pig === 'rosina' ? 3 : 2) : P.hearts,
    stats: { energia: P.energia, mano: P.mano, pancia: 6 },
    deck: [], relics: [], history: [], screen: 'day', D: null, result: null, offers: null, shop: null,
    totals: { mele: 0, fango: 0, passi: 0, carte: 0, rotolate: 0, colpiSubiti: 0, colpiDati: 0, animaliScacciati: 0,
              meleRubate: 0, giorniSuperati: 0, giorniFalliti: 0, catenaMax: 0, meleTurnoMax: 0, ghiandeTot: 0, meleOro: 0, oggetti: 0 },
  };
  if (!relax) [...STARTING_DECK, P.card].forEach((id) => addCard(run, id));
  if (rule(run, 'scattanti')) { addCard(run, 'scatto'); addCard(run, 'scatto'); }
  if (rule(run, 'ricchi')) { run.ghiande += 15; run.relics.push(pick(run, Object.keys(RELICS))); }
  if (rule(run, 'fragile')) { run.maxHearts = Math.max(1, run.maxHearts - 1); run.hearts = run.maxHearts; }
  startDay(run);
  return run;
}
const addCard = (run, id) => run.deck.push({ uid: ++run.uid, id });
export function removeCard(run, uid) {
  const i = run.deck.findIndex((c) => c.uid === uid);
  if (i >= 0) run.deck.splice(i, 1);
}

export function startDay(run) {
  const cfg = config(run.day, run.variant);
  if (rule(run, 'corte')) cfg.turns = 6;
  if (rule(run, 'sole')) cfg.sun++;
  if (rule(run, 'corvi')) cfg.crows++;
  if (rule(run, 'tori') && run.day >= 3) cfg.bulls = Math.max(cfg.bulls, 1);
  if (rule(run, 'doro')) cfg.gold++;
  const goals = makeGoals(run, cfg);
  run.D = {
    w: cfg.w, cfg, turn: 1, turns: cfg.turns, goals, mele: 0, fango: 0, pancia: 0, panciaExtra: 0, belly: !!goals.pancia,
    grid: null, pig: null, face: 1, energy: 0, passi: 0, scared: 0, ateToday: false,
    hand: [], draw: [], discard: [], exhaust: [], foes: [], events: [], gas: {},
    flags: {}, hide: false, freeze: false, disguise: false, shield: 0, won: false, dayOver: false, nextFoe: 0,
  };
  generateBoard(run, cfg);
  run.screen = 'day';
  if (isRelax(run)) {
    Object.assign(run.D, { immune: 0, steps: relaxSteps(run), pellaccia: !!isPig(run, 'ciccio'), flags: { rolls: 0, apples: 0, chainBonus: 0 } });
    run.D.foes.forEach((f) => { f.rest = 0; f.timer = 2; });
    telegraph(run);
    return;
  }
  run.D.draw = shuffle(run, run.deck.map((c) => ({ ...c })));
  startTurn(run);
}

function freeGrass(D, minDist = 1) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < D.w; x++) {
    const c = cell(D, x, y);
    if (c.t === 'grass' && !c.item && !foeAt(D, x, y) && dist({ x, y }, D.pig) >= minDist) out.push({ x, y });
  }
  return out;
}

function connected(D) {
  const ok = (i) => D.grid[i].t === 'grass' || D.grid[i].t === 'mud';
  const seen = new Set([D.pig.y * D.w + D.pig.x]), q = [D.pig];
  while (q.length) {
    const p = q.pop();
    for (const [dx, dy] of N4) {
      const x = p.x + dx, y = p.y + dy, i = y * D.w + x;
      if (!inb(D, x, y) || seen.has(i) || !ok(i)) continue;
      seen.add(i); q.push({ x, y });
    }
  }
  return D.grid.every((c, i) => !ok(i) || seen.has(i));
}

function generateBoard(run, cfg) {
  const D = run.D, extra = D.w - 8;
  for (let attempt = 0; attempt < 150; attempt++) {
    D.grid = Array.from({ length: D.w * H }, () => ({ t: 'grass', d: 0, item: null, deco: ri(run, 7) }));
    D.pig = { x: ri(run, 2), y: ri(run, H) };
    const place = (n, fn) => {
      for (let i = 0; i < n; i++) {
        const f = freeGrass(D, 2);
        if (f.length) { const p = pick(run, f); fn(cell(D, p.x, p.y)); }
      }
    };
    place(3 + ri(run, 2) + Math.ceil(extra / 2), (c) => { c.t = 'tree'; });
    place(3 + ri(run, 3) + Math.ceil(extra / 2), (c) => { c.t = rand(run) < 0.6 ? 'rock' : 'bush'; });
    place(4 + ri(run, 2) + Math.floor(extra / 2), (c) => { c.t = 'mud'; c.d = Math.min(3, 1 + ri(run, 3) + (rule(run, 'fango') ? 1 : 0)); });
    place(6 + ri(run, 3) + extra, (c) => { c.item = 'apple'; });
    if (!isRelax(run)) {
      place(1 + ri(run, 2), (c) => { c.item = 'acorn'; });
      if (rand(run) < 0.5) place(1, (c) => { c.item = 'mushroom'; });
      if (rand(run) < 0.4) place(1, (c) => { c.item = 'clover'; });
    }
    if (connected(D)) break;
  }
  // mele d'oro, spesso sorvegliate da un'oca
  let geese = cfg.geese;
  const golds = cfg.gold + (has(run, 'melodoro') ? 1 : 0);
  for (let i = 0; i < golds; i++) {
    const f = freeGrass(D, 3);
    if (!f.length) break;
    const p = pick(run, f);
    cell(D, p.x, p.y).item = 'gold';
    if (geese > 0 && i < cfg.gold) {
      const spots = N4.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter((s) => canEnter(D, s.x, s.y) && !cell(D, s.x, s.y).item && dist(s, D.pig) >= 3);
      if (spots.length) { const s = pick(run, spots); addFoe(D, 'goose', s.x, s.y); geese--; }
    }
  }
  const far = (k, min) => {
    const opts = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < D.w; x++)
      if (canEnter(D, x, y) && !cell(D, x, y).item && dist({ x, y }, D.pig) >= min) opts.push({ x, y });
    if (opts.length) { const p = pick(run, opts); return addFoe(D, k, p.x, p.y, ri(run, 4)); }
    return null;
  };
  for (let i = 0; i < cfg.farmers; i++) far('farmer', 4);
  for (let i = 0; i < cfg.dogs; i++) far('dog', 5);
  for (let i = 0; i < cfg.bulls; i++) { const b = far('bull', 4); if (b) aimBull(run, b); }
  for (let i = 0; i < cfg.crows; i++) { const c = addFoe(D, 'crow', -1, -1); retargetCrow(run, c); }
}

function addFoe(D, k, x, y, dir = 0) {
  const f = { id: D.nextFoe++, k, x, y, dir, hp: HP[k] || 0, away: 0, gone: false, target: false };
  D.foes.push(f);
  return f;
}

// Cono visivo del contadino: dritto per R caselle, e si allarga dalla seconda. Il gas lo ferma.
export function farmerSight(run, f) {
  const D = run.D, R = 3 + D.cfg.sight - (has(run, 'bandana') ? 1 : 0);
  const [dx, dy] = N4[f.dir], px = -dy, py = dx, out = [];
  for (let k = 1; k <= R; k++) {
    const x = f.x + dx * k, y = f.y + dy * k;
    if (!walkable(D, x, y) || inGas(D, x, y)) break;
    out.push({ x, y });
    if (k >= 2) for (const s of [1, -1]) {
      const sx = x + px * s, sy = y + py * s;
      if (walkable(D, sx, sy) && !inGas(D, sx, sy)) out.push({ x: sx, y: sy });
    }
  }
  return out;
}
// La corsa del toro: dritto finché trova strada.
export function bullLine(run, b) {
  const D = run.D, [dx, dy] = N4[b.dir], out = [];
  let x = b.x + dx, y = b.y + dy;
  while (walkable(D, x, y) && !inGas(D, x, y) && !foeAt(D, x, y)) { out.push({ x, y }); x += dx; y += dy; }
  return out;
}
function aimBull(run, b) {
  const dirs = shuffle(run, [0, 1, 2, 3]);
  b.dir = dirs.find((d) => { b.dir = d; return bullLine(run, b).length >= 2; }) ?? dirs[0];
}

// Le zone di pericolo da mostrare sul campo: indice casella → tipo.
export function dangerZones(run) {
  const D = run.D, z = new Map();
  const add = (p, k) => { const i = p.y * D.w + p.x; if (!z.has(i)) z.set(i, k); };
  for (const f of liveFoes(D, ['bull'])) bullLine(run, f).forEach((p) => add(p, 'bull'));
  for (const f of liveFoes(D, ['farmer'])) farmerSight(run, f).forEach((p) => add(p, D.hide || f.rest > 0 ? 'blind' : 'farmer'));
  for (const f of liveFoes(D, ['goose'])) N8.forEach(([dx, dy]) => { const p = { x: f.x + dx, y: f.y + dy }; if (walkable(D, p.x, p.y)) add(p, 'goose'); });
  if (!has(run, 'osso')) for (const f of liveFoes(D, ['dog'])) if (!(f.rest > 0)) N4.forEach(([dx, dy]) => { const p = { x: f.x + dx, y: f.y + dy }; if (walkable(D, p.x, p.y)) add(p, 'dog'); });
  return z;
}

function retargetCrow(run, c) {
  const D = run.D;
  const taken = new Set(liveFoes(D, ['crow']).filter((o) => o !== c && o.target).map((o) => o.y * D.w + o.x));
  const opts = [];
  D.grid.forEach((g, i) => {
    const p = xy(D, i);
    if ((g.item === 'apple' || g.item === 'gold') && !taken.has(i) && !D.gas[i] && dist(p, D.pig) >= 2 && !foeAt(D, p.x, p.y)) opts.push(p);
  });
  if (!opts.length) { c.target = false; c.x = -1; c.y = -1; return; }
  const p = pick(run, opts);
  c.target = true; c.x = p.x; c.y = p.y;
}

// ---------- turno ----------
function startTurn(run) {
  const D = run.D;
  D.energy = Math.max(0, run.stats.energia + (D.turn === 1 && has(run, 'campanaccio') ? 1 : 0) - D.scared);
  D.scared = 0;
  D.passi = (has(run, 'zoccoli') ? 1 : 0) + (isPig(run, 'lampo') ? 2 : 0);
  D.flags = { rolls: 0, apples: 0, cards: 0, nextRollDouble: false, freeRollUsed: false, feast: 0, chainBonus: 0 };
  D.hide = false; D.freeze = false; D.disguise = false; D.shield = 0;
  drawCards(run, handSize(run));
  telegraph(run);
}

export function drawCards(run, n) {
  const D = run.D;
  for (let i = 0; i < n && D.hand.length < 10; i++) {
    if (!D.draw.length) { D.draw = shuffle(run, D.discard); D.discard = []; }
    if (!D.draw.length) return;
    D.hand.push(D.draw.pop());
  }
}

// Il meteo e le mele in arrivo: tutto annunciato sulla mappa prima che accada.
function telegraph(run) {
  const D = run.D, cfg = D.cfg, ev = [];
  const free = (p) => !ev.some((e) => same(e, p));
  const trees = [];
  D.grid.forEach((g, i) => { if (g.t === 'tree') trees.push(xy(D, i)); });
  shuffle(run, trees);
  const nd = isRelax(run) ? (rand(run) < 0.7 ? 1 : 0) : 1 + ri(run, 2) + (D.w >= 10 ? 1 : 0);
  let drops = 0;
  for (let pass = 0; pass < 2 && drops < nd; pass++) for (const t of trees) {
    if (drops >= nd) break;
    const spots = N8.map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }))
      .filter((p) => inb(D, p.x, p.y) && cell(D, p.x, p.y).t === 'grass' && !cell(D, p.x, p.y).item && free(p));
    if (spots.length) { ev.push({ k: 'drop', ...pick(run, spots) }); drops++; }
  }
  if (isRelax(run)) { D.events = ev; return; }
  const pools = [];
  D.grid.forEach((g, i) => { if (g.t === 'mud' && g.d > 0) pools.push(xy(D, i)); });
  shuffle(run, pools).filter(free).slice(0, cfg.sun).forEach((p) => ev.push({ k: 'sun', ...p }));
  if (rand(run) < 0.3) {
    const opts = [];
    D.grid.forEach((g, i) => { const p = xy(D, i); if ((g.t === 'grass' || g.t === 'mud') && free(p)) opts.push(p); });
    if (opts.length) ev.push({ k: 'cloud', ...pick(run, opts) });
  }
  if (rand(run) < 0.07) {
    const f = freeGrass(D, 2).filter(free);
    if (f.length) ev.push({ k: 'rainbow', ...pick(run, f) });
  }
  if (cfg.bolt && rand(run) < 0.45) {
    const opts = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < D.w; x++)
      if (walkable(D, x, y) && dist({ x, y }, D.pig) <= 2 && free({ x, y })) opts.push({ x, y });
    if (opts.length) ev.push({ k: 'bolt', ...pick(run, opts) });
  }
  D.events = ev;
}

export function moveOptions(run) {
  const D = run.D, ciccio = isPig(run, 'ciccio');
  if (D.won) return [];
  if (isRelax(run)) return N4.map(([dx, dy]) => ({ x: D.pig.x + dx, y: D.pig.y + dy })).filter((p) => walkable(D, p.x, p.y) && !foeAt(D, p.x, p.y));
  const canPay = D.energy + D.passi > 0;
  const out = [];
  for (const [dx, dy] of N4) {
    const x = D.pig.x + dx, y = D.pig.y + dy;
    if (!walkable(D, x, y)) continue;
    const f = foeAt(D, x, y);
    if (!f) { if (canPay) out.push({ x, y }); continue; }
    if (f.k !== 'farmer' && (canPay || ciccio)) out.push({ x, y, bump: f.id });
  }
  return out;
}

function pay(D) { if (D.passi > 0) D.passi--; else D.energy--; }

export function move(run, x, y) {
  const D = run.D;
  const opt = moveOptions(run).find((p) => p.x === x && p.y === y);
  if (!opt) return null;
  const ev = [];
  if (x !== D.pig.x) D.face = x > D.pig.x ? 1 : -1;
  if (opt.bump != null) {
    if (!isPig(run, 'ciccio')) pay(D);
    const f = D.foes.find((o) => o.id === opt.bump);
    ev.push({ type: 'bump', x, y });
    hit(run, f, (isPig(run, 'ciccio') ? 2 : 1) + (has(run, 'zanne') ? 1 : 0), ev);
    return ev;
  }
  pay(D);
  run.totals.passi++;
  enterTile(run, x, y, ev);
  return ev;
}

function hit(run, f, dmg, ev) {
  f.hp -= dmg; run.totals.colpiDati++;
  ev.push({ type: 'hit', x: f.x, y: f.y, dmg, id: f.id });
  if (f.hp > 0) return;
  ev.push({ type: 'flee', x: f.x, y: f.y, id: f.id });
  run.totals.animaliScacciati++;
  if (f.k === 'crow') { f.target = false; f.x = -1; f.y = -1; f.away = 2; f.hp = HP.crow; }
  else f.gone = true;
}

function enterTile(run, x, y, ev) {
  const D = run.D, c = cell(D, x, y);
  D.pig = { x, y };
  if (c.item) pickup(run, c, x, y, ev);
  if (c.t === 'mud' && c.d > 0) roll(run, c, x, y, ev);
}

function pickup(run, c, x, y, ev) {
  const D = run.D, it = c.item;
  if (it === 'apple' || it === 'gold') { if (eat(run, it === 'gold', x, y, ev)) c.item = null; return; }
  c.item = null; run.totals.oggetti++;
  if (it === 'acorn') { run.ghiande++; run.totals.ghiandeTot++; ev.push({ type: 'item', x, y, text: '+1 ghianda', icon: 'acorn' }); }
  if (it === 'mushroom') { D.energy++; ev.push({ type: 'item', x, y, text: '+1 energia', icon: 'mushroom' }); }
  if (it === 'clover') { drawCards(run, 1); ev.push({ type: 'item', x, y, text: '+1 carta', icon: 'clover' }); }
}

// Mangia una mela, se la pancia lo permette. false = pancia piena.
function eat(run, gold, x, y, ev) {
  const D = run.D;
  if (D.belly && D.pancia >= panciaMax(run)) { ev.push({ type: 'text', x, y, text: 'Pancia piena!', cls: 'warn' }); return false; }
  let val = gold ? 3 : 1;
  if (isPig(run, 'rosina') && !isRelax(run) && D.flags.apples === 0) val *= 2;
  if (has(run, 'bavaglino') && !D.ateToday) val += 2;
  D.flags.apples++; D.ateToday = true;
  if (has(run, 'codino') && D.flags.apples % 3 === 0) val += 2;
  if (D.flags.feast > 0) { val += 1; D.flags.feast--; }
  if (D.belly) D.pancia++;
  D.mele += val; run.totals.mele += val;
  if (gold) run.totals.meleOro++;
  run.totals.meleTurnoMax = Math.max(run.totals.meleTurnoMax, D.flags.apples);
  for (const cr of liveFoes(D, ['crow'])) if (cr.target && cr.x === x && cr.y === y) {
    cr.target = false; ev.push({ type: 'flee', x, y, id: cr.id }); cr.x = -1; cr.y = -1;
  }
  ev.push({ type: 'eat', x, y, val, gold });
  checkGoal(run, ev);
  return true;
}

function roll(run, c, x, y, ev) {
  const D = run.D;
  let gain = c.d + D.flags.rolls + D.flags.chainBonus + (has(run, 'maschera') ? 1 : 0) + (isPig(run, 'grufolo') ? 1 : 0);
  if (D.flags.nextRollDouble) { gain *= 2; D.flags.nextRollDouble = false; }
  addFango(run, gain);
  run.totals.rotolate++;
  D.flags.rolls++;
  run.totals.catenaMax = Math.max(run.totals.catenaMax, D.flags.rolls);
  if (has(run, 'stivali') && !D.flags.freeRollUsed) D.flags.freeRollUsed = true;
  else if (--c.d <= 0) { c.t = 'grass'; c.d = 0; }
  if (D.belly) D.pancia = Math.max(0, D.pancia - 2);
  ev.push({ type: 'roll', x, y, gain, chain: D.flags.rolls });
  checkGoal(run, ev);
}
function addFango(run, n) { run.D.fango += n; run.totals.fango += n; }

function checkGoal(run, ev) {
  const D = run.D;
  if (!D.won && goalMet(D)) { D.won = true; ev.push({ type: 'goal' }); }
}

// Colpo subito dal maialino, se non è al sicuro.
function penalty(run, p, label, ev) {
  const D = run.D, P = D.pig;
  if (inGas(D, P.x, P.y) || D.disguise) { ev.push({ type: 'text', x: P.x, y: P.y, text: 'Al sicuro!', cls: 'good' }); return; }
  if (D.shield > 0) { D.shield--; ev.push({ type: 'text', x: P.x, y: P.y, text: 'Parato!', cls: 'good' }); return; }
  const parts = [];
  if (p.fango) { const l = Math.min(D.fango, p.fango); D.fango -= l; if (l) parts.push(`−${l} fango`); }
  if (p.mele) { const l = Math.min(D.mele, p.mele); D.mele -= l; if (l) parts.push(`−${l} mele`); }
  if (p.scare) { D.scared += p.scare; parts.push('−1 energia'); }
  run.totals.colpiSubiti++;
  ev.push({ type: 'hurt', x: P.x, y: P.y, text: label, sub: parts.join(' · ') });
}

// ---------- carte ----------
export function cardCost(run, card) {
  const c = CARDS[card.id].cost;
  return isPig(run, 'nebbia') && run.D.flags.cards === 0 ? Math.max(0, c - 1) : c;
}

export function cardTargets(run, card) {
  const D = run.D, P = D.pig, def = CARDS[card.id];
  const adj = N4.map(([dx, dy]) => ({ x: P.x + dx, y: P.y + dy })).filter((p) => inb(D, p.x, p.y));
  const free = (p) => walkable(D, p.x, p.y) && !foeAt(D, p.x, p.y);
  const line = (k) => N4.map(([dx, dy]) => ({ x: P.x + k * dx, y: P.y + k * dy }));
  switch (def.target) {
    case 'tree': return N8.map(([dx, dy]) => ({ x: P.x + dx, y: P.y + dy })).filter((p) => inb(D, p.x, p.y) && cell(D, p.x, p.y).t === 'tree');
    case 'grass': return adj.filter((p) => { const c = cell(D, p.x, p.y); return c.t === 'grass' && !c.item && !foeAt(D, p.x, p.y); });
    case 'jump': return line(2).filter(free);
    case 'jump3': return [...line(2), ...line(3)].filter(free);
    case 'dir': return adj.filter(free);
    case 'dirAny': return adj.filter((p) => walkable(D, p.x, p.y) && !foeAt(D, p.x, p.y, ['farmer']));
    case 'mud': {
      const out = [];
      D.grid.forEach((c, i) => { const p = xy(D, i); if (c.t === 'mud' && c.d > 0 && !same(p, P) && free(p)) out.push(p); });
      return out;
    }
    case 'foeAdj': return liveFoes(D, FIGHTABLE).filter((f) => dist(f, P) === 1).map((f) => ({ x: f.x, y: f.y }));
    case 'foeRange': return liveFoes(D, FIGHTABLE).filter((f) => dist(f, P) <= 3).map((f) => ({ x: f.x, y: f.y }));
    case 'fly': {
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < D.w; x++) { const d = dist({ x, y }, P); if (d >= 1 && d <= 3 && free({ x, y })) out.push({ x, y }); }
      return out;
    }
    default: return null;
  }
}

// Perché una carta non si può giocare (null se si può).
export function cantPlay(run, i) {
  const D = run.D, card = D.hand[i];
  if (!card) return 'Nessuna carta.';
  if (D.won) return 'Giornata conclusa.';
  const def = CARDS[card.id];
  if (cardCost(run, card) > D.energy) return 'Energia insufficiente.';
  if (def.needs === 'belly' && !D.belly) return 'Oggi la pancia non conta.';
  if (def.needs === 'onMud') { const c = cell(D, D.pig.x, D.pig.y); if (c.t !== 'mud' || c.d <= 0) return 'Devi essere su una pozza.'; }
  const t = cardTargets(run, card);
  if (t && !t.length) return 'Nessun bersaglio valido qui.';
  return null;
}
export const canPlay = (run, i) => !cantPlay(run, i);

export function playCard(run, i, target) {
  const D = run.D, card = D.hand[i];
  if (!card || cantPlay(run, i)) return null;
  const def = CARDS[card.id];
  const tg = cardTargets(run, card);
  if (tg && (!target || !tg.some((p) => same(p, target)))) return null;
  D.energy -= cardCost(run, card);
  D.flags.cards++;
  D.hand.splice(i, 1);
  (def.exhaust ? D.exhaust : D.discard).push(card);
  run.totals.carte++;
  const ev = [{ type: 'card', id: card.id, uid: card.uid, exhaust: !!def.exhaust }];
  EFFECTS[card.id](run, target, ev);
  return ev;
}

function shake(run, t, n, ev) {
  const D = run.D;
  const spots = shuffle(run, N8.map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy })).filter((p) => inb(D, p.x, p.y)
    && cell(D, p.x, p.y).t === 'grass' && !cell(D, p.x, p.y).item && !foeAt(D, p.x, p.y) && !same(p, D.pig)));
  spots.slice(0, n).forEach((p) => { cell(D, p.x, p.y).item = 'apple'; ev.push({ type: 'drop', x: p.x, y: p.y }); });
  if (!spots.length) ev.push({ type: 'text', x: t.x, y: t.y, text: 'Non c\'è spazio!', cls: 'warn' });
}

function slide(run, t, ev, stopInMud) {
  const D = run.D, dx = t.x - D.pig.x, dy = t.y - D.pig.y;
  if (dx) D.face = dx > 0 ? 1 : -1;
  let x = D.pig.x + dx, y = D.pig.y + dy;
  ev.push({ type: 'spin' });
  while (walkable(D, x, y) && !foeAt(D, x, y)) {
    const wasMud = cell(D, x, y).t === 'mud' && cell(D, x, y).d > 0;
    enterTile(run, x, y, ev);
    if (stopInMud && wasMud) return;
    x += dx; y += dy;
  }
}

const makeMud = (run, t, d, ev) => { const c = cell(run.D, t.x, t.y); c.t = 'mud'; c.d = d; ev.push({ type: 'pop', x: t.x, y: t.y }); };
const say = (run, ev, text, cls = '') => ev.push({ type: 'text', x: run.D.pig.x, y: run.D.pig.y, text, cls });

const EFFECTS = {
  passetto(run) { run.D.passi += 1; },
  scatto(run) { run.D.passi += 2; },
  trotto(run) { run.D.passi += 3; },
  galoppo(run) { run.D.passi += 5; },
  tuffo(run, t, ev) { EFFECTS.ali(run, t, ev); },
  supersalto(run, t, ev) { EFFECTS.ali(run, t, ev); },
  ali(run, t, ev) {
    const D = run.D;
    if (t.x !== D.pig.x) D.face = t.x > D.pig.x ? 1 : -1;
    ev.push({ type: 'jump' });
    enterTile(run, t.x, t.y, ev);
  },
  portale(run, t, ev) { ev.push({ type: 'jump' }); enterTile(run, t.x, t.y, ev); },
  scivolata(run, t, ev) { slide(run, t, ev, true); },
  rotolone(run, t, ev) { slide(run, t, ev, false); },
  scrollatina(run, t, ev) { ev.push({ type: 'shake', ...t }); shake(run, t, 1, ev); },
  testata(run, t, ev) { ev.push({ type: 'shake', ...t }); shake(run, t, 2, ev); },
  banchetto(run, t, ev) {
    const D = run.D;
    D.grid.forEach((c, i) => {
      const p = xy(D, i);
      if (c.t === 'tree' && cheb(p, D.pig) <= 2) { ev.push({ type: 'shake', ...p }); shake(run, p, 1, ev); }
    });
  },
  spuntino(run, t, ev) { eat(run, false, run.D.pig.x, run.D.pig.y, ev); },
  raccolto(run, t, ev) {
    const D = run.D;
    for (const [dx, dy] of N4) {
      const x = D.pig.x + dx, y = D.pig.y + dy;
      if (!inb(D, x, y)) continue;
      const c = cell(D, x, y);
      if ((c.item === 'apple' || c.item === 'gold') && !foeAt(D, x, y) && eat(run, c.item === 'gold', x, y, ev)) c.item = null;
    }
  },
  abbuffata(run, t, ev) { run.D.flags.feast = 3; say(run, ev, 'Mele +1!', 'good'); },
  calamita(run, t, ev) {
    const D = run.D, P = D.pig, list = [];
    D.grid.forEach((c, i) => { const p = xy(D, i); if ((c.item === 'apple' || c.item === 'gold') && dist(p, P) <= 2 && !same(p, P)) list.push(p); });
    list.sort((a, b) => dist(a, P) - dist(b, P));
    for (const p of list) {
      const c = cell(D, p.x, p.y), sx = Math.sign(P.x - p.x), sy = Math.sign(P.y - p.y);
      const steps = Math.abs(P.x - p.x) >= Math.abs(P.y - p.y) ? [[sx, 0], [0, sy]] : [[0, sy], [sx, 0]];
      for (const [dx, dy] of steps) {
        if (!dx && !dy) continue;
        const n = { x: p.x + dx, y: p.y + dy };
        if (same(n, P)) { if (eat(run, c.item === 'gold', P.x, P.y, ev)) c.item = null; break; }
        const nc = inb(D, n.x, n.y) && cell(D, n.x, n.y);
        if (nc && nc.t === 'grass' && !nc.item && !foeAt(D, n.x, n.y)) { nc.item = c.item; c.item = null; ev.push({ type: 'pop', ...n }); break; }
      }
    }
  },
  doro(run, t, ev) { cell(run.D, t.x, t.y).item = 'gold'; ev.push({ type: 'drop', ...t }); },
  semina(run, t, ev) { cell(run.D, t.x, t.y).t = 'tree'; ev.push({ type: 'pop', ...t }); },
  pioggiamele(run, t, ev) {
    shuffle(run, freeGrass(run.D, 1)).slice(0, 4).forEach((p) => { cell(run.D, p.x, p.y).item = 'apple'; ev.push({ type: 'drop', ...p }); });
  },
  pozzanghera(run, t, ev) { makeMud(run, t, 1, ev); },
  grufolata(run, t, ev) { makeMud(run, t, 2, ev); },
  sorgente(run, t, ev) { makeMud(run, t, 3, ev); },
  bis(run, t, ev) { const D = run.D; ev.push({ type: 'spin' }); roll(run, cell(D, D.pig.x, D.pig.y), D.pig.x, D.pig.y, ev); },
  bagno(run, t, ev) { run.D.flags.nextRollDouble = true; say(run, ev, 'Prossima rotolata ×2'); },
  perfetta(run, t, ev) { run.D.flags.chainBonus += 2; say(run, ev, 'Rotolate +2'); },
  impacco(run, t, ev) { addFango(run, 2); say(run, ev, '+2 fango', 'mud'); checkGoal(run, ev); },
  tornado(run, t, ev) {
    const D = run.D;
    ev.push({ type: 'spin' });
    for (const [dx, dy] of N4) {
      const x = D.pig.x + dx, y = D.pig.y + dy;
      if (inb(D, x, y)) { const c = cell(D, x, y); if (c.t === 'mud' && c.d > 0) roll(run, c, x, y, ev); }
    }
  },
  pioggerella(run, t, ev) { run.D.grid.forEach((c) => { if (c.t === 'mud') c.d = Math.min(3, c.d + 1); }); ev.push({ type: 'rain' }); },
  grugnito(run, t, ev) {
    const D = run.D;
    ev.push({ type: 'grunt' });
    for (const c of liveFoes(D, ['crow'])) if (dist(c, D.pig) <= 3) {
      ev.push({ type: 'flee', x: c.x, y: c.y, id: c.id });
      c.target = false; c.x = -1; c.y = -1; c.away = 1; run.totals.animaliScacciati++;
    }
    D.hide = true;
  },
  spallata(run, t, ev) { ev.push({ type: 'bump', ...t }); hit(run, foeAt(run.D, t.x, t.y, FIGHTABLE), 2, ev); },
  fionda(run, t, ev) { hit(run, foeAt(run.D, t.x, t.y, FIGHTABLE), 1, ev); },
  carica(run, t, ev) {
    const D = run.D, dx = t.x - D.pig.x, dy = t.y - D.pig.y;
    if (dx) D.face = dx > 0 ? 1 : -1;
    let x = D.pig.x + dx, y = D.pig.y + dy;
    while (walkable(D, x, y)) {
      const f = foeAt(D, x, y, FIGHTABLE);
      if (f) { ev.push({ type: 'bump', x, y }); hit(run, f, 2, ev); return; }
      if (foeAt(D, x, y)) return;
      enterTile(run, x, y, ev);
      x += dx; y += dy;
    }
  },
  pelle(run, t, ev) { run.D.shield++; say(run, ev, 'Scudo!', 'good'); },
  strillo(run, t, ev) { ev.push({ type: 'grunt' }); for (const f of liveFoes(run.D, FIGHTABLE)) hit(run, f, 1, ev); },
  scoreggia(run, t, ev) {
    const D = run.D;
    [[0, 0], ...N4].forEach(([dx, dy]) => {
      const x = D.pig.x + dx, y = D.pig.y + dy;
      if (walkable(D, x, y) && !foeAt(D, x, y)) D.gas[y * D.w + x] = 2;
    });
    ev.push({ type: 'gas' });
  },
  respiro(run) { drawCards(run, 1); },
  fiuto(run) { drawCards(run, 2); },
  rimescolata(run) { const D = run.D, n = D.hand.length; D.discard.push(...D.hand); D.hand = []; drawCards(run, n); },
  energetica(run) { run.D.energy += 2; },
  tenerone(run, t, ev) { run.D.hide = true; run.D.freeze = true; ev.push({ type: 'cute' }); },
  travestimento(run, t, ev) { run.D.disguise = true; say(run, ev, 'Sono un cespuglio…', 'good'); },
  tesoretto(run, t, ev) { run.ghiande += 3; run.totals.ghiandeTot += 3; say(run, ev, '+3 ghiande', 'gold'); },
  calma(run) { run.D.events = run.D.events.filter((e) => e.k === 'drop' || e.k === 'rainbow'); },
  ruttino(run, t, ev) { run.D.pancia = Math.max(0, run.D.pancia - 3); ev.push({ type: 'burp' }); },
  stomaco(run) { run.D.panciaExtra += 3; },
  clessidra(run, t, ev) { run.D.turns++; say(run, ev, '+1 turno', 'gold'); },
};

// ---------- fine turno: il mondo si muove, una fase alla volta ----------
export const END_STEPS = [
  function discard(run) { run.D.discard.push(...run.D.hand); run.D.hand = []; return []; },

  function weather(run) {
    const D = run.D, ev = [];
    for (const e of D.events) {
      const c = cell(D, e.x, e.y), onPig = same(e, D.pig);
      if (e.k === 'drop' || e.k === 'rainbow') {
        if (c.t !== 'grass' || c.item || foeAt(D, e.x, e.y)) continue;
        const gold = e.k === 'rainbow';
        if (onPig) {
          if (eat(run, gold, e.x, e.y, ev)) ev.push({ type: 'text', x: e.x, y: e.y, text: 'Dritta in bocca!' });
          else c.item = gold ? 'gold' : 'apple';
        } else { c.item = gold ? 'gold' : 'apple'; ev.push({ type: 'drop', x: e.x, y: e.y }); }
      } else if (e.k === 'sun') {
        if (has(run, 'ombrellino') || c.t !== 'mud') continue;
        if (--c.d <= 0) { c.t = 'grass'; c.d = 0; }
        ev.push({ type: 'dry', x: e.x, y: e.y });
      } else if (e.k === 'cloud') {
        if (c.t === 'mud') c.d = Math.min(3, c.d + 1);
        else if (c.t === 'grass' && !c.item && !onPig && !foeAt(D, e.x, e.y)) { c.t = 'mud'; c.d = 1; }
        for (const [dx, dy] of N4) {
          const x = e.x + dx, y = e.y + dy;
          if (inb(D, x, y) && cell(D, x, y).t === 'mud') cell(D, x, y).d = Math.min(3, cell(D, x, y).d + 1);
        }
        ev.push({ type: 'rain', x: e.x, y: e.y });
      } else if (e.k === 'bolt') {
        ev.push({ type: 'bolt', x: e.x, y: e.y });
        if (c.item === 'apple' || c.item === 'gold') c.item = null;
        if (onPig && !has(run, 'parafulmine')) penalty(run, { fango: 2, mele: 2 }, 'Fulmine!', ev);
      }
    }
    if (has(run, 'nuvoletta')) {
      const pools = [];
      D.grid.forEach((c, i) => { if (c.t === 'mud' && c.d < 3) pools.push(i); });
      if (pools.length) { const i = pick(run, pools); D.grid[i].d++; ev.push({ type: 'pop', ...xy(D, i) }); }
    }
    D.events = [];
    return ev;
  },

  function crows(run) {
    const D = run.D, ev = [], r = has(run, 'spaventapasseri') ? 2 : 1;
    for (const c of liveFoes(D, ['crow'])) {
      if (!c.target) continue;
      if (dist(c, D.pig) <= r) {
        ev.push({ type: 'flee', x: c.x, y: c.y, id: c.id }); run.totals.animaliScacciati++;
      } else {
        const g = cell(D, c.x, c.y);
        if (g.item === 'apple' || g.item === 'gold') { g.item = null; run.totals.meleRubate++; ev.push({ type: 'steal', x: c.x, y: c.y, id: c.id }); }
      }
      c.target = false;
    }
    for (const c of D.foes.filter((f) => f.k === 'crow')) {
      if (c.away > 0) { c.away--; c.x = -1; c.y = -1; continue; }
      if (!c.target) retargetCrow(run, c);
    }
    return ev;
  },

  function geese(run) {
    const D = run.D, ev = [];
    for (const g of liveFoes(D, ['goose'])) if (cheb(g, D.pig) === 1) { ev.push({ type: 'attack', id: g.id }); penalty(run, { mele: 2 }, 'Beccata!', ev); }
    return ev;
  },

  function dogs(run) {
    const D = run.D, ev = [];
    for (const g of liveFoes(D, ['dog'])) {
      if (dist(g, D.pig) === 1 && !has(run, 'osso')) { ev.push({ type: 'attack', id: g.id }); penalty(run, { scare: 1 }, 'Bau!', ev); }
      for (let s = 0; s < 2 && dist(g, D.pig) > 1; s++) {
        const step = pathStep(D, g, D.pig);
        if (!step) break;
        g.x = step.x; g.y = step.y;
      }
    }
    return ev;
  },

  function bulls(run) {
    const D = run.D, ev = [];
    for (const b of liveFoes(D, ['bull'])) {
      const line = bullLine(run, b);
      const hitAt = line.findIndex((p) => same(p, D.pig));
      const path = hitAt >= 0 ? line.slice(0, hitAt) : line;
      for (const p of path) { const c = cell(D, p.x, p.y); if (c.item === 'apple' || c.item === 'gold') c.item = null; }
      if (hitAt >= 0) { ev.push({ type: 'attack', id: b.id }); penalty(run, { fango: 3, mele: 2 }, 'Incornata!', ev); }
      if (path.length) { const last = path[path.length - 1]; b.x = last.x; b.y = last.y; }
      aimBull(run, b);
    }
    return ev;
  },

  function farmers(run) {
    const D = run.D, ev = [];
    const fs = liveFoes(D, ['farmer']);
    if (!D.hide) for (const f of fs) {
      if (!farmerSight(run, f).some((p) => same(p, D.pig))) continue;
      ev.push({ type: 'bucket', id: f.id, x: D.pig.x, y: D.pig.y });
      penalty(run, { fango: has(run, 'mantellina') ? 1 : 3 }, 'Secchiata!', ev);
    }
    if (!D.freeze) for (const f of fs) for (let s = 0; s < (rule(run, 'pigri') ? 1 : 2); s++) {
      for (let k = 0; k < 4; k++) {
        const [dx, dy] = N4[f.dir], x = f.x + dx, y = f.y + dy;
        if (canEnter(D, x, y)) { f.x = x; f.y = y; break; }
        f.dir = (f.dir + 1) % 4; // davanti a un ostacolo gira a destra
      }
    }
    return ev;
  },

  function gas(run) {
    const D = run.D;
    for (const k of Object.keys(D.gas)) if (--D.gas[k] <= 0) delete D.gas[k];
    return [];
  },
];

// Primo passo del percorso più breve da a verso b (per i cani).
function pathStep(D, a, b) {
  const key = (p) => p.y * D.w + p.x;
  const prev = new Map([[key(a), null]]), q = [a];
  while (q.length) {
    const p = q.shift();
    for (const [dx, dy] of N4) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (!inb(D, n.x, n.y) || prev.has(key(n))) continue;
      if (same(n, b)) {
        let cur = p;
        while (prev.get(key(cur)) && !same(prev.get(key(cur)), a)) cur = prev.get(key(cur));
        return same(cur, a) ? null : cur;
      }
      if (!canEnter(D, n.x, n.y)) continue;
      prev.set(key(n), p); q.push(n);
    }
  }
  return null;
}

export function finishTurn(run) {
  const D = run.D;
  if (D.belly) D.pancia = Math.max(0, D.pancia - 1);
  D.turn++;
  if (D.turn > D.turns) { D.turn = D.turns; D.dayOver = true; return; }
  startTurn(run);
}

// ---------- fine giornata, premi, mercato ----------
export function endDay(run) {
  const D = run.D, ok = D.won;
  const res = { ok, day: run.day, goals: { ...D.goals }, mele: D.mele, fango: D.fango, pancia: D.pancia, parts: [], ghiande: 0 };
  if (isRelax(run)) {
    if (ok) run.totals.giorniSuperati++;
    run.history.push({ day: run.day, ok, goals: { ...D.goals }, mele: D.mele, fango: D.fango, pancia: 0 });
    run.result = res;
    run.screen = run.hearts <= 0 ? 'over' : 'result';
    return res;
  }
  if (ok) {
    const left = D.turns - D.turn;
    res.parts.push(['Giornata superata', 3]);
    if (left > 0) res.parts.push([`Turni avanzati (${left})`, left * (has(run, 'ghianda') ? 3 : 2)]);
    let g = res.parts.reduce((s, p) => s + p[1], 0);
    if (has(run, 'salvadanaio')) { const b = Math.round(g * 0.5); res.parts.push(['Salvadanaio', b]); g += b; }
    if (rule(run, 'corte')) { res.parts.push(['Giornate corte', g]); g += g; }
    if (rule(run, 'fragile')) { const b = Math.round(g * 0.3); res.parts.push(['Cuore fragile', b]); g += b; }
    res.ghiande = g; run.ghiande += g; run.totals.ghiandeTot += g; run.totals.giorniSuperati++;
  } else {
    run.hearts--; run.totals.giorniFalliti++;
  }
  run.history.push({ day: run.day, ok, goals: { ...D.goals }, mele: D.mele, fango: D.fango, pancia: D.pancia });
  run.result = res;
  run.screen = run.hearts <= 0 ? 'over' : 'result';
  return res;
}

const RAR_W = (run) => ({ common: 55, uncommon: 32, rare: 7 + run.day });
const cardOffer = (run, ex) => {
  const ids = Object.keys(CARDS).filter((id) => !CARDS[id].starter && !ex.includes(id));
  const w = RAR_W(run);
  return { kind: 'card', id: weighted(run, ids, (id) => w[CARDS[id].rarity]) };
};
const relicOffer = (run, ex) => {
  const ids = Object.keys(RELICS).filter((id) => !has(run, id) && !ex.includes(id));
  return ids.length ? { kind: 'relic', id: pick(run, ids) } : null;
};
const upgradeOffer = (run, ex) => {
  const ids = Object.keys(UPGRADES).filter((id) => UPGRADES[id].weight > 0 && !ex.includes(id) && !(id === 'pota' && run.deck.length <= 5));
  return { kind: 'upgrade', id: weighted(run, ids, (id) => UPGRADES[id].weight) };
};

export function makeOffers(run) {
  const offers = [], ex = [];
  const add = (o) => { if (o) { offers.push(o); ex.push(o.id); } };
  if (run.day % 5 === 4) { add(relicOffer(run, ex)); add(relicOffer(run, ex) || upgradeOffer(run, ex)); add(cardOffer(run, ex)); }
  else { add(cardOffer(run, ex)); add(cardOffer(run, ex)); add(rand(run) < 0.3 ? relicOffer(run, ex) || upgradeOffer(run, ex) : upgradeOffer(run, ex)); }
  run.offers = offers; run.screen = 'reward';
}

export function offerName(o) {
  return o.kind === 'card' ? CARDS[o.id].name : o.kind === 'relic' ? RELICS[o.id].name : UPGRADES[o.id].name;
}

// Applica un premio o un acquisto. Restituisce 'remove' se serve scegliere la carta da togliere.
export function grant(run, o) {
  if (o.kind === 'card') addCard(run, o.id);
  else if (o.kind === 'relic') run.relics.push(o.id);
  else switch (o.id) {
    case 'energia': run.stats.energia++; break;
    case 'pancia': run.stats.pancia += 2; break;
    case 'mano': run.stats.mano++; break;
    case 'cuore': run.maxHearts++; run.hearts++; break;
    case 'heal': run.hearts = Math.min(run.maxHearts, run.hearts + 1); break;
    case 'pota': return 'remove';
  }
  return null;
}

export function skipReward(run) { run.ghiande += 3; run.totals.ghiandeTot += 3; }

export function makeShop(run) {
  const items = [], ex = [];
  const price = { common: 5, uncommon: 8, rare: 12 };
  for (let i = 0; i < 4; i++) { const o = cardOffer(run, ex); ex.push(o.id); items.push({ ...o, price: price[CARDS[o.id].rarity] }); }
  for (let i = 0; i < 2; i++) { const o = relicOffer(run, ex); if (o) { ex.push(o.id); items.push({ ...o, price: 14 + ri(run, 5) }); } }
  items.push({ kind: 'upgrade', id: 'pota', price: 6 });
  items.push(run.hearts < run.maxHearts ? { kind: 'upgrade', id: 'heal', price: 8 } : { kind: 'upgrade', id: 'cuore', price: 16 });
  items.push({ kind: 'upgrade', id: 'energia', price: 24 });
  run.shop = { items, sold: [] };
  run.screen = 'shop';
}

export function nextDay(run) {
  run.day++;
  run.result = null; run.offers = null; run.shop = null;
  startDay(run);
}

// =====================================================================
// Modalità Relax: a ogni turno fai 3 passi (4 con Lampo), poi il mondo risponde.
// =====================================================================
export const relaxSteps = (run) => (isPig(run, 'lampo') ? 4 : 3);
function relaxHit(run, label, ev) {
  const D = run.D, P = D.pig;
  if (D.pellaccia) { D.pellaccia = false; D.immune = 1; ev.push({ type: 'text', x: P.x, y: P.y, text: 'Pellaccia!', cls: 'good' }); return; }
  run.hearts--; D.immune = 1; run.totals.colpiSubiti++;
  ev.push({ type: 'hurt', x: P.x, y: P.y, text: label, sub: '−1 vita' });
  if (run.hearts <= 0) {
    run.history.push({ day: run.day, ok: false, goals: { ...D.goals }, mele: D.mele, fango: D.fango, pancia: 0 });
    run.totals.giorniFalliti++;
    run.screen = 'over';
  }
}

function relaxTick(run, ev) {
  const D = run.D, P = D.pig;
  D.turn++;
  D.steps = relaxSteps(run);
  D.flags = { rolls: 0, apples: 0, chainBonus: 0 };
  const vulnerable = D.immune === 0;
  if (D.immune > 0) D.immune--;
  // mele che cadono dai meli
  for (const e of D.events) {
    const c = cell(D, e.x, e.y);
    if (c.t !== 'grass' || c.item || foeAt(D, e.x, e.y)) continue;
    if (same(e, P)) { if (eat(run, false, e.x, e.y, ev)) ev.push({ type: 'text', x: e.x, y: e.y, text: 'Dritta in bocca!' }); }
    else { c.item = 'apple'; ev.push({ type: 'drop', x: e.x, y: e.y }); }
  }
  if (D.won) return;
  // corvi: se gli sei vicino scappano, altrimenti dopo qualche turno mangiano la mela
  for (const c of D.foes.filter((f) => f.k === 'crow')) {
    if (c.target && cheb(c, P) <= 1) {
      ev.push({ type: 'flee', x: c.x, y: c.y, id: c.id }); run.totals.animaliScacciati++;
      c.target = false; c.x = -1; c.y = -1; c.away = 3; continue;
    }
    if (c.target && --c.timer <= 0) {
      const g = cell(D, c.x, c.y);
      if (g.item) { g.item = null; run.totals.meleRubate++; ev.push({ type: 'steal', x: c.x, y: c.y, id: c.id }); }
      c.target = false;
    }
    if (!c.target) {
      if (c.away > 0) { c.away--; c.x = -1; c.y = -1; continue; }
      retargetCrow(run, c); c.timer = 2;
    }
  }
  // cani: se gli sei accanto ti mordono e poi si riposano; altrimenti corrono di 2 passi verso di te
  for (const g of liveFoes(D, ['dog'])) {
    if (g.rest > 0) { g.rest--; continue; }
    if (dist(g, P) === 1 && vulnerable) { ev.push({ type: 'attack', id: g.id }); relaxHit(run, 'Morso!', ev); g.rest = 2; continue; }
    for (let k = 0; k < 2 && dist(g, P) > 1; k++) { const st = pathStep(D, g, P); if (!st) break; g.x = st.x; g.y = st.y; }
  }
  // contadini: se sei nella zona rossa ti colpiscono; poi un passo avanti
  for (const f of liveFoes(D, ['farmer'])) {
    if (f.rest > 0) { f.rest--; continue; }
    const hidden = isPig(run, 'nebbia') && cell(D, P.x, P.y).t === 'mud';
    if (vulnerable && !hidden && run.hearts > 0 && farmerSight(run, f).some((p) => same(p, P))) {
      ev.push({ type: 'bucket', id: f.id, x: P.x, y: P.y }); relaxHit(run, 'Secchiata!', ev); f.rest = 1; continue;
    }
    for (let s = 0; s < 2; s++) for (let k = 0; k < 4; k++) {
      const [dx, dy] = N4[f.dir], x = f.x + dx, y = f.y + dy;
      if (canEnter(D, x, y)) { f.x = x; f.y = y; break; }
      f.dir = (f.dir + 1) % 4;
    }
  }
  telegraph(run);
}

export function relaxMove(run, x, y) {
  const D = run.D;
  if (D.won || run.hearts <= 0 || !moveOptions(run).some((p) => p.x === x && p.y === y)) return null;
  if (x !== D.pig.x) D.face = x > D.pig.x ? 1 : -1;
  run.totals.passi++;
  const ev = [];
  enterTile(run, x, y, ev);
  if (!D.won && --D.steps <= 0) { ev.push({ type: 'tick' }); relaxTick(run, ev); }
  return ev;
}
// «Aspetta»: rinunci ai passi rimasti e il mondo fa la sua mossa.
export function relaxWait(run) {
  const D = run.D;
  if (D.won || run.hearts <= 0) return null;
  const ev = [{ type: 'text', x: D.pig.x, y: D.pig.y, text: 'Zzz…' }, { type: 'tick' }];
  relaxTick(run, ev);
  return ev;
}
