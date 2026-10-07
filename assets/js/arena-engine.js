// Arena auto-battler: regole, negozio, fusioni, statistiche, battaglia e avversari.
// Nessun accesso al DOM: lo stato è JSON, così si salva e si riprende.
import { APIGS, TRAITS, ACHARMS, TAGS, FARMS, FARM_TAG_WEIGHT, FX, HIT_KEYS, RARITIES, RARITY_ORDER, shopOdds, TRAIT_COST, CHARM_COST,
         FARM_HP, dayMult, WIN_TARGET, START_GOLD, START_HEARTS, REROLL_COST, CELLS, COLS, ROWS, OPP_NAMES } from './arena-data.js';

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
function shuffle(o, a) { for (let i = a.length - 1; i > 0; i--) { const j = ri(o, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- recinto 4×2: l'ultima colonna è la prima fila (la più vicina al nemico) ----------
export const FRONT = COLS - 1;
export const col = (i) => i % COLS, row = (i) => (i / COLS) | 0;
const at = (c, r) => (c >= 0 && c < COLS && r >= 0 && r < ROWS ? r * COLS + c : -1);
export function area(i, who) {
  const c = col(i), r = row(i), out = [];
  const push = (j) => { if (j >= 0 && j !== i) out.push(j); };
  if (who === 'adj') [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dr]) => push(at(c + dc, r + dr)));
  else if (who === 'diag') [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dc, dr]) => push(at(c + dc, r + dr)));
  else if (who === 'row') for (let k = 0; k < COLS; k++) push(at(k, r));
  else if (who === 'col') for (let k = 0; k < ROWS; k++) push(at(c, k));
  else if (who === 'all') for (let k = 0; k < CELLS; k++) push(k);
  return out;
}
export const place = (i) => (col(i) === FRONT ? 'Prima fila' : col(i) === 0 ? 'Retrovia' : 'Centro') + ` · riga ${row(i) + 1}`;

// ---------- livelli ----------
export const MAX_LEVEL = 5;
export const statMult = (L) => 1 + 0.6 * (L - 1);
const hitLv = (v, L) => (v ? Math.max(v, Math.round(v * statMult(L))) : 0);
// valore di un parametro di effetto al livello L (m = moltiplicatore, es. Altare d'oro)
export function pv(eff, key, L, m = 1) {
  const x = eff[key];
  if (x == null) return 0;
  if (key === 'p') return Math.min(60, x * L * m);
  if (key === 's') return eff.e === 'stun' ? x + 0.5 * (L - 1) : x;
  if (key === 'n') return x + Math.floor((L - 1) / 2);
  return x * L * m;
}
export const repeats = (pw, L) => (pw.repeat || 1) + (pw.repeatUp ? (L >= 3) + (L >= 5) : 0);
const round1 = (x) => Math.round(x * 10) / 10;
export const fmt = (x) => { const r = round1(x); return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ','); };
export const fmtCd = (s) => `ogni ${fmt(s)} s`;

// Statistiche base di un maialino al livello L (più le crescite permanenti `perm`).
export function baseStats(id, L = 1, perm = {}) {
  const d = APIGS[id], m = statMult(L);
  const hit = {};
  for (const k of HIT_KEYS) { const v = hitLv((d.hit || {})[k] || 0, L) + (perm[k] || 0); if (v) hit[k] = v; }
  return { atk: round1(d.atk * m + (perm.atk || 0)), hp: Math.round(d.hp * m + (perm.hp || 0)), cd: d.cd, spd: perm.spd || 0, crit: (d.crit || 0) + (perm.crit || 0), hit };
}

// ---------- descrizione dei poteri (generata dagli stessi dati che usa il motore) ----------
// [nome, unità prima del nome]
const STAT = {
  atk: ['attacco', ''], hp: ['vita', ''], spd: ['velocità', '%'], crit: ['critico', '%'],
  burn: ['bruciatura per colpo', ''], poison: ['veleno per colpo', ''], mud: ['fango per colpo', ''],
  heal: ['cura per colpo', ''], shield: ['scudo per colpo', ''], stun: ['di stordire per colpo', '%'],
};
export const STAT_ICON = { atk: '⚔️', hp: '❤️', spd: '⏩', crit: '🎯', burn: '🔥', poison: '☠️', mud: '🟤', heal: '💚', shield: '🫧', stun: '💫' };
const WHO = { self: '', adj: 'i vicini', row: 'gli altri della sua riga', col: 'chi sta nella sua colonna', diag: 'i vicini in diagonale', random: 'un alleato a caso' };
function whoText(e) {
  if (e.who === 'tags') return 'i ' + e.tags.map((t) => TAGS[t].plural).join(' e i ');
  if (e.who === 'all') return e.tag ? `tutti i ${TAGS[e.tag].plural}` : e.incSelf ? 'tutta la squadra' : 'gli alleati';
  if (e.tag) return `i ${TAGS[e.tag].plural} ${e.who === 'adj' ? 'vicini' : e.who === 'row' ? 'della sua riga' : e.who === 'col' ? 'della sua colonna' : 'in diagonale'}`;
  return WHO[e.who] || '';
}
export function trigInfo(pw) {
  const n = pw.n || 1;
  const front = pw.cond === 'front' ? ', in prima fila' : pw.cond === 'alone' ? ', senza vicini' : '';
  switch (pw.on) {
    case 'aura': return 'Sempre' + front;
    case 'start': return 'A inizio battaglia';
    case 'end': return 'Dopo ogni battaglia';
    case 'win': return 'Alla vittoria';
    case 'lose': return 'Alla sconfitta';
    case 'attack': return n === 1 ? 'A ogni attacco' : `Ogni ${n} attacchi`;
    case 'hurt': return `Ogni ${n} colpi subiti dalla squadra`;
    case 'crit': return 'A ogni colpo critico';
    case 'ally': return 'Quando un alleato attiva un potere';
    case 'inflict': return pw.fx === 'heal' ? 'Quando la squadra si cura' : `Quando la squadra infligge ${FX[pw.fx].name.toLowerCase()}`;
    case 'tagAttack': return `Ogni ${n} attacchi dei ${TAGS[pw.tag].plural}`;
    case 'timer': return `Ogni ${pw.t} secondi`;
    case 'low': return 'Sotto metà vita, una volta';
  }
  return '';
}
const plural = (v, one, many) => (v === 1 ? one : many);
export function effText(e, L = 1, m = 1) {
  const v = pv(e, 'v', L, m), s = fmt(v);
  if (e.e === 'stat' || e.e === 'buff' || e.e === 'grow') {
    const [nm, u] = STAT[e.stat], w = whoText(e);
    const per = e.perTag ? ` per ogni ${TAGS[e.perTag].name}` : e.perCharm ? ' per ogni ciondolo' : '';
    const tail = e.e === 'buff' ? ' fino a fine battaglia' : e.e === 'grow' ? ' permanentemente' : '';
    return { who: w, tail, core: `+${s}${u} ${nm}${per}`, text: `${w ? w + ' ' : ''}+${s}${u} ${nm}${per}${tail}` };
  }
  switch (e.e) {
    case 'dmg': return { text: `${s} danni al nemico` };
    case 'heal': return { text: `cura la squadra di ${s}` };
    case 'shield': return { text: `scudo di ${s} alla squadra` };
    case 'armor': return { text: `+${s} corazza alla squadra` };
    case 'burn': return { text: `${s} ${plural(v, 'bruciatura', 'bruciature')} al nemico` };
    case 'poison': return { text: `${s} veleno al nemico` };
    case 'mud': return { text: `${s} fango al nemico` };
    case 'stun': {
      const d = fmt(pv(e, 's', L)), n = pv(e, 'n', L) || 1;
      return { text: e.target === 'front' ? `stordisce il nemico di fronte per ${d} s` : n > 1 ? `stordisce ${n} nemici a caso per ${d} s` : `stordisce un nemico a caso per ${d} s` };
    }
    case 'haste': return { text: `la squadra attacca il ${fmt(pv(e, 'p', L, m))}% più veloce per ${fmt(pv(e, 's', L))} s` };
    case 'strike': return { text: 'un colpo in più' };
    case 'gold': return { text: `+${s} ghiande` };
    case 'charm': return { text: `${fmt(pv(e, 'p', L, m))}% di ricevere un ciondolo` };
  }
  return { text: '' };
}
// «la sua riga +2 attacco, la sua riga +12 vita» → «la sua riga +2 attacco e +12 vita»
function joinEffs(effs) {
  const out = [];
  effs.forEach((e, i) => {
    const prev = effs[i - 1];
    if (prev && e.core && prev.core && prev.who === e.who && prev.tail === e.tail) {
      const last = out[out.length - 1];
      out[out.length - 1] = last.slice(0, last.length - e.tail.length) + ` e ${e.core}${e.tail}`;
    } else out.push(e.text);
  });
  return out.join(', ');
}
// Un potere diviso in due righe: quando scatta e cosa fa (frase con la maiuscola).
export function powerParts(pw, L = 1, m = 1) {
  if (!pw) return null;
  const body = joinEffs(pw.do.map((e) => effText(e, L, m)));
  const rep = repeats(pw, L);
  return { when: trigInfo(pw), what: body[0].toUpperCase() + body.slice(1) + (rep > 1 ? `, ${rep} volte` : '') + '.' };
}
export function powerText(pw, L = 1, m = 1) { const P = powerParts(pw, L, m); return P ? `${P.when}: ${P.what}` : ''; }
export function traitParts(id) {
  const t = TRAITS[id];
  if (t.extraTag) return { when: 'Sempre', what: `Conta anche come ${TAGS[t.extraTag].name} per sinergie e poteri.` };
  if (t.amp) return { when: 'Sempre', what: '+1 a ogni effetto per colpo che il maialino applica già.' };
  return powerParts(t.power);
}
export const traitText = (id) => { const P = traitParts(id); return `${P.when}: ${P.what}`; };

// ---------- partita ----------
export function newArena(seed) {
  const st = {
    v: 3, seed, rng: seed | 0, day: 1, wins: 0, losses: 0, hearts: START_HEARTS, gold: START_GOLD,
    grid: Array(CELLS).fill(null), cells: {}, charms: [], shop: [], uid: 0, freeRolls: 0,
    farm: null, farmOptions: [], screen: 'farm', battle: null, history: [], over: null,
    stats: { comprati: 0, fusioni: 0, rerolls: 0, danniFatti: 0, poteri: 0 },
  };
  st.farmOptions = shuffle(st, Object.keys(FARMS)).slice(0, 3);
  return st;
}
export function chooseFarm(st, id) {
  st.farm = id;
  st.screen = 'shop';
  rollShop(st, 'pig');
}
export const has = (st, id) => st.charms.includes(id);
export const rerollCost = (st) => (st.farm === 'cascina' ? REROLL_COST - 1 : REROLL_COST);

// ---------- negozio ----------
function pickRarity(st, odds) {
  const w = has(st, 'quadrifoglio') ? odds.map((x, i) => x * (1 + i * 0.35)) : odds;
  return weighted(st, RARITY_ORDER, (r) => w[RARITY_ORDER.indexOf(r)]);
}
function pigItem(st) {
  const r = pickRarity(st, shopOdds(st.day));
  const ids = Object.keys(APIGS).filter((id) => APIGS[id].r === r);
  const ft = st.farm && FARMS[st.farm].tag;
  const id = weighted(st, ids, (k) => (ft && APIGS[k].tags.includes(ft) ? FARM_TAG_WEIGHT : 1));
  return { kind: 'pig', id, price: Math.max(1, RARITIES[r].cost - (has(st, 'quadrifoglio') ? 1 : 0)) };
}
function traitItem(st) {
  const day = st.day;
  const w = { comune: 50, raro: 32, epico: 10 + day * 1.5, leggendario: Math.max(0, day - 3) * 1.2 };
  const id = weighted(st, Object.keys(TRAITS), (k) => w[TRAITS[k].r]);
  return { kind: 'trait', id, price: TRAIT_COST[TRAITS[id].r] };
}
function charmItem(st) {
  const w = { comune: 40, raro: 32, epico: 18 + st.day, leggendario: Math.max(0, st.day - 2) * 1.5, eroico: Math.max(0, st.day - 6) * 0.8 };
  const ids = Object.keys(ACHARMS).filter((id) => !(has(st, id) && !ACHARMS[id].cell));
  if (!ids.length) return null;
  const id = weighted(st, ids, (k) => w[ACHARMS[k].r]);
  return { kind: 'charm', id, price: CHARM_COST[ACHARMS[id].r] };
}
// Riempie i 6 posti. Ogni tanto, al posto di un maialino, compare un ciondolo.
export function rollShop(st, kind) {
  st.shop = Array.from({ length: 6 }, () => (kind === 'pig' ? pigItem(st) : traitItem(st)));
  if (kind === 'pig' && st.day >= 2 && rnd(st) < 0.2) {
    const c = charmItem(st);
    if (c) st.shop[ri(st, 6)] = c;
  }
}
export function reroll(st, kind) {
  if (st.freeRolls > 0) st.freeRolls--;
  else { const c = rerollCost(st); if (st.gold < c) return 'Ghiande insufficienti.'; st.gold -= c; }
  st.stats.rerolls++;
  rollShop(st, kind);
  return null;
}

const newUnit = (st, id, price) => ({ uid: ++st.uid, id, level: 1, copies: 1, trait: null, perm: {}, spent: price });
const addPerm = (a, b, share = 1) => { for (const k in b) a[k] = (a[k] || 0) + b[k] * share; };

// Compra l'oggetto nel posto `slot` e lo usa sulla casella `cell`. Restituisce un messaggio d'errore o null.
export function buy(st, slot, cell) {
  const it = st.shop[slot];
  if (!it || it.sold) return 'Questo posto è vuoto.';
  if (st.gold < it.price) return 'Ghiande insufficienti.';
  const u = cell != null ? st.grid[cell] : null;
  if (it.kind === 'pig') {
    if (cell == null) return 'Trascinalo su una casella del recinto.';
    if (u && u.id !== it.id) return 'Casella occupata da un altro maialino.';
    if (u && u.level >= MAX_LEVEL) return 'Questo maialino è già al livello massimo.';
    if (u) { u.copies++; u.spent += it.price; }
    else st.grid[cell] = newUnit(st, it.id, it.price);
    st.stats.comprati++;
  } else if (it.kind === 'trait') {
    if (!u) return 'Trascina il tratto su un maialino.';
    u.trait = it.id; u.spent += it.price;
  } else {
    const c = ACHARMS[it.id];
    if (c.cell) { if (cell == null) return 'Trascina questo ciondolo su una casella del recinto.'; st.cells[cell] = it.id; }
    else st.charms.push(it.id);
    if (it.id === 'ferro') st.freeRolls++;
  }
  st.gold -= it.price;
  it.sold = true;
  return null;
}

// Tre copie identiche (stesso maialino e livello) si fondono in un livello in più.
export function mergeAll(st) {
  const merged = [];
  for (let guard = 0; guard < 20; guard++) {
    let did = false;
    for (let i = 0; i < CELLS && !did; i++) {
      const u = st.grid[i];
      if (!u || u.level >= MAX_LEVEL) continue;
      const same = [];
      for (let j = 0; j < CELLS; j++) { const v = st.grid[j]; if (v && v.id === u.id && v.level === u.level) same.push(j); }
      const total = same.reduce((s, j) => s + st.grid[j].copies, 0);
      if (total < 3) continue;
      // usa esattamente 3 copie: le eventuali avanzate restano al livello di prima
      const base = st.grid[same[0]];
      let need = 3 - base.copies;
      for (const j of same.slice(1)) {
        if (need <= 0) break;
        const v = st.grid[j], take = Math.min(need, v.copies);
        need -= take;
        const share = take / v.copies;
        base.spent += Math.round(v.spent * share);
        addPerm(base.perm, v.perm, share);
        if (!base.trait && v.trait) base.trait = v.trait;
        v.copies -= take; v.spent -= Math.round(v.spent * share);
        if (v.copies <= 0) st.grid[j] = null;
      }
      base.level++;
      base.copies = 1;
      merged.push({ cell: same[0], id: base.id, level: base.level });
      st.stats.fusioni++;
      did = true;
    }
    if (!did) break;
  }
  return merged;
}

export function move(st, from, to) {
  if (from === to) return;
  const a = st.grid[from], b = st.grid[to];
  if (a && b && a.id === b.id && a.level === b.level && b.level < MAX_LEVEL) {
    b.copies += a.copies; b.spent += a.spent;
    addPerm(b.perm, a.perm);
    if (!b.trait) b.trait = a.trait;
    st.grid[from] = null;
    return;
  }
  st.grid[from] = b; st.grid[to] = a;
}
export const sellValue = (u) => Math.max(1, Math.floor(u.spent / 2));
export function sell(st, cell) {
  const u = st.grid[cell];
  if (!u) return 0;
  const v = sellValue(u);
  st.gold += v;
  st.grid[cell] = null;
  return v;
}

// ---------- composizione della squadra ----------
export const tagsOf = (u) => {
  const t = [...APIGS[u.id].tags];
  if (u.trait && TRAITS[u.trait].extraTag && !t.includes(TRAITS[u.trait].extraTag)) t.push(TRAITS[u.trait].extraTag);
  return t;
};
export function tagCounts(grid) {
  const c = {}, seenIds = {};
  grid.forEach((u) => {
    if (!u) return;
    for (const t of tagsOf(u)) {
      seenIds[t] = seenIds[t] || new Set();
      if (seenIds[t].has(u.id)) continue; // maialini uguali contano una volta
      seenIds[t].add(u.id);
      c[t] = (c[t] || 0) + 1;
    }
  });
  return c;
}
// Livello attivo di ogni sinergia (0, 1 o 2).
export function activeSets(grid, charms = []) {
  const c = tagCounts(grid), off = charms.includes('corona') ? 1 : 0, out = {};
  for (const [t, def] of Object.entries(TAGS)) {
    const n = c[t] || 0;
    out[t] = { n, tier: n >= def.sets[1][0] - off ? 2 : n >= def.sets[0][0] - off ? 1 : 0, need: def.sets.map((s) => s[0] - off) };
  }
  return out;
}

// Statistiche finali e poteri di ogni maialino in campo. `boosts` elenca da dove arrivano i bonus.
export function buildTeam(grid, cells = {}, charms = [], farm = null, day = 1) {
  const sets = activeSets(grid, charms);
  const pigs = [];
  grid.forEach((u, i) => {
    if (!u) return;
    const b = baseStats(u.id, u.level, u.perm);
    pigs.push({ cell: i, uid: u.uid, id: u.id, L: u.level, name: APIGS[u.id].name, tags: tagsOf(u), trait: u.trait, cellCharm: cells[i] || null,
      ...b, hit: { ...b.hit }, powers: [], boosts: [] });
  });
  const byCell = new Map(pigs.map((p) => [p.cell, p]));
  const has = (id) => charms.includes(id);
  const mult = (p) => (p.cellCharm === 'altare' ? 2 : 1);
  const nCharms = charms.length + Object.keys(cells).length;
  const add = (p, stat, v, src) => {
    if (!v) return;
    if (HIT_KEYS.includes(stat)) p.hit[stat] = (p.hit[stat] || 0) + v; else p[stat] += v;
    p.boosts.push({ stat, v, src });
  };
  for (const p of pigs) {
    p.powers.push({ ...APIGS[p.id].power, L: p.L, m: mult(p), src: APIGS[p.id].name });
    if (p.trait && TRAITS[p.trait].power) p.powers.push({ ...TRAITS[p.trait].power, L: 1, m: mult(p), src: TRAITS[p.trait].name });
  }
  const count = (tag) => pigs.filter((p) => p.tags.includes(tag)).length;
  // aure
  for (const p of pigs) for (const pw of p.powers) {
    if (pw.on !== 'aura') continue;
    if (pw.cond === 'front' && col(p.cell) !== FRONT) continue;
    if (pw.cond === 'alone' && area(p.cell, 'adj').some((j) => byCell.has(j))) continue;
    for (const e of pw.do) {
      let targets = e.who === 'self' ? [p] : area(p.cell, e.who).map((j) => byCell.get(j)).filter(Boolean);
      if (e.incSelf) targets.push(p);
      if (e.tag) targets = targets.filter((t) => t.tags.includes(e.tag));
      const v = pv(e, 'v', pw.L, pw.m) * (e.perTag ? count(e.perTag) : 1) * (e.perCharm ? nCharms : 1);
      for (const t of targets) add(t, e.stat, v, pw.src);
    }
  }
  // sinergie, fattoria e ciondoli
  const tier = (t) => sets[t].tier;
  const F = farm;
  const syn = (t) => `Sinergia ${TAGS[t].plural}`;
  for (const p of pigs) {
    const is = (t) => p.tags.includes(t);
    if (is('marinaio') && tier('marinaio')) { add(p, 'atk', tier('marinaio') === 2 ? 5 : 2, syn('marinaio')); if (tier('marinaio') === 2) add(p, 'crit', 10, syn('marinaio')); }
    if (is('lottatore') && tier('lottatore')) add(p, 'hp', tier('lottatore') === 2 ? 60 : 25, syn('lottatore'));
    if (is('mago') && tier('mago')) add(p, 'burn', tier('mago') === 2 ? 3 : 1, syn('mago'));
    if (is('cuoco') && tier('cuoco')) add(p, 'heal', tier('cuoco') === 2 ? 4 : 2, syn('cuoco'));
    if (tier('musicista')) add(p, 'spd', tier('musicista') === 2 ? 25 : 10, syn('musicista'));
    if (is('ninja') && tier('ninja')) add(p, 'crit', tier('ninja') === 2 ? 30 : 15, syn('ninja'));
    if (is('contadino') && tier('contadino') === 2) add(p, 'atk', 3, syn('contadino'));
    if (is('fangoso') && tier('fangoso')) add(p, 'mud', tier('fangoso') === 2 ? 2 : 1, syn('fangoso'));
    if (is('alieno') && tier('alieno')) { add(p, 'poison', tier('alieno') === 2 ? 2 : 1, syn('alieno')); if (tier('alieno') === 2) add(p, 'stun', 10, syn('alieno')); }
    if (F === 'dojo' && is('ninja')) add(p, 'crit', 10, FARMS.dojo.name);
    if (F === 'porto' && is('marinaio')) add(p, 'atk', 2, FARMS.porto.name);
    if (F === 'palestra' && is('lottatore')) add(p, 'hp', 15, FARMS.palestra.name);
    if (F === 'torre' && is('mago')) add(p, 'burn', 1, FARMS.torre.name);
    if (F === 'conservatorio') add(p, 'spd', 10, FARMS.conservatorio.name);
    if (F === 'base' && is('alieno')) add(p, 'stun', 10, FARMS.base.name);
    if (has('bandiera')) add(p, 'hp', 15, ACHARMS.bandiera.name);
    if (has('tamburo')) add(p, 'spd', 15, ACHARMS.tamburo.name);
    if (has('fischietto') && (is('marinaio') || is('lottatore'))) add(p, 'atk', 3, ACHARMS.fischietto.name);
    const cc = p.cellCharm, cn = cc && ACHARMS[cc].name;
    if (cc === 'paglia') add(p, 'hp', 20, cn);
    if (cc === 'mangiatoia') add(p, 'atk', 2, cn);
    if (cc === 'tizzone') add(p, 'burn', 2, cn);
    if (cc === 'ampolla') add(p, 'poison', 1, cn);
    if (cc === 'secchio') add(p, 'mud', 2, cn);
    if (cc === 'mirino') add(p, 'crit', 20, cn);
    if (cc === 'ventaglio') add(p, 'spd', 25, cn);
    if (cc === 'trono') { add(p, 'atk', 6, cn); add(p, 'hp', 60, cn); add(p, 'spd', 25, cn); }
    // chi applica già un effetto ne applica di più
    if (has('braciere') && p.hit.burn) add(p, 'burn', 1, ACHARMS.braciere.name);
    if (has('fiala') && p.hit.poison) add(p, 'poison', 1, ACHARMS.fiala.name);
    if (has('palude') && p.hit.mud) add(p, 'mud', 1, ACHARMS.palude.name);
    if (p.trait && TRAITS[p.trait].amp) for (const k of HIT_KEYS) if (p.hit[k] && k !== 'stun') add(p, k, TRAITS[p.trait].amp, TRAITS[p.trait].name);
    if (cc === 'altare') for (const k of HIT_KEYS) if (p.hit[k]) add(p, k, p.hit[k], cn);
    p.atk = round1(Math.max(0, p.atk)); p.hp = Math.round(p.hp); p.crit = Math.min(90, p.crit); p.spd = Math.round(p.spd);
    for (const k of HIT_KEYS) { if (!p.hit[k]) delete p.hit[k]; else p.hit[k] = round1(p.hit[k]); }
    if (p.hit.stun) p.hit.stun = Math.min(50, p.hit.stun);
  }
  const M = dayMult(day);
  const mods = {
    mult: M,
    dmgMult: has('coppa') ? 1.2 : 1,
    healMult: (has('ricettario') ? 1.5 : 1) * (F === 'cucina' ? 1.3 : 1),
    dotMult: has('calderone') ? 1.3 : 1,
    mudPer: has('palude') ? 3 : 2,
    startTwice: has('bacchetta'),
    critMult: tier('ninja') === 2 ? 2.5 : 2,
    armorStart: (tier('cavaliere') === 2 ? 5 : tier('cavaliere') ? 2 : 0) + (tier('lottatore') === 2 ? 2 : 0) + (F === 'castello' ? 3 : 0),
    mudStart: (tier('fangoso') === 2 ? 5 : 0) + (F === 'stalla' ? 4 : 0),
    cuocoTimer: tier('cuoco') === 2 ? 20 : 0,
  };
  const pigHp = pigs.reduce((s, p) => s + p.hp, 0);
  return { pigs, sets, farm: F, day, farmHp: FARM_HP, pigHp, hpMax: Math.round((FARM_HP + pigHp) * M), mods };
}
export const teamOf = (st) => buildTeam(st.grid, st.cells, st.charms, st.farm, st.day);

// ---------- battaglia ----------
// Simula tutta la battaglia e restituisce la cronaca degli eventi, che l'interfaccia riproduce.
export const MUD_MAX = 35, FURY_AT = 15, FURY_EVERY = 5;
export const furyAt = (t) => (t < FURY_AT ? 1 : 1.5 ** (Math.floor((t - FURY_AT) / FURY_EVERY) + 1));
export function simulate(teamA, teamB, seed) {
  const R = { rng: seed | 0 };
  const mk = (T, i) => ({
    i, T, pool: T.hpMax, max: T.hpMax, shield: 0, armor: 0, burn: 0, poison: 0, mud: 0,
    hastes: [], lowDone: false, tagCount: {}, hits: 0,
    pigs: T.pigs.map((p) => ({ ...p, hit: { ...p.hit }, buffAtk: 0, buffCrit: 0, buffSpd: 0, stun: 0, attacks: 0, next: 0 })),
  });
  const S = [mk(teamA, 0), mk(teamB, 1)];
  const ev = [];
  let t = 0;
  const stats = { danni: 0, poteri: 0 };
  const snap = () => [Math.max(0, S[0].pool), Math.max(0, S[1].pool)];
  const status = () => S.map((s) => [Math.round(s.shield), s.armor, round1(s.burn), round1(s.poison), round1(s.mud)]);
  const emit = (e) => ev.push({ t: Math.round(t * 100) / 100, ...e, hp: snap(), ss: status() });
  const foe = (s) => S[1 - s.i];
  const interval = (s, p) => {
    const haste = s.hastes.filter((x) => x.until > t).reduce((a, x) => a + x.p, 0) + p.spd + p.buffSpd;
    const slow = Math.min(MUD_MAX, s.mud * foe(s).T.mods.mudPer) / 100;
    return p.cd / Math.max(0.2, 1 + haste / 100) / (1 - slow);
  };
  function hurt(s, amount, isHit) {
    let a = amount;
    if (isHit && s.armor > 0) a -= Math.min(s.armor, a * 0.5);
    if (s.shield > 0) { const blk = Math.min(s.shield, a); s.shield -= blk; a -= blk; }
    s.pool -= a;
    if (s.i === 1) stats.danni += a;
    return a;
  }
  const scaleLife = (s, v) => v * s.T.mods.mult * s.T.mods.healMult;
  function heal(s, v) { const h = Math.max(0, Math.min(s.max - s.pool, scaleLife(s, v))); s.pool += h; return h; }
  function frontEnemy(s, p) {
    const o = foe(s), r = row(p.cell);
    const sameRow = o.pigs.filter((q) => row(q.cell) === r).sort((a, b) => col(b.cell) - col(a.cell));
    return sameRow[0] || (o.pigs.length ? pick(R, o.pigs) : null);
  }
  function targetsOf(s, p, e) {
    if (e.who === 'self') return [p];
    if (e.who === 'random') return s.pigs.length ? [pick(R, s.pigs)] : [];
    if (e.who === 'tags') return s.pigs.filter((q) => q.tags.some((x) => e.tags.includes(x)));
    let out = area(p.cell, e.who).map((j) => s.pigs.find((q) => q.cell === j)).filter(Boolean);
    if (e.incSelf) out.push(p);
    if (e.tag) out = out.filter((q) => q.tags.includes(e.tag));
    return out;
  }
  // «quando la squadra infligge…»: reagiscono solo agli effetti originali, così non ci sono catene infinite
  function inflicted(s, fx, depth) {
    if (depth > 1) return;
    for (const q of s.pigs) for (const qp of q.powers) if (qp.on === 'inflict' && qp.fx === fx) fire(s, q, qp, 2);
  }
  function stunPig(o, q, dur) { q.stun = Math.max(q.stun, t + dur); emit({ k: 'stun', s: o.i, c: q.cell, d: dur }); }
  // applica un effetto di un potere
  function apply(s, p, pw, e, depth) {
    const L = pw.L, m = pw.m || 1, o = foe(s);
    const v = pv(e, 'v', L, m);
    const out = (fx, val) => emit({ k: 'pow', s: s.i, c: p.cell, fx, v: val });
    switch (e.e) {
      case 'dmg': { const d = v * s.T.mods.mult * s.T.mods.dmgMult; hurt(o, d, false); out('dmg', d); inflicted(s, 'dmg', depth); break; }
      case 'heal': { const h = heal(s, v); out('heal', h); inflicted(s, 'heal', depth); break; }
      case 'shield': { const sh = scaleLife(s, v); s.shield += sh; out('shield', sh); inflicted(s, 'shield', depth); break; }
      case 'armor': s.armor += v; out('armor', v); inflicted(s, 'armor', depth); break;
      case 'burn': o.burn += v; out('burn', v); inflicted(s, 'burn', depth); break;
      case 'poison': o.poison += v; out('poison', v); inflicted(s, 'poison', depth); break;
      case 'mud': o.mud += v; out('mud', v); inflicted(s, 'mud', depth); break;
      case 'stun': {
        const n = pv(e, 'n', L) || 1, dur = pv(e, 's', L);
        const targets = e.target === 'front' ? [frontEnemy(s, p)] : shuffle(R, [...o.pigs]).slice(0, n);
        for (const q of targets) if (q) stunPig(o, q, dur);
        out('stun', 0);
        inflicted(s, 'stun', depth);
        break;
      }
      case 'buff': {
        for (const q of targetsOf(s, p, e)) {
          if (e.stat === 'atk') q.buffAtk += v;
          else if (e.stat === 'crit') q.buffCrit += v;
          else if (e.stat === 'spd') q.buffSpd += v;
          else if (e.stat === 'hp') { const x = v * s.T.mods.mult; s.max += x; s.pool += x; }
          else if (HIT_KEYS.includes(e.stat)) q.hit[e.stat] = (q.hit[e.stat] || 0) + v;
          emit({ k: 'buff', s: s.i, c: q.cell, stat: e.stat, v });
        }
        out('buff', 0);
        break;
      }
      case 'haste': s.hastes.push({ p: pv(e, 'p', L, m), until: t + pv(e, 's', L) }); out('haste', pv(e, 'p', L, m)); break;
      case 'strike': strike(s, p, true); break;
    }
  }
  // depth: 0 = potere originale, 1 = reazione di un alleato, 2 = reazione a un effetto inflitto
  function fire(s, p, pw, depth = 0) {
    const reps = repeats(pw, pw.L);
    for (let r = 0; r < reps; r++) for (const e of pw.do) apply(s, p, pw, e, depth);
    if (s.i === 0) stats.poteri++;
    if (depth > 0) return;
    for (const q of s.pigs) {
      if (q === p) continue;
      for (const qp of q.powers) if (qp.on === 'ally') fire(s, q, qp, 1);
    }
    const fest = s.T.sets.festaiolo.tier;
    if (fest) {
      const h = heal(s, fest === 2 ? 6 : 3);
      if (h > 0) emit({ k: 'set', s: s.i, tag: 'festaiolo', fx: 'heal', v: h });
      if (fest === 2) p.buffAtk += 1;
    }
    if (p.cellCharm === 'campana') area(p.cell, 'adj').forEach((j) => { const q = s.pigs.find((x) => x.cell === j); if (q) { q.buffAtk += 2; emit({ k: 'buff', s: s.i, c: j, stat: 'atk', v: 2 }); } });
  }
  // un colpo: danni (se ha attacco) e tutti gli effetti per colpo; il critico raddoppia entrambi
  function strike(s, p, bonus = false) {
    const o = foe(s);
    if (!o.pigs.length) return;
    const crit = rnd(R) * 100 < p.crit + p.buffCrit;
    const cm = crit ? s.T.mods.critMult : 1;
    const target = frontEnemy(s, p) && rnd(R) < 0.6 ? frontEnemy(s, p) : pick(R, o.pigs);
    const atk = p.atk + p.buffAtk;
    const real = atk > 0 ? hurt(o, atk * s.T.mods.dmgMult * furyAt(t) * cm, true) : 0;
    const h = p.hit, fxs = [];
    if (h.burn) { o.burn += h.burn * cm; fxs.push(['burn', h.burn * cm]); }
    if (h.poison) { o.poison += h.poison * cm; fxs.push(['poison', h.poison * cm]); }
    if (h.mud) { o.mud += h.mud * cm; fxs.push(['mud', h.mud * cm]); }
    if (h.heal) fxs.push(['heal', heal(s, h.heal * cm)]);
    if (h.shield) { const sh = scaleLife(s, h.shield * cm); s.shield += sh; fxs.push(['shield', sh]); }
    emit({ k: 'atk', s: s.i, c: p.cell, tc: target.cell, v: real, crit, bonus, fxs });
    if (h.stun && rnd(R) * 100 < h.stun) stunPig(o, target, 1);
    for (const [fx] of fxs) inflicted(s, fx, 0);
    o.hits++;
    for (const q of o.pigs) for (const qp of q.powers) if (qp.on === 'hurt' && o.hits % qp.n === 0) fire(o, q, qp);
    if (crit && !bonus) for (const pw of p.powers) if (pw.on === 'crit') fire(s, p, pw);
  }
  function attack(s, p) {
    strike(s, p);
    p.attacks++;
    for (const pw of p.powers) if (pw.on === 'attack' && p.attacks % pw.n === 0) fire(s, p, pw);
    for (const q of s.pigs) for (const pw of q.powers) {
      if (pw.on !== 'tagAttack' || !p.tags.includes(pw.tag)) continue;
      const key = q.cell + pw.tag;
      s.tagCount[key] = (s.tagCount[key] || 0) + 1;
      if (s.tagCount[key] % pw.n === 0) fire(s, q, pw);
    }
  }

  // inizio battaglia: prima gli effetti di squadra, poi i poteri «a inizio battaglia»
  for (const s of S) {
    const M = s.T.mods, o = foe(s);
    if (M.armorStart) { s.armor += M.armorStart; emit({ k: 'set', s: s.i, fx: 'armor', v: M.armorStart }); }
    if (M.mudStart) { o.mud += M.mudStart; emit({ k: 'set', s: s.i, fx: 'mud', v: M.mudStart }); }
  }
  for (const s of S) for (const p of s.pigs) p.next = interval(s, p) * (0.35 + rnd(R) * 0.4);
  for (const s of S) for (let k = 0; k < (s.T.mods.startTwice ? 2 : 1); k++)
    for (const p of s.pigs) for (const pw of p.powers) if (pw.on === 'start') fire(s, p, pw);

  // svolgimento: passi da 50 ms, al massimo 120 secondi
  const PER_S = 20;
  let winner = -1;
  for (let step = 1; step <= 120 * PER_S; step++) {
    t = step / PER_S;
    for (const s of S) {
      // bruciature e veleno, una volta al secondo
      if (step % PER_S === 0) {
        const dm = foe(s).T.mods.dotMult * furyAt(t);
        if (s.burn > 0) { const d = hurt(s, s.burn * dm, false); emit({ k: 'dot', s: s.i, fx: 'burn', v: d }); s.burn = Math.max(0, s.burn - Math.max(1, Math.round(s.burn * 0.2))); }
        if (s.poison > 0 && step % (2 * PER_S) === 0) { const d = hurt(s, s.poison * dm, false); emit({ k: 'dot', s: s.i, fx: 'poison', v: d }); }
      }
      for (const p of s.pigs) for (const pw of p.powers) if (pw.on === 'timer' && step % Math.round(pw.t * PER_S) === 0) fire(s, p, pw);
      if (step % (5 * PER_S) === 0 && s.T.mods.cuocoTimer) { const h = heal(s, s.T.mods.cuocoTimer); emit({ k: 'set', s: s.i, tag: 'cuoco', fx: 'heal', v: h }); inflicted(s, 'heal', 1); }
      for (const p of s.pigs) {
        if (t < p.next) continue;
        if (t < p.stun) { p.next = p.stun; continue; }
        attack(s, p);
        p.next = t + interval(s, p);
      }
      if (!s.lowDone && s.pool < s.max / 2) {
        s.lowDone = true;
        for (const p of s.pigs) for (const pw of p.powers) if (pw.on === 'low') fire(s, p, pw);
      }
    }
    if (S[0].pool <= 0 || S[1].pool <= 0) { winner = S[0].pool <= 0 && S[1].pool <= 0 ? (S[0].pool >= S[1].pool ? 0 : 1) : S[0].pool <= 0 ? 1 : 0; break; }
  }
  if (winner < 0) winner = S[0].pool / S[0].max >= S[1].pool / S[1].max ? 0 : 1;
  ev.push({ t: Math.round(t * 100) / 100, k: 'end', winner, hp: snap(), ss: status() });
  return { events: ev, winner, max: [S[0].max, S[1].max], duration: t, stats: { danni: Math.round(stats.danni), poteri: stats.poteri } };
}

// ---------- dopo la battaglia: crescite, ghiande, ciondoli ----------
export function afterBattle(st, won) {
  let gold = 0;
  const log = [];
  const gifts = [];
  const sets = activeSets(st.grid, st.charms);
  const growUnit = (t, stat, v, src) => { t.perm[stat] = (t.perm[stat] || 0) + v; log.push({ id: t.id, stat, v, src }); };
  st.grid.forEach((u, i) => {
    if (!u) return;
    const list = [[APIGS[u.id].power, u.level, APIGS[u.id].name], u.trait && TRAITS[u.trait].power ? [TRAITS[u.trait].power, 1, TRAITS[u.trait].name] : null].filter(Boolean);
    const m = st.cells[i] === 'altare' ? 2 : 1;
    for (const [pw, L, src] of list) {
      if (!(pw.on === 'end' || (pw.on === 'win' && won) || (pw.on === 'lose' && !won))) continue;
      for (const e of pw.do) {
        if (e.e === 'grow') {
          let targets = e.who === 'adj' ? area(i, 'adj').map((j) => st.grid[j]).filter(Boolean)
            : e.who === 'all' ? st.grid.filter((x) => x && (x !== u || e.incSelf)) : [u];
          if (e.tag) targets = targets.filter((x) => tagsOf(x).includes(e.tag));
          for (const t of targets) growUnit(t, e.stat, pv(e, 'v', L, m), src);
        } else if (e.e === 'gold') gold += pv(e, 'v', L, m);
        else if (e.e === 'charm' && rnd(st) * 100 < pv(e, 'p', L, m)) {
          const ids = Object.keys(ACHARMS).filter((k) => !ACHARMS[k].cell && !has(st, k));
          if (ids.length) { const c = pick(st, ids); st.charms.push(c); gifts.push(c); if (c === 'ferro') st.freeRolls++; }
        }
      }
    }
  });
  if (won) {
    const mostri = st.grid.filter((u) => u && tagsOf(u).includes('mostro'));
    const mt = sets.mostro.tier;
    for (const u of mostri) {
      if (mt) growUnit(u, 'atk', mt === 2 ? 2 : 1, 'Sinergia Mostri');
      if (mt === 2) growUnit(u, 'hp', 10, 'Sinergia Mostri');
      if (st.farm === 'grotta') growUnit(u, 'hp', 10, FARMS.grotta.name);
    }
  }
  if (sets.contadino.tier) gold += sets.contadino.tier === 2 ? 5 : 2;
  if (has(st, 'coccio')) gold += 3;
  if (won && st.farm === 'sagra') gold += 3;
  st.gold += gold;
  return { gold, log, gifts };
}

// ---------- avversari: un giocatore simulato, un po' meno bravo e con meno ghiande ----------
const FRONT_ORDER = [3, 7, 2, 6, 1, 5, 0, 4], BACK_ORDER = [0, 4, 1, 5, 2, 6, 3, 7];
function aiPlace(st, id) {
  const front = APIGS[id].tags.some((t) => t === 'lottatore' || t === 'cavaliere');
  return (front ? FRONT_ORDER : BACK_ORDER).find((i) => !st.grid[i]);
}
export function aiDay(st, maxRolls = 2) {
  let rolls = 0;
  for (let pass = 0; pass < 8; pass++) {
    let bought = false;
    st.shop.forEach((it, slot) => {
      if (it.sold || it.price > st.gold) return;
      if (it.kind === 'pig') {
        const dup = st.grid.findIndex((u) => u && u.id === it.id && u.level < MAX_LEVEL);
        let cell = dup >= 0 ? dup : aiPlace(st, it.id);
        if (cell == null) {
          // recinto pieno: vende il più debole se il nuovo è di rarità più alta
          const weakest = st.grid.map((u, i) => ({ u, i })).filter((x) => x.u).sort((a, b) =>
            RARITY_ORDER.indexOf(APIGS[a.u.id].r) + a.u.level - (RARITY_ORDER.indexOf(APIGS[b.u.id].r) + b.u.level))[0];
          if (weakest && RARITY_ORDER.indexOf(APIGS[it.id].r) > RARITY_ORDER.indexOf(APIGS[weakest.u.id].r) + weakest.u.level - 1) { sell(st, weakest.i); cell = weakest.i; }
          else return;
        }
        if (!buy(st, slot, cell)) { mergeAll(st); bought = true; }
      } else if (it.kind === 'trait') {
        const cell = st.grid.findIndex((u) => u && !u.trait);
        if (cell >= 0 && rnd(st) < 0.6 && !buy(st, slot, cell)) bought = true;
      } else if (it.kind === 'charm') {
        const c = ACHARMS[it.id];
        const cell = c.cell ? st.grid.findIndex((u, i) => u && !st.cells[i]) : null;
        if ((!c.cell || cell >= 0) && !buy(st, slot, c.cell ? cell : null)) bought = true;
      }
    });
    if (!bought) {
      if (rolls < maxRolls && st.gold >= rerollCost(st) + 3 && rnd(st) < 0.8) { rolls++; reroll(st, rnd(st) < 0.75 || !st.grid.some((u) => u && !u.trait) ? 'pig' : 'trait'); }
      else break;
    }
  }
}
export const income = (day, won) => (won ? 14 : 12) + Math.floor(day / 2);
// L'avversario parte con meno ghiande e ne guadagna meno: deve essere battibile da chi gioca con calma.
export const GHOST_START = 18, GHOST_MALUS = 4, GHOST_WINRATE = 0.35;

// Squadra avversaria per il giorno `day`: una partita simulata giocata fino a quel giorno.
export function makeGhost(seed, day) {
  const g = newArena(seed);
  g.gold = GHOST_START;
  chooseFarm(g, pick(g, g.farmOptions));
  for (let d = 1; d <= day; d++) {
    if (d > 1) {
      const won = rnd(g) < GHOST_WINRATE;
      afterBattle(g, won);
      g.gold += income(d - 1, won) - GHOST_MALUS + (g.farm === 'cascina' ? 3 : 0);
      g.day = d;
      g.freeRolls = has(g, 'ferro') ? 1 : 0;
      rollShop(g, 'pig');
    }
    aiDay(g, d < 4 ? 0 : 1);
  }
  return { name: pick(g, OPP_NAMES), farm: g.farm, grid: g.grid, cells: g.cells, charms: g.charms };
}

// Avvia la battaglia del giorno e applica il risultato.
export function fight(st) {
  const ghost = makeGhost((st.seed ^ (st.day * 7919)) | 0, st.day);
  const A = teamOf(st), B = buildTeam(ghost.grid, ghost.cells, ghost.charms, ghost.farm, st.day);
  const sim = simulate(A, B, (st.seed + st.day * 101) | 0);
  const won = sim.winner === 0;
  if (won) st.wins++; else { st.losses++; st.hearts--; }
  const base = income(st.day, won), after = afterBattle(st, won);
  st.gold += base;
  st.stats.danniFatti += sim.stats.danni; st.stats.poteri += sim.stats.poteri;
  st.battle = { day: st.day, won, A, B, ghost, sim, reward: base, extra: after.gold, growth: after.log, gifts: after.gifts };
  st.history.push({ day: st.day, won, opp: ghost.name });
  st.over = st.wins >= WIN_TARGET ? 'win' : st.hearts <= 0 ? 'lose' : null;
  st.screen = 'battle';
  return st.battle;
}

export function nextDay(st) {
  st.day++;
  st.battle = null;
  st.screen = 'shop';
  st.freeRolls = has(st, 'ferro') ? 1 : 0;
  if (st.farm === 'cascina') st.gold += 3;
  rollShop(st, 'pig');
}
