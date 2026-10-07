// Assalto: tower defense al contrario. Introduzione, accampamento, ondata su canvas, riepiloghi.
import * as E from './assault-engine.js';
import { APIGS, RARITIES, RARITY_ORDER, FX, HIT_KEYS } from './arena-data.js';
import { ASSAULTS, MAX_WAVES, WAVE_TIME, MAP_W, MAP_H, DEPLOY_COST, LEVEL_COST, MAX_LEVEL, REROLL, rancioCost, slotCost, SQUAD_SLOT_MAX,
         CHARM_PRICE, ROLES, DEFENDERS, ACHARMS_A, START_RANCIO } from './assault-data.js';
import { arenaPigSVG, ICONS } from './art.js';
import { defImg, pigImg, defIconHTML, drawMapBG, GATE_NAMES, HOUSE } from './assault-art.js';
import * as Au from './audio.js';

const SAVE = 'piggy.assault.v2', PROF = 'piggy.assaultprof.v1', SEEN = 'piggy.assaultintro.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = E.fmt;
const acorn = '<svg class="ico" aria-hidden="true"><use href="#s-acorn"/></svg>';
const STAT_ICON = { burn: '🔥', poison: '☠️', mud: '🟤', heal: '💚', shield: '🫧', stun: '💫' };
const HIT_NAME = { burn: 'bruciatura', poison: 'veleno', mud: 'fango', heal: 'cura agli alleati', shield: 'scudo agli alleati', stun: 'di stordire' };
let X = null, run = null, diaryTab = 'pigs', diaryRar = 'all', diaryRole = 'all';
let ui = { gate: 0, qty: 1, speed: 1, paused: true, hover: null, mouse: null, timer: null, last: 0, acc: 0, fx: [], ended: false, T: 32, bg: null, shake: 0 };

const save = () => { if (run) X.store(SAVE, { ...run, W: null }); };
const pigArt = (id) => arenaPigSVG(APIGS[id].look);
const rarBand = (r) => `<span class="band band-rar" style="--bc:${RARITIES[r].color}">${RARITIES[r].name}</span>`;
const roleBand = (role) => `<span class="band" style="--bc:${ROLES[role].color}">${ROLES[role].name}</span>`;

export function openAssault(ctx) {
  X = ctx;
  stopLoop();
  showIntro();
}

// =====================================================================
// Introduzione
// =====================================================================
function showIntro() {
  X.closeModal();
  const prof = X.load(PROF) || { runs: 0, wins: 0, best: 0 };
  const saved = X.load(SAVE);
  const can = saved && saved.v === 2 && !saved.over;
  X.app.innerHTML = `<main class="ar-intro as-intro">
    <header class="pg-head"><button class="btn ghost" data-sact="exit">${ICONS.back}Menu principale</button>
      <div class="pg-title"><h1>🏰 Assalto alla fattoria</h1><p>Un tower defense al contrario: questa volta sono i maialini ad attaccare.</p></div><span class="pg-spacer"></span></header>
    <section class="ai-hero">
      <div class="ai-pigs">${['cotechino', 'squalotto', 'scodellina', 'ombretta', 'bollicina', 'lardone'].map((id) => `<div class="ai-pig">${pigArt(id)}</div>`).join('')}</div>
      <div class="ai-rules">
        <div class="rr"><span>🏰</span><div><b>3 fattorie da conquistare</b><small>Ognuna in al massimo ${MAX_WAVES} ondate. I danni alla fattoria e i contadini abbattuti restano da un'ondata all'altra.</small></div></div>
        <div class="rr"><span>🐷</span><div><b>Il tuo esercito</b><small>Squadre di maialini (gli stessi dell'Arena) con 4 ruoli: Guerrieri, Untori, Supporti e Corridori. Scegli tu chi mandare, quando e da quale cancello.</small></div></div>
        <div class="rr"><span>🍲</span><div><b>Il rancio</b><small>Ogni maialino schierato costa rancio. Ogni ondata ne hai una scorta (parti da ${START_RANCIO}) che cresce col tempo.</small></div></div>
        <div class="rr"><span>🏕️</span><div><b>L'accampamento</b><small>Fra un'ondata e l'altra spendi ghiande: nuove squadre, livelli, più rancio, ciondoli. Ma i contadini chiamano rinforzi.</small></div></div>
        <div class="rr"><span>⏸️</span><div><b>Con calma</b><small>Ogni ondata dura ${WAVE_TIME} secondi e parte in pausa: puoi fermare il tempo quando vuoi, o accelerarlo.</small></div></div>
      </div>
    </section>
    <div class="ai-foot">
      ${can ? `<button class="btn big primary" data-sact="continue">▶ Continua · assalto ${saved.assault}, ondata ${saved.wave}</button>` : ''}
      <button class="btn big ${can ? '' : 'primary'}" data-sact="new">Nuovo assalto</button>
      <p class="best">${prof.runs ? `Partite: ${prof.runs} · fattorie conquistate al massimo: ${prof.best}/3 · vittorie: ${prof.wins}` : 'Prima volta? Passa il mouse su maialini e contadini: ti dicono tutto.'}</p>
    </div>
  </main>`;
}

// =====================================================================
// Schede informative (tooltip)
// =====================================================================
function troopTip(sq) {
  const d = APIGS[sq.id], s = E.troopStats(sq, run.charms);
  const hits = HIT_KEYS.filter((k) => s.hit[k]);
  return `<div class="tt">
    <div class="tt-bands">${rarBand(d.r)}${roleBand(s.role)}</div>
    <b class="tt-name">${d.name}</b>
    <p class="tt-role">${ROLES[s.role].desc}</p>
    <div class="tt-stats">
      <span>❤️ <b>${s.hp}</b><small>vita</small></span>
      ${s.role !== 'corridore' && s.atk > 0 ? `<span>⚔️ <b>${fmt(s.atk)}</b><small>ogni ${fmt(s.cd)} s</small></span>` : ''}
      ${s.range ? `<span>📏 <b>${fmt(s.range)}</b><small>caselle di portata</small></span>` : ''}
      <span>👣 <b>${fmt(s.speed)}</b><small>caselle al secondo</small></span>
      <span>🏠 <b>${s.siege}</b><small>danni alla fattoria</small></span>
      <span>🍲 <b>${s.cost}</b><small>rancio a maialino</small></span>
      ${s.crit ? `<span>🎯 <b>${s.crit}%</b><small>critico</small></span>` : ''}
      ${hits.map((k) => `<span style="--fc:${FX[k].color}">${STAT_ICON[k]} <b>${s.hit[k]}${k === 'stun' ? '%' : ''}</b><small>${HIT_NAME[k]}${k === 'heal' || k === 'shield' ? '' : ' per colpo'}</small></span>`).join('')}
    </div>
    ${sq.level ? `<p class="tt-foot">Livello ${sq.level}${sq.level < MAX_LEVEL ? ` · al livello ${sq.level + 1}: +50% vita, attacco ed effetti` : ' (massimo)'}</p>` : ''}
  </div>`;
}
function defTip(d) {
  const D = DEFENDERS[d.k], mm = E.defMult(d.L);
  return `<div class="tt">
    <div class="tt-bands"><span class="band" style="--bc:#8a5a33">Difensore · livello ${d.L}</span></div>
    <b class="tt-name">${D.name}</b>
    <p class="tt-role">${D.desc}</p>
    <div class="tt-stats">
      ${D.trap ? '' : `<span>❤️ <b>${Math.max(0, Math.round(d.hp))}/${d.max}</b><small>vita</small></span>`}
      ${D.dmg ? `<span>💥 <b>${fmt(D.dmg * mm)}</b><small>danni ogni ${fmt(D.cd)} s</small></span>` : ''}
      ${D.heal ? `<span>💚 <b>${fmt(D.heal * mm)}</b><small>cura ogni ${fmt(D.cd)} s</small></span>` : ''}
      <span>📏 <b>${fmt(D.range)}</b><small>caselle di portata</small></span>
      ${D.targets ? `<span>🎯 <b>${D.targets}</b><small>bersagli</small></span>` : ''}
      ${D.splash ? `<span>💣 <b>${fmt(D.splash)}</b><small>raggio dell'esplosione</small></span>` : ''}
      ${D.slow ? `<span>🐢 <b>−${D.slow}%</b><small>velocità dei maialini vicini</small></span>` : ''}
      ${D.stun ? `<span>💫 <b>${D.stun} s</b><small>bloccati</small></span>` : ''}
    </div>
    ${D.trap ? '<p class="tt-foot">Non si può distruggere: si attraversa.</p>' : '<p class="tt-foot">Abbattuto resta a terra fino alla fine dell\'assalto.</p>'}
  </div>`;
}
function showTip(html, e) {
  let t = $('#as-tip');
  if (!t) { t = document.createElement('div'); t.id = 'as-tip'; document.body.appendChild(t); }
  t.innerHTML = html; t.hidden = false;
  const w = t.offsetWidth, h = t.offsetHeight;
  let x = e.clientX + 16, y = e.clientY + 16;
  if (x + w > innerWidth - 8) x = e.clientX - w - 16;
  if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTip() { const t = $('#as-tip'); if (t) t.hidden = true; }

// =====================================================================
// Accampamento
// =====================================================================
function houseBar() {
  const h = run.house, p = Math.max(0, h.hp / h.max * 100);
  return `<div class="as-house" title="Vita della fattoria: va portata a zero"><span>🏠</span><div class="bar"><i style="width:${p}%"></i></div><b>${Math.ceil(h.hp)} / ${h.max}</b></div>`;
}
function showCamp() {
  stopLoop(); X.closeModal(); hideTip();
  const fresh = run.defs.filter((d) => d.alive && d.fresh);
  X.app.innerHTML = `<main class="camp">
    <header class="as-top">
      <div class="as-left"><button class="btn ghost small" data-sact="exit">${ICONS.back}Menu</button><span class="ar-chip c-gold" title="Ghiande da spendere">${acorn}<b>${run.gold}</b></span></div>
      <div class="as-center">
        <div class="as-title"><b>🏕️ Accampamento</b><small>Assalto ${run.assault}/${ASSAULTS} · ${esc(run.map.name)}</small></div>
        <div class="as-wave">Ondata <b>${run.wave}</b>/${MAX_WAVES}</div>
        ${houseBar()}
      </div>
      <div class="as-right"><button class="hbtn" data-sact="diary" title="Maialini, ruoli, contadini, ciondoli ed effetti">${ICONS.diary}<span>Diario</span></button><button class="hbtn" data-sact="rules" title="Come si gioca"><span class="hb-emoji">❔</span><span>Regole</span></button><button class="hbtn" data-sact="abandon" title="Abbandona la partita"><span class="hb-emoji">🏳️</span><span>Abbandona</span></button></div>
    </header>
    <section class="camp-main">
      <aside class="camp-market">
        <div class="p-title">Mercato</div>
        <div class="market">${run.market.map((it, i) => marketCard(it, i)).join('')}</div>
        <button class="btn reroll-btn" data-sact="reroll" ${run.gold < REROLL ? 'disabled' : ''}>🔄 Nuovi maialini · ${REROLL} ${acorn}</button>
        ${run.charmOffer ? `<div class="p-title">Ciondolo in vendita</div><button class="upg" data-sact="charm" data-tip="charm" ${run.gold < CHARM_PRICE ? 'disabled' : ''}><span>${ACHARMS_A[run.charmOffer].icon}</span><b>${ACHARMS_A[run.charmOffer].name}</b><small>${ACHARMS_A[run.charmOffer].text}</small><i>${CHARM_PRICE} ${acorn}</i></button>` : ''}
      </aside>
      <div class="camp-map">
        <div class="camp-canvas"><canvas id="cmap"></canvas></div>
        <div class="camp-legend">
          ${fresh.length ? `<span class="legend-new">📯 Rinforzi${run.lastFocus != null ? ` sulla strada ${GATE_NAMES[run.lastFocus]}, la più usata` : ''}: ${fresh.map((d) => DEFENDERS[d.k].name).join(', ')}</span>` : '<span>Passa il mouse sui contadini per vedere cosa fanno.</span>'}
          <span>⚔️ Più fronti: ogni strada in più da cui arrivano maialini dà <b>+20%</b> danni alla fattoria</span>
          <span>Difensori in piedi: <b>${run.defs.filter((d) => d.alive && !DEFENDERS[d.k].trap).length}</b> · abbattuti: <b>${run.defs.filter((d) => !d.alive).length}</b></span>
        </div>
      </div>
      <aside class="camp-side">
        <div class="p-title">Il tuo esercito <small>${run.squads.length}/${run.slots} squadre</small></div>
        <div class="squads">${run.squads.map((sq, i) => squadRow(sq, i)).join('') || '<p class="quiet small">Compra la prima squadra dal mercato, a sinistra.</p>'}</div>
        <div class="p-title">Migliorie</div>
        <div class="upgrades">
          <button class="upg" data-sact="rancio" ${run.gold < rancioCost(run.rancioBought) ? 'disabled' : ''}><span>🍲</span><b>+2 rancio</b><small>per ogni ondata</small><i>${rancioCost(run.rancioBought)} ${acorn}</i></button>
          <button class="upg" data-sact="slot" ${run.slots >= SQUAD_SLOT_MAX || run.gold < slotCost(run.slots) ? 'disabled' : ''}><span>🚩</span><b>+1 squadra</b><small>${run.slots}/${SQUAD_SLOT_MAX} posti</small><i>${run.slots >= SQUAD_SLOT_MAX ? 'max' : slotCost(run.slots) + ' ' + acorn}</i></button>
        </div>
        ${run.charms.length ? `<div class="p-title">I tuoi ciondoli</div><div class="owned-charms">${run.charms.map((k) => `<span title="${esc(ACHARMS_A[k].name + ': ' + ACHARMS_A[k].text)}">${ACHARMS_A[k].icon}</span>`).join('')}</div>` : ''}
      </aside>
    </section>
    <footer class="camp-foot">
      <span>🍲 Rancio per l'ondata: <b>${E.waveRancio(run)}</b></span>
      <button class="btn primary big" data-sact="startwave" ${run.squads.length ? '' : 'disabled'}>⚔️ Inizia l'ondata ${run.wave}</button>
    </footer>
  </main>`;
  drawCampMap();
  if (!X.load(SEEN)) { X.store(SEEN, 1); showRules(); }
}
function squadRow(sq, i) {
  const d = APIGS[sq.id], s = E.troopStats(sq, run.charms);
  const lc = LEVEL_COST[sq.level];
  return `<div class="sq-row" data-tip="squad" data-i="${i}" style="--rc:${RARITIES[d.r].color}">
    <div class="sq-art">${pigArt(sq.id)}</div>
    <div class="sq-body"><b>${d.name}</b><div class="sq-bands">${roleBand(s.role)}<span class="lv-badge">Liv.<b>${sq.level}</b></span></div>
      <div class="sq-stats">❤️${s.hp} ${s.role !== 'corridore' && s.atk ? `⚔️${fmt(s.atk)}` : ''} 🏠${s.siege} 🍲${s.cost}</div></div>
    <div class="sq-act">
      ${sq.level < MAX_LEVEL ? `<button class="btn small" data-sact="levelup" data-i="${i}" ${run.gold < lc ? 'disabled' : ''} title="Sale al livello ${sq.level + 1}">⬆ ${lc} ${acorn}</button>` : '<span class="cp-bar max">MAX</span>'}
      <button class="icon-x" data-sact="dismiss" data-i="${i}" title="Congeda la squadra" ${run.squads.length <= 1 ? 'disabled' : ''}>✕</button>
    </div>
  </div>`;
}
function marketCard(it, i) {
  if (it.sold) return '<div class="mk-card sold">comprato</div>';
  const d = APIGS[it.id], role = E.roleOf(it.id), own = run.squads.find((s) => s.id === it.id);
  return `<button class="mk-card" data-sact="buy" data-i="${i}" data-tip="market" style="--rc:${RARITIES[d.r].color}" ${run.gold < it.price || (own && own.level >= MAX_LEVEL) ? 'disabled' : ''}>
    ${rarBand(d.r)}<div class="mk-art">${pigArt(it.id)}</div>${roleBand(role)}
    <i class="price">${it.price} ${acorn}</i>${own ? '<span class="mk-own" title="Ce l\'hai già: comprandolo sale di livello">✨</span>' : ''}</button>`;
}
// Mappa nell'accampamento: sfondo, contadini (i nuovi evidenziati), percorsi dai cancelli.
function drawCampMap() {
  const cv = $('#cmap');
  if (!cv) return;
  const box = cv.parentElement.getBoundingClientRect();
  const T = Math.max(12, Math.floor(Math.min(box.width / MAP_W, box.height / MAP_H)));
  setupCanvas(cv, T);
  ui.T = T; ui.bg = makeBG(T);
  const ctx = cv.getContext('2d');
  const draw = () => {
    if (!$('#cmap')) return;
    ctx.setTransform(devicePixelRatio || 1, 0, 0, devicePixelRatio || 1, 0, 0);
    ctx.drawImage(ui.bg, 0, 0, MAP_W * T, MAP_H * T);
    run.map.paths.forEach((p, g) => drawPath(ctx, p, T, '#ffffff', 0.55));
    drawDefs(ctx, T, performance.now() / 1000, true);
    drawGateLabels(ctx, T, -1);
    drawHouseBar(ctx, T);
    if (ui.hover && ui.hover.def) drawRange(ctx, ui.hover.def, T);
  };
  draw();
  ui.campDraw = draw;
  // le immagini arrivano un attimo dopo: ridisegna appena pronte
  setTimeout(draw, 120); setTimeout(draw, 400);
}

// =====================================================================
// Canvas comune
// =====================================================================
function setupCanvas(cv, T) {
  const dpr = devicePixelRatio || 1;
  cv.width = MAP_W * T * dpr; cv.height = MAP_H * T * dpr;
  cv.style.width = MAP_W * T + 'px'; cv.style.height = MAP_H * T + 'px';
}
function makeBG(T) {
  const dpr = devicePixelRatio || 1;
  const c = document.createElement('canvas');
  c.width = MAP_W * T * dpr; c.height = MAP_H * T * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  drawMapBG(ctx, run.map, T);
  return c;
}
function drawPath(ctx, path, T, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, T * 0.08); ctx.setLineDash([T * 0.18, T * 0.16]); ctx.lineCap = 'round';
  ctx.beginPath();
  path.pts.forEach((p, i) => (i ? ctx.lineTo(p.x * T, p.y * T) : ctx.moveTo(p.x * T, p.y * T)));
  ctx.stroke();
  ctx.restore();
}
function drawGateLabels(ctx, T, sel) {
  run.map.gates.forEach((g, i) => {
    const x = (g.x + 0.5) * T, y = (g.y + 0.5) * T;
    ctx.save();
    ctx.fillStyle = i === sel ? '#f06b93' : '#ffffff'; ctx.strokeStyle = '#4e2f16'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - T * 0.75, T * 0.26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = i === sel ? '#fff' : '#4e2f16'; ctx.font = `700 ${Math.round(T * 0.3)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(GATE_NAMES[i], x, y - T * 0.74);
    ctx.restore();
  });
}
function drawHouseBar(ctx, T) {
  const h = run.house, w = HOUSE.w * T * 0.9, x = HOUSE.x * T + (HOUSE.w * T - w) / 2, y = HOUSE.y * T - T * 0.1;
  ctx.save();
  ctx.fillStyle = 'rgba(43,36,51,.75)'; roundRect(ctx, x - 2, y - 2, w + 4, T * 0.22 + 4, 6); ctx.fill();
  ctx.fillStyle = '#e5483e'; roundRect(ctx, x, y, w * Math.max(0, h.hp / h.max), T * 0.22, 4); ctx.fill();
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w), h, r); }
function drawRange(ctx, d, T) {
  const D = DEFENDERS[d.k];
  ctx.save();
  ctx.fillStyle = 'rgba(226,54,31,.12)'; ctx.strokeStyle = 'rgba(226,54,31,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(d.x * T, d.y * T, D.range * T, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawDefs(ctx, T, now, camp) {
  const defs = [...run.defs].sort((a, b) => a.y - b.y);
  for (const d of defs) {
    const D = DEFENDERS[d.k];
    const x = d.x * T, y = d.y * T;
    if (!d.alive) {
      // abbattuto: cappello a terra
      ctx.save(); ctx.globalAlpha = 0.75;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + T * 0.2, T * 0.3, T * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2cf6b'; ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x, y + T * 0.12, T * 0.26, T * 0.08, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      continue;
    }
    const big = d.k === 'trattore' ? 1.5 : D.trap ? 0.8 : 1.15;
    const s = T * big;
    const img = defImg(d.k);
    const recoil = d.anim && now - d.anim < 0.15 ? T * 0.06 : 0;
    if (img.complete && img.naturalWidth) ctx.drawImage(img, x - s / 2 - recoil, y - (D.trap ? s / 2 : s * 0.82), s, D.trap ? s : s * (d.k === 'trattore' ? 1 : 1.25));
    if (camp && d.fresh) { ctx.save(); ctx.fillStyle = '#f06b93'; ctx.font = `700 ${Math.round(T * 0.26)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('NUOVO', x, y - s * 0.9); ctx.restore(); }
    if (!D.trap && d.hp < d.max) bar(ctx, x - T * 0.38, y - s * 0.95, T * 0.76, Math.max(0, d.hp / d.max), '#e5483e');
    // stati
    const st = [];
    if (d.burn > 0.5) st.push('🔥'); if (d.poison > 0.5) st.push('☠️'); if (d.mud > 0.5) st.push('🟤'); if (run.W && d.stun > run.W.t) st.push('💫');
    if (st.length) { ctx.save(); ctx.font = `${Math.round(T * 0.26)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(st.join(''), x, y - s * 1.02); ctx.restore(); }
  }
}
function bar(ctx, x, y, w, f, col) {
  ctx.save();
  ctx.fillStyle = 'rgba(43,36,51,.7)'; roundRect(ctx, x - 1, y - 1, w + 2, 6, 3); ctx.fill();
  ctx.fillStyle = col; roundRect(ctx, x, y, w * f, 4, 2); ctx.fill();
  ctx.restore();
}

// =====================================================================
// Ondata
// =====================================================================
function showWave() {
  X.closeModal(); hideTip();
  E.startWave(run);
  ui = { ...ui, gate: Math.min(ui.gate, run.map.gates.length - 1), paused: true, speed: 1, acc: 0, fx: [], ended: false, shake: 0, hover: null, last: performance.now() };
  X.app.innerHTML = `<main class="assault">
    <header class="as-top">
      <div class="as-left"><button class="btn ghost small" data-sact="retreat" title="Ritirata: l'ondata finisce subito">🏳️ Ritirata</button><span class="ar-chip c-gold" title="Ghiande guadagnate in questa ondata">${acorn}<b id="as-gold">+0</b></span></div>
      <div class="as-center">
        <div class="as-title"><b>Assalto ${run.assault}/${ASSAULTS}</b><small>Ondata ${run.wave}/${MAX_WAVES} · ${esc(run.map.name)}</small></div>
        <div class="as-house-wrap" id="as-house"></div>
        <div class="as-time" title="Tempo rimasto"><span>⏱</span><b id="as-time"></b></div>
        <div class="as-rancio" title="Rancio rimasto per schierare"><span>🍲</span><b id="as-rancio"></b></div>
        <div class="as-fronts" id="as-fronts" title="Fronti: strade da cui sono già arrivati maialini. Ogni fronte in più: +20% danni alla fattoria"></div>
        <div class="as-ctrl">
          <button class="spd" id="as-play" data-sact="play" title="Pausa / via (barra spaziatrice)">▶</button>
          ${[1, 2, 3].map((x) => `<button class="spd ${x === 1 ? 'on' : ''}" data-sact="speed" data-x="${x}">${x}×</button>`).join('')}
        </div>
      </div>
      <div class="as-right"><button class="hbtn" data-sact="diary" title="Maialini, ruoli, contadini, ciondoli ed effetti">${ICONS.diary}<span>Diario</span></button><button class="hbtn" data-sact="rules" title="Come si gioca"><span class="hb-emoji">❔</span><span>Regole</span></button><button class="hbtn" data-sact="abandon" title="Abbandona la partita"><span class="hb-emoji">🏳️</span><span>Abbandona</span></button></div>
    </header>
    <section class="as-field"><canvas id="field"></canvas><div class="as-banner" id="banner"></div></section>
    <footer class="as-bar">
      <div class="as-gates"><small>Cancello</small>${run.map.gates.map((g, i) => `<button class="gate-btn ${i === ui.gate ? 'on' : ''}" data-sact="gate" data-g="${i}" title="Tasto ${GATE_NAMES[i]}">${GATE_NAMES[i]}</button>`).join('')}</div>
      <div class="as-qty"><small>Quanti</small>${[[1, '×1'], [5, '×5'], [99, 'Tutti']].map(([q, l]) => `<button class="qty-btn ${q === ui.qty ? 'on' : ''}" data-sact="qty" data-q="${q}">${l}</button>`).join('')}</div>
      <div class="as-troops" id="as-troops"></div>
    </footer>
  </main>`;
  const cv = $('#field');
  const box = cv.parentElement.getBoundingClientRect();
  const T = Math.max(14, Math.floor(Math.min((box.width - 8) / MAP_W, (box.height - 8) / MAP_H)));
  ui.T = T;
  setupCanvas(cv, T);
  ui.bg = makeBG(T);
  renderTroops(); updateHUD();
  ui.last = performance.now();
  loop();
}
function renderTroops() {
  const W = run.W, el = $('#as-troops');
  if (!el || !W) return;
  el.innerHTML = W.squads.map((s, i) => {
    const d = APIGS[s.id], n = W.units.filter((u) => u.si === i && u.alive).length + W.queue.reduce((a, q) => a + q.filter((x) => x === i).length, 0);
    return `<button class="troop" data-sact="deploy" data-i="${i}" data-tip="troop" style="--rc:${ROLES[s.role].color}" ${W.rancio < s.cost || W.done ? 'disabled' : ''}>
      <span class="tr-key">${i + 1}</span><div class="tr-art">${pigArt(s.id)}</div>
      <b>${d.name}</b><small>${ROLES[s.role].name}</small><i>🍲 ${s.cost}</i>${n ? `<em>${n}</em>` : ''}</button>`;
  }).join('');
}
function updateHUD() {
  const W = run.W;
  if (!W) return;
  const h = run.house;
  const hb = $('#as-house');
  if (hb) hb.innerHTML = `<div class="as-house"><span>🏠</span><div class="bar"><i style="width:${Math.max(0, h.hp / h.max * 100)}%"></i></div><b>${Math.ceil(h.hp)} / ${h.max}</b></div>`;
  const t = $('#as-time'); if (t) t.textContent = `${Math.max(0, Math.ceil(WAVE_TIME - W.t))} s`;
  const r = $('#as-rancio'); if (r) r.textContent = W.rancio;
  const g = $('#as-gold'); if (g) g.textContent = '+' + W.gold;
  const fr = $('#as-fronts');
  if (fr) { const n = W.fronts.filter(Boolean).length; fr.innerHTML = `⚔️ <b>${n}</b> ${n === 1 ? 'fronte' : 'fronti'}${n > 1 ? ` · +${Math.round((E.frontBonus(n) - 1) * 100)}%` : ''}`; }
  const p = $('#as-play'); if (p) { p.textContent = ui.paused ? '▶' : '⏸'; p.classList.toggle('on', !ui.paused); }
  const b = $('#banner');
  if (b) {
    b.hidden = !(ui.paused && !W.done);
    b.innerHTML = W.t === 0 ? 'In pausa: scegli il cancello, schiera i maialini, poi premi <b>▶</b> (o la barra spaziatrice)' : 'In pausa · puoi schierare anche adesso';
  }
}
function stopLoop() { clearTimeout(ui.timer); ui.timer = null; }
function loop() {
  stopLoop();
  const cv = $('#field');
  if (!cv || !run || !run.W) return;
  const now = performance.now();
  const dt = Math.min(0.25, (now - ui.last) / 1000);
  ui.last = now;
  const W = run.W;
  if (!ui.paused && !W.done) {
    ui.acc += dt * ui.speed;
    let n = 0;
    while (ui.acc >= E.DT && !W.done && n++ < 40) { E.waveStep(run); ui.acc -= E.DT; }
  }
  absorbFx(now / 1000);
  render(cv, now / 1000);
  updateHUD(); renderTroopsLite();
  if (W.done && !ui.ended) { ui.ended = true; setTimeout(finishWave, 900); }
  ui.timer = setTimeout(loop, 30);
}
// aggiorna solo i contatori e lo stato dei bottoni (senza ricostruire le carte, così i clic non si perdono)
function renderTroopsLite() {
  const W = run.W;
  $$('.troop').forEach((b) => {
    const i = +b.dataset.i, s = W.squads[i];
    b.disabled = W.rancio < s.cost || W.done;
    const n = W.units.filter((u) => u.si === i && u.alive).length + W.queue.reduce((a, q) => a + q.filter((x) => x === i).length, 0);
    let em = b.querySelector('em');
    if (n && !em) { em = document.createElement('em'); b.appendChild(em); }
    if (em) { if (n) em.textContent = n; else em.remove(); }
  });
}
// effetti visivi prodotti dal motore
function absorbFx(now) {
  const W = run.W;
  for (const f of W.fx) {
    if (f.k === 'shot' && f.def) { const d = run.defs.find((x) => x.alive && Math.abs(x.x - f.from.x) < 0.01 && Math.abs(x.y - f.from.y) < 0.01); if (d) d.anim = now; }
    if (f.k === 'house') { ui.shake = now; if (!ui.lastHit || now - ui.lastHit > 0.08) { Au.sfx('bump'); ui.lastHit = now; } }
    if (f.k === 'kill') Au.sfx('coin');
    ui.fx.push({ ...f, born: now });
  }
  W.fx.length = 0;
  ui.fx = ui.fx.filter((f) => now - f.born < 1.2).slice(-260);
}
function render(cv, now) {
  const T = ui.T, ctx = cv.getContext('2d'), W = run.W;
  const dpr = devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const shake = now - ui.shake < 0.2 ? (Math.random() - 0.5) * T * 0.08 : 0;
  ctx.drawImage(ui.bg, 0, 0, MAP_W * T, MAP_H * T);
  // percorso del cancello scelto
  drawPath(ctx, run.map.paths[ui.gate], T, '#ffffff', ui.hover && ui.hover.troop != null ? 0.95 : 0.5);
  if (shake) { ctx.save(); ctx.fillStyle = 'rgba(229,72,62,.18)'; ctx.fillRect(HOUSE.x * T, HOUSE.y * T, HOUSE.w * T, HOUSE.h * T); ctx.restore(); }
  drawDefs(ctx, T, now, false);
  if (ui.hover && ui.hover.def) drawRange(ctx, ui.hover.def, T);
  // maialini
  const units = W.units.filter((u) => u.alive).sort((a, b) => a.y - b.y);
  for (const u of units) {
    const s = T * (0.78 + 0.07 * (DEPLOY_COST[APIGS[u.id].r] - 1));
    const walk = u.stun > W.t || u.fighting ? 0 : Math.abs(Math.sin(now * 9 + u.uid)) * T * 0.07;
    const lane = ((u.uid % 3) - 1) * T * 0.16; // piccole corsie: l'orda non si sovrappone tutta
    const x = u.x * T + (Math.abs(u.dx) > 0.01 ? 0 : lane), y = u.y * T - walk + (Math.abs(u.dx) > 0.01 ? lane : 0);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, u.y * T + s * 0.32, s * 0.36, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ROLES[u.role].color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, u.y * T + s * 0.32, s * 0.36, s * 0.1, 0, 0, Math.PI * 2); ctx.stroke();
    const img = pigImg(u.id);
    ctx.translate(x, y);
    if (u.dx < 0) ctx.scale(-1, 1);
    if (u.fighting) ctx.rotate(Math.sin(now * 18 + u.uid) * 0.08);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, -s / 2, -s * 0.62, s, s * 0.9);
    ctx.restore();
    if (u.shield > 0.5) { ctx.save(); ctx.strokeStyle = 'rgba(63,169,224,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.5, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (u.hp < u.max) bar(ctx, x - s * 0.35, y - s * 0.72, s * 0.7, Math.max(0, u.hp / u.max), '#3f9a45');
    if (u.stun > W.t) { ctx.save(); ctx.font = `${Math.round(T * 0.3)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('💫', x, y - s * 0.75); ctx.restore(); }
  }
  drawFx(ctx, T, now);
  drawGateLabels(ctx, T, ui.gate);
  drawHouseBar(ctx, T);
}
function drawFx(ctx, T, now) {
  for (const f of ui.fx) {
    const a = now - f.born;
    ctx.save();
    if (f.k === 'shot') {
      const dur = f.melee ? 0.12 : f.def === 'fucile' || f.def === 'doppietta' ? 0.1 : 0.22;
      if (a > dur + 0.1) { ctx.restore(); continue; }
      const p = Math.min(1, a / dur);
      const x0 = f.from.x * T, y0 = f.from.y * T - T * 0.3, x1 = f.to.x * T, y1 = f.to.y * T - T * 0.2;
      if (f.def === 'fucile' || f.def === 'doppietta') {
        ctx.globalAlpha = 1 - a / (dur + 0.1); ctx.strokeStyle = f.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      } else if (f.melee) {
        ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x1, y1, T * 0.3, -1 + p, 0.4 + p); ctx.stroke();
      } else {
        const x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * T * 0.4;
        ctx.fillStyle = f.c; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, f.def === 'trattore' ? T * 0.14 : T * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (f.def === 'trattore' && p >= 1) { ctx.globalAlpha = 1 - (a - dur) / 0.1; ctx.fillStyle = 'rgba(255,160,60,.5)'; ctx.beginPath(); ctx.arc(x1, y1, T * 1.1, 0, Math.PI * 2); ctx.fill(); }
      }
    } else if (f.k === 'dmg' || f.k === 'heal' || f.k === 'txt' || f.k === 'kill') {
      if (a > 0.9) { ctx.restore(); continue; }
      const txt = f.k === 'dmg' ? `−${Math.round(f.v)}` : f.k === 'heal' ? `+${Math.round(f.v)}` : f.txt;
      const col = f.k === 'heal' ? '#b8f5a8' : f.k === 'kill' ? '#ffd34d' : f.c || '#fff';
      ctx.globalAlpha = 1 - a / 0.9;
      ctx.font = `700 ${Math.round(T * (f.k === 'kill' ? 0.4 : 0.3))}px Fredoka, sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,36,51,.85)';
      const y = f.y * T - T * 0.6 - a * T * 0.6;
      ctx.strokeText(txt, f.x * T, y); ctx.fillStyle = col; ctx.fillText(txt, f.x * T, y);
    } else if (f.k === 'poof' || f.k === 'trap') {
      if (a > 0.5) { ctx.restore(); continue; }
      ctx.globalAlpha = 1 - a / 0.5; ctx.fillStyle = f.k === 'trap' ? '#b8c2cc' : '#ffffff';
      for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; ctx.beginPath(); ctx.arc(f.x * T + Math.cos(an) * a * T, f.y * T + Math.sin(an) * a * T * 0.6, T * 0.1, 0, Math.PI * 2); ctx.fill(); }
    } else if (f.k === 'house') {
      if (a > 1) { ctx.restore(); continue; }
      ctx.globalAlpha = 1 - a; ctx.font = `700 ${Math.round(T * 0.42)}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,36,51,.85)';
      const x = (HOUSE.x + HOUSE.w / 2) * T, y = HOUSE.y * T - T * 0.3 - a * T * 0.8;
      const txt = `−${Math.round(f.v)}${f.txt ? ' ' + f.txt : ''}`;
      ctx.strokeText(txt, x, y); ctx.fillStyle = '#ff9a8c'; ctx.fillText(txt, x, y);
    }
    ctx.restore();
  }
}
function finishWave() {
  stopLoop();
  const sum = E.endWave(run);
  run.pending = false;
  save();
  if (sum.over) { finish(sum); return; }
  Au.sfx(sum.conquered ? 'win' : 'pop');
  X.openModal(`<div class="result ${sum.conquered ? 'win' : ''}">
    <h2>${sum.conquered ? '🏰 Fattoria conquistata!' : `Ondata ${sum.wave} conclusa`}</h2>
    <p class="m-sub">${sum.conquered ? `${esc(sum.farm)} è vostra! Si parte per l'assalto ${run.assault} di ${ASSAULTS}: nuova mappa, contadini più agguerriti.` : `Ti restano ${MAX_WAVES - sum.wave} ondate per conquistare la fattoria.`}</p>
    <div class="kpis">
      <div class="kpi"><small>Contadini abbattuti</small><b>${sum.killed}</b></div>
      <div class="kpi"><small>Arrivati alla fattoria</small><b>${sum.arrived}</b></div>
      <div class="kpi"><small>Danni alla fattoria</small><b>${sum.houseDmg}</b></div>
      <div class="kpi">${acorn}<small>Ghiande</small><b>+${sum.gold}</b></div>
    </div>
    ${sum.reinf.length ? `<p class="reinf">📯 I contadini chiamano rinforzi${sum.focus != null ? ` sulla strada <b>${GATE_NAMES[sum.focus]}</b>, quella che hai usato di più${sum.heavy ? ' (e quasi solo quella: un contadino in più)' : ''}` : ''}: ${sum.reinf.map((k) => DEFENDERS[k].name).join(', ')}.</p>` : ''}
    <div class="m-foot"><button class="btn primary big" data-sact="tocamp">🏕️ All'accampamento</button></div>
  </div>`, { closable: false, cls: 'narrow' });
}
function finish(sum) {
  const prof = X.load(PROF) || { runs: 0, wins: 0, best: 0 };
  prof.runs++; if (run.over === 'win') prof.wins++; prof.best = Math.max(prof.best, run.stats.fattorie);
  X.store(PROF, prof);
  X.store(SAVE, null);
  const win = run.over === 'win';
  Au.sfx(win ? 'win' : 'lose');
  X.openModal(`<div class="result ${win ? 'win' : 'lose'}">
    <div class="br-pigs">${run.squads.slice(0, 4).map((s) => `<div class="br-pig ${win ? 'happy' : 'sad'}">${pigArt(s.id)}</div>`).join('')}</div>
    <h2>${win ? '🏆 Tutte le fattorie sono vostre!' : run.abandoned ? 'Assalto abbandonato' : 'L\'assalto è fallito'}</h2>
    <p class="m-sub">${win ? 'Tre fattorie conquistate: i contadini scappano a gambe levate.' : run.abandoned ? `Hai lasciato il campo durante l’assalto ${run.assault}. Fattorie conquistate: ${run.stats.fattorie} di ${ASSAULTS}.` : `I contadini hanno resistito per ${MAX_WAVES} ondate. Fattorie conquistate: ${run.stats.fattorie} di ${ASSAULTS}.`}</p>
    <div class="kpis">
      <div class="kpi"><small>Ondate</small><b>${run.stats.ondate}</b></div>
      <div class="kpi"><small>Contadini abbattuti</small><b>${run.stats.difensori}</b></div>
      <div class="kpi"><small>Maialini arrivati</small><b>${run.stats.arrivati}</b></div>
      <div class="kpi"><small>Danni alle fattorie</small><b>${Math.round(run.stats.danniFattoria)}</b></div>
    </div>
    <div class="menu row"><button class="btn primary big" data-sact="new">Nuovo assalto</button><button class="btn ghost" data-sact="exit">Menu principale</button></div>
  </div>`, { closable: false, cls: 'narrow' });
}

// =====================================================================
// Diario dell'Assalto
// =====================================================================
function showDiary(tab) {
  if (tab) diaryTab = tab;
  if (run && run.W && !ui.paused) { ui.paused = true; updateHUD(); }
  const tabs = { pigs: 'Maialini', roles: 'Ruoli', defs: 'Contadini', charms: 'Ciondoli', fx: 'Effetti', map: 'Strade e fattorie' };
  let body = '';
  if (diaryTab === 'pigs') {
    const ids = Object.keys(APIGS).filter((id) => (diaryRar === 'all' || APIGS[id].r === diaryRar) && (diaryRole === 'all' || E.roleOf(id) === diaryRole))
      .sort((a, b) => RARITY_ORDER.indexOf(APIGS[a].r) - RARITY_ORDER.indexOf(APIGS[b].r));
    body = `<div class="chips">${[['all', 'Tutte le rarità'], ...RARITY_ORDER.map((r) => [r, RARITIES[r].name])].map(([k, n]) => `<button class="chipf ${diaryRar === k ? 'on' : ''}" data-sact="drar" data-k="${k}" ${k !== 'all' ? `style="--tc:${RARITIES[k].color}"` : ''}>${n}</button>`).join('')}</div>
      <div class="chips">${[['all', 'Tutti i ruoli'], ...Object.entries(ROLES).map(([k, r]) => [k, r.name])].map(([k, n]) => `<button class="chipf ${diaryRole === k ? 'on' : ''}" data-sact="drole" data-k="${k}" ${k !== 'all' ? `style="--tc:${ROLES[k].color}"` : ''}>${n}</button>`).join('')}</div>
      <div class="adex">${ids.map((id) => { const d = APIGS[id], st = E.troopStats({ id, level: 1 }, run ? run.charms : []); const hits = HIT_KEYS.filter((k) => st.hit[k]);
        return `<div class="adx" data-tip="dpig" data-id="${id}" style="--rc:${RARITIES[d.r].color}"><div class="adx-art">${pigArt(id)}</div><div class="adx-body"><b>${d.name}</b><div class="tt-bands">${rarBand(d.r)}${roleBand(st.role)}</div>
        <small>❤️ ${st.hp}${st.role !== 'corridore' && st.atk ? ` · ⚔️ ${fmt(st.atk)} ogni ${fmt(st.cd)} s` : ''} · 👣 ${fmt(st.speed)} · 🏠 ${st.siege} · 🍲 ${st.cost} · costa ${BUY_COST_TXT(d.r)}</small>
        ${hits.length ? `<small>${hits.map((k) => `${STAT_ICON[k]} ${st.hit[k]}${k === 'stun' ? '%' : ''} ${HIT_NAME[k]}`).join(' · ')}</small>` : ''}</div></div>`; }).join('') || '<p class="quiet">Nessun maialino con questi filtri.</p>'}</div>`;
  } else if (diaryTab === 'roles') {
    body = `<div class="adex">${Object.entries(ROLES).map(([k, r]) => `<div class="adx" style="--rc:${r.color}"><div class="adx-body"><div class="tt-bands">${roleBand(k)}</div><small>${r.desc}</small><small class="quiet">${Object.keys(APIGS).filter((id) => E.roleOf(id) === k).length} maialini</small></div></div>`).join('')}</div>
      <p class="m-sub">Il ruolo dipende dal maialino: chi applica effetti a ogni colpo è un Untore, chi cura o protegge un Supporto, i maialini snelli o piccoli corrono, i robusti combattono.</p>`;
  } else if (diaryTab === 'defs') {
    body = `<div class="adex">${Object.entries(DEFENDERS).map(([k, D]) => `<div class="adx" style="--rc:#8a5a33"><div class="adx-art def">${defIconHTML(k)}</div><div class="adx-body"><b>${D.name}</b><small>${D.desc}</small>
      <small>${D.trap ? '' : `❤️ ${D.hp} · `}${D.dmg ? `💥 ${D.dmg} ogni ${fmt(D.cd)} s · ` : ''}${D.heal ? `💚 ${D.heal} ogni ${fmt(D.cd)} s · ` : ''}📏 ${fmt(D.range)}${D.targets ? ` · ${D.targets} bersagli` : ''}${D.splash ? ' · ad area' : ''}${D.knock ? ' · spinge indietro' : ''}${D.slow ? ` · −${D.slow}% velocità` : ''}${D.stun ? ` · blocca ${D.stun} s` : ''}</small>
      <small class="quiet">Valori al livello 1: ogni livello +40%.</small></div></div>`).join('')}</div>`;
  } else if (diaryTab === 'charms') {
    body = `<div class="adex">${Object.entries(ACHARMS_A).map(([k, c]) => `<div class="adx ${run && run.charms.includes(k) ? 'own' : ''}" style="--rc:#e0a20c"><div class="adx-art emoji">${c.icon}</div><div class="adx-body"><b>${c.name}</b><small>${c.text}</small>${run && run.charms.includes(k) ? '<small class="quiet">Lo hai già.</small>' : ''}</div></div>`).join('')}</div>`;
  } else if (diaryTab === 'fx') {
    body = `<div class="adex">${[['burn', 'Ogni secondo il contadino perde tanta vita quante bruciature ha, poi le bruciature calano di un quinto.'], ['poison', 'Ogni 2 secondi il contadino perde tanta vita quanti veleni ha. Non passa mai.'], ['mud', 'Ogni fango fa sparare il contadino il 3% più piano (fino al 50%).'], ['stun', 'Probabilità di bloccare il contadino per 1 secondo.'], ['heal', 'I Supporti curano i maialini vicini (3 volte il valore).'], ['shield', 'I Supporti danno uno scudo ai maialini vicini (3 volte il valore).'], ['crit', 'Probabilità che un colpo faccia il doppio dei danni e degli effetti.']].map(([k, t]) => `<div class="adx" style="--rc:${FX[k].color}"><div class="adx-art emoji">${FX[k].icon}</div><div class="adx-body"><b>${FX[k].name}</b><small>${t}</small></div></div>`).join('')}</div>`;
  } else {
    body = `<div class="relax-rules">
      <div class="rr"><span>🛣️</span><div><b>Una corsia per cancello</b><small>Ogni cancello ha la sua strada, con i suoi contadini. Le strade si uniscono solo nelle ultime caselle davanti alla porta.</small></div></div>
      <div class="rr"><span>⚔️</span><div><b>Più fronti</b><small>Ogni strada in più da cui arrivano maialini nella stessa ondata dà +20% ai danni alla fattoria (2 strade +20%, 3 strade +40%).</small></div></div>
      <div class="rr"><span>📯</span><div><b>Rinforzi</b><small>Dopo ogni ondata i contadini rinforzano la strada che hai usato di più. Se l'hai usata quasi solo quella (oltre il 60% del rancio), arriva un contadino in più.</small></div></div>
      <div class="rr"><span>🏠</span><div><b>Le fattorie</b><small>${ASSAULTS} fattorie, sempre più difese: 2 cancelli nella prima, 3 nelle altre. Danni alla fattoria e contadini abbattuti restano fino alla conquista.</small></div></div>
    </div>`;
  }
  X.openModal(`<h2>📖 Diario dell'Assalto</h2>
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${diaryTab === k ? 'on' : ''}" data-sact="dtab" data-k="${k}">${v}</button>`).join('')}</div>
    ${body}`, { cls: 'wide tall', key: 'asdiary-' + diaryTab + diaryRar + diaryRole });
}
const BUY_COST_TXT = (r) => `${{ comune: 4, raro: 7, epico: 10, leggendario: 14, eroico: 18 }[r]} ghiande`;

function showRules() {
  if (run && run.W && !ui.paused) { ui.paused = true; updateHUD(); }
  X.openModal(`<h2>🏰 Regole dell'Assalto</h2>
    <div class="relax-rules">
      <div class="rr"><span>🎯</span><div><b>Obiettivo</b><small>Porta a zero la vita della fattoria entro ${MAX_WAVES} ondate. Poi la prossima: ${ASSAULTS} fattorie in tutto, sempre più difese.</small></div></div>
      <div class="rr"><span>🚪</span><div><b>Cancelli e strade</b><small>Scegli il cancello (A, B, C): ogni cancello ha la sua strada, con i suoi contadini, e i maialini la seguono da soli fino alla fattoria. Attaccare da più strade nella stessa ondata dà +20% danni alla fattoria per ogni strada in più; i rinforzi dei contadini arrivano sulla strada che usi di più.</small></div></div>
      <div class="rr"><span>🐷</span><div><b>Ruoli</b><small><b>Guerrieri</b>: si fermano a combattere i contadini a portata. <b>Untori</b>: colpiscono passando e lasciano bruciature, veleno, fango. <b>Supporti</b>: curano e proteggono i vicini. <b>Corridori</b>: corrono alla fattoria e fanno più danni.</small></div></div>
      <div class="rr"><span>🍲</span><div><b>Rancio</b><small>Ogni maialino costa rancio (da 1 a 5, secondo la rarità). Puoi schierarli uno alla volta, a gruppi da 5 o tutti: entrano in fila dal cancello scelto.</small></div></div>
      <div class="rr"><span>⏸️</span><div><b>Tempo</b><small>${WAVE_TIME} secondi a ondata. Si parte in pausa; ▶/⏸ (o barra spaziatrice) ferma e riparte, 1× 2× 3× accelera. Tasti 1-8 per le squadre, A/B/C per i cancelli.</small></div></div>
      <div class="rr"><span>🔥</span><div><b>Effetti</b><small>Come nell'Arena: bruciatura e veleno feriscono i contadini nel tempo, il fango li fa sparare più piano, lo stordimento li blocca. Il critico raddoppia danni ed effetti.</small></div></div>
      <div class="rr"><span>🏕️</span><div><b>Accampamento</b><small>Ghiande per ogni contadino abbattuto e per i danni alla fattoria. Spendile in squadre, livelli, rancio, posti e ciondoli. Dopo ogni ondata arrivano rinforzi: li vedi segnati «NUOVO».</small></div></div>
    </div>`, { cls: 'wide' });
}

// =====================================================================
// Eventi
// =====================================================================
function act(name, b, e) {
  switch (name) {
    case 'exit': stopLoop(); hideTip(); X.showTitle(); break;
    case 'new': {
      run = E.newRun((Math.random() * 2 ** 31) | 0);
      save(); showCamp(); break;
    }
    case 'continue': {
      run = X.load(SAVE);
      // ondata lasciata a metà (pagina chiusa o ricaricata): conta come una ritirata
      if (run.pending) {
        run.pending = false;
        E.startWave(run); run.W.done = true;
        const sum = E.endWave(run);
        save();
        X.toast('L’ondata lasciata a metà è stata contata come una ritirata.');
        if (sum.over) { finish(sum); break; }
      }
      showCamp(); break;
    }
    case 'rules': showRules(); break;
    case 'abandon':
      if (run.W && !ui.paused) { ui.paused = true; updateHUD(); }
      X.openModal(`<h2>Abbandonare la partita?</h2><p class="m-sub">L'assalto finisce qui: esercito, ghiande e fattorie conquistate vanno persi. La partita conta nelle statistiche.</p>
        <div class="m-foot"><button class="btn" data-sact="close">Continua a giocare</button><button class="btn primary" data-sact="abandonok">Abbandona</button></div>`, { cls: 'narrow' });
      break;
    case 'abandonok': stopLoop(); hideTip(); run.W = null; run.pending = false; run.over = 'lose'; run.abandoned = true; finish(null); break;
    case 'diary': showDiary(); break;
    case 'dtab': showDiary(b.dataset.k); break;
    case 'drar': diaryRar = b.dataset.k; showDiary('pigs'); break;
    case 'drole': diaryRole = b.dataset.k; showDiary('pigs'); break;
    case 'reroll': { const err = E.reroll(run); if (err) X.toast(err); else { Au.sfx('card'); save(); showCamp(); } break; }
    case 'buy': {
      const i = +b.dataset.i;
      const err = E.buyTroop(run, i);
      if (err === 'full') { chooseReplace(i); break; }
      if (err) { X.toast(err); break; }
      Au.sfx('coin'); save(); showCamp(); break;
    }
    case 'replace': { const err = E.buyTroop(run, +b.dataset.m, +b.dataset.i); if (err) X.toast(err); else { Au.sfx('coin'); save(); showCamp(); } break; }
    case 'levelup': { const err = E.levelUp(run, +b.dataset.i); if (err) X.toast(err); else { Au.sfx('win'); save(); showCamp(); } break; }
    case 'dismiss': {
      const i = +b.dataset.i;
      X.openModal(`<h2>Congedare ${esc(APIGS[run.squads[i].id].name)}?</h2><p class="m-sub">La squadra lascia l'esercito con i suoi livelli. Non ti restituisce ghiande.</p>
        <div class="m-foot"><button class="btn" data-sact="close">Annulla</button><button class="btn primary" data-sact="dismissok" data-i="${i}">Congeda</button></div>`, { cls: 'narrow' });
      break;
    }
    case 'dismissok': E.dismiss(run, +b.dataset.i); save(); showCamp(); break;
    case 'close': X.closeModal(); break;
    case 'rancio': { const err = E.buyRancio(run); if (err) X.toast(err); else { Au.sfx('coin'); save(); showCamp(); } break; }
    case 'slot': { const err = E.buySlot(run); if (err) X.toast(err); else { Au.sfx('coin'); save(); showCamp(); } break; }
    case 'charm': { const err = E.buyCharm(run); if (err) X.toast(err); else { Au.sfx('win'); save(); showCamp(); } break; }
    case 'startwave': if (run.squads.length) { run.pending = true; save(); showWave(); } break;
    case 'play': ui.paused = !ui.paused; ui.last = performance.now(); updateHUD(); break;
    case 'speed': ui.speed = +b.dataset.x; $$('.as-ctrl .spd[data-x]').forEach((x) => x.classList.toggle('on', x === b)); if (ui.paused) { ui.paused = false; ui.last = performance.now(); } updateHUD(); break;
    case 'gate': setGate(+b.dataset.g); break;
    case 'qty': ui.qty = +b.dataset.q; $$('.qty-btn').forEach((x) => x.classList.toggle('on', x === b)); break;
    case 'deploy': deployFrom(+b.dataset.i, e && e.shiftKey ? 5 : ui.qty); break;
    case 'retreat':
      X.openModal(`<h2>Ritirata?</h2><p class="m-sub">L'ondata finisce subito: i maialini ancora in campo tornano all'accampamento e non fanno altri danni. L'ondata conta comunque.</p>
        <div class="m-foot"><button class="btn" data-sact="close">Continua a combattere</button><button class="btn primary" data-sact="retreatok">Ritirata</button></div>`, { cls: 'narrow' });
      break;
    case 'retreatok': X.closeModal(); if (run.W && !run.W.done) { run.W.done = true; } break;
    case 'tocamp': X.closeModal(); showCamp(); break;
  }
}
function setGate(g) {
  if (!run || !run.W || g < 0 || g >= run.map.gates.length) return;
  ui.gate = g;
  $$('.gate-btn').forEach((x) => x.classList.toggle('on', +x.dataset.g === g));
}
function deployFrom(i, q) {
  const k = E.deploy(run, i, ui.gate, q);
  if (!k) { X.toast('Rancio finito per questa squadra.'); Au.sfx('hit'); return; }
  Au.sfx('pop');
  renderTroopsLite(); updateHUD();
}
function chooseReplace(m) {
  const it = run.market[m];
  X.openModal(`<h2>Esercito al completo</h2><p class="m-sub">Per arruolare ${esc(APIGS[it.id].name)} devi congedare una squadra (oppure compra un posto in più nelle migliorie).</p>
    <div class="replace-list">${run.squads.map((sq, i) => `<button class="sq-row" data-sact="replace" data-m="${m}" data-i="${i}"><div class="sq-art">${pigArt(sq.id)}</div><div class="sq-body"><b>${APIGS[sq.id].name}</b><small>Liv. ${sq.level}</small></div><span>Congeda ✕</span></button>`).join('')}</div>
    <div class="m-foot"><button class="btn" data-sact="close">Annulla</button></div>`, { cls: 'narrow' });
}
function onClick(e) {
  if (!$('.assault, .camp, .as-intro') && !$('#modal [data-sact]')) return;
  const b = e.target.closest('[data-sact]');
  if (b && !b.disabled) { Au.sfx('click'); act(b.dataset.sact, b, e); return; }
  // clic sulla mappa: cancello vicino
  const cv = e.target.closest('#field');
  if (cv && run && run.W) {
    const p = canvasPos(cv, e);
    const gi = run.map.gates.findIndex((g) => Math.abs(p.x - (g.x + 0.5)) < 0.9 && Math.abs(p.y - (g.y + 0.5)) < 1.2);
    if (gi >= 0) setGate(gi);
  }
}
function canvasPos(cv, e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / ui.T, y: (e.clientY - r.top) / ui.T }; }
function onMove(e) {
  if (!run || !$('.assault, .camp')) { hideTip(); return; }
  if (document.querySelector('#modal') && !e.target.closest('#modal [data-tip]')) { hideTip(); return; }
  ui.hover = null;
  const cv = e.target.closest('#field, #cmap');
  if (cv) {
    const p = canvasPos(cv, e);
    const d = run.defs.filter((x) => x.alive).find((x) => Math.abs(x.x - p.x) < 0.5 && p.y > x.y - 1 && p.y < x.y + 0.5);
    if (d) { ui.hover = { def: d }; showTip(defTip(d), e); } else hideTip();
    if (cv.id === 'cmap' && ui.campDraw) ui.campDraw();
    return;
  }
  const t = e.target.closest('[data-tip]');
  if (!t) { hideTip(); return; }
  const k = t.dataset.tip, i = +t.dataset.i;
  if (k === 'squad') showTip(troopTip(run.squads[i]), e);
  else if (k === 'dpig') showTip(troopTip({ id: t.dataset.id, level: 1 }), e);
  else if (k === 'market') showTip(troopTip({ id: run.market[i].id, level: 1 }), e);
  else if (k === 'troop' && run.W) { ui.hover = { troop: i }; const sq = run.squads.find((s) => s.uid === run.W.squads[i].uid) || { id: run.W.squads[i].id, level: 1 }; showTip(troopTip(sq), e); }
  else if (k === 'charm' && run.charmOffer) showTip(`<div class="tt"><b class="tt-name">${ACHARMS_A[run.charmOffer].icon} ${ACHARMS_A[run.charmOffer].name}</b><p class="tt-role">${ACHARMS_A[run.charmOffer].text}</p><p class="tt-foot">Vale per tutta la partita.</p></div>`, e);
  else hideTip();
}
function onKey(e) {
  if (!$('.assault') || !run || !run.W || document.querySelector('#modal')) return;
  if (e.key === ' ') { e.preventDefault(); act('play'); return; }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9 && run.W.squads[n - 1]) { deployFrom(n - 1, e.shiftKey ? 5 : ui.qty); return; }
  const g = GATE_NAMES.indexOf(e.key.toUpperCase());
  if (g >= 0) setGate(g);
}
document.addEventListener('click', onClick);
document.addEventListener('mousemove', onMove);
document.addEventListener('keydown', onKey);
window.addEventListener('resize', () => {
  if ($('.camp')) drawCampMap();
  else if ($('.assault') && run && run.W) {
    const cv = $('#field'), box = cv.parentElement.getBoundingClientRect();
    ui.T = Math.max(14, Math.floor(Math.min((box.width - 8) / MAP_W, (box.height - 8) / MAP_H)));
    setupCanvas(cv, ui.T); ui.bg = makeBG(ui.T);
  }
});
