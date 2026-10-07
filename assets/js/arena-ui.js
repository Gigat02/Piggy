// Arena auto-battler: scelta della fattoria, recinto, negozio con trascinamento, battaglia animata.
import * as AE from './arena-engine.js';
import { APIGS, TRAITS, ACHARMS, TAGS, FARMS, FX, HIT_KEYS, RARITIES, RARITY_ORDER, FARM_HP, MULT_DAYS, dayMult, CELLS,
         WIN_TARGET, START_GOLD, START_HEARTS } from './arena-data.js';
import { arenaPigSVG, ICONS } from './art.js';
import * as Au from './audio.js';

const SAVE = 'piggy.arena.v3', PROF = 'piggy.arenaprof.v1', SEEN_INTRO = 'piggy.arenaintro.v3';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let X = null, st = null, sel = null, drag = null, play = null, diaryTab = 'pigs', diaryRar = 'all', farmSel = null;

const save = () => X.store(SAVE, st);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = AE.fmt;
const acorn = '<svg class="ico" aria-hidden="true"><use href="#s-acorn"/></svg>';
const heart = '<svg class="ico" aria-hidden="true"><use href="#s-heart"/></svg>';
const rarColor = (r) => RARITIES[r].color;
const pigArt = (id) => arenaPigSVG(APIGS[id].look);
const multTxt = (d) => '×' + fmt(dayMult(d));

// ---------- pezzi grafici comuni ----------
const rarBand = (r) => `<div class="band band-rar" style="--bc:${rarColor(r)}">${RARITIES[r].name}</div>`;
const tagBands = (tags) => `<div class="band-tags">${tags.map((t) => `<span class="band band-tag" style="--bc:${TAGS[t].color}">${TAGS[t].name}</span>`).join('')}</div>`;
const HIT_NAME = { burn: 'bruciatura', poison: 'veleno', mud: 'fango', heal: 'cura', shield: 'scudo', stun: 'stordire' };
// Statistiche sulla carta: attacco (se c'è), vita ed effetti per colpo. `base` = senza bonus, per evidenziare i potenziamenti.
function statChips(s, base = null) {
  const up = (v, b) => (base && v - (b || 0) > 0.05 ? 'up' : '');
  const out = [];
  if (s.atk > 0) out.push(`<span class="cs cs-atk ${up(s.atk, base && base.atk)}" title="Attacco: danni per colpo">⚔️<b>${fmt(s.atk)}</b></span>`);
  out.push(`<span class="cs cs-hp ${up(s.hp, base && base.hp)}" title="Vita">❤️<b>${Math.round(s.hp)}</b></span>`);
  for (const k of HIT_KEYS) if (s.hit[k]) out.push(`<span class="cs cs-fx ${up(s.hit[k], base && base.hit[k])}" style="--fc:${FX[k].color}" title="${FX[k].name} per colpo">${AE.STAT_ICON[k]}<b>${fmt(s.hit[k])}${k === 'stun' ? '%' : ''}</b></span>`);
  return `<div class="card-stats">${out.join('')}</div>`;
}
function copiesBar(u) {
  if (u.level >= AE.MAX_LEVEL) return '<div class="cp-bar max" title="Livello massimo">MAX</div>';
  return `<div class="cp-bar" title="Copie: ${u.copies} di 3. Alla terza copia sale al livello ${u.level + 1}.">${[0, 1, 2].map((k) => `<i class="${k < u.copies ? 'on' : ''}"></i>`).join('')}<small>${u.copies}/3</small></div>`;
}
const lvBadge = (L) => `<span class="lv-badge" title="Livello ${L} (massimo ${AE.MAX_LEVEL})">Liv.<b>${L}</b></span>`;
// Potere: momento in alto, frase sotto, tutto centrato.
const powerBlock = (P, title = '') => `<div class="pw-block">${title ? `<small class="pw-src">${title}</small>` : ''}<div class="pw-when">${P.when}</div><div class="pw-what">${P.what}</div></div>`;

export function openArena(ctx) {
  X = ctx;
  const saved = X.load(SAVE);
  if (saved && saved.v === 3 && !saved.over) { st = saved; route(); }
  else showIntro();
}
function route() {
  if (st.screen === 'farm') showFarms();
  else if (st.screen === 'battle' && st.battle) showBattle();
  else showShop();
}

// =====================================================================
// Introduzione
// =====================================================================
function showIntro() {
  X.closeModal();
  const prof = X.load(PROF) || { runs: 0, best: 0, champs: 0 };
  const saved = X.load(SAVE);
  const can = saved && saved.v === 3 && !saved.over;
  X.app.innerHTML = `<main class="ar-intro">
    <header class="pg-head"><button class="btn ghost" data-aact="exit">${ICONS.back}Menu principale</button>
      <div class="pg-title"><h1>⚔️ Arena dei maialini</h1><p>Auto-battler: componi il recinto, il resto lo fanno loro.</p></div><span class="pg-spacer"></span></header>
    <section class="ai-hero">
      <div class="ai-pigs">${['velenella', 'squalotto', 'kosmo', 'zorg', 'diavoletto', 'tartaruga'].map((id) => `<div class="ai-pig">${pigArt(id)}</div>`).join('')}</div>
      <div class="ai-rules">
        <div class="rr"><span>🏡</span><div><b>Scegli la fattoria</b><small>Una fra tre: decide quali maialini troverai più spesso e dà un bonus. Ogni fattoria ha ${FARM_HP} di vita.</small></div></div>
        <div class="rr"><span>🛒</span><div><b>Compra e piazza</b><small>Trascina maialini, tratti e ciondoli dal negozio al recinto di ${CELLS} caselle. Parti con ${START_GOLD} ghiande.</small></div></div>
        <div class="rr"><span>✨</span><div><b>Fondi i doppioni</b><small>3 copie dello stesso maialino lo portano al livello successivo, fino al 5.</small></div></div>
        <div class="rr"><span>🔥</span><div><b>Effetti a ogni colpo</b><small>Molti maialini bruciano, avvelenano, infangano o curano a ogni attacco. Combo, tratti e ciondoli li fanno crescere.</small></div></div>
        <div class="rr"><span>📈</span><div><b>Ogni giorno più vita</b><small>La vita della squadra si moltiplica: ×1 il primo giorno, ×1,5 il secondo, ×2 il terzo… fino al giorno ${MULT_DAYS}. Servono maialini sempre più forti.</small></div></div>
        <div class="rr"><span>🏆</span><div><b>${WIN_TARGET} vittorie per diventare campione</b><small>Hai ${START_HEARTS} cuori: ogni sconfitta ne costa uno.</small></div></div>
      </div>
    </section>
    <div class="ai-foot">
      ${can ? `<button class="btn big primary" data-aact="continue">▶ Continua · giorno ${saved.day}, ${saved.wins} vittorie</button>` : ''}
      <button class="btn big ${can ? '' : 'primary'}" data-aact="new">Nuova arena</button>
      <p class="best">${prof.runs ? `Partite: ${prof.runs} · record ${prof.best} vittorie · titoli di campione: ${prof.champs}` : 'Prima volta nell\'Arena? Passa il mouse su qualunque cosa: il pannello a destra spiega tutto.'}</p>
    </div>
  </main>`;
}

// =====================================================================
// Scelta della fattoria
// =====================================================================
function farmPigs(tag) {
  const ids = Object.keys(APIGS).filter((id) => APIGS[id].tags.includes(tag));
  const out = [];
  for (const r of RARITY_ORDER) { const x = ids.find((id) => APIGS[id].r === r && !out.includes(id)); if (x) out.push(x); if (out.length === 3) break; }
  return out;
}
function showFarms() {
  X.closeModal();
  farmSel = null;
  X.app.innerHTML = `<main class="ar-farms">
    <header class="pg-head"><button class="btn ghost" data-aact="exit">${ICONS.back}Menu principale</button>
      <div class="pg-title"><h1>🏡 Scegli la tua fattoria</h1><p>Vale per tutta la partita: decide quali maialini troverai più spesso e ti dà un bonus. Ogni fattoria ha ${FARM_HP} di vita.</p></div><span class="pg-spacer"></span></header>
    <section class="farm-list">${st.farmOptions.map((id) => {
      const f = FARMS[id], tg = TAGS[f.tag];
      return `<button class="farm" data-aact="farm" data-k="${id}" style="--tc:${tg.color}">
        <span class="farm-ico">${f.icon}</span><b class="farm-name">${f.name}</b>
        <div class="farm-pigs">${farmPigs(f.tag).map((p) => `<div class="fp" style="--rc:${rarColor(APIGS[p].r)}" title="${esc(APIGS[p].name)}">${pigArt(p)}</div>`).join('')}</div>
        <div class="farm-perk"><span class="fk">🛒</span><span>Più <span class="band band-tag inline" style="--bc:${tg.color}">${tg.plural}</span> nel negozio</span></div>
        <div class="farm-perk"><span class="fk">⭐</span><span>${f.bonus}</span></div>
        <div class="farm-perk"><span class="fk">❤️</span><span>${FARM_HP} vita della fattoria</span></div>
        <small class="farm-set">Sinergia ${tg.name}: ${tg.sets.map(([n, x]) => `<b>${n}</b> ${x}`).join(' · ')}</small>
      </button>`;
    }).join('')}</section>
    <div class="ai-foot"><button class="btn big primary" data-aact="farmok" disabled>Scegli una fattoria</button></div>
  </main>`;
}

// =====================================================================
// Recinto e negozio
// =====================================================================
function showShop() {
  X.closeModal();
  const f = FARMS[st.farm];
  X.app.innerHTML = `<main class="arena">
    <header class="ar-top">
      <button class="btn ghost small" data-aact="exit">${ICONS.back}Menu</button>
      <div class="ar-title"><b>Arena</b><small id="ar-day"></small></div>
      <span class="ar-farm" data-farm="1" style="--tc:${TAGS[f.tag].color}">${f.icon} ${f.name}</span>
      <div class="ar-res" id="ar-res"></div>
      <div class="ar-btns">
        <button class="hbtn" data-aact="diary" title="Tutti i maialini, i tratti, i ciondoli, gli effetti e le sinergie">${ICONS.diary}<span>Diario</span></button>
        <button class="hbtn" data-aact="charms" title="I ciondoli che possiedi"><span class="hb-emoji">💍</span><span>Ciondoli</span></button>
        <button class="hbtn" data-aact="rules" title="Come si gioca"><span class="hb-emoji">❔</span><span>Regole</span></button>
        <button class="hbtn" data-aact="abandon" title="Abbandona la partita"><span class="hb-emoji">🏳️</span><span>Abbandona</span></button>
      </div>
    </header>
    <section class="ar-main">
      <aside class="ar-syn" id="ar-syn"></aside>
      <div class="pen-wrap">
        <div class="pen-fence"><div class="pen" id="pen"></div></div>
        <div class="front-label">prima fila ▶</div>
      </div>
      <aside class="ar-info" id="ar-info"></aside>
    </section>
    <footer class="ar-shop">
      <div class="ar-rolls">
        <button class="btn roll" data-aact="roll" data-k="pig">🐷 Nuovi maialini <b id="cost-pig"></b></button>
        <button class="btn roll" data-aact="roll" data-k="trait">🎁 Nuovi tratti <b id="cost-trait"></b></button>
      </div>
      <div class="ar-slots" id="ar-slots"></div>
      <div class="ar-actions">
        <div class="sellzone" id="sellzone" data-drop="sell"></div>
        <button class="btn primary big fight" data-aact="fight">⚔️ Combatti!</button>
      </div>
    </footer>
  </main>`;
  renderShop();
  if (!X.load(SEEN_INTRO)) { X.store(SEEN_INTRO, 1); showRules(); }
}

function sellIdle() { return '💰 Vendi<small>trascina qui un maialino</small>'; }
function sellPreview(cell) {
  const z = $('#sellzone'), u = st.grid[cell];
  if (!z || !u) return;
  z.classList.add('preview');
  z.innerHTML = `💰 Vendi ${APIGS[u.id].name}<b class="sell-val">+${AE.sellValue(u)} ${acorn}</b>`;
}
function sellReset() { const z = $('#sellzone'); if (z) { z.classList.remove('preview'); z.innerHTML = sellIdle(); } }

function renderShop() {
  const team = AE.teamOf(st);
  const byCell = new Map(team.pigs.map((p) => [p.cell, p]));
  $('#ar-day').textContent = `Giorno ${st.day}`;
  $('#ar-res').innerHTML = `<span class="ar-chip c-heart" title="Cuori: ogni sconfitta ne costa uno">${heart}<b>${st.hearts}</b></span>
    <span class="ar-chip c-trophy" title="Vittorie: a ${WIN_TARGET} sei campione">🏆<b>${st.wins}</b><small>/${WIN_TARGET}</small></span>
    <span class="ar-chip c-gold" title="Ghiande">${acorn}<b>${st.gold}</b></span>`;
  const cost = st.freeRolls > 0 ? 'gratis' : `${AE.rerollCost(st)} ${acorn}`;
  $('#cost-pig').innerHTML = cost;
  $('#cost-trait').innerHTML = cost;
  // recinto
  $('#pen').innerHTML = st.grid.map((u, i) => {
    const charm = st.cells[i] ? `<span class="pc-charm" title="${esc(ACHARMS[st.cells[i]].name)}: ${esc(ACHARMS[st.cells[i]].text)}">${ACHARMS[st.cells[i]].icon}</span>` : '';
    if (!u) return `<div class="pc empty" data-cell="${i}" data-drop="cell"><span class="pc-plus">+</span>${charm}</div>`;
    const d = APIGS[u.id], p = byCell.get(i), b = AE.baseStats(u.id, u.level, u.perm);
    return `<div class="pc ${sel && sel.from === 'cell' && sel.i === i ? 'sel' : ''}" data-cell="${i}" data-drop="cell" style="--rc:${rarColor(d.r)}">
      <div class="pc-pig acard" data-drag="cell" data-i="${i}">
        ${rarBand(d.r)}${tagBands(p.tags)}
        <b class="c-name">${d.name}</b>
        <div class="pc-art">${pigArt(u.id)}${lvBadge(u.level)}${copiesBar(u)}</div>
        ${statChips(p, b)}
      </div>${charm}</div>`;
  }).join('');
  $('#ar-slots').innerHTML = st.shop.map((it, i) => slotHTML(it, i)).join('');
  renderSide(team);
  refreshInfo();
  if (sel && sel.from === 'cell') sellPreview(sel.i); else sellReset();
  $('.fight').disabled = !st.grid.some(Boolean);
}

function slotHTML(it, i) {
  if (!it || it.sold) return `<div class="slot empty"><span>venduto</span></div>`;
  const poor = st.gold < it.price;
  const price = `<span class="price ${poor ? 'poor' : ''}">${it.price} ${acorn}</span>`;
  const selCls = sel && sel.from === 'shop' && sel.i === i ? 'sel' : '';
  if (it.kind === 'pig') {
    const d = APIGS[it.id], b = AE.baseStats(it.id);
    const owned = st.grid.filter((u) => u && u.id === it.id && u.level < AE.MAX_LEVEL).sort((a, c) => c.copies - a.copies)[0];
    const own = owned ? `<span class="slot-own" title="Ne hai già ${owned.copies} di 3 al livello ${owned.level}: trascinalo sopra per avvicinarti al livello ${owned.level + 1}">✨ ${owned.copies}/3</span>` : '';
    return `<div class="slot pig acard ${poor ? 'poor' : ''} ${selCls}" data-slot="${i}" data-drag="shop" data-i="${i}" style="--rc:${rarColor(d.r)}">
      ${rarBand(d.r)}${tagBands(d.tags)}${own}
      <b class="c-name">${d.name}</b>
      <div class="slot-art">${pigArt(it.id)}</div>
      ${statChips(b)}${price}</div>`;
  }
  const def = it.kind === 'trait' ? TRAITS[it.id] : ACHARMS[it.id];
  const kindLabel = it.kind === 'trait' ? 'Tratto' : def.cell ? 'Ciondolo da casella' : 'Ciondolo di squadra';
  const txt = it.kind === 'trait' ? AE.traitParts(it.id).what : def.text;
  return `<div class="slot ${it.kind} acard ${poor ? 'poor' : ''} ${selCls}" data-slot="${i}" data-drag="shop" data-i="${i}" style="--rc:${rarColor(def.r)}">
    ${rarBand(def.r)}<div class="band-tags"><span class="band band-kind">${kindLabel}</span></div>
    <b class="c-name">${def.name}</b>
    <div class="slot-icon">${def.icon}</div>
    <small class="slot-text">${txt}</small>${price}</div>`;
}

// Colonna sinistra: vita della squadra col moltiplicatore del giorno, poi le sinergie.
function renderSide(team) {
  const sets = team.sets;
  const list = Object.entries(TAGS).map(([t, def]) => ({ t, def, s: sets[t] })).filter((x) => x.s.n > 0).sort((a, b) => b.s.tier - a.s.tier || b.s.n - a.s.n);
  const ft = FARMS[st.farm].tag;
  const days = Array.from({ length: MULT_DAYS }, (_, k) => k + 1);
  $('#ar-syn').innerHTML = `<div class="mult-box" data-mult="1">
      <div class="p-title">Vita della squadra</div>
      <div class="mult-now"><span>Giorno ${st.day}</span><b>${multTxt(st.day)}</b></div>
      <div class="mult-calc">(${FARM_HP} fattoria + ${team.pigHp} maialini) ${multTxt(st.day)} = <b>${team.hpMax}</b></div>
      <div class="mult-ladder">${days.map((d) => `<i class="${d < st.day ? 'past' : d === st.day ? 'now' : ''}" title="Giorno ${d}: ${multTxt(d)}"></i>`).join('')}</div>
      <small class="mult-next">${st.day < MULT_DAYS ? `Domani ${multTxt(st.day + 1)}: servono più danni ed effetti.` : 'Moltiplicatore al massimo.'}</small>
    </div>
    <div class="p-title">Sinergie</div>${list.length ? list.map(({ t, def, s }) => `
    <div class="syn ${s.tier ? 'on t' + s.tier : ''}" style="--tc:${def.color}" data-tag="${t}">
      <div class="syn-body"><span class="band band-tag" style="--bc:${def.color}">${def.name}${t === ft ? ' ★' : ''}</span>
      <span class="syn-steps">${s.need.map((n) => `<i class="${s.n >= n ? 'ok' : ''}">${n}</i>`).join('')}</span>
      <small class="syn-now">${s.tier ? def.sets[s.tier - 1][1] : `Ne servono ${s.need[0]} diversi`}</small></div><span class="syn-n">${s.n}</span></div>`).join('')
    : '<p class="quiet small">Metti maialini diversi con lo stesso tag per attivare i bonus.</p>'}`;
}

// ---------- riepilogo a destra ----------
function defaultInfo(team) {
  const f = FARMS[st.farm];
  return `<div class="p-title">Come si fa</div>
    <ul class="howto">
      <li><b>Trascina</b> un maialino dal negozio a una casella (o cliccalo e poi clicca la casella).</li>
      <li>Trascinalo su un <b>maialino uguale</b>: con <b>3/3 copie</b> sale di livello.</li>
      <li>I <b>tratti</b> vanno su un maialino, uno a testa.</li>
      <li>La colonna a destra è la <b>prima fila</b>.</li>
      <li>Passa il mouse su qualunque cosa per i dettagli; <b>clicca</b> per tenerli fissi.</li>
    </ul>
    <div class="info-farm" style="--tc:${TAGS[f.tag].color}"><b>${f.icon} ${f.name}</b><small>Più ${TAGS[f.tag].plural} nel negozio · ${f.bonus}</small></div>
    <div class="info-team"><span>Vita della squadra</span><b>${team.hpMax}</b></div>`;
}
const BOOST_NAME = { atk: ' attacco', hp: ' vita', spd: '% velocità', crit: '% critico', burn: ' bruciatura per colpo', poison: ' veleno per colpo', mud: ' fango per colpo', heal: ' cura per colpo', shield: ' scudo per colpo', stun: '% di stordire' };
const permText = (perm) => Object.entries(perm).filter(([, v]) => v).map(([k, v]) => `+${fmt(v)}${BOOST_NAME[k]}`).join(', ');
// Tutto ciò che riguarda un maialino, nell'ordine: rarità, nome, tag, disegno, statistiche, potere, tratto, livello, bonus.
function pigInfo(id, L = 1, unit = null, p = null, cell = null) {
  const d = APIGS[id];
  const s = p || AE.baseStats(id, L);
  const m = cell != null && st.cells[cell] === 'altare' ? 2 : 1;
  const every = s.cd / (1 + (s.spd || 0) / 100);
  const hitRows = HIT_KEYS.filter((k) => s.hit[k]).map((k) => `<span class="is" style="--fc:${FX[k].color}" title="${esc(FX[k].help)}">${AE.STAT_ICON[k]} <b>${fmt(s.hit[k])}${k === 'stun' ? '%' : ''}</b><small>${k === 'stun' ? 'di stordire' : HIT_NAME[k]} per colpo</small></span>`).join('');
  return `<div class="api">
    ${rarBand(d.r)}
    <b class="api-name">${d.name}</b>
    ${tagBands(unit ? AE.tagsOf(unit) : d.tags)}
    <div class="api-art">${pigArt(id)}</div>
    <div class="ii-stats">
      <span class="is is-atk" title="Danni per colpo">⚔️ <b>${fmt(s.atk)}</b><small>attacco</small></span>
      <span class="is is-hp" title="Si somma alla vita della squadra">❤️ <b>${Math.round(s.hp)}</b><small>vita</small></span>
      <span class="is is-spd" title="Ogni quanti secondi attacca">⏩ <b>ogni ${fmt(every)} s</b><small>attacca</small></span>
      ${s.crit ? `<span class="is is-crit" title="Colpo critico: danni ed effetti doppi">🎯 <b>${fmt(s.crit)}%</b><small>critico</small></span>` : ''}
      ${hitRows}
    </div>
    ${powerBlock(AE.powerParts(d.power, L, m), m > 1 ? 'Potere · raddoppiato dall\'Altare d\'oro' : 'Potere')}
    ${L < AE.MAX_LEVEL ? `<p class="ii-next">Al livello ${L + 1}: ${AE.powerText(d.power, L + 1, m)}</p>` : ''}
    ${unit && unit.trait ? powerBlock(AE.traitParts(unit.trait), `Tratto · ${TRAITS[unit.trait].icon} ${TRAITS[unit.trait].name}`) : ''}
    ${unit ? `<p class="ii-line">Livello <b>${unit.level}</b> · ${unit.level < AE.MAX_LEVEL ? `copie ${unit.copies}/3 verso il livello ${unit.level + 1}` : 'livello massimo'}</p>` : `<p class="ii-line">Costa <b>${RARITIES[d.r].cost}</b> ghiande</p>`}
    ${p && p.boosts.length ? `<div class="ii-boosts"><b>Bonus attivi</b>${p.boosts.map((x) => `<span>${AE.STAT_ICON[x.stat]} +${fmt(x.v)}${BOOST_NAME[x.stat]} <small>da ${esc(x.src)}</small></span>`).join('')}</div>` : ''}
    ${unit && permText(unit.perm) ? `<p class="ii-grow">🌱 Cresciuto permanentemente: ${permText(unit.perm)}</p>` : ''}
    ${cell != null && st.cells[cell] ? `<p class="ii-trait">${ACHARMS[st.cells[cell]].icon} <b>${ACHARMS[st.cells[cell]].name}</b>: ${ACHARMS[st.cells[cell]].text}</p>` : ''}
    ${unit ? `<p class="ii-line">📍 ${AE.place(cell)} · vendendolo: <b>+${AE.sellValue(unit)}</b> ghiande</p>` : ''}
  </div>`;
}
function itemInfo(it) {
  const def = it.kind === 'trait' ? TRAITS[it.id] : ACHARMS[it.id];
  return `<div class="api">${rarBand(def.r)}<b class="api-name">${def.icon} ${def.name}</b>
    <div class="band-tags"><span class="band band-kind">${it.kind === 'trait' ? 'Tratto' : def.cell ? 'Ciondolo da casella' : 'Ciondolo di squadra'}</span></div>
    ${it.kind === 'trait' ? powerBlock(AE.traitParts(it.id)) : `<div class="pw-block"><div class="pw-what">${def.text}</div></div>`}
    <p class="ii-line">${it.kind === 'trait' ? 'Trascinalo su un maialino. Se ne ha già uno, lo sostituisce.' : def.cell ? 'Trascinalo su una casella del recinto: vale per chi ci sta sopra.' : 'Vale per tutta la squadra, per sempre.'} Costa <b>${it.price}</b> ghiande.</p></div>`;
}
function infoForSlot(i) { const it = st.shop[i]; if (!it || it.sold) return null; return it.kind === 'pig' ? pigInfo(it.id, 1) : itemInfo(it); }
function infoForCell(i) {
  const u = st.grid[i];
  if (!u) return `<div class="p-title">Casella vuota</div>${st.cells[i] ? `<p class="ii-trait">${ACHARMS[st.cells[i]].icon} <b>${ACHARMS[st.cells[i]].name}</b>: ${ACHARMS[st.cells[i]].text}</p>` : ''}<p class="ii-line">📍 ${AE.place(i)}</p>`;
  return pigInfo(u.id, u.level, u, AE.teamOf(st).pigs.find((p) => p.cell === i), i);
}
// Con qualcosa selezionato il riepilogo resta fisso su quello, anche spostando il mouse.
function selInfo() {
  if (!sel) return null;
  const it = sel.from === 'shop' ? st.shop[sel.i] : null;
  const hint = it && it.kind === 'trait' ? 'Clicca il maialino a cui dare il tratto.'
    : it && it.kind === 'charm' && ACHARMS[it.id].cell ? 'Clicca la casella su cui mettere il ciondolo.'
    : it ? 'Clicca una casella vuota, o un maialino uguale.' : 'Clicca un\'altra casella per spostarlo, o «Vendi».';
  const body = sel.from === 'shop' ? infoForSlot(sel.i) : infoForCell(sel.i);
  return `<div class="sel-hint"><span>📌 ${hint}</span><button class="btn small" data-aact="unselect">Annulla</button></div>${body || ''}`;
}
function setInfo(html) { const el = $('#ar-info'); if (el) el.innerHTML = html; }
function refreshInfo() { setInfo(selInfo() || defaultInfo(AE.teamOf(st))); }

let swallowClick = false;
function showDetails(el) {
  swallowClick = true;
  Au.sfx('pop');
  const html = hoverHTML(el);
  if (html) X.openModal(`<div class="ar-details">${html}</div>`, { cls: 'narrow' });
}

// ---------- azioni ----------
function afterChange(msgOk) {
  const merged = AE.mergeAll(st);
  save(); renderShop();
  if (merged.length) {
    Au.sfx('win');
    for (const m of merged) {
      const el = $(`.pc[data-cell="${m.cell}"]`);
      if (el) { el.classList.add('levelup'); setTimeout(() => el.classList.remove('levelup'), 1200); }
      X.toast(`${APIGS[m.id].name} sale al livello ${m.level}!`);
    }
  } else if (msgOk) Au.sfx(msgOk);
}
function doBuy(slot, cell) {
  const err = AE.buy(st, slot, cell);
  if (err) { X.toast(err); Au.sfx('hit'); return; }
  sel = null;
  afterChange('coin');
}
function doMove(from, to) { AE.move(st, from, to); sel = null; afterChange('pop'); }
function doSell(cell) {
  const v = AE.sell(st, cell);
  if (v) { X.toast(`Venduto per ${v} ghiande`); sel = null; afterChange('coin'); }
}
function onTargetClick(target) {
  if (!sel) return;
  if (target.drop === 'sell') { if (sel.from === 'cell') doSell(sel.i); return; }
  const cell = target.cell;
  if (sel.from === 'shop') {
    const it = st.shop[sel.i];
    doBuy(sel.i, it.kind === 'charm' && !ACHARMS[it.id].cell ? null : cell);
  } else doMove(sel.i, cell);
}

// trascinamento con il puntatore; un clic senza trascinare = selezione
let pressTimer = null;
function onPointerDown(e) {
  clearTimeout(pressTimer);
  if (e.pointerType === 'touch') {
    const t = e.target.closest('.slot[data-slot], .pc[data-cell]');
    if (t) pressTimer = setTimeout(() => { cancelDrag(); showDetails(t); }, 480);
  }
  const src = e.target.closest('[data-drag]');
  if (!src || e.button > 0) return;
  const from = src.dataset.drag, i = +src.dataset.i;
  if (from === 'shop' && (!st.shop[i] || st.shop[i].sold)) return;
  drag = { from, i, x: e.clientX, y: e.clientY, src, ghost: null, moved: false };
}
function onPointerMove(e) {
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
  clearTimeout(pressTimer);
  if (!drag.moved) {
    drag.moved = true;
    try { drag.src.setPointerCapture(e.pointerId); } catch { /* non supportato */ }
    const g = document.createElement('div');
    g.className = 'drag-ghost';
    const art = drag.src.querySelector('.slot-art, .pc-art, .slot-icon');
    g.innerHTML = art ? (art.querySelector('.pig-svg') || art).outerHTML : '';
    document.body.appendChild(g);
    drag.ghost = g;
    drag.src.classList.add('dragging');
    document.body.classList.add('is-dragging');
    highlightTargets(drag);
    if (drag.from === 'cell') sellPreview(drag.i);
  }
  drag.ghost.style.left = e.clientX + 'px';
  drag.ghost.style.top = e.clientY + 'px';
  $$('.drop-hover').forEach((el) => el.classList.remove('drop-hover'));
  const t = dropTarget(e);
  if (t) t.el.classList.add('drop-hover');
  // sopra «Vendi»: il fantasmino mostra le ghiande che si ricevono
  const over = !!(t && t.drop === 'sell' && drag.from === 'cell');
  let badge = drag.ghost.querySelector('.ghost-sell');
  if (over && !badge) { badge = document.createElement('span'); badge.className = 'ghost-sell'; badge.innerHTML = `+${AE.sellValue(st.grid[drag.i])} ${acorn}`; drag.ghost.appendChild(badge); }
  else if (!over && badge) badge.remove();
}
function onPointerUp(e) {
  clearTimeout(pressTimer);
  if (!drag) return;
  const d = drag; drag = null;
  try { return dropOn(d, e); } finally { if (d.ghost) d.ghost.remove(); d.src.classList.remove('dragging'); }
}
function dropOn(d, e) {
  document.body.classList.remove('is-dragging');
  $$('.drop-hover, .can').forEach((el) => el.classList.remove('drop-hover', 'can'));
  if (!d.moved) {
    if (sel && d.from === 'cell' && sel.from) { onTargetClick({ cell: d.i }); return; }
    sel = sel && sel.from === d.from && sel.i === d.i ? null : { from: d.from, i: d.i };
    renderShop();
    if (sel) highlightTargets(sel);
    return;
  }
  d.ghost.remove();
  d.src.classList.remove('dragging');
  const t = dropTarget(e);
  if (!t) { sellReset(); return; }
  if (t.drop === 'sell') { if (d.from === 'cell') doSell(d.i); return; }
  if (d.from === 'shop') {
    const it = st.shop[d.i];
    doBuy(d.i, it.kind === 'charm' && !ACHARMS[it.id].cell ? null : t.cell);
  } else if (t.cell !== d.i) doMove(d.i, t.cell);
  else sellReset();
}
function dropTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const t = el && el.closest('[data-drop]');
  if (!t) return null;
  return { el: t, drop: t.dataset.drop, cell: t.dataset.cell != null ? +t.dataset.cell : null };
}
function highlightTargets(s) {
  const it = s.from === 'shop' ? st.shop[s.i] : null;
  $$('.pc').forEach((el) => {
    const i = +el.dataset.cell, u = st.grid[i];
    let ok;
    if (!it) ok = i !== s.i;
    else if (it.kind === 'pig') ok = !u || (u.id === it.id && u.level < AE.MAX_LEVEL);
    else if (it.kind === 'trait') ok = !!u;
    else ok = true;
    el.classList.toggle('can', ok);
  });
  if (s.from === 'cell') $('#sellzone').classList.add('can');
}

function hoverHTML(target) {
  const slot = target.closest('.slot[data-slot]'), cell = target.closest('.pc[data-cell]'), syn = target.closest('.syn'), farm = target.closest('[data-farm]'), mult = target.closest('[data-mult]');
  if (slot) return infoForSlot(+slot.dataset.slot);
  if (cell) return infoForCell(+cell.dataset.cell);
  if (syn) {
    const def = TAGS[syn.dataset.tag];
    return `<div class="api"><div class="band-tags"><span class="band band-tag" style="--bc:${def.color}">${def.name}</span></div>${def.sets.map(([n, txt]) => `<div class="pw-block"><div class="pw-when">Con ${n} ${def.plural}</div><div class="pw-what">${txt}</div></div>`).join('')}<p class="ii-line">Contano i maialini diversi: due copie dello stesso valgono uno.</p></div>`;
  }
  if (farm) {
    const f = FARMS[st.farm];
    return `<div class="api"><b class="api-name">${f.icon} ${f.name}</b><div class="pw-block"><div class="pw-when">Negozio</div><div class="pw-what">Più ${TAGS[f.tag].plural} tra i maialini in vendita.</div></div><div class="pw-block"><div class="pw-when">Sempre</div><div class="pw-what">${f.bonus}</div></div><p class="ii-line">Vita della fattoria: <b>${FARM_HP}</b></p></div>`;
  }
  if (mult) {
    return `<div class="api"><b class="api-name">📈 Moltiplicatore della vita</b><div class="pw-block"><div class="pw-when">Ogni giorno</div><div class="pw-what">La vita della squadra (fattoria + maialini) si moltiplica: ×1 il primo giorno, poi +0,5 al giorno fino a ${multTxt(MULT_DAYS)} al giorno ${MULT_DAYS}.</div></div><div class="pw-block"><div class="pw-when">Vale anche per</div><div class="pw-what">Cure, scudi e danni dei poteri. Attacco, bruciature e veleno invece no: per vincere servono maialini e combo sempre più forti.</div></div></div>`;
  }
  return null;
}
function onHover(e) {
  if (drag && drag.moved) return;
  const html = hoverHTML(e.target);
  if (html) setInfo(html);
}

// =====================================================================
// Finestre: regole, diario, ciondoli posseduti
// =====================================================================
function showRules() {
  X.openModal(`<h2>⚔️ Regole dell'Arena</h2>
    <div class="relax-rules">
      <div class="rr"><span>🛒</span><div><b>Negozio</b><small>6 posti. «Nuovi maialini» e «Nuovi tratti» li cambiano per ${AE.rerollCost(st)} ghiande. Ogni giorno il negozio si rinnova gratis. Ogni tanto compare un ciondolo.</small></div></div>
      <div class="rr"><span>🖱️</span><div><b>Trascina</b><small>Maialino → casella vuota (o su un suo doppione). Tratto → maialino (uno a testa). Ciondolo da casella → casella. Maialino → «Vendi»: mentre trascini vedi quante ghiande ti dà. Clicca qualcosa per tenere fisso il suo riepilogo.</small></div></div>
      <div class="rr"><span>✨</span><div><b>Livello e copie</b><small><b>Liv.</b> è il livello. La barretta <b>1/3</b> conta le copie: alla terza sale di livello, fino al 5. Ogni livello: +60% attacco, vita ed effetti per colpo, poteri più forti.</small></div></div>
      <div class="rr"><span>⚔️❤️🔥</span><div><b>Statistiche</b><small>Sulla carta: attacco, vita ed effetti che applica a ogni colpo (bruciatura, veleno, fango, cura, scudo, stordimento). Con il bordo giallo se sono potenziate. Ogni quanto attacca e il critico sono nel riepilogo.</small></div></div>
      <div class="rr"><span>📈</span><div><b>Vita della squadra</b><small>(${FARM_HP} della fattoria + vita dei maialini) × il moltiplicatore del giorno: ×1, ×1,5, ×2… fino al giorno ${MULT_DAYS}. Il moltiplicatore vale anche per cure, scudi e danni dei poteri.</small></div></div>
      <div class="rr"><span>🔥☠️🟤</span><div><b>Effetti</b><small>🔥 bruciatura: danni ogni secondo, poi cala di un quinto. ☠️ veleno: danni ogni 2 secondi, non passa mai. 🟤 fango: rallenta il nemico (2% a punto, fino al 35%). 🛡️ corazza: riduce ogni colpo subito. 🫧 scudo: assorbe danni. 💫 stordimento. 🎯 critico: danni ed effetti doppi.</small></div></div>
      <div class="rr"><span>🧭</span><div><b>Posizione</b><small>Recinto di 4 colonne e 2 righe: la colonna a destra è la prima fila. Alcuni poteri valgono per i vicini, la riga, la colonna o le diagonali.</small></div></div>
      <div class="rr"><span>🧩</span><div><b>Sinergie</b><small>Con 2 o 4 maialini diversi dello stesso tag si attivano bonus di squadra.</small></div></div>
      <div class="rr"><span>🏆</span><div><b>Vittoria</b><small>Battaglie automatiche contro il recinto di un altro allevatore. A ${WIN_TARGET} vittorie sei campione; a 0 cuori la corsa finisce. Dopo ${AE.FURY_AT} secondi arriva la furia: i danni salgono.</small></div></div>
    </div>`, { cls: 'wide' });
}

function showDiary(tab) {
  if (tab) diaryTab = tab;
  const tabs = { pigs: 'Maialini', traits: 'Tratti', charms: 'Ciondoli', tags: 'Sinergie', fx: 'Effetti', farms: 'Fattorie' };
  let body = '';
  if (diaryTab === 'pigs') {
    const ids = Object.keys(APIGS).filter((id) => diaryRar === 'all' || APIGS[id].r === diaryRar)
      .sort((a, b) => RARITY_ORDER.indexOf(APIGS[a].r) - RARITY_ORDER.indexOf(APIGS[b].r));
    body = `<div class="chips">${[['all', 'Tutti'], ...RARITY_ORDER.map((r) => [r, RARITIES[r].name])].map(([k, n]) => `<button class="chipf ${diaryRar === k ? 'on' : ''}" data-aact="drar" data-k="${k}" ${k !== 'all' ? `style="--tc:${rarColor(k)}"` : ''}>${n}</button>`).join('')}</div>
      <div class="adex">${ids.map((id) => { const d = APIGS[id], b = AE.baseStats(id); const P = AE.powerParts(d.power); return `<div class="adx" style="--rc:${rarColor(d.r)}">
        <div class="adx-art">${pigArt(id)}</div><div class="adx-body"><b>${d.name}</b>${tagBands(d.tags)}
        <small class="ii-rar">${RARITIES[d.r].name} · ${RARITIES[d.r].cost} ghiande · attacca ogni ${fmt(d.cd)} s${b.crit ? ` · 🎯 ${b.crit}%` : ''}</small>
        ${statChips(b)}<small><b>${P.when}:</b> ${P.what}</small></div></div>`; }).join('')}</div>`;
  } else if (diaryTab === 'traits') {
    body = `<div class="adex">${Object.keys(TRAITS).map((id) => { const t = TRAITS[id], P = AE.traitParts(id); return `<div class="adx" style="--rc:${rarColor(t.r)}"><div class="adx-art emoji">${t.icon}</div><div class="adx-body"><b>${t.name}</b><small class="ii-rar">${RARITIES[t.r].name}</small><small><b>${P.when}:</b> ${P.what}</small></div></div>`; }).join('')}</div>`;
  } else if (diaryTab === 'charms') {
    body = `<div class="adex">${Object.entries(ACHARMS).map(([id, c]) => `<div class="adx ${st && (st.charms.includes(id) || Object.values(st.cells).includes(id)) ? 'own' : ''}" style="--rc:${rarColor(c.r)}"><div class="adx-art emoji">${c.icon}</div><div class="adx-body"><b>${c.name}</b><small class="ii-rar">${RARITIES[c.r].name} · ${c.cell ? 'casella' : 'squadra'}</small><small>${c.text}</small></div></div>`).join('')}</div>`;
  } else if (diaryTab === 'tags') {
    body = `<div class="adex">${Object.entries(TAGS).map(([k, t]) => `<div class="adx" style="--rc:${t.color}"><div class="adx-body"><div class="band-tags"><span class="band band-tag" style="--bc:${t.color}">${t.name}</span></div>${t.sets.map(([n, x]) => `<small><b>${n}:</b> ${x}</small>`).join('')}
      <small class="quiet">${Object.values(APIGS).filter((p) => p.tags.includes(k)).map((p) => p.name).join(', ')}</small></div></div>`).join('')}</div>`;
  } else if (diaryTab === 'fx') {
    body = `<div class="adex">${['burn', 'poison', 'mud', 'heal', 'shield', 'stun', 'armor', 'crit', 'dmg', 'buff', 'haste', 'strike', 'grow', 'gold', 'charm'].map((k) => `<div class="adx" style="--rc:${FX[k].color}"><div class="adx-art emoji">${FX[k].icon}</div><div class="adx-body"><b>${FX[k].name}</b><small>${FX[k].help}</small></div></div>`).join('')}</div>
      <h3>Quando scattano i poteri</h3>
      <div class="adex">${[['Sempre', 'Bonus fisso, già contato nelle statistiche. «Sempre, in prima fila» vale solo nella colonna di destra.'], ['A inizio battaglia', 'Una volta, prima del primo colpo.'], ['A ogni attacco / Ogni N attacchi', 'Contano gli attacchi del maialino.'], ['Ogni N secondi', 'A tempo, per tutta la battaglia.'], ['Ogni N colpi subiti', 'Contano i colpi che la squadra riceve.'], ['A ogni colpo critico', 'Quando il maialino fa un critico.'], ['Quando un alleato attiva un potere', 'Reazione ai poteri dei compagni.'], ['Quando la squadra infligge…', 'Reazione a ogni bruciatura, veleno o cura della squadra.'], ['Sotto metà vita, una volta', 'Una sola volta per battaglia.'], ['Alla vittoria / Alla sconfitta / Dopo ogni battaglia', 'Dopo la battaglia: crescite permanenti, ghiande, ciondoli.']].map(([n, x]) => `<div class="adx"><div class="adx-body"><b>${n}</b><small>${x}</small></div></div>`).join('')}</div>`;
  } else {
    body = `<div class="adex">${Object.entries(FARMS).map(([k, f]) => `<div class="adx ${st && st.farm === k ? 'own' : ''}" style="--rc:${TAGS[f.tag].color}"><div class="adx-art emoji">${f.icon}</div><div class="adx-body"><b>${f.name}</b><small>🛒 Più ${TAGS[f.tag].plural} nel negozio</small><small>⭐ ${f.bonus}</small><small>❤️ ${FARM_HP} di vita</small></div></div>`).join('')}</div>`;
  }
  X.openModal(`<h2>📖 Diario dell'Arena</h2>
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${diaryTab === k ? 'on' : ''}" data-aact="dtab" data-k="${k}">${v}</button>`).join('')}</div>
    ${body}`, { cls: 'wide tall', key: 'adiary-' + diaryTab + diaryRar });
}

function showCharms() {
  const glob = st.charms, cells = Object.entries(st.cells);
  X.openModal(`<h2>💍 I tuoi ciondoli</h2>
    ${glob.length || cells.length ? '' : '<p class="m-sub">Non ne hai ancora. Compaiono ogni tanto nel negozio, al posto di un maialino.</p>'}
    ${glob.length ? `<h3>Per tutta la squadra</h3><div class="adex">${glob.map((id) => `<div class="adx" style="--rc:${rarColor(ACHARMS[id].r)}"><div class="adx-art emoji">${ACHARMS[id].icon}</div><div class="adx-body"><b>${ACHARMS[id].name}</b><small>${ACHARMS[id].text}</small></div></div>`).join('')}</div>` : ''}
    ${cells.length ? `<h3>Sulle caselle del recinto</h3><div class="adex">${cells.map(([i, id]) => `<div class="adx" style="--rc:${rarColor(ACHARMS[id].r)}"><div class="adx-art emoji">${ACHARMS[id].icon}</div><div class="adx-body"><b>${ACHARMS[id].name}</b><small class="ii-rar">${AE.place(+i)}</small><small>${ACHARMS[id].text}</small></div></div>`).join('')}</div>` : ''}`, { cls: 'wide' });
}

// =====================================================================
// Battaglia
// =====================================================================
function penHTML(grid, team, cells, side) {
  const byCell = new Map(team.pigs.map((p) => [p.cell, p]));
  // il recinto avversario è speculare: la sua prima fila guarda verso di noi
  const order = side === 0 ? [0, 1, 2, 3, 4, 5, 6, 7] : [3, 2, 1, 0, 7, 6, 5, 4];
  return order.map((i) => {
    const u = grid[i], p = byCell.get(i);
    const charm = cells && cells[i] ? `<span class="pc-charm">${ACHARMS[cells[i]].icon}</span>` : '';
    if (!u) return `<div class="bc empty">${charm}</div>`;
    return `<div class="bc" data-bs="${side}" data-bc="${i}" style="--rc:${rarColor(APIGS[u.id].r)}" title="${esc(APIGS[u.id].name)} — ${esc(AE.powerText(APIGS[u.id].power, u.level))}">
      ${lvBadge(u.level)}
      <div class="bc-art ${side === 1 ? 'flip' : ''}">${pigArt(u.id)}</div>
      ${statChips(p)}${charm}</div>`;
  }).join('');
}

function showBattle() {
  X.closeModal();
  const B = st.battle;
  const farmChip = (id) => (id ? `<span class="bt-farm" title="${esc(FARMS[id].bonus)}">${FARMS[id].icon} ${FARMS[id].name}</span>` : '');
  X.app.innerHTML = `<main class="battle">
    <header class="bt-top">
      <div class="bt-day"><b>Giorno ${B.day}</b><small>Vita ${multTxt(B.day)}</small></div>
      <div class="bt-speed"><span>Velocità</span>${[1, 2, 4].map((x) => `<button class="spd ${x === 1 ? 'on' : ''}" data-aact="speed" data-x="${x}">${x}×</button>`).join('')}
        <button class="btn small" data-aact="skip">Salta ⏭</button></div>
    </header>
    <section class="bt-field">
      ${[0, 1].map((side) => `<div class="bt-side s${side}">
        <div class="bt-name">${side === 0 ? 'Il tuo recinto' : esc(B.ghost.name)} ${farmChip(side === 0 ? st.farm : B.ghost.farm)}</div>
        <div class="hpbar" id="hp${side}"><i class="fill"></i><i class="shield"></i><b></b></div>
        <div class="bt-status" id="ss${side}"></div>
        <div class="pen-fence small"><div class="pen bpen">${penHTML(side === 0 ? st.grid : B.ghost.grid, side === 0 ? B.A : B.B, side === 0 ? st.cells : B.ghost.cells, side)}</div></div>
      </div>${side === 0 ? '<div class="bt-vs">VS</div>' : ''}`).join('')}
    </section>
    <div class="bt-feed" id="feed"></div>
    <div class="bt-timer" id="bt-timer"></div>
  </main>`;
  play = { i: 0, clock: 0, speed: 1, last: performance.now(), done: false, lastSfx: 0, hp: [B.sim.max[0], B.sim.max[1]], ss: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]] };
  updateBars();
  setTimeout(() => tick(performance.now()), 30);
}

const SS_KEYS = [['shield', '🫧'], ['armor', '🛡️'], ['burn', '🔥'], ['poison', '☠️'], ['mud', '🟤']];
function updateBars() {
  const B = st.battle;
  for (const s of [0, 1]) {
    const el = $('#hp' + s);
    if (!el) return;
    const max = B.sim.max[s], sh = play.ss[s][0];
    $('.fill', el).style.width = Math.max(0, play.hp[s] / max * 100) + '%';
    $('.shield', el).style.width = Math.min(100, sh / max * 100) + '%';
    $('b', el).textContent = `${Math.max(0, Math.round(play.hp[s]))} / ${Math.round(max)}`;
    const box = $('#ss' + s);
    if (box) box.innerHTML = SS_KEYS.map(([k, ic], j) => (play.ss[s][j] > 0 ? `<span class="ssc" style="--fc:${FX[k].color}" title="${esc(FX[k].name + ': ' + FX[k].help)}">${ic}<b>${fmt(play.ss[s][j])}</b></span>` : '')).join('');
  }
}

// Ciclo della riproduzione: un timer da ~30 ms, così funziona anche dove le animazioni del browser rallentano.
function tick(now) {
  if (!play || play.done || !$('.battle')) return;
  const dt = Math.min(0.5, (now - play.last) / 1000);
  play.last = now;
  play.clock += dt * play.speed;
  const evs = st.battle.sim.events;
  while (play.i < evs.length && evs[play.i].t <= play.clock) playEvent(evs[play.i++]);
  const tm = $('#bt-timer');
  if (tm) tm.textContent = `${Math.floor(play.clock)} s${play.clock >= AE.FURY_AT ? ` · furia ×${fmt(AE.furyAt(play.clock))}!` : ''}`;
  if (play.i >= evs.length) { play.done = true; setTimeout(showResult, 900); return; }
  setTimeout(() => tick(performance.now()), 30);
}
const cellEl = (side, cell) => $(`.bc[data-bs="${side}"][data-bc="${cell}"]`);
function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function bfloat(el, html, cls = '') {
  if (!el) return;
  const f = document.createElement('div');
  f.className = 'bfloat ' + cls;
  f.innerHTML = html;
  el.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}
const fxIcon = (k) => (FX[k] ? FX[k].icon : '✨');
function feed(text, side) {
  const f = $('#feed');
  if (!f) return;
  const row = document.createElement('div');
  row.className = 'fd s' + side;
  row.innerHTML = text;
  f.prepend(row);
  while (f.children.length > 5) f.lastChild.remove();
}
function sfxThrottled(name) {
  const t = performance.now();
  if (t - play.lastSfx < 90) return;
  play.lastSfx = t; Au.sfx(name);
}
const ON_FOE = { dmg: 1, burn: 1, poison: 1, mud: 1, stun: 1 };
function playEvent(e) {
  const B = st.battle;
  play.hp = e.hp; if (e.ss) play.ss = e.ss;
  if (e.k === 'atk') {
    const a = cellEl(e.s, e.c), tgt = cellEl(1 - e.s, e.tc);
    restart(a, e.s === 0 ? 'lunge-r' : 'lunge-l');
    const fxTxt = (e.fxs || []).filter(([k]) => ON_FOE[k]).map(([k, v]) => `${fxIcon(k)}${fmt(v)}`).join(' ');
    setTimeout(() => { restart(tgt, 'hit'); bfloat(tgt, `${e.crit ? '🎯 ' : ''}${e.v ? '−' + fmt(e.v) : ''}${fxTxt ? ` <small>${fxTxt}</small>` : ''}`, e.crit ? 'big' : ''); }, 130);
    sfxThrottled('bump');
  } else if (e.k === 'pow') {
    const el = cellEl(e.s, e.c);
    restart(el, 'pow');
    bfloat(el, `${fxIcon(e.fx)}${e.v ? ' ' + fmt(e.v) : ''}`, 'pw ' + e.fx);
    if (ON_FOE[e.fx] && e.v) bfloat($('#hp' + (1 - e.s)), `${fxIcon(e.fx)} ${e.fx === 'dmg' ? '−' : '+'}${fmt(e.v)}`, 'pw ' + e.fx);
    const u = (e.s === 0 ? st.grid : B.ghost.grid)[e.c];
    if (u) feed(`${fxIcon(e.fx)} <b>${APIGS[u.id].name}</b>${e.v ? ` · ${FX[e.fx].name.toLowerCase()} ${fmt(e.v)}` : ''}`, e.s);
    sfxThrottled(e.fx === 'heal' ? 'eat' : e.fx === 'shield' || e.fx === 'armor' ? 'coin' : 'pop');
  } else if (e.k === 'stun') {
    const el = cellEl(e.s, e.c);
    if (el) { el.classList.add('stunned'); setTimeout(() => el.classList.remove('stunned'), e.d * 1000 / play.speed); }
    sfxThrottled('whoosh');
  } else if (e.k === 'buff') {
    bfloat(cellEl(e.s, e.c), `+${fmt(e.v)}${e.stat === 'crit' || e.stat === 'spd' ? '%' : ''} ${AE.STAT_ICON[e.stat] || '⬆️'}`, 'buff');
  } else if (e.k === 'set') {
    const who = e.tag ? `Sinergia <b>${TAGS[e.tag].plural}</b>` : `${fxIcon(e.fx)} <b>Bonus di squadra</b>`;
    feed(`${who} · ${FX[e.fx].name.toLowerCase()} ${fmt(e.v || 0)}`, e.s);
    bfloat($('#hp' + (ON_FOE[e.fx] ? 1 - e.s : e.s)), `${fxIcon(e.fx)} ${fmt(e.v || 0)}`, 'pw ' + e.fx);
  } else if (e.k === 'dot') {
    bfloat($('#hp' + e.s), `${fxIcon(e.fx)} −${fmt(e.v)}`, 'pw ' + e.fx);
  }
  updateBars();
}

function showResult() {
  const B = st.battle;
  const over = st.over;
  Au.sfx(B.won ? 'win' : 'lose');
  const growth = (B.growth || []).map((g) => `<li>🌱 <b>${APIGS[g.id].name}</b> ${permText({ [g.stat]: g.v })} permanentemente <small>(${esc(g.src)})</small></li>`)
    .concat((B.gifts || []).map((c) => `<li>💍 Regalo: <b>${ACHARMS[c].name}</b> ${ACHARMS[c].icon}</li>`));
  X.openModal(`<div class="result ${B.won ? 'win' : 'lose'}">
    <div class="br-pigs">${st.grid.filter(Boolean).slice(0, 3).map((u) => `<div class="br-pig ${B.won ? 'happy' : 'sad'}">${pigArt(u.id)}</div>`).join('')}</div>
    <h2>${B.won ? 'Vittoria!' : 'Sconfitta…'}</h2>
    <p class="m-sub">${B.won ? `Il tuo recinto ha battuto ${esc(B.ghost.name)}.` : `${esc(B.ghost.name)} ha avuto la meglio. Perdi un cuore.`}</p>
    <div class="kpis">
      <div class="kpi"><small>Vittorie</small><b>${st.wins}/${WIN_TARGET}</b></div>
      <div class="kpi">${heart}<small>Cuori</small><b>${st.hearts}</b></div>
      <div class="kpi">${acorn}<small>Ghiande guadagnate</small><b>+${B.reward + B.extra}</b></div>
      <div class="kpi"><small>Domani la vita vale</small><b>${multTxt(B.day + 1)}</b></div>
    </div>
    ${growth.length ? `<ul class="br-growth">${growth.join('')}</ul>` : ''}
    <div class="m-foot"><button class="btn primary big" data-aact="${over ? 'final' : 'next'}">${over ? 'Vedi il risultato finale' : 'Torna al recinto'}</button></div>
  </div>`, { closable: false, cls: 'narrow' });
}

function finish() {
  const prof = X.load(PROF) || { runs: 0, best: 0, champs: 0 };
  prof.runs++; prof.best = Math.max(prof.best, st.wins); if (st.over === 'win') prof.champs++;
  X.store(PROF, prof);
  X.store(SAVE, null);
  const champ = st.over === 'win';
  X.openModal(`<div class="result ${champ ? 'win' : 'lose'}">
    <div class="br-pigs">${st.grid.filter(Boolean).slice(0, 5).map((u) => `<div class="br-pig ${champ ? 'happy' : 'sad'}">${pigArt(u.id)}</div>`).join('')}</div>
    <h2>${champ ? '🏆 Campione dell\'Arena!' : st.abandoned ? 'Partita abbandonata' : 'Fine dell\'avventura'}</h2>
    <p class="m-sub">${champ ? `${WIN_TARGET} vittorie in ${st.day} ${st.day === 1 ? 'giorno' : 'giorni'} con la ${FARMS[st.farm].name}: il tuo recinto è leggenda.` : (st.abandoned ? `Hai abbandonato l’Arena dopo ${st.wins} vittorie in ${st.day} ${st.day === 1 ? 'giorno' : 'giorni'}.` : `Hai finito i cuori dopo ${st.wins} vittorie in ${st.day} ${st.day === 1 ? 'giorno' : 'giorni'}.`)}</p>
    <div class="kpis">
      <div class="kpi"><small>Vittorie</small><b>${st.wins}</b></div>
      <div class="kpi"><small>Sconfitte</small><b>${st.losses}</b></div>
      <div class="kpi"><small>Fusioni</small><b>${st.stats.fusioni}</b></div>
      <div class="kpi"><small>Poteri attivati</small><b>${st.stats.poteri}</b></div>
    </div>
    <div class="menu row"><button class="btn primary big" data-aact="new">Nuova arena</button><button class="btn ghost" data-aact="exit">Menu principale</button></div>
  </div>`, { closable: false, cls: 'narrow' });
}

// =====================================================================
// Eventi (attivi solo nelle pagine dell'Arena)
// =====================================================================
const ACT = {
  exit: () => { play = null; X.showTitle(); },
  new: () => { play = null; st = AE.newArena((Math.random() * 2 ** 31) | 0); sel = null; save(); showFarms(); },
  continue: () => { st = X.load(SAVE); route(); },
  farm: (b) => {
    farmSel = b.dataset.k;
    $$('.farm').forEach((x) => x.classList.toggle('on', x === b));
    const ok = $('[data-aact="farmok"]');
    ok.disabled = false;
    ok.textContent = `Conferma: ${FARMS[farmSel].name}`;
  },
  farmok: () => { if (!farmSel) return; AE.chooseFarm(st, farmSel); save(); showShop(); },
  roll: (b) => { const err = AE.reroll(st, b.dataset.k); if (err) { X.toast(err); return; } sel = null; Au.sfx('card'); save(); renderShop(); },
  fight: () => {
    if (!st.grid.some(Boolean)) { X.toast('Metti almeno un maialino nel recinto!'); return; }
    sel = null; AE.fight(st); save(); showBattle();
  },
  next: () => { X.closeModal(); AE.nextDay(st); save(); showShop(); },
  final: finish,
  diary: () => showDiary(),
  dtab: (b) => showDiary(b.dataset.k),
  drar: (b) => { diaryRar = b.dataset.k; showDiary('pigs'); },
  charms: showCharms,
  rules: showRules,
  abandon: () => X.openModal(`<h2>Abbandonare la partita?</h2><p class="m-sub">La corsa nell’Arena finisce qui: recinto, ghiande e vittorie vanno persi. La partita conta nelle statistiche.</p>
    <div class="m-foot"><button class="btn" data-aact="closemodal">Continua a giocare</button><button class="btn primary" data-aact="abandonok">Abbandona</button></div>`, { cls: 'narrow' }),
  closemodal: () => X.closeModal(),
  abandonok: () => { sel = null; st.over = 'lose'; st.abandoned = true; finish(); },
  unselect: () => { sel = null; renderShop(); },
  speed: (b) => { play.speed = +b.dataset.x; $$('.spd').forEach((x) => x.classList.toggle('on', x === b)); },
  skip: () => {
    if (!play || play.done) return;
    const evs = st.battle.sim.events;
    const last = evs[evs.length - 1];
    play.hp = last.hp; play.ss = last.ss || play.ss; play.i = evs.length; play.done = true;
    updateBars(); showResult();
  },
};
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-aact]');
  if (b && !b.disabled && ACT[b.dataset.aact]) { Au.sfx('click'); ACT[b.dataset.aact](b); return; }
  if (!$('.arena') || drag) return;
  const t = e.target.closest('[data-drop="sell"]');
  if (t && sel) { onTargetClick({ drop: 'sell' }); return; }
  const pc = e.target.closest('.pc[data-cell]');
  if (pc && sel && !pc.querySelector('[data-drag]')) onTargetClick({ cell: +pc.dataset.cell });
});
// Chiude un trascinamento rimasto a metà (rilascio fuori dalla finestra, gesto annullato…).
function cancelDrag() {
  if (!drag) return;
  if (drag.ghost) drag.ghost.remove();
  if (drag.src) drag.src.classList.remove('dragging');
  drag = null;
  document.body.classList.remove('is-dragging');
  $$('.drop-hover, .can').forEach((el) => el.classList.remove('drop-hover', 'can'));
  if (!(sel && sel.from === 'cell')) sellReset();
}
const HOVERABLE = '.slot, .pc, .syn, [data-farm], [data-mult]';
document.addEventListener('pointerdown', (e) => { cancelDrag(); if ($('.arena') && !document.querySelector('#modal')) onPointerDown(e); });
document.addEventListener('pointercancel', cancelDrag);
document.addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
window.addEventListener('blur', cancelDrag);
document.addEventListener('pointermove', (e) => { if (drag) { e.preventDefault(); onPointerMove(e); } });
document.addEventListener('pointerup', (e) => { if (drag) onPointerUp(e); });
document.addEventListener('mouseover', (e) => { if ($('.arena')) onHover(e); });
document.addEventListener('mouseout', (e) => {
  if (!$('.arena')) return;
  // uscendo da un elemento torna al riepilogo fisso (quello selezionato) o alle istruzioni
  if (e.target.closest(HOVERABLE) && !e.relatedTarget?.closest?.(HOVERABLE)) refreshInfo();
});
document.addEventListener('keydown', (e) => {
  if (!$('.arena') || document.querySelector('#modal')) return;
  if (e.key === 'Escape' && sel) { sel = null; renderShop(); }
});
