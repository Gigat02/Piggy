// Interfaccia: disegna lo stato, raccoglie i comandi, anima gli eventi.
import * as E from './engine.js';
import { CARDS, RELICS, UPGRADES, RARITY_NAME, PIGS, TYPES, BESTIARY, DAILY_RULES, COSMETICS, SLOTS, RELAX_IDS } from './data.js';
import * as A from './audio.js';
import * as S from './shop.js';
import { openArena } from './arena-ui.js';
import { openAssault } from './assault-ui.js';
import { SPRITES, pigSVG, arenaPigSVG, ICONS, use } from './art.js';
import { APIGS } from './arena-data.js';
import { defIconHTML } from './assault-art.js';

const H = E.H;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
document.body.insertAdjacentHTML('afterbegin', SPRITES);

const SAVE = 'piggy.run.v2', PROF = 'piggy.profile.v1', SEEN = 'piggy.seen.v1', HELP = 'piggy.help.v2', LASTPIG = 'piggy.pig';
let run = null, undo = [], busy = false, targeting = null, lastPig = null, renderedDay = -1, handUids = new Set();
let peek = false, hintOff = '', tileTimer = null, pickVariant = 'roguelike';
let diaryTab = 'deck', statsTab = 'run', cardFilter = 'all', pendingRemove = null, pickMode = 'normal', pickPig = 'rosina';

const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage non disponibile */ } };
const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const save = () => store(SAVE, run);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const seen = new Set(load(SEEN) || []);

function profile() {
  return { runs: 0, bestDays: 0, bestScore: 0, mele: 0, fango: 0, giorni: 0, history: [], daily: {}, ...(load(PROF) || {}) };
}
const todayKey = () => new Date().toISOString().slice(0, 10);
const dailySeed = () => E.seedFrom('piggy-' + todayKey());
const ruleHTML = (id) => { const r = DAILY_RULES[id]; return `<div class="rule ${r.good ? 'good' : 'bad'}"><span class="r-ico">${r.icon}</span><div><em>${r.good ? 'Vantaggio' : 'Svantaggio'}</em><b>${r.name}</b><small>${r.desc}</small></div></div>`; };

// Disegno di una voce del compendio (animali, oggetti, meteo, campo).
function artOf(id) {
  if (id === 'farmer') return `<svg viewBox="0 0 64 72"><use href="#s-farmer"/></svg>`;
  return `<svg viewBox="0 0 40 40"><use href="#s-${id}"/></svg>`;
}
const entryOf = (id) => BESTIARY.flatMap((g) => g.items).find((it) => it.id === id);

// =====================================================================
// Titolo e scelta del maialino
// =====================================================================
const LOOKS = 'piggy.looks.v1';
// L'aspetto salvato di un maialino, tenendo solo gli accessori sbloccati.
function lookOf(pig) {
  const all = load(LOOKS) || {}, prof = profile(), out = {};
  for (const [slot, id] of Object.entries(all[pig] || {})) if (COSMETICS[id] && S.lookStatus(id, prof).ok) out[slot] = id;
  return out;
}
function setLook(pig, slot, id) {
  const all = load(LOOKS) || {};
  all[pig] = { ...(all[pig] || {}) };
  if (id) all[pig][slot] = id; else delete all[pig][slot];
  store(LOOKS, all);
}
const gameLook = () => (A.settings.cosmetics && run.look ? run.look : {});
const VARIANT = 'piggy.variant';
const VARIANTS = {
  relax: { name: 'Relax', icon: '🌿', desc: 'Solo il maialino, niente carte né energia. 3 passi per turno, 2 vite.' },
  roguelike: { name: 'Roguelike', icon: '🎲', desc: 'Carte, energia, ciondoli, meteo e tutti gli animali.' },
};
// Tutte le modalità del menu a tendina della schermata iniziale. Arena e Assalto per ora solo da computer.
const MODE = 'piggy.mode';
const MODES = {
  relax: { name: 'Relax', icon: '🌿', desc: VARIANTS.relax.desc },
  roguelike: { name: 'Roguelike', icon: '🎲', desc: VARIANTS.roguelike.desc },
  arena: { name: 'Arena', icon: '⚔️', desc: 'Auto-battler: componi un recinto di maialini e sfida altri allevatori.', pc: true },
  assalto: { name: 'Assalto', icon: '🏰', desc: 'Tower defense al contrario: guida le orde di maialini alla conquista di 3 fattorie.', pc: true, isNew: true },
};
const curVariant = () => (VARIANTS[load(VARIANT)] ? load(VARIANT) : 'roguelike');
// L'Arena per ora è solo da computer: schermo stretto o dispositivo touch senza mouse = bloccata.
const arenaLocked = () => matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
const pcOnly = (m) => !!MODES[m].pc && arenaLocked();
const curMode = () => { const m = load(MODE); return MODES[m] && !pcOnly(m) ? m : 'relax'; };
function setMode(m) { store(MODE, m); if (VARIANTS[m]) store(VARIANT, m); }
const relax = () => !!run && run.variant === 'relax';
const powerOf = (id, variant) => (variant === 'relax' ? { name: PIGS[id].relaxPower, desc: PIGS[id].relaxDesc } : { name: PIGS[id].power, desc: PIGS[id].powerDesc });

function showTitle() {
  run = null; closeModal();
  const saved = load(SAVE), prof = profile();
  const canContinue = saved && saved.v === 2 && saved.screen !== 'over';
  const pig = PIGS[load(LASTPIG)] ? load(LASTPIG) : 'rosina';
  app.innerHTML = `<main class="title ${canContinue ? 'has-continue' : ''}">
    <div class="hills"><i></i><i></i><i></i></div>
    <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
    <div class="title-inner">
      <h1 class="logo">Piggy</h1>
      <p class="tagline">Mele da sgranocchiare, fango in cui rotolarsi e un contadino da evitare.</p>
      <div class="title-pig">${pigSVG(pig, lookOf(pig))}</div>
      <nav class="menu">
        ${canContinue ? `<button class="btn big primary" data-act="continue">▶ Continua · ${PIGS[saved.pig].name}${saved.variant === 'relax' ? ' (Relax)' : ''}, giorno ${saved.day + 1}</button>` : ''}
        <div class="newgame">
          <button class="btn big ${canContinue ? '' : 'primary'}" data-act="newgame">Nuova partita</button>
          <div class="mode-pick" id="mode-pick">
            <button class="btn big mode-btn" data-act="modemenu" aria-haspopup="listbox" title="Scegli la modalità">${MODES[curMode()].icon} ${MODES[curMode()].name}<span class="caret">▾</span></button>
            <div class="mode-menu" role="listbox" hidden>${Object.entries(MODES).map(([id, v]) => `<button class="mode-it ${id === curMode() ? 'on' : ''} ${pcOnly(id) ? 'locked' : ''}" data-act="mode" data-id="${id}" role="option" aria-selected="${id === curMode()}"><span class="mi-ico">${v.icon}</span><span class="mi-txt"><b>${v.name}${v.isNew ? ' <span class="soon new">nuova</span>' : ''}</b><small>${pcOnly(id) ? 'Per ora solo da computer' : v.desc}</small></span></button>`).join('')}</div>
          </div>
        </div>
        <p class="vdesc">${MODES[curMode()].desc}</p>
        <div class="menu-grid">
          <button class="btn" data-act="pregame" data-mode="daily">📅 Sfida del giorno</button>
          <button class="btn" data-act="tutorial">🎓 Tutorial</button>
          <button class="btn" data-act="shoppage">🛒 Negozio</button>
          <button class="btn ghost" data-act="help">❔ Come si gioca</button>
          <button class="btn ghost" data-act="career">📊 Statistiche</button>
          <button class="btn ghost" data-act="settings">⚙️ Impostazioni</button>
        </div>
      </nav>
      <p class="best">${prof.runs ? `Record: ${prof.bestDays} giorni · ${prof.bestScore} punti · ${prof.runs} partite${prof.daily[todayKey()] ? ` · sfida di oggi ${prof.daily[todayKey()]}` : ''}` : 'Prima volta in fattoria? Dai un\'occhiata a «Come si gioca».'}</p>
    </div>
  </main>`;
}

function showPregame(mode) {
  closeModal();
  pickMode = mode;
  pickVariant = mode === 'daily' ? 'roguelike' : curVariant();
  pickPig = PIGS[load(LASTPIG)] ? load(LASTPIG) : 'rosina';
  if (!S.pigStatus(pickPig, profile()).ok) pickPig = 'rosina';
  app.innerHTML = `<main class="pregame">
    <header class="pg-head">
      <button class="btn ghost" data-act="title">${ICONS.back}Menu principale</button>
      <div class="pg-title"><h1>Scegli il tuo maialino</h1><p>${mode === 'daily' ? 'Sfida del giorno: oggi la fattoria è la stessa per tutti.' : 'Ognuno ha un carattere e un potere speciale.'}</p>
        <span class="pg-variant">${VARIANTS[pickVariant].icon} Modalità ${VARIANTS[pickVariant].name}</span></div>
      <span class="pg-spacer"></span>
    </header>
    ${mode === 'daily' ? `<section class="daily-rules">
      <h2>📅 Regole della sfida di oggi <small>${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</small></h2>
      <div class="rules">${E.dailyRules(dailySeed()).map(ruleHTML).join('')}</div>
      <p>Tutti giocano la stessa fattoria con le stesse regole: confronta il punteggio con i tuoi amici. Domani cambiano.</p>
    </section>` : ''}
    <div class="pigs" id="pigs"></div>
    <div class="pg-foot"><button class="btn primary big" data-act="startrun" id="startrun"></button></div>
    <section class="wardrobe" id="wardrobe"></section>
  </main>`;
  renderPigs();
}

function renderPigs() {
  const prof = profile();
  $('#pigs').innerHTML = Object.entries(PIGS).map(([id, p]) => {
    const st = S.pigStatus(id, prof);
    return `<button class="pig-card ${id === pickPig ? 'sel' : ''} ${st.ok ? '' : 'is-locked'}" data-act="pickpig" data-id="${id}">
      <div class="pc-art">${pigSVG(id, lookOf(id))}</div>
      <b class="pc-name">${st.ok ? '' : '🔒 '}${p.name}</b><small class="pc-role">${p.role}</small>
      <div class="pc-stats">${pickVariant === 'relax'
        ? `<span title="Vite">${use('heart')}<b>${id === 'rosina' ? 3 : 2}</b></span><span title="Passi per turno">${use('step')}<b>${id === 'lampo' ? 4 : 3}</b></span>`
        : `<span title="Cuori">${use('heart')}<b>${p.hearts}</b></span>
        <span title="Energia per turno">${use('bolt')}<b>${p.energia}</b></span>
        <span title="Carte pescate a ogni turno"><i class="mini-card"></i><b>${p.mano}</b></span>`}
      </div>
      <div class="pc-power"><b>✦ ${powerOf(id, pickVariant).name}</b><span>${powerOf(id, pickVariant).desc}</span></div>
      ${st.ok ? (pickVariant === 'relax' ? '' : `<small class="pc-card">Carta in più nel mazzo: <b>${CARDS[p.card].name}</b></small>`)
        : `<div class="pc-lock"><span>${st.goal.text}</span><div class="pc-prog"><i style="width:${(st.progress / st.goal.n) * 100}%"></i></div><small>${st.progress}/${st.goal.n} · oppure ${S.formatPrice(st.price)} nel negozio</small></div>`}
    </button>`;
  }).join('');
  const ok = S.pigStatus(pickPig, prof).ok;
  const btn = $('#startrun');
  btn.disabled = !ok;
  btn.textContent = ok ? `Inizia con ${PIGS[pickPig].name}` : `🔒 ${PIGS[pickPig].name} è ancora bloccato`;
  renderWardrobe();
}

function renderWardrobe() {
  const prof = profile(), look = lookOf(pickPig), P = PIGS[pickPig];
  $('#wardrobe').innerHTML = `<h2>Guardaroba di ${P.name} <small>gli accessori sono solo estetici</small></h2>
    ${Object.entries(SLOTS).map(([slot, label]) => `<div class="wr-row"><b class="wr-label">${label}</b><div class="wr-items">
      <button class="look-item ${!look[slot] ? 'on' : ''}" data-act="equip" data-slot="${slot}" data-id=""><div class="li-art">${pigSVG(pickPig, { ...look, [slot]: undefined })}</div><small>Nessuno</small></button>
      ${Object.entries(COSMETICS).filter(([, c]) => c.slot === slot).map(([id, c]) => {
        const st = S.lookStatus(id, prof);
        return `<button class="look-item ${look[slot] === id ? 'on' : ''} ${st.ok ? '' : 'locked'}" data-act="equip" data-slot="${slot}" data-id="${id}">
          <div class="li-art">${pigSVG(pickPig, { ...look, [slot]: id })}</div><small>${c.name}</small>
          ${st.ok ? '' : `<span class="li-lock">🔒 ${st.goal ? `${st.progress}/${st.goal.n}` : S.formatPrice(st.price)}</span>`}</button>`;
      }).join('')}</div></div>`).join('')}`;
}

function equip(b) {
  const { slot, id } = b.dataset;
  if (id && !S.lookStatus(id, profile()).ok) {
    const c = COSMETICS[id], st = S.lookStatus(id, profile());
    openModal(`<div class="lock-art">${pigSVG(pickPig, { [slot]: id })}</div><h2>${c.name}</h2>
      <p>${st.goal ? `Si sblocca giocando: <b>${st.goal.text}</b> (${st.progress}/${st.goal.n}).` : 'Disponibile nel negozio.'}${st.price ? ` Puoi anche prenderlo subito per <b>${S.formatPrice(st.price)}</b>.` : ''}</p>
      <div class="menu row"><button class="btn primary" data-act="shoppage">🛒 Vai al negozio</button><button class="btn ghost" data-act="close">Chiudi</button></div>`, { cls: 'narrow center' });
    return;
  }
  setLook(pickPig, slot, id || null);
  A.sfx('pop');
  renderPigs();
}

// =====================================================================
// Negozio
// =====================================================================
function showShopPage() {
  closeModal();
  const prof = profile();
  const card = (p, art, sub) => {
    const mine = S.ownsAll(p);
    const free = p.kind === 'pig' ? S.pigStatus(p.ref, prof).ok : p.kind === 'look' ? S.lookStatus(p.ref, prof).ok : false;
    return `<div class="prod ${mine || free ? 'have' : ''}">
      <div class="prod-art">${art}</div><b>${p.name}</b><small>${sub}</small>
      ${mine ? '<span class="prod-tag">Acquistato</span>' : free ? '<span class="prod-tag ok">Già sbloccato giocando</span>'
        : `<button class="btn primary small" data-act="buy-real" data-id="${p.id}">${S.formatPrice(p.price)}</button>`}
    </div>`;
  };
  const pigs = S.PRODUCTS.filter((p) => p.kind === 'pig');
  const looks = S.PRODUCTS.filter((p) => p.kind === 'look');
  const bundles = S.PRODUCTS.filter((p) => p.kind === 'bundle');
  app.innerHTML = `<main class="shop-page">
    <header class="pg-head">
      <button class="btn ghost" data-act="title">${ICONS.back}Menu principale</button>
      <div class="pg-title"><h1>🛒 Negozio</h1><p>Sblocca prima i maialini e vesti il tuo preferito.</p></div>
      <button class="btn ghost small" data-act="restore">Ripristina acquisti</button>
    </header>
    ${S.paymentsActive() ? '' : '<div class="shop-note">💡 Gli acquisti non sono ancora attivi: puoi sfogliare il catalogo, ma per ora non si paga nulla. Tutto ciò che è in vendita si può comunque sbloccare giocando, tranne gli accessori esclusivi.</div>'}
    <section><h2>Pacchetti</h2><div class="prods">${bundles.map((p) => card(p, `<span class="prod-emoji">${p.icon}</span>`, p.desc)).join('')}</div></section>
    <section><h2>Maialini</h2><div class="prods">${pigs.map((p) => card(p, pigSVG(p.ref), `Sblocco anticipato · si ottiene anche giocando: ${PIGS[p.ref].goal.text.toLowerCase()}`)).join('')}</div></section>
    <section><h2>Accessori</h2><div class="prods">${looks.map((p) => card(p, pigSVG('rosina', { [COSMETICS[p.ref].slot]: p.ref }), `${SLOTS[COSMETICS[p.ref].slot]}${COSMETICS[p.ref].goal ? ' · oppure: ' + COSMETICS[p.ref].goal.text.toLowerCase() : ' · esclusivo del negozio'}`)).join('')}</div></section>
    <section><h2>⚔️ Arena auto-battler <span class="soon">presto</span></h2><div class="prods"><div class="prod coming"><div class="prod-art"><span class="prod-emoji">🏟️</span></div><b>Contenuti dell'Arena</b><small>Quando arriverà la modalità a classifica, qui troverai i suoi oggetti.</small><span class="prod-tag">In arrivo</span></div></div></section>
  </main>`;
}

async function buyReal(b) {
  const res = await S.purchase(b.dataset.id);
  if (res.ok) { A.sfx('coin'); showShopPage(); return; }
  openModal(`<div class="relic-big">🚧</div><h2>Acquisti in arrivo</h2>
    <p>I pagamenti non sono ancora attivi, quindi non ti è stato addebitato nulla. Quando lo saranno, potrai comprare da qui in modo sicuro.</p>
    <p class="muted">Intanto puoi sbloccare maialini e accessori giocando.</p>
    <div class="m-foot"><button class="btn primary" data-act="close">Ho capito</button></div>`, { cls: 'narrow center' });
}

// =====================================================================
// Impostazioni (dal menu principale e dal menu in partita)
// =====================================================================
function showSettings() {
  closeMenu();
  const st = A.settings;
  const toggle = (k, label, sub) => `<label class="set-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" class="switch" data-set="${k}" ${st[k] ? 'checked' : ''}></label>`;
  const slider = (k, on) => `<input type="range" min="0" max="1" step="0.05" value="${st[k]}" data-set="${k}" ${st[on] ? '' : 'disabled'} aria-label="Volume">`;
  openModal(`<h2>⚙️ Impostazioni</h2>
    <div class="settings">
      <section><h3>🔊 Audio</h3>
        ${toggle('music', 'Musica di sottofondo', 'Scegli il brano qui sotto')}<div class="set-vol">🎵 ${slider('musicVol', 'music')}</div>
        <div class="tracks">${Object.entries(A.TRACKS).map(([id, tr]) => `<label class="track ${st.track === id ? 'on' : ''}"><input type="radio" name="track" value="${id}" data-set="track" ${st.track === id ? 'checked' : ''}><b>${tr.name}</b><small>${tr.desc}</small></label>`).join('')}</div>
        ${toggle('sfx', 'Effetti sonori', 'Mele, fango, grugniti e secchiate')}<div class="set-vol">🔔 ${slider('sfxVol', 'sfx')}</div>
      </section>
      <section><h3>🎮 Gioco</h3>
        ${toggle('fast', 'Animazioni veloci', 'Il mondo si muove più in fretta a fine turno')}
        ${toggle('cosmetics', 'Accessori visibili in partita', 'Toglili se preferisci un campo più pulito')}
        <div class="set-row"><span><b>Guida</b><small>Rivedi le regole quando vuoi</small></span><button class="btn small" data-act="help">Come si gioca</button></div>
      </section>
      <section><h3>💾 Dati</h3>
        <div class="set-row"><span><b>Compendio</b><small>Rimette in ombra animali e oggetti già scoperti</small></span><button class="btn small" data-act="reset-seen">Azzera</button></div>
        <div class="set-row"><span><b>Statistiche e record</b><small>Cancella la carriera; gli acquisti restano</small></span><button class="btn small danger-btn" data-act="reset-stats">Azzera</button></div>
      </section>
      <section class="credits"><h3>🏆 Riconoscimenti</h3>
        <p class="cr-main">Ideazione, game design e sviluppo<br><b>Mr. Null</b></p>
        <p>Grafica, musica ed effetti sonori disegnati e generati dal codice: nessuna immagine o file audio esterno.</p>
        <p>Carattere: Fredoka (Google Fonts) · Fatto con HTML, CSS e JavaScript.</p>
        <p class="muted">Piggy · versione ${VERSION} · Grazie per aver giocato! 🐷</p>
      </section>
    </div>`, { cls: 'wide', key: 'settings' });
}
const VERSION = '1.3';

function startRun() {
  store(SAVE, null);
  store(LASTPIG, pickPig);
  const seed = pickMode === 'daily' ? dailySeed() : (Math.random() * 2 ** 31) | 0;
  run = E.newRun(seed, pickMode, pickPig, pickMode === 'daily' ? E.dailyRules(seed) : [], pickVariant);
  run.look = lookOf(pickPig);
  undo = []; renderedDay = -1; handUids = new Set();
  save();
  showGame();
  dayBanner();
  if (!load(HELP)) { store(HELP, 1); showHelp(); }
}

function resume() {
  run = load(SAVE);
  if (!run || run.v !== 2) return showTitle();
  undo = []; renderedDay = -1; handUids = new Set();
  showGame();
  if (run.screen === 'reward') showReward();
  else if (run.screen === 'shop') showShop();
  else if (run.screen === 'over') showGameOver();
}

// =====================================================================
// Schermata di gioco
// =====================================================================
function showGame() {
  app.innerHTML = `<div class="game ${run && run.variant === 'relax' ? 'is-relax' : ''}">
    <header class="hud">
      <div class="hud-left">
        <div class="vitals">
          <span class="vital v-heart" title="Cuori: se manchi gli obiettivi di una giornata ne perdi uno"><b id="v-hearts"></b>${use('heart')}</span>
          <span class="vital v-acorn" title="Ghiande: la moneta del Mercato"><b id="v-acorns"></b>${use('acorn')}</span>
          <span class="vital v-market" id="v-market">${use('market')}<b id="v-mk"></b></span>
        </div>
        <div class="dayinfo"><b id="v-day"></b><small id="v-variant"></small></div>
      </div>
      <div class="turnbig" id="turnbig"></div>
      <div class="hud-right">
        <button class="hbtn" data-act="diary" title="Diario: mazzo, carte, ciondoli, avversari">${ICONS.diary}<span>Diario</span></button>
        <button class="hbtn" data-act="stats" title="Statistiche">${ICONS.stats}<span>Statistiche</span></button>
        <div class="menu-wrap">
          <button class="hbtn" data-act="menu" title="Menu">${ICONS.menu}<span>Menu</span></button>
          <div class="dropdown" id="dropdown" hidden>
            <button data-act="help">❔ Come si gioca</button>
            <button data-act="deckview">🃏 Il mio mazzo</button>
            <button data-act="settings">⚙️ Impostazioni</button>
            <button data-act="title">🏠 Menu principale <small>la partita resta salvata</small></button>
            <button class="danger" data-act="abandon">🏳️ Abbandona la partita</button>
          </div>
        </div>
      </div>
    </header>
    <section class="field">
      <aside class="side">
        <div class="panel pig-panel" id="pig-panel"></div>
        <div class="panel relax-panel" id="relax-panel" hidden></div>
        <div class="panel goals-panel"><div class="p-title">Obiettivi</div><div class="goals" id="goals"></div></div>
        <div class="panel rules-panel" id="rules-panel" hidden></div>
        <div class="panel relic-panel" id="relics"></div>
      </aside>
      <div class="board-wrap">
        <div class="board" id="board">
          <div class="tiles" id="tiles"></div>
          <div class="ents" id="ents"></div>
          <div class="fx" id="fx"></div>
          <div class="rainfx" id="rainfx"></div>
          <div class="banner" id="banner"></div>
          <div class="hint" id="hint" hidden></div>

        </div>
      </div>
    </section>
    <div class="dayend" id="dayend" hidden></div>
    <div class="peekbar" id="peekbar" hidden></div>
    <footer class="tray">
      <div class="orb" id="orb" title="Energia: muoversi costa 1, le carte costano quanto indicato">
        <svg viewBox="0 0 100 100" class="orb-svg">
          <defs><clipPath id="orb-clip"><circle cx="50" cy="50" r="42"/></clipPath>
            <linearGradient id="orb-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#f3a20c"/></linearGradient></defs>
          <circle cx="50" cy="50" r="46" fill="#fff6dc" stroke="#d48b00" stroke-width="4"/>
          <g clip-path="url(#orb-clip)"><g class="liq" id="orb-liq">
            <path class="wave w2" d="M-100 6 Q-87.5 0 -75 6 T-50 6 T-25 6 T0 6 T25 6 T50 6 T75 6 T100 6 T125 6 T150 6 T175 6 T200 6 V200 H-100Z" fill="#ffd34d" opacity=".6"/>
            <path class="wave w1" d="M-100 9 Q-87.5 3 -75 9 T-50 9 T-25 9 T0 9 T25 9 T50 9 T75 9 T100 9 T125 9 T150 9 T175 9 T200 9 V200 H-100Z" fill="url(#orb-grad)"/>
          </g></g>
          <ellipse cx="36" cy="28" rx="10" ry="6" fill="#fff" opacity=".45" transform="rotate(-25 36 28)"/>
        </svg>
        <div class="orb-num"><b id="orb-n"></b><small id="orb-m"></small></div>
        <span class="passi" id="passi" hidden></span>
      </div>
      <button class="pile p-draw" id="pile-draw" data-act="pile" data-k="draw" title="Mazzo di pesca: clic per vedere le carte"><i></i><i></i><i></i><span class="count" id="n-draw"></span><small>Mazzo</small></button>
      <div class="hand" id="hand"></div>
      <button class="pile p-discard" id="pile-discard" data-act="pile" data-k="discard" title="Pila degli scarti: clic per vedere le carte"><i></i><i></i><i></i><span class="count" id="n-discard"></span><small>Scarti</small></button>
      <div class="actions" id="actions"></div>
    </footer>
  </div>`;
  const tiles = $('#tiles');
  tiles.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) onTile(+t.dataset.i); });
  const armTip = (e) => {
    clearTimeout(tileTimer); hideTip();
    const t = e.target.closest('.tile');
    if (t) tileTimer = setTimeout(() => { if (t.isConnected) showTip(t, tileInfo(+t.dataset.i)); }, 2000);
  };
  tiles.addEventListener('mousemove', armTip);
  tiles.addEventListener('mouseleave', () => { clearTimeout(tileTimer); hideTip(); });
  // su telefono: tieni premuto su una casella per leggerne la descrizione
  let press = null;
  tiles.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    const t = e.target.closest('.tile');
    if (!t) return;
    press = { t, timer: setTimeout(() => { press.long = true; showTip(t, tileInfo(+t.dataset.i)); }, 450), long: false };
  });
  const endPress = () => { if (press) clearTimeout(press.timer); };
  tiles.addEventListener('pointerup', endPress);
  tiles.addEventListener('pointercancel', endPress);
  tiles.addEventListener('click', (e) => { if (press && press.long) { e.stopImmediatePropagation(); press = null; } }, true);
  tiles.addEventListener('contextmenu', (e) => {
    const t = e.target.closest('.tile');
    if (!t) return;
    e.preventDefault(); clearTimeout(tileTimer); showTip(t, tileInfo(+t.dataset.i));
  });
  $('#hand').addEventListener('mouseover', (e) => { const c = e.target.closest('.card'); if (c) showTip(c, cardInfo(+c.dataset.card), 'up'); });
  $('#hand').addEventListener('mouseleave', hideTip);
  $('#relics').addEventListener('mouseover', (e) => { const r = e.target.closest('.relic'); if (r) showTip(r, relicInfo(r.dataset.id), 'right'); });
  $('#relics').addEventListener('mouseleave', hideTip);
  render();
}

function render() {
  if (!run || !$('#tiles')) return;
  const D = run.D;
  if (renderedDay !== run.day) { $('#ents').innerHTML = ''; lastPig = null; renderedDay = run.day; handUids = new Set(); }
  hideTip();
  renderHud(D); renderSide(); renderBoard(D); renderEnts(D); renderTray(D); renderDayEnd(); renderHint();
  noteSeen(D);
}

function goalHTML(kind, v, g, extra = '') {
  const pct = Math.min(100, (v / g) * 100), done = v >= g;
  const icon = { mele: 'apple', fango: 'mud', pancia: 'belly' }[kind];
  const label = { mele: 'Mele', fango: 'Fango', pancia: 'Pancia' }[kind];
  return `<div class="goal g-${kind} ${done ? 'done' : ''}" title="${label}: ${v} su ${g}${kind === 'pancia' ? '. Ogni mela +1, ogni rotolata −2, a fine turno −1.' : ''}">
    ${use(icon)}<div class="g-body"><div class="g-top"><span>${label}</span><span class="num"><b>${v}</b>/${g}${extra}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div></div>${done ? '<span class="tick">✓</span>' : ''}</div>`;
}

function renderHud(D) {
  $('#v-hearts').textContent = run.hearts;
  $('#v-acorns').textContent = run.ghiande;
  const toMarket = 3 - (run.day % 3);
  $('#v-mk').textContent = toMarket;
  $('#v-market').title = toMarket === 1 ? 'Mercato: arriva alla fine di questa giornata. Spendi lì le ghiande.'
    : `Mercato: arriva fra ${toMarket} giornate (compresa questa). Spendi lì le ghiande.`;
  $('#v-market').classList.toggle('soon', toMarket === 1);
  $('#v-day').textContent = `Giorno ${run.day + 1}`;
  $('#v-variant').textContent = relax() ? '🌿 Relax' : run.mode === 'daily' ? '📅 Sfida' : '⚔️ Roguelike';
  $('.v-acorn').hidden = relax(); $('#v-market').hidden = relax();
  if (relax()) {
    const steps = E.relaxSteps(run);
    $('#turnbig').innerHTML = `<div class="tb-main"><small>Turno</small><b>${D.turn}</b></div>
      <div class="tb-steps" title="Passi rimasti in questo turno: dopo l'ultimo, il mondo si muove">${Array.from({ length: steps }, (_, i) => `<i class="${i < D.steps ? 'on' : ''}"></i>`).join('')}<span>${D.steps} ${D.steps === 1 ? 'passo' : 'passi'}</span></div>`;
  } else {
    $('#turnbig').innerHTML = `<div class="tb-main"><small>Turno</small><b>${D.turn}</b><em>/${D.turns}</em></div>
      <div class="sundots">${Array.from({ length: D.turns }, (_, i) => `<i class="${i + 1 < D.turn ? 'done' : i + 1 === D.turn ? 'now' : ''}"></i>`).join('')}</div>`;
  }
  const g = D.goals;
  $('#goals').innerHTML = (g.mele ? goalHTML('mele', D.mele, g.mele) : '') + (g.fango ? goalHTML('fango', D.fango, g.fango) : '')
    + (g.pancia ? goalHTML('pancia', D.pancia, g.pancia, ` <small>max ${E.panciaMax(run)}</small>`) : '');
}

function renderSide() {
  const P = PIGS[run.pig], pw = powerOf(run.pig, run.variant);
  $('#pig-panel').innerHTML = `<div class="pp-art">${pigSVG(run.pig, run.look || {})}</div>
    <div class="pp-txt"><b>${P.name}</b><span class="pp-power">✦ ${pw.name}</span><small>${pw.desc}</small></div>`;
  $('#relics').hidden = relax();
  const rp = $('#rules-panel');
  rp.hidden = !(run.rules && run.rules.length);
  if (!rp.hidden) rp.innerHTML = `<div class="p-title">Sfida del giorno</div><div class="rules mini">${run.rules.map(ruleHTML).join('')}</div>`;
  $('#relics').innerHTML = `<div class="p-title">Ciondoli <small>${run.relics.length}</small></div>
    <div class="relics">${run.relics.map((id) => `<button class="relic" data-act="relic" data-id="${id}" aria-label="${esc(RELICS[id].name)}"><span>${RELICS[id].icon}</span><small>${RELICS[id].name}</small></button>`).join('') || '<span class="quiet">Nessuno, per ora. Si ottengono come ricompensa o al Mercato.</span>'}</div>`;
}

const ZONE_CLASS = { farmer: 'z-farmer', blind: 'z-blind', goose: 'z-goose', dog: 'z-dog', bull: 'z-bull' };

function renderBoard(D) {
  const board = $('#board');
  board.style.setProperty('--w', D.w);
  const zones = E.dangerZones(run);
  const active = canAct();
  const reach = new Map(active && !targeting ? E.moveOptions(run).map((p) => [p.y * D.w + p.x, p]) : []);
  const tset = new Set(targeting ? targeting.targets.map((p) => p.y * D.w + p.x) : []);
  const evs = new Map(D.events.map((e) => [e.y * D.w + e.x, e.k]));
  const crowed = new Set(E.liveFoes(D, ['crow']).filter((c) => c.target).map((c) => c.y * D.w + c.x));
  let html = '';
  D.grid.forEach((c, i) => {
    const x = i % D.w, y = (i / D.w) | 0;
    let cls = `tile ${(x + y) % 2 ? 'g1' : 'g0'} t-${c.t}`, inner = '';
    const ev = evs.get(i);
    if (c.t === 'grass' && !c.item && !ev) {
      if (c.deco === 0) inner += `<svg class="deco"><use href="#s-flower"/></svg>`;
      else if (c.deco === 1) inner += `<svg class="deco tuft"><use href="#s-tuft"/></svg>`;
    }
    if (c.t === 'mud') inner += `<div class="puddle d${c.d}"><i></i><i></i></div><span class="depth">${c.d}</span>`;
    if (c.t === 'tree' || c.t === 'rock' || c.t === 'bush') inner += `<svg class="obj"><use href="#s-${c.t}"/></svg>`;
    if (c.item) inner += `<svg class="item it-${c.item}"><use href="#s-${c.item}"/></svg>`;
    if (D.gas[i]) inner += `<div class="gas-cloud"><svg><use href="#s-gas"/></svg><span>${D.gas[i]}</span></div>`;
    if (ev) inner += `<svg class="ev ev-${ev}"><use href="#s-${ev}"/></svg>`;
    const z = zones.get(i);
    if (z) cls += ' zone ' + ZONE_CLASS[z];
    if (crowed.has(i)) cls += ' crowed';
    if (ev === 'bolt') cls += ' bolted';
    if (reach.has(i)) cls += reach.get(i).bump != null ? ' reach bumpable' : ' reach';
    if (tset.has(i)) cls += ' target';
    html += `<div class="${cls}" data-i="${i}">${inner}</div>`;
  });
  $('#tiles').innerHTML = html;
  board.classList.toggle('targeting', !!targeting);
}

function place(el, x, y) { const w = run.D.w; el.style.left = (x * 100 / w) + '%'; el.style.top = (y * 100 / H) + '%'; }

const VIEWBOX = { farmer: '0 0 64 72', crow: '0 0 50 50', bull: '0 0 68 58', goose: '0 0 52 58', dog: '0 0 64 58' };

function renderEnts(D) {
  const ents = $('#ents');
  let pig = $('#pig');
  if (!pig) {
    ents.insertAdjacentHTML('beforeend', `<div class="ent pig" id="pig"><div class="pig-inner"><div class="pig-fx">${pigSVG(run.pig, gameLook())}</div></div></div>`);
    pig = $('#pig');
  }
  place(pig, D.pig.x, D.pig.y);
  if (lastPig && (lastPig.x !== D.pig.x || lastPig.y !== D.pig.y)) restartClass(pig, 'hop');
  lastPig = { ...D.pig };
  $('.pig-inner', pig).classList.toggle('flip', D.face < 0);
  const goal = D.goals.fango || 8;
  const dirt = D.fango <= 0 ? 0 : D.fango / goal < 0.34 ? 1 : D.fango / goal < 0.75 ? 2 : 3;
  pig.className = pig.className.replace(/\bdirt-\d\b/g, '').trim() + ` dirt-${dirt}`;
  pig.classList.toggle('stuffed', D.belly && D.pancia >= E.panciaMax(run));
  pig.classList.toggle('disguised', D.disguise);
  pig.classList.toggle('shielded', D.shield > 0);
  pig.classList.toggle('immune', relax() && D.immune > 0);

  const alive = new Set();
  for (const f of D.foes) {
    let el = ents.querySelector(`[data-foe="${f.id}"]`);
    const visible = !f.gone && f.x >= 0;
    if (!el) {
      if (!visible) continue;
      ents.insertAdjacentHTML('beforeend', `<div class="ent foe f-${f.k}" data-foe="${f.id}"><div class="f-inner"><svg viewBox="${VIEWBOX[f.k]}"><use href="#s-${f.k}"/></svg></div><span class="f-dir"></span><span class="hp"></span></div>`);
      el = ents.querySelector(`[data-foe="${f.id}"]`);
    }
    alive.add(String(f.id));
    if (f.gone) { if (!el.classList.contains('gone')) { el.classList.add('gone'); setTimeout(() => el.remove(), 700); } continue; }
    el.classList.toggle('away', !visible);
    if (!visible) continue;
    place(el, f.x, f.y);
    el.dataset.dir = f.dir;
    const faceLeft = f.k === 'farmer' || f.k === 'bull' ? f.dir === 2 : f.k === 'dog' ? D.pig.x < f.x : false;
    el.classList.toggle('flip', faceLeft);
    el.classList.toggle('frozen', f.k === 'farmer' && D.freeze);
    el.classList.toggle('blind', f.k === 'farmer' && D.hide);
    const max = E.HP[f.k];
    $('.hp', el).innerHTML = relax()
      ? (f.k === 'crow' && f.target ? `<span class="timer" title="Turni prima che mangi la mela">${f.timer}</span>` : f.rest > 0 ? '<span class="zzz">z</span>' : '')
      : max && f.k !== 'crow' ? Array.from({ length: max }, (_, i) => `<i class="${i < f.hp ? 'on' : ''}"></i>`).join('') : '';
  }
  $$('.foe', ents).forEach((el) => { if (!alive.has(el.dataset.foe)) el.remove(); });
}

function cardHTML(card, i, opts = {}) {
  const def = CARDS[card.id], type = TYPES[def.type];
  const cost = opts.cost ?? def.cost;
  return `<button class="card r-${def.rarity} ${opts.off ? 'off' : ''} ${opts.sel ? 'sel' : ''}" ${i == null ? '' : `data-card="${i}"`} ${card.uid ? `data-uid="${card.uid}"` : ''} ${opts.act ? `data-act="${opts.act}"` : ''} style="--tc:${type.color}">
    <span class="c-band">${type.name}</span>
    <span class="cost ${cost < def.cost ? 'cheap' : ''}">${cost}</span>
    ${opts.key ? `<span class="key">${opts.key}</span>` : ''}
    <span class="art">${def.icon}</span>
    <b class="c-name">${def.name}</b>
    <small class="c-desc">${def.desc}</small>
    ${def.exhaust ? '<span class="exh">si consuma</span>' : ''}
  </button>`;
}

function renderTray(D) {
  $('.tray').classList.toggle('relax', relax());
  const rp = $('#relax-panel');
  rp.hidden = !relax();
  if (relax()) {
    // in Relax niente vassoio: spiegazione e «Aspetta» stanno a sinistra del campo
    rp.innerHTML = `<div class="p-title">Il tuo turno</div>
      <p class="info-txt">Hai <b>${E.relaxSteps(run)} passi</b>: dopo l'ultimo, contadini, cani e corvi fanno la loro mossa. Non finire il turno nelle zone colorate!</p>
      <button class="btn primary end" data-act="wait" ${canAct() ? '' : 'disabled'} title="Rinunci ai passi rimasti e il mondo si muove">⏳ Aspetta<small>Spazio</small></button>`;
    return;
  }
  const max = Math.max(run.stats.energia, 1);
  const pct = Math.max(0, Math.min(1, D.energy / max));
  $('#orb-liq').style.transform = `translateY(${(1 - pct) * 92}px)`;
  $('#orb-n').textContent = D.energy;
  $('#orb-m').textContent = '/' + run.stats.energia;
  $('#orb').classList.toggle('empty', D.energy <= 0);
  const ps = $('#passi');
  ps.hidden = !D.passi;
  ps.innerHTML = `${use('step')}+${D.passi} <small>passi</small>`;
  $('#n-draw').textContent = D.draw.length;
  $('#n-discard').textContent = D.discard.length;
  $('#pile-draw').classList.toggle('empty', !D.draw.length);
  $('#pile-discard').classList.toggle('empty', !D.discard.length);

  const active = canAct();
  $('#hand').innerHTML = D.hand.length
    ? D.hand.map((c, i) => cardHTML(c, i, { off: !active || !E.canPlay(run, i), sel: targeting && targeting.i === i, key: i < 9 ? i + 1 : '', cost: E.cardCost(run, c) })).join('')
    : `<div class="hand-empty">${busy ? '' : 'Niente carte in mano'}</div>`;
  // le carte nuove arrivano volando dal mazzo
  const from = $('#pile-draw').getBoundingClientRect();
  let k = 0;
  $$('#hand .card').forEach((el) => {
    if (handUids.has(el.dataset.uid)) return;
    const r = el.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (r.left + r.width / 2), dy = from.top + from.height / 2 - (r.top + r.height / 2);
    el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(.35) rotate(-14deg)`, opacity: 0.2 }, { transform: 'none', opacity: 1 }],
      { duration: 420, delay: k * 90, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' });
    setTimeout(() => A.sfx('draw'), k++ * 90);
  });
  handUids = new Set(D.hand.map((c) => String(c.uid)));

  $('#actions').innerHTML = `
    <button class="btn small" data-act="undo" ${undo.length && active ? '' : 'disabled'} title="Annulla l'ultima mossa (Z)">${ICONS.undo}Annulla</button>
    <button class="btn primary end" data-act="end" ${active ? '' : 'disabled'}>Fine turno<small>Invio</small></button>`;
}

function renderDayEnd() {
  const box = $('#dayend');
  const r = run.result;
  const bar = $('#peekbar');
  if (run.screen !== 'result' || !r) { box.hidden = true; bar.hidden = true; peek = false; return; }
  box.hidden = peek; bar.hidden = !peek;
  bar.innerHTML = `<span>${r.ok ? 'Giornata completata' : 'Giornata fallita'} · così era il campo alla fine</span>
    <button class="btn small" data-act="unpeek">Riepilogo</button>
    <button class="btn small primary" data-act="proceed">${r.ok && !relax() ? 'Ricompensa' : 'Avanti'}</button>`;
  const row = (k, v, g) => g ? `<div class="r-goal ${v >= g ? 'ok' : 'ko'}">${use({ mele: 'apple', fango: 'mud', pancia: 'belly' }[k])}<b>${v}</b><span>/${g}</span><em>${v >= g ? '✓' : '✗'}</em></div>` : '';
  box.innerHTML = `<div class="de-card ${r.ok ? 'win' : 'lose'}">
    <div class="de-pig ${r.ok ? 'happy' : 'sad'}">${pigSVG(run.pig, run.look || {})}</div>
    <h2>${r.ok ? 'Giornata completata!' : 'Giornata fallita…'}</h2>
    <div class="r-goals">${row('mele', r.mele, r.goals.mele)}${row('fango', r.fango, r.goals.fango)}${row('pancia', r.pancia, r.goals.pancia)}</div>
    ${relax() ? `<p class="lose-txt">Vite rimaste: <b>${run.hearts}</b>. Domani la fattoria si fa un po' più movimentata.</p>`
      : r.ok ? `<div class="srows">${r.parts.map(([k, v]) => `<div class="srow"><span>${k}</span><b>+${v} ${use('acorn')}</b></div>`).join('')}</div>`
      : `<p class="lose-txt">Perdi un cuore: ne restano <b>${run.hearts}</b>.</p>`}
    <div class="de-btns"><button class="btn ghost" data-act="peek" title="Nascondi il riepilogo e guarda com'era il campo">👀 Guarda il campo</button>
    <button class="btn primary big" data-act="proceed">${relax() ? 'Giornata successiva' : r.ok ? 'Scegli la ricompensa' : (E.isMarketDay(run.day) ? 'Vai al Mercato' : 'Giornata successiva')}</button></div>
  </div>`;
}

// ---------- riquadri a comparsa e suggerimento sul campo ----------
function renderHint() {
  const h = $('#hint'), D = run.D;
  let t = '';
  if (targeting) t = `<b>${CARDS[D.hand[targeting.i].id].name}</b>: ${targetHint(CARDS[D.hand[targeting.i].id].target)} <span>Esc o clic sulla carta per annullare</span>`;
  else if (canAct() && !relax() && D.energy + D.passi <= 0 && hintOff !== `${run.day}-${D.turn}`) t = 'Energia finita: gioca le carte da 0 o premi <b>Fine turno</b>. <button class="hint-ok" data-act="hintok">OK</button>';
  h.hidden = !t;
  h.classList.toggle('has-btn', t.includes('hint-ok'));
  h.innerHTML = t;
}
function tipEl() {
  let t = $('#tip');
  if (!t) { t = document.createElement('div'); t.id = 'tip'; t.setAttribute('role', 'tooltip'); document.body.appendChild(t); }
  return t;
}
// Mostra il riquadro accanto all'elemento: sopra se c'è spazio, altrimenti sotto (o a destra).
function showTip(el, html, side = 'auto') {
  const t = tipEl();
  t.innerHTML = html;
  t.classList.add('show');
  const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight, pad = 10;
  let x, y;
  if (side === 'right') { x = r.right + pad; y = r.top + r.height / 2 - h / 2; }
  else {
    x = r.left + r.width / 2 - w / 2;
    y = side === 'up' || r.top - h - pad > 8 ? r.top - h - pad : r.bottom + pad;
  }
  x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
  y = Math.max(8, Math.min(window.innerHeight - h - 8, y));
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTip() { const t = $('#tip'); if (t) t.classList.remove('show'); }
function relicInfo(id) {
  const r = RELICS[id];
  return `<div class="ii"><span class="ii-art emoji">${r.icon}</span><div><b>${r.name}</b><span>${r.desc}</span></div></div>`;
}
const targetHint = (t) => ({ tree: 'scegli un melo vicino.', grass: 'scegli un prato libero accanto a te.', jump: 'scegli dove atterrare.', jump3: 'scegli dove atterrare.',
  dir: 'scegli la direzione.', dirAny: 'scegli la direzione.', mud: 'scegli la pozza.', foeAdj: 'scegli l\'animale.', foeRange: 'scegli l\'animale.', fly: 'scegli dove volare.' }[t]);

function tileInfo(i) {
  const D = run.D, c = D.grid[i], x = i % D.w, y = (i / D.w) | 0, rows = [];
  const add = (art, name, txt) => rows.push(`<div class="ii">${art ? `<span class="ii-art">${art}</span>` : ''}<div><b>${name}</b><span>${txt}</span></div></div>`);
  if (D.pig.x === x && D.pig.y === y) add(`<span class="ii-pig">${pigSVG(run.pig)}</span>`, PIGS[run.pig].name, 'Sei qui.');
  for (const f of E.liveFoes(D)) if (f.x === x && f.y === y) {
    const e = entryOf(f.k);
    if (relax()) add(artOf(f.k), e.name + (f.rest > 0 ? ' <small>riposa</small>' : f.k === 'crow' ? ` <small>mangia fra ${f.timer}</small>` : ''), e.relax || e.desc);
    else add(artOf(f.k), e.name + (E.HP[f.k] && f.k !== 'crow' ? ` <small>${f.hp}/${E.HP[f.k]} ♥</small>` : ''),
      e.desc + (f.k !== 'farmer' && f.k !== 'crow' ? ' Spingilo muovendoti contro di lui.' : ''));
  }
  const ev = D.events.find((e) => e.x === x && e.y === y);
  if (ev) { const e = entryOf(ev.k); add(artOf(ev.k), e.name, relax() && e.relax ? e.relax : e.desc); }
  if (D.gas[i]) add(artOf('gas'), 'Nube di gas', `${entryOf('gas').desc} Dura ancora ${D.gas[i]} turn${D.gas[i] > 1 ? 'i' : 'o'}.`);
  if (c.item) { const e = entryOf(c.item); add(artOf(c.item), e.name, e.desc); }
  if (c.t === 'mud') add(artOf('mud'), `Pozza profonda ${c.d}`, `Rotolandoti ora prendi <b>${c.d + D.flags.rolls + D.flags.chainBonus}</b> fango${D.flags.rolls ? ` (catena +${D.flags.rolls})` : ''}.`);
  else if (c.t !== 'grass') { const e = entryOf(c.t); add(artOf(c.t), e.name, e.desc); }
  const z = E.dangerZones(run).get(i);
  const zt = relax() ? { farmer: 'Zona del contadino: se il turno finisce con te qui, −1 vita!', blind: 'Il contadino guarda qui, ma per ora si riposa.', dog: 'Accanto al cane: se il turno finisce con te qui, −1 vita!' }[z] : { farmer: 'Il contadino guarda qui: se finisci il turno qui, secchiata!', blind: 'Il contadino guarda qui, ma in questo turno non ti vede.',
    goose: 'Zona dell\'oca: se finisci il turno qui, beccata!', dog: 'Accanto al cane: se finisci il turno qui, abbaia.', bull: 'Strada del toro: se finisci il turno qui, incornata!' }[z];
  if (zt) rows.push(`<p class="zone-warn z-${z}">${zt}</p>`);
  if (!rows.length) add('', 'Prato', 'Niente di speciale.');
  return rows.join('');
}
function cardInfo(i) {
  const card = run.D.hand[i];
  if (!card) return '';
  const def = CARDS[card.id], why = E.cantPlay(run, i);
  return `<div class="ii"><span class="ii-art emoji">${def.icon}</span><div><b>${def.name}</b><span>${def.desc}${def.exhaust ? ' Si consuma: torna nel mazzo il giorno dopo.' : ''}</span></div></div>
    <p class="info-txt muted">Costo ${E.cardCost(run, card)} · ${TYPES[def.type].name}</p>${why && run.screen === 'day' ? `<p class="zone-warn">${why}</p>` : ''}`;
}

// Ciò che si vede sul campo entra nel compendio.
function noteSeen(D) {
  const found = [];
  const add = (k) => { if (k && !seen.has(k)) { seen.add(k); found.push(k); } };
  E.liveFoes(D).forEach((f) => add(f.k));
  D.grid.forEach((c) => { add(c.item); if (c.t !== 'grass') add(c.t); });
  D.events.forEach((e) => add(e.k));
  if (Object.keys(D.gas).length) add('gas');
  if (!found.length) return;
  store(SEEN, [...seen]);
  const named = found.map((k) => entryOf(k)).filter((e) => e && !['apple', 'mud', 'tree', 'rock', 'bush'].includes(e.id));
  if (named.length) toast(`Nuovo nel diario: ${named.map((e) => e.name).join(', ')}`);
}

// =====================================================================
// Comandi
// =====================================================================
function pushUndo() { undo.push(JSON.stringify(run)); if (undo.length > 40) undo.shift(); }
function canAct() { return !!run && run.screen === 'day' && !busy && !run.D.won; }

function onTile(i) {
  if (!canAct()) return;
  const D = run.D, x = i % D.w, y = (i / D.w) | 0;
  if (targeting) {
    if (targeting.targets.some((p) => p.x === x && p.y === y)) {
      const idx = targeting.i; targeting = null;
      doCard(idx, { x, y });
    }
    return;
  }
  doMove(x, y);
}

function doMove(x, y) {
  if (!canAct()) return;
  if (relax()) {
    const ev = E.relaxMove(run, x, y);
    if (!ev) { const t = tileEl(x, y); if (t) showTip(t, tileInfo(y * run.D.w + x)); return; }
    A.sfx('step');
    afterRelax(ev);
    return;
  }
  pushUndo();
  const ev = E.move(run, x, y);
  if (!ev) { undo.pop(); const t = tileEl(x, y); if (t) showTip(t, tileInfo(y * run.D.w + x)); return; }
  A.sfx('step');
  after(ev);
}

function onCard(i) {
  if (!canAct()) return;
  if (targeting && targeting.i === i) { targeting = null; render(); return; }
  if (E.cantPlay(run, i)) { const c = $(`#hand [data-card="${i}"]`); restartClass(c, 'nope'); if (c) showTip(c, cardInfo(i), 'up'); return; }
  const targets = E.cardTargets(run, run.D.hand[i]);
  if (targets) { targeting = { i, targets }; render(); return; }
  doCard(i);
}

function doCard(i, target) {
  const el = $(`#hand [data-card="${i}"]`);
  const rect = el && el.getBoundingClientRect(), html = el && el.outerHTML;
  pushUndo();
  const ev = E.playCard(run, i, target);
  if (!ev) { undo.pop(); render(); return; }
  handUids.delete(String(ev[0].uid));
  after(ev);
  if (rect) flyCard(html, rect, ev[0].exhaust);
}

function after(ev) {
  render(); playEvents(ev); save();
  if (run.D.won) setTimeout(() => finishDay(), 900);
}
// In Relax il mondo risponde subito dopo il terzo passo: niente annulla, e se le vite finiscono la corsa termina.
function afterRelax(ev) {
  if (ev.some((e) => e.type === 'tick')) { A.sfx('turn'); }
  render(); playEvents(ev); save();
  if (run.screen === 'over') { busy = true; setTimeout(() => { busy = false; showGameOver(); }, 1300); return; }
  if (run.D.won) setTimeout(() => finishDay(), 900);
}
function relaxWait() {
  if (!canAct() || !relax()) return;
  afterRelax(E.relaxWait(run));
}

function doUndo() {
  if (!canAct() || !undo.length) return;
  run = JSON.parse(undo.pop()); targeting = null; lastPig = null;
  handUids = new Set(run.D.hand.map((c) => String(c.uid)));
  render(); save();
}

async function endTurn() {
  if (!canAct()) return;
  busy = true; targeting = null; undo = [];
  const flying = $$('#hand .card').map((el) => [el.outerHTML, el.getBoundingClientRect()]);
  render();
  for (const step of E.END_STEPS) {
    const ev = step(run);
    render();
    const pace = A.settings.fast ? 0.45 : 1;
    if (step.name === 'discard') { flying.forEach(([h, r], k) => setTimeout(() => flyCard(h, r, false), k * 60)); await sleep(320 * pace); }
    if (ev.length) { playEvents(ev); await sleep(620 * pace); }
    if (run.D.won) break;
  }
  busy = false;
  if (run.D.won) { render(); save(); setTimeout(() => finishDay(), 500); return; }
  E.finishTurn(run);
  render(); save();
  if (run.D.dayOver) finishDay();
  else { banner(`Turno ${run.D.turn}`, 'small'); A.sfx('turn'); }
}

function finishDay() {
  if (run.screen !== 'day') return;
  targeting = null; undo = [];
  E.endDay(run);
  A.sfx(run.result.ok ? 'win' : 'lose');
  save();
  render();
  if (run.screen === 'over') showGameOver();
}

// =====================================================================
// Effetti
// =====================================================================
function restartClass(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function tileEl(x, y) { return $(`#tiles .tile[data-i="${y * run.D.w + x}"]`); }
function foeEl(id) { return $(`[data-foe="${id}"]`); }

function flyCard(html, from, exhaust) {
  const to = $('#pile-discard');
  if (!to) return;
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = html;
  Object.assign(el.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
  document.body.appendChild(el);
  const t = to.getBoundingClientRect();
  const dx = t.left + t.width / 2 - (from.left + from.width / 2), dy = t.top + t.height / 2 - (from.top + from.height / 2);
  const frames = exhaust
    ? [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-70px) scale(1.15) rotate(-6deg)', opacity: 0, filter: 'brightness(2) blur(3px)' }]
    : [{ transform: 'none' }, { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) rotate(10deg) scale(.85)`, offset: 0.45 },
       { transform: `translate(${dx}px, ${dy}px) rotate(22deg) scale(.42)`, opacity: 0.7 }];
  el.animate(frames, { duration: 540, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => {
    el.remove();
    if (!exhaust) restartClass(to, 'bump');
  };
}

function float(x, y, html, cls = '') {
  const fx = $('#fx'); if (!fx) return;
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.innerHTML = html;
  el.style.left = ((x + 0.5) * 100 / run.D.w) + '%';
  el.style.top = ((y + 0.2) * 100 / H) + '%';
  fx.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
function splash(x, y, color, n = 8) {
  const fx = $('#fx'); if (!fx) return;
  for (let k = 0; k < n; k++) {
    const p = document.createElement('i');
    p.className = 'drop';
    const a = (Math.PI * 2 * k) / n + Math.random() * 0.6, r = 26 + Math.random() * 22;
    p.style.left = ((x + 0.5) * 100 / run.D.w) + '%';
    p.style.top = ((y + 0.6) * 100 / H) + '%';
    p.style.background = color;
    p.style.setProperty('--dx', Math.cos(a) * r + 'px');
    p.style.setProperty('--dy', Math.sin(a) * r - 18 + 'px');
    fx.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}
const pigFx = (cls) => restartClass($('#pig .pig-fx'), cls);

function playEvents(ev) {
  let delay = 0;
  for (const e of ev) {
    setTimeout(() => playOne(e), delay);
    if (['eat', 'roll', 'drop', 'steal', 'hit', 'hurt'].includes(e.type)) delay += 130;
  }
}
function playOne(e) {
  if (!run || !$('#tiles')) return;
  const P = run.D.pig;
  switch (e.type) {
    case 'eat': float(e.x, e.y, `+${e.val} ${use(e.gold ? 'gold' : 'apple')}`, e.gold ? 'gold' : 'good'); pigFx('chomp'); A.sfx(e.gold ? 'gold' : 'eat'); break;
    case 'roll':
      float(e.x, e.y, `+${e.gain} ${use('mud')}${e.chain > 1 ? `<small>catena ×${e.chain}</small>` : ''}`, 'mud');
      splash(e.x, e.y, '#7a4a26', 10); pigFx('roll'); A.sfx('mud'); break;
    case 'item': float(e.x, e.y, `${use(e.icon)} ${esc(e.text)}`, 'gold'); pigFx('chomp'); A.sfx('coin'); break;
    case 'text': float(e.x, e.y, esc(e.text), e.cls || ''); break;
    case 'drop': case 'pop': restartClass(tileEl(e.x, e.y), 'bumpin'); A.sfx('pop'); break;
    case 'shake': restartClass(tileEl(e.x, e.y), 'wobble'); break;
    case 'steal': float(e.x, e.y, `−1 ${use('apple')}`, 'bad'); restartClass(foeEl(e.id), 'peck'); A.sfx('hit'); break;
    case 'flee': float(e.x, e.y, 'Sciò!', 'good'); A.sfx('whoosh'); break;
    case 'bump': pigFx('bump'); splash(e.x, e.y, '#fff3c4', 6); A.sfx('bump'); break;
    case 'hit': restartClass(foeEl(e.id), 'hurt'); float(e.x, e.y, `−${e.dmg} ♥`, 'warn'); A.sfx('hit'); break;
    case 'attack': restartClass(foeEl(e.id), 'lunge'); break;
    case 'hurt': setTimeout(() => { pigFx('wet'); A.sfx('hurt'); float(e.x, e.y, `${esc(e.text)}${e.sub ? `<small>${esc(e.sub)}</small>` : ''}`, 'bad'); }, 200); break;
    case 'bucket': restartClass(foeEl(e.id), 'throw'); setTimeout(() => { splash(e.x, e.y, '#5bc0eb', 14); A.sfx('splash'); }, 220); break;
    case 'dry': float(e.x, e.y, `${use('sun')} −1`, 'sun'); A.sfx('dry'); break;
    case 'rain': restartClass($('#rainfx'), 'on'); A.sfx('rain'); break;
    case 'bolt': restartClass($('#board'), 'flash'); splash(e.x, e.y, '#ffd34d', 10); A.sfx('thunder'); break;
    case 'goal': banner('Obiettivi raggiunti!', 'goal'); pigFx('happy'); A.sfx('win'); break;
    case 'grunt': pigFx('grunt'); float(P.x, P.y, 'GRUNF!', 'loud'); A.sfx('oink'); break;
    case 'burp': pigFx('grunt'); float(P.x, P.y, 'Burp!'); A.sfx('oink'); break;
    case 'gas': pigFx('grunt'); float(P.x, P.y, 'PRRRT!', 'loud gasf'); A.sfx('fart'); break;
    case 'cute': float(P.x, P.y, '🥺', 'loud'); break;
    case 'jump': pigFx('jump'); A.sfx('step'); break;
    case 'card': A.sfx('card'); break;
    case 'spin': pigFx('roll'); break;
  }
}

let bannerTimer = null;
function banner(text, cls = '') {
  const b = $('#banner'); if (!b) return;
  b.className = 'banner show ' + cls;
  b.innerHTML = text;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { b.className = 'banner'; }, cls === 'small' ? 900 : 1800);
}
function dayBanner() {
  const g = run.D.goals, parts = [];
  if (g.mele) parts.push(`${g.mele} mele`);
  if (g.fango) parts.push(`${g.fango} fango`);
  if (g.pancia) parts.push(`pancia ${g.pancia}`);
  banner(`Giorno ${run.day + 1}<small>${parts.join(' · ')}</small>`, 'day');
}
let toastTimer = null;
function toast(text) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = `${ICONS.diary}<span>${esc(text)}</span>`;
  restartClass(t, 'show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// =====================================================================
// Finestre
// =====================================================================
// Se una finestra è già aperta ne aggiorna il contenuto sul posto: niente lampeggio.
// key uguale = stessa vista (es. un acquisto): si conserva anche lo scorrimento.
let modalKey = null;
function openModal(html, { cls = '', closable = true, key = null } = {}) {
  hideTip();
  const cur = $('#modal');
  if (cur) {
    const box = $('.modal', cur), keep = key && key === modalKey ? box.scrollTop : 0;
    box.className = `modal ${cls} still`;
    box.innerHTML = `${closable ? `<button class="m-close" data-act="close" aria-label="Chiudi">${ICONS.close}</button>` : ''}${html}`;
    box.scrollTop = keep;
    cur.dataset.closable = closable ? '1' : '';
    modalKey = key;
    return;
  }
  modalKey = key;
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.id = 'modal';
  back.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${closable ? `<button class="m-close" data-act="close" aria-label="Chiudi">${ICONS.close}</button>` : ''}${html}</div>`;
  back.addEventListener('click', (e) => { if (e.target === back && back.dataset.closable) userClose(); });
  back.dataset.closable = closable ? '1' : '';
  document.body.appendChild(back);
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
// Chiusura chiesta dall'utente: a corsa finita si torna sempre al riepilogo.
function userClose() { closeModal(); if (run && run.screen === 'over') showGameOver(); }
const modalOpen = () => !!$('#modal');
function closeMenu() { const d = $('#dropdown'); if (d) d.hidden = true; }

function showHelp() {
  if (relax()) {
    openModal(`<h2>Come si gioca · Relax</h2>${relaxRulesHTML()}
      <div class="h-pc" style="margin-top:12px"><b>Comandi:</b> clic sulle caselle tratteggiate o frecce/WASD per muoverti · <kbd>Spazio</kbd> o «Aspetta» per lasciar passare il turno · tasto destro su una casella per sapere cosa c'è.</div>`, { cls: 'wide' });
    return;
  }
  const step = (icon, title, body) => `<div class="h-step"><span class="h-ico">${icon}</span><div><b>${title}</b><p>${body}</p></div></div>`;
  openModal(`<h2>Come si gioca</h2>
  <div class="help">
    <section><h3>🎯 Lo scopo</h3>
      ${step(use('apple'), 'Mele', 'Passa su una mela per mangiarla.')}
      ${step(use('mud'), 'Fango', 'Entra in una pozza per rotolarti. Più rotolate nello stesso turno fanno catena: ognuna vale +1.')}
      ${step(use('belly'), 'Pancia <small>(dal giorno 8)</small>', 'Ogni mela +1, ogni rotolata −2, a fine turno −1. A pancia piena non mangi.')}
      <p class="h-note">Ogni giornata chiede uno, due o tre obiettivi. <b>Appena li raggiungi, la giornata finisce</b> e scegli una ricompensa.</p>
    </section>
    <section><h3>🔁 Il turno</h3>
      ${step(use('bolt'), 'Energia', 'Muoversi di una casella costa 1. Le carte costano il numero nel cerchio giallo.')}
      ${step(use('step'), 'Passi gratis', 'Alcune carte danno passi: si spendono prima dell\'energia.')}
      ${step('🃏', 'Carte', 'Clicca una carta per giocarla. Se serve un bersaglio, le caselle valide si illuminano di giallo.')}
      ${step('⏭️', 'Fine turno', 'Le carte rimaste vanno negli scarti, il mondo si muove, peschi una mano nuova.')}
    </section>
    <section><h3>👀 Il mondo ti avvisa</h3>
      ${step('<span class="lg"></span>', 'Zone colorate', 'Rosso = contadino · arancio = cane · giallo = oca · viola = toro. Non finire il turno lì.')}
      ${step(use('drop'), 'Segnalini', 'Mela in caduta, sole, nuvola, arcobaleno, fulmine: accadono tutti a fine turno.')}
      ${step('💥', 'Spintoni', 'Muoviti contro un animale per colpirlo. Quando finisce i cuoricini, scappa.')}
    </section>
    <section><h3>🏆 La corsa</h3>
      ${step(use('heart'), 'Cuori', 'Se manchi gli obiettivi perdi un cuore. A zero, la corsa finisce.')}
      ${step(use('acorn'), 'Ghiande', 'Le guadagni chiudendo presto le giornate. Ogni 3 giorni si spendono al Mercato.')}
      ${step('📈', 'Difficoltà', 'Dal giorno 6 arrivano più animali e obiettivi più alti, e la mappa si allunga.')}
    </section>
    <section class="h-wide"><h3>🖱️ Comandi</h3>
      <div class="h-pc"><b>Consigliato: computer con mouse.</b> Clic sulle caselle tratteggiate per muoverti, clic su una carta per giocarla. Passa il mouse su caselle e carte: il pannello a sinistra del campo spiega tutto.</div>
      <div class="keys"><span><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> o <kbd>WASD</kbd> muoversi</span><span><kbd>1</kbd>–<kbd>9</kbd> carte</span><span><kbd>Invio</kbd> fine turno</span><span><kbd>Z</kbd> annulla</span><span><kbd>Esc</kbd> chiudi o annulla il bersaglio</span></div>
      <p class="h-note">Puoi <b>annullare</b> tutte le mosse del turno in corso: pensa con calma, qui non servono riflessi.</p>
    </section>
  </div>`, { cls: 'wide' });
}

function showDiary(tab) {
  if (tab) diaryTab = tab;
  if (!run && diaryTab === 'deck') diaryTab = 'cards';
  if (relax() && !['rules', 'foes'].includes(diaryTab)) diaryTab = 'rules';
  const tabs = relax() ? { rules: 'Regole Relax', foes: 'Avversari e oggetti' }
    : run ? { deck: 'Mazzo', cards: 'Libreria carte', relics: 'Ciondoli', foes: 'Avversari e oggetti' } : { cards: 'Libreria carte', relics: 'Ciondoli', foes: 'Avversari e oggetti' };
  const owned = {};
  (run ? run.deck : []).forEach((c) => { owned[c.id] = (owned[c.id] || 0) + 1; });
  let body = '';
  if (diaryTab === 'rules') body = relaxRulesHTML();
  else if (diaryTab === 'deck') {
    const D = run.D;
    const pile = (name, cards) => `<h3>${name} <small>${cards.length}</small></h3>${cards.length ? `<div class="deck-grid">${sortCards(cards).map((c) => cardHTML(c, null)).join('')}</div>` : '<p class="quiet">Vuoto.</p>'}`;
    body = `<p class="m-sub">${run.deck.length} carte in tutto; ne peschi ${E.handSize(run)} a ogni turno. Quando il mazzo finisce, gli scarti vengono rimescolati.</p>
      ${pile('Mazzo completo', run.deck)}${pile('Da pescare', D.draw)}${pile('Scarti', D.discard)}${D.exhaust.length ? pile('Consumate oggi', D.exhaust) : ''}`;
  } else if (diaryTab === 'cards') {
    const ids = Object.keys(CARDS).filter((id) => cardFilter === 'all' || CARDS[id].type === cardFilter);
    body = `<p class="m-sub">Tutte le ${Object.keys(CARDS).length} carte del gioco, divise per famiglia.</p>
      <div class="chips">${[['all', 'Tutte'], ...Object.entries(TYPES).map(([k, t]) => [k, t.name])].map(([k, n]) => `<button class="chipf ${cardFilter === k ? 'on' : ''}" data-act="cfilter" data-k="${k}" ${k !== 'all' ? `style="--tc:${TYPES[k].color}"` : ''}>${n}</button>`).join('')}</div>
      <div class="deck-grid lib">${ids.map((id) => `<div class="lib-card">${cardHTML({ id }, null)}<small>${RARITY_NAME[CARDS[id].rarity]}${CARDS[id].starter ? ' · iniziale' : ''}${owned[id] ? ` · <b>×${owned[id]} nel mazzo</b>` : ''}</small></div>`).join('')}</div>`;
  } else if (diaryTab === 'relics') {
    const mine = run ? run.relics : [];
    body = `<p class="m-sub">${run ? `${mine.length} di ${Object.keys(RELICS).length} in tuo possesso. ` : ''}I ciondoli valgono per tutta la corsa.</p>
      <div class="relic-lib">${Object.entries(RELICS).map(([id, r]) => `<div class="rl ${mine.includes(id) ? 'own' : ''}"><span>${r.icon}</span><div><b>${r.name}</b><small>${r.desc}</small></div>${mine.includes(id) ? '<em>tuo</em>' : ''}</div>`).join('')}</div>`;
  } else {
    const groups = BESTIARY.map((g) => ({ ...g, items: g.items.filter((it) => !relax() || RELAX_IDS.includes(it.id)) })).filter((g) => g.items.length);
    const total = groups.reduce((s, g) => s + g.items.length, 0), got = groups.reduce((s, g) => s + g.items.filter((it) => seen.has(it.id)).length, 0);
    body = `<p class="m-sub">Scoperti ${got} su ${total}. Ciò che non hai ancora incontrato resta in ombra: si sblocca da solo la prima volta che lo vedi in campo.</p>
      ${groups.map((g) => `<h3>${g.group}</h3><div class="besti">${g.items.map((it) => {
        const ok = seen.has(it.id), txt = relax() && it.relax ? it.relax : it.desc;
        return `<div class="be ${ok ? '' : 'locked'}"><div class="be-art">${artOf(it.id)}</div><div><b>${ok ? it.name : '???'}</b>${ok && it.hp && !relax() ? `<span class="be-hp">${'♥'.repeat(it.hp)}</span>` : ''}<small>${ok ? txt : 'Non ancora incontrato.'}</small></div></div>`;
      }).join('')}</div>`).join('')}`;
  }
  openModal(`<h2>Diario</h2>
    <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="tab ${diaryTab === k ? 'on' : ''}" data-act="dtab" data-k="${k}">${v}</button>`).join('')}</div>
    <div class="diary-body">${body}</div>`, { cls: 'wide tall', key: 'diary-' + diaryTab + '-' + cardFilter });
}
function relaxRulesHTML() {
  const pw = run ? powerOf(run.pig, 'relax') : null;
  return `<div class="relax-rules">
    <div class="rr"><span>👣</span><div><b>3 passi per turno</b><small>Muovi il maialino casella per casella. Dopo il terzo passo (o se premi «Aspetta») il mondo fa la sua mossa.</small></div></div>
    <div class="rr"><span>🎯</span><div><b>Obiettivi: mele e/o fango</b><small>Appena li raggiungi la giornata finisce e passi alla successiva, un po' più difficile.</small></div></div>
    <div class="rr"><span>❤️</span><div><b>2 vite</b><small>Contadini e cani tolgono una vita se il turno finisce con te nella loro zona colorata. Dopo un colpo hai un turno di tregua. A zero vite la corsa finisce.</small></div></div>
    <div class="rr"><span>🐦</span><div><b>I corvi rubano solo mele</b><small>Il numero sul corvo dice fra quanti turni mangerà la mela. Passagli accanto e scappa.</small></div></div>
    <div class="rr"><span>🚫</span><div><b>Niente di superfluo</b><small>Niente carte, energia, meteo, oggetti, ciondoli né ghiande. Contano solo i tuoi passi.</small></div></div>
    ${pw ? `<div class="rr"><span>✦</span><div><b>Potere di ${PIGS[run.pig].name}: ${pw.name}</b><small>${pw.desc}</small></div></div>` : ''}
  </div>`;
}
const sortCards = (cards) => cards.slice().sort((a, b) => CARDS[a.id].cost - CARDS[b.id].cost || CARDS[a.id].name.localeCompare(CARDS[b.id].name));

function showPile(k) {
  const D = run.D, cards = k === 'draw' ? D.draw : D.discard;
  openModal(`<h2>${k === 'draw' ? 'Mazzo di pesca' : 'Pila degli scarti'} <small class="muted">${cards.length} carte</small></h2>
    <p class="m-sub">${k === 'draw' ? 'Le carte che puoi ancora pescare, in ordine di costo (l’ordine di pesca resta segreto).' : 'Le carte già usate o scartate: quando il mazzo finisce, tornano mescolate nel mazzo.'}</p>
    ${cards.length ? `<div class="deck-grid">${sortCards(cards).map((c) => cardHTML(c, null)).join('')}</div>` : '<p class="quiet">Nessuna carta.</p>'}`, { cls: 'wide', key: 'pile-' + k });
}

function statRows(rows) { return `<div class="srows">${rows.map(([k, v]) => `<div class="srow"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`; }

function showStats() {
  if (!run) return showCareer();
  const T = run.totals;
  let body;
  if (statsTab === 'run') {
    const hist = run.history.map((h) => {
      const bars = ['mele', 'fango', 'pancia'].filter((k) => h.goals[k]).map((k) => `<i class="h-${k}" style="height:${Math.min(100, h[k] / h.goals[k] * 100)}%"></i>`).join('');
      return `<div class="hday ${h.ok ? 'ok' : 'ko'}" title="Giorno ${h.day + 1}: ${h.ok ? 'superato' : 'fallito'}"><div class="hbars">${bars}</div><small>${h.day + 1}</small></div>`;
    }).join('');
    body = `
      <div class="kpis">
        <div class="kpi"><small>Giorno</small><b>${run.day + 1}</b></div>
        <div class="kpi"><small>Punteggio</small><b>${E.score(run)}</b></div>
        <div class="kpi">${use('apple')}<small>Mele</small><b>${T.mele}</b></div>
        <div class="kpi">${use('mud')}<small>Fango</small><b>${T.fango}</b></div>
      </div>
      ${run.history.length ? `<h3>Giornate</h3><div class="hist">${hist}</div><p class="legend"><i class="h-mele"></i> mele <i class="h-fango"></i> fango <i class="h-pancia"></i> pancia · in percentuale dell'obiettivo</p>` : ''}
      <div class="cols">
        <div><h3>La corsa</h3>${relax() ? statRows([['Giorni superati', T.giorniSuperati], ['Passi', T.passi], ['Rotolate', T.rotolate],
          ['Colpi subiti', T.colpiSubiti], ['Corvi scacciati', T.animaliScacciati], ['Mele rubate dai corvi', T.meleRubate]]) : statRows([
          ['Giorni superati', T.giorniSuperati], ['Giorni falliti', T.giorniFalliti], ['Passi', T.passi], ['Carte giocate', T.carte],
          ['Rotolate', T.rotolate], ['Catena più lunga', T.catenaMax], ['Mele in un turno (record)', T.meleTurnoMax], ['Mele d\'oro', T.meleOro],
          ['Colpi subiti', T.colpiSubiti], ['Colpi dati', T.colpiDati], ['Animali scacciati', T.animaliScacciati], ['Mele rubate dai corvi', T.meleRubate],
          ['Oggetti raccolti', T.oggetti], ['Ghiande guadagnate', T.ghiandeTot]])}</div>${relax() ? `<div><h3>${PIGS[run.pig].name}</h3>${statRows([['Modalità', 'Relax'], ['Potere', powerOf(run.pig, 'relax').name], ['Vite', `${run.hearts}/${run.maxHearts}`], ['Passi per turno', E.relaxSteps(run)]])}</div>` : `
        <div><h3>${PIGS[run.pig].name}</h3>${statRows([
          ['Potere', PIGS[run.pig].power], ['Cuori', `${run.hearts}/${run.maxHearts}`], ['Energia per turno', run.stats.energia],
          ['Carte pescate', E.handSize(run)], ['Pancia massima', run.stats.pancia + (E.has(run, 'panciadiferro') ? 3 : 0)], ['Carte nel mazzo', run.deck.length],
          ['Ghiande', run.ghiande], ['Modalità', run.mode === 'daily' ? 'Sfida del giorno' : 'Partita']])}
          <h3>Ciondoli</h3>${run.relics.length ? `<ul class="rlist">${run.relics.map((id) => `<li><span>${RELICS[id].icon}</span><div><b>${RELICS[id].name}</b><small>${RELICS[id].desc}</small></div></li>`).join('')}</ul>` : '<p class="quiet">Nessun ciondolo.</p>'}
        </div>`}
      </div>`;
  } else body = careerHTML(profile());
  openModal(`<h2>Statistiche</h2>
    <div class="tabs"><button class="tab ${statsTab === 'run' ? 'on' : ''}" data-act="stab" data-k="run">Questa partita</button><button class="tab ${statsTab === 'career' ? 'on' : ''}" data-act="stab" data-k="career">Carriera</button></div>
    ${body}`, { cls: 'wide tall', key: 'stats-' + statsTab });
}

function careerHTML(prof) {
  return `<div class="kpis">
      <div class="kpi"><small>Partite</small><b>${prof.runs}</b></div>
      <div class="kpi"><small>Record giorni</small><b>${prof.bestDays}</b></div>
      <div class="kpi"><small>Record punti</small><b>${prof.bestScore}</b></div>
      <div class="kpi"><small>Giorni superati</small><b>${prof.giorni}</b></div>
    </div>
    ${statRows([['Mele mangiate in tutto', prof.mele], ['Fango accumulato in tutto', prof.fango], ['Sfida di oggi', prof.daily[todayKey()] ? prof.daily[todayKey()] + ' punti' : 'non giocata'],
      ['Compendio scoperto', `${seen.size} voci`]])}
    <h3>Ultime partite</h3>
    ${prof.history.length ? `<ul class="runs">${prof.history.slice().reverse().map((h) => `<li><span>${h.date}</span><span>${h.pig && PIGS[h.pig] ? PIGS[h.pig].name : ''}${h.mode === 'daily' ? ' · sfida' : h.variant === 'relax' ? ' · relax' : ''}</span><span>${h.days} giorni</span><b>${h.score} punti</b></li>`).join('')}</ul>` : '<p class="quiet">Ancora nessuna partita conclusa.</p>'}`;
}
function showCareer() { openModal(`<h2>Statistiche</h2>${careerHTML(profile())}`, { cls: 'wide' }); }

function offerHTML(o, i, act, price) {
  const p = price != null ? `<span class="price">${price} ${use('acorn')}</span>` : '';
  if (o.kind === 'card') {
    return `<div class="offer o-card" ${act ? `data-act="${act}"` : ''} data-i="${i}">${cardHTML({ id: o.id }, null)}<span class="o-kind">Carta · ${RARITY_NAME[CARDS[o.id].rarity]}</span>${p}</div>`;
  }
  const def = o.kind === 'relic' ? RELICS[o.id] : UPGRADES[o.id];
  return `<div class="offer o-${o.kind}" ${act ? `data-act="${act}"` : ''} data-i="${i}">
    <div class="o-box"><span class="o-ico">${def.icon}</span><b>${def.name}</b><small>${def.desc}</small></div>
    <span class="o-kind">${o.kind === 'relic' ? 'Ciondolo' : 'Potenziamento'}</span>${p}</div>`;
}

function showReward() {
  const r = run.result;
  openModal(`<h2>Scegli una ricompensa</h2>
    <p class="m-sub">${r && r.ghiande ? `Hai guadagnato <b>${r.ghiande}</b> ${use('acorn')}. ` : ''}Prendi una di queste:</p>
    <div class="offers">${run.offers.map((o, i) => offerHTML(o, i, 'take')).join('')}</div>
    <div class="m-foot"><button class="btn ghost" data-act="skip">Salta e prendi 3 ${use('acorn')}</button></div>`, { closable: false, cls: 'wide' });
}

function showShop() {
  const sh = run.shop;
  openModal(`<h2>Mercato del paese</h2>
    <p class="m-sub">Spendi le ghiande prima di ripartire. Hai <b class="acorn-n">${run.ghiande} ${use('acorn')}</b></p>
    <div class="offers shop">${sh.items.map((o, i) => {
      const sold = sh.sold.includes(i), poor = run.ghiande < o.price;
      return `<div class="shop-item ${sold ? 'sold' : ''} ${poor && !sold ? 'poor' : ''}">${offerHTML(o, i, sold || poor ? '' : 'buy', sold ? null : o.price)}${sold ? '<span class="sold-tag">Venduto</span>' : ''}</div>`;
    }).join('')}</div>
    <div class="m-foot"><button class="btn primary big" data-act="leaveshop">Riparti verso il giorno ${run.day + 2}</button></div>`, { closable: false, cls: 'wide tall', key: 'shop' });
}

function showRemovePicker(done) {
  pendingRemove = done;
  openModal(`<h2>Togli una carta</h2>
    <p class="m-sub">Un mazzo più snello pesca più spesso le carte migliori.</p>
    <div class="deck-grid pick">${sortCards(run.deck).map((c) => cardHTML(c, null, { act: 'removepick' })).join('')}</div>`, { closable: false, cls: 'wide tall' });
}

function recordRun() {
  if (run.recorded) return;
  run.recorded = true;
  const prof = profile(), sc = E.score(run), days = run.totals.giorniSuperati;
  run.recordFlags = { newDays: days > prof.bestDays, newScore: sc > prof.bestScore };
  prof.runs++; prof.bestDays = Math.max(prof.bestDays, days); prof.bestScore = Math.max(prof.bestScore, sc);
  prof.mele += run.totals.mele; prof.fango += run.totals.fango; prof.giorni += days;
  prof.history.push({ date: new Date().toLocaleDateString('it-IT'), mode: run.mode, variant: run.variant || 'roguelike', pig: run.pig, days, score: sc });
  prof.history = prof.history.slice(-12);
  if (run.mode === 'daily') prof.daily[todayKey()] = Math.max(prof.daily[todayKey()] || 0, sc);
  store(PROF, prof);
  save();
}

function showGameOver() {
  recordRun();
  const T = run.totals, rec = run.recordFlags || {};
  openModal(`<div class="result over">
    <div class="r-pig sleepy">${pigSVG(run.pig, run.look || {})}</div>
    <h2>Fine della corsa</h2>
    <p class="m-sub">${PIGS[run.pig].name} si addormenta dopo ${run.day + 1} giorni in fattoria.</p>
    <div class="kpis">
      <div class="kpi"><small>Giorni superati</small><b>${T.giorniSuperati}</b>${rec.newDays ? '<em>record!</em>' : ''}</div>
      <div class="kpi"><small>Punteggio</small><b>${E.score(run)}</b>${rec.newScore ? '<em>record!</em>' : ''}</div>
      <div class="kpi">${use('apple')}<small>Mele</small><b>${T.mele}</b></div>
      <div class="kpi">${use('mud')}<small>Fango</small><b>${T.fango}</b></div>
    </div>
    <div class="menu row">
      <button class="btn primary big" data-act="pregame" data-mode="normal">Nuova partita</button>
      <button class="btn" data-act="stats">Statistiche</button>
      <button class="btn ghost" data-act="title">Menu principale</button>
    </div>
  </div>`, { closable: false, cls: 'narrow' });
}

// =====================================================================
// Tutorial: una partita spiegata passo passo, con campi in miniatura
// =====================================================================
// Campo in miniatura. Contenuto: P maialino · a mela · g mela d'oro · m pozza · M pozza col sole · T melo · R sasso
//   B cespuglio · F/f contadino verso destra/sinistra · C corvo su una mela · D cane · d mela in caduta · c nuvola · A ghianda
// Zone (seconda mappa, facoltativa): r contadino · o cane · * casella raggiungibile · x bersaglio di una carta
function mini(rows, zones = []) {
  const w = rows[0].length;
  const sym = (id, cls = '') => `<svg class="mi ${cls}" viewBox="${id === 'farmer' ? '0 0 64 72' : id === 'dog' ? '0 0 64 58' : '0 0 40 40'}"><use href="#s-${id}"/></svg>`;
  const content = {
    P: () => `<span class="mpig">${pigSVG('rosina')}</span>`, a: () => sym('apple'), g: () => sym('gold'), A: () => sym('acorn'),
    m: () => '<i class="mpud"></i><b class="mdep">2</b>', M: () => `<i class="mpud"></i><b class="mdep">2</b>${sym('sun', 'msun')}`,
    T: () => sym('tree', 'mobj'), R: () => sym('rock', 'mobj'), B: () => sym('bush', 'mobj'),
    F: () => sym('farmer', 'mfoe'), f: () => sym('farmer', 'mfoe flip'), D: () => sym('dog', 'mfoe flip'),
    C: () => `${sym('apple')}${sym('crow', 'mcrow')}`, d: () => sym('drop', 'mev'), c: () => sym('cloud', 'mev'),
  };
  const zc = { r: 'z-farmer', o: 'z-dog', '*': 'mreach', x: 'mtarget' };
  let html = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const z = zones[y] && zones[y][x];
    html += `<div class="mc ${(x + y) % 2 ? 'g1' : 'g0'} ${z && zc[z] ? zc[z] : ''}">${content[ch] ? content[ch]() : ''}</div>`;
  }));
  return `<div class="mini" style="--mw:${w}">${html}</div>`;
}

const TUTORIAL = [
  { title: 'Benvenuto in fattoria!', art: () => `<div class="tut-hero">${pigSVG('rosina')}<div class="tut-goals"><span>${use('apple')} 6 mele</span><span>${use('mud')} 5 fango</span></div></div>`,
    text: ['Sei un maialino goloso. Ogni <b>giornata</b> ti chiede degli <b>obiettivi</b>: mangiare mele, accumulare fango e, più avanti, riempire la pancia.',
      'Li trovi nel riquadro <b>Obiettivi</b> a sinistra del campo. Raggiungili prima che finiscano i turni (il numero grande in alto).',
      'Lo scopo finale: <b>sopravvivere più giornate possibile</b>. Ogni giorno è un po\' più difficile.'] },
  { title: '1 · Muoversi', art: () => mini(['.....', '..P..', '.....'], ['..*..', '.*.*.', '..*..']),
    text: ['Clicca una casella <b>tratteggiata</b> per spostarti (oppure usa le frecce o WASD).',
      'Ogni passo costa <b>1 energia</b>: è il cerchio giallo in basso a sinistra, che si svuota come un liquido.',
      'Alcune carte danno <b>passi gratis</b>, che si spendono prima dell\'energia.'] },
  { title: '2 · Mangiare le mele', art: () => mini(['.T...', 'Paag.', '.....'], ['', '.**..', '']),
    text: ['Passa sopra una mela per mangiarla: <b>+1 mela</b>.',
      'La <b>mela d\'oro</b> vale 3. I meli lasciano cadere nuove mele durante la giornata.'] },
  { title: '3 · Rotolarsi nel fango', art: () => mini(['.....', 'Pmm..', '.....'], ['', '.**..', '']),
    text: ['Entra in una pozza per rotolarti: prendi tanto fango quanto la sua <b>profondità</b> (il numero bianco), e la pozza cala di 1.',
      '<b>Catena:</b> ogni rotolata nello stesso turno vale +1 rispetto alla precedente. Due pozze profonde 2 di fila valgono 2 + 3 = <b>5 fango</b>.'] },
  { title: '4 · Le carte', art: () => `<div class="tut-cards">${cardHTML({ id: 'scatto' }, null)}${cardHTML({ id: 'grufolata' }, null)}${cardHTML({ id: 'testata' }, null)}</div>`,
    text: ['A ogni turno peschi alcune carte. Il numero nel <b>cerchio giallo</b> è quanta energia costano.',
      'Se una carta ha bisogno di un bersaglio, le caselle valide si colorano di <b>giallo</b>: cliccane una.',
      'Le carte giocate vanno negli <b>scarti</b>; quando il mazzo finisce, vengono rimescolate.'] },
  { title: '5 · Il mondo ti avvisa', art: () => mini(['F....', '..M..', 'T.d.P'], ['.rr..', '.rrr.', '']),
    text: ['A fine turno il mondo si muove, ma prima te lo mostra:',
      '<b>Zona rossa</b>: il contadino ti vede. Se finisci il turno lì, secchiata e fango perso.',
      '<b>Sagoma di mela</b>: lì cadrà una mela. <b>Sole</b> su una pozza: si asciugherà di 1.',
      'Tieni il mouse fermo su una casella per 2 secondi, o cliccala col <b>tasto destro</b>, per leggere cosa fa.'] },
  { title: '6 · Gli animali', art: () => mini(['..C..', '.P.D.', '.....'], ['', '..o.o', '...o.']),
    text: ['Il <b>corvo</b> mangia la mela su cui è posato, a meno che tu non gli stia accanto.',
      'Il <b>cane</b> ti insegue: se finisci il turno accanto a lui (zona arancio) abbaia e il turno dopo hai meno energia.',
      'Puoi dare una <b>spintone</b> agli animali muovendoti contro di loro: quando finiscono i cuoricini, scappano.'] },
  { title: '7 · Fine turno e fine giornata', art: () => `<div class="tut-flow"><span>🐷 Ti muovi e giochi le carte</span><b>→</b><span>⏭️ Fine turno</span><b>→</b><span>🌍 Il mondo si muove</span><b>→</b><span>🃏 Nuova mano</span></div>`,
    text: ['Quando hai finito, premi <b>Fine turno</b> (o Invio).',
      'Appena raggiungi tutti gli obiettivi la giornata <b>finisce subito</b> e scegli una ricompensa: una carta, un ciondolo o un potenziamento. Chiudere presto vale anche ghiande.',
      'Se i turni finiscono prima, perdi un <b>cuore</b>. A zero cuori la corsa è finita.',
      'Ogni 3 giornate c\'è il <b>Mercato</b>, dove spendi le ghiande.'] },
  { title: '8 · La modalità Relax', art: () => mini(['.f...', '..P..', '.C.a.'], ['rr...', '.*.*.', '..*..']),
    text: ['Vuoi qualcosa di più semplice? Scegli <b>🌿 Relax</b> nella schermata iniziale, accanto a «Nuova partita».',
      'Niente carte, energia, meteo né oggetti: a ogni turno fai <b>3 passi</b>, poi contadini, cani e corvi fanno la loro mossa.',
      'Hai <b>2 vite</b>: contadini e cani te ne tolgono una se il turno finisce nella loro zona. I corvi rubano solo le mele.'] },
  { title: 'Pronto a grufolare?', art: () => `<div class="tut-hero">${pigSVG('rosina', { testa: 'paglia' })}</div>`,
    text: ['<b>Pensa con calma</b>: qui non servono riflessi. In Roguelike puoi anche annullare le mosse del turno.',
      'Nel <b>Diario</b> trovi il tuo mazzo, tutte le carte e il compendio di animali e oggetti che hai incontrato.',
      'Buon divertimento! 🐷'] },
];

// Tutorial della modalità Relax: solo le sue regole, niente carte né energia.
const TUTORIAL_RELAX = [
  { title: 'Benvenuto in Relax!', art: () => `<div class="tut-hero">${pigSVG('rosina', { testa: 'fiori' })}<div class="tut-goals"><span>${use('apple')} 5 mele</span><span>${use('mud')} 4 fango</span></div></div>`,
    text: ['Sei un maialino goloso. Ogni <b>giornata</b> ti chiede degli <b>obiettivi</b>: mangiare mele, rotolarti nel fango, o tutte e due le cose.',
      'Li trovi nel riquadro <b>Obiettivi</b>. Non c’è un limite di turni: prenditi tutto il tempo che vuoi.',
      'Lo scopo: <b>arrivare più lontano possibile</b>. Ogni giornata è un po’ più difficile della precedente.'] },
  { title: '1 · Tre passi per turno', art: () => mini(['.....', '..P..', '.....'], ['..*..', '.*.*.', '..*..']),
    text: ['Clicca una casella <b>tratteggiata</b> per spostarti (oppure usa le frecce o WASD).',
      'A ogni turno fai <b>3 passi</b>. Dopo il terzo, il mondo fa la sua mossa.',
      'Vuoi restare dove sei? Premi <b>«Aspetta»</b>: rinunci ai passi rimasti e il turno passa.'] },
  { title: '2 · Mangiare le mele', art: () => mini(['.T...', 'Paad.', '.....'], ['', '.**..', '']),
    text: ['Passa sopra una mela per mangiarla.',
      'I <b>meli</b> lasciano cadere nuove mele: la <b>sagoma</b> sul prato ti dice dove cadrà la prossima. Se ci sei sotto, ti cade dritta in bocca!'] },
  { title: '3 · Rotolarsi nel fango', art: () => mini(['.....', 'Pmm..', '.....'], ['', '.**..', '']),
    text: ['Entra in una pozza per rotolarti: prendi tanto fango quanto la sua <b>profondità</b> (il numero bianco), e la pozza cala di 1.',
      '<b>Catena:</b> ogni rotolata nello stesso turno vale +1 rispetto alla precedente. Usa bene i tuoi 3 passi!'] },
  { title: '4 · Contadini e cani', art: () => mini(['F....', '..P.D', '.....'], ['.rr..', '.rr.o', '...o.']),
    text: ['Prima di muoversi, il mondo ti mostra dove colpirà:',
      '<b>Zona rossa</b>: il contadino ti vede. <b>Zona arancio</b>: il cane ti morde. Se il turno finisce con te lì dentro, <b>perdi una vita</b>.',
      'Dopo un colpo hai un turno di tregua per scappare. Tieni il mouse fermo su una casella, o cliccala col <b>tasto destro</b>, per sapere cosa fa.'] },
  { title: '5 · I corvi', art: () => mini(['..C..', '.P...', '.....'], ['', '', '']),
    text: ['Il <b>corvo</b> non ti fa male: ruba solo le mele.',
      'Il numero sul corvo dice <b>fra quanti turni</b> mangerà la mela su cui è posato. Passagli accanto e scappa via.'] },
  { title: '6 · Vite e giornate', art: () => `<div class="tut-flow"><span>👣 3 passi</span><b>→</b><span>🌍 Il mondo si muove</span><b>→</b><span>🎯 Obiettivi raggiunti?</span><b>→</b><span>🌅 Nuova giornata</span></div>`,
    text: ['Hai <b>2 vite</b>. A zero vite la corsa finisce.',
      'Appena raggiungi gli obiettivi la giornata <b>finisce subito</b> e passi alla successiva.',
      'Niente carte, energia, meteo, oggetti né ghiande: contano solo i tuoi passi. Ogni maialino ha un <b>potere Relax</b> tutto suo, lo vedi quando lo scegli.'] },
  { title: 'Pronto a grufolare?', art: () => `<div class="tut-hero">${pigSVG('rosina', { testa: 'paglia' })}</div>`,
    text: ['<b>Pensa con calma</b>: qui non servono riflessi.',
      'Quando ti senti pronto, prova la modalità <b>⚔️ Roguelike</b>: carte, energia, ciondoli e molto altro.',
      'Buon divertimento! 🐷'] },
];

const apig = (...ids) => `<div class="tut-apigs">${ids.map((id) => `<div class="tut-apig">${arenaPigSVG(APIGS[id].look)}</div>`).join('')}</div>`;
const TUTORIAL_ARENA = [
  { title: 'Benvenuto nell’Arena!', art: () => apig('velenella', 'squalotto', 'kosmo'),
    text: ['Un <b>auto-battler</b>: componi un recinto di maialini e manda la squadra a combattere contro il recinto di un altro allevatore.',
      'A ogni partita scegli una <b>fattoria</b> fra tre: decide quali maialini troverai più spesso e ti dà un bonus.',
      'Servono <b>15 vittorie</b> per diventare campione. Hai <b>5 cuori</b>: ogni sconfitta ne costa uno.'] },
  { title: '1 · Il negozio e il recinto', art: () => apig('mozzo', 'pugnetto', 'scodellina', 'zappetta'),
    text: ['Trascina i maialini dal negozio al recinto di <b>4 colonne × 2 righe</b>. La colonna a destra è la prima fila.',
      'I <b>tratti</b> si trascinano su un maialino; i <b>ciondoli</b> compaiono ogni tanto, al posto di un maialino.',
      '«Nuovi maialini» e «Nuovi tratti» cambiano il negozio per 3 ghiande. Ogni giorno si rinnova gratis.'] },
  { title: '2 · Livelli e copie', art: () => apig('prosciutto', 'prosciutto', 'prosciutto'),
    text: ['Trascina un maialino su uno <b>uguale</b>: la barretta <b>1/3</b> conta le copie.',
      'Alla terza copia sale di livello (<b>Liv.2</b>, fino al 5): più attacco, vita, effetti e poteri più forti.'] },
  { title: '3 · Statistiche ed effetti', art: () => apig('bollicina', 'blip', 'fanghino'),
    text: ['Sulla carta vedi <b>⚔️ attacco</b>, <b>❤️ vita</b> e gli effetti che il maialino applica <b>a ogni colpo</b>: 🔥 bruciatura, ☠️ veleno, 🟤 fango, 💚 cura, 🫧 scudo, 💫 stordimento.',
      '<b>Clicca</b> un maialino per tenere fisso il suo riepilogo: potere, velocità, critico e bonus.'] },
  { title: '4 · Sinergie e vita della squadra', art: () => apig('culatello', 'trombetta', 'ancoretta'),
    text: ['Ogni maialino ha 2 <b>tag</b>: con 2 o 4 maialini diversi dello stesso tag si attivano bonus di squadra.',
      'La vita della squadra è <b>(250 della fattoria + vita dei maialini) × il moltiplicatore del giorno</b>: ×1, ×1,5, ×2… Servono maialini sempre più forti.'] },
  { title: '5 · La battaglia', art: () => apig('shogun', 'drago'),
    text: ['La battaglia è automatica: tu guardi (anche a 2× o 4×) e tifi.',
      'Dopo 15 secondi arriva la <b>furia</b>: i danni salgono. Dopo la battaglia ricevi ghiande, e alcuni maialini crescono <b>permanentemente</b>.'] },
];
const TUTORIAL_ASSALTO = [
  { title: 'Benvenuto all’Assalto!', art: () => apig('cotechino', 'squalotto', 'ombretta'),
    text: ['Un <b>tower defense al contrario</b>: i contadini difendono la fattoria, tu la attacchi con le tue orde di maialini.',
      'Una partita sono <b>3 assalti</b> a fattorie diverse. Ogni fattoria va conquistata in al massimo <b>7 ondate</b>: portane a zero la vita.',
      'Danni alla fattoria e contadini abbattuti <b>restano</b> da un’ondata all’altra.'] },
  { title: '1 · I ruoli', art: () => apig('lardone', 'bollicina', 'pancetta', 'spillo'),
    text: ['<b>Guerrieri</b>: si fermano a combattere i contadini a portata.',
      '<b>Untori</b>: non si fermano; colpiscono passando e lasciano bruciature, veleno e fango.',
      '<b>Supporti</b>: curano e proteggono i maialini vicini. <b>Corridori</b>: corrono dritti alla fattoria e fanno più danni.'] },
  { title: '2 · Cancelli e strade', art: () => `<div class="tut-flow"><span>🚪 Cancello A</span><b>→</b><span>🐷🐷🐷 strada più corta</span><b>→</b><span>🏠 Fattoria</span></div>`,
    text: ['A sinistra ci sono 2 o 3 <b>cancelli</b> (A, B, C). Scegli da quale entrare: i maialini seguono da soli la <b>strada più corta</b> verso la fattoria.',
      'La linea tratteggiata mostra il percorso. Strade diverse passano vicino a contadini diversi: scegli bene.'] },
  { title: '3 · Rancio e tempo', art: () => `<div class="tut-flow"><span>🍲 Rancio</span><b>→</b><span>🐷 Schieri ×1, ×5 o tutti</span><b>→</b><span>⏸️ Pausa quando vuoi</span></div>`,
    text: ['Ogni maialino costa <b>rancio</b> (da 1 a 5, secondo la rarità). Ogni ondata hai una scorta di rancio, che cresce col tempo.',
      'L’ondata dura 60 secondi e <b>parte in pausa</b>: schiera, poi premi ▶. Puoi fermare il tempo o accelerarlo (1× 2× 3×) quando vuoi.',
      'Mandare prima i guerrieri ad aprire la strada e poi i corridori è spesso una buona idea.'] },
  { title: '4 · I contadini', art: () => `<div class="tut-defs">${['forcone', 'fucile', 'fionda', 'nonna', 'spaventa'].map((k) => `<div>${defIconHTML(k)}</div>`).join('')}</div>`,
    text: ['Forcone, fucile, fionda, scopa, spaventapasseri, veterinaria, doppietta, trattore e tagliole: ognuno ha portata e danni diversi.',
      'Passa il mouse su un contadino per vedere cosa fa e fin dove arriva.'] },
  { title: '5 · L’accampamento', art: () => apig('zappetta', 'salmone', 'contessa'),
    text: ['Fra un’ondata e l’altra spendi le <b>ghiande</b>: nuove squadre dal mercato, livelli, +2 rancio, posti squadra e ciondoli.',
      'Ma anche i contadini si preparano: dopo ogni ondata arrivano <b>rinforzi</b>, segnati «NUOVO» sulla mappa.'] },
  { title: 'Pronto all’assalto?', art: () => apig('kungpork', 'remostri'),
    text: ['<b>Pensa con calma</b>: la pausa è tua amica.', 'Buona conquista! 🐷'] },
];
const TUTORIALS = { relax: () => TUTORIAL_RELAX, roguelike: () => TUTORIAL, arena: () => TUTORIAL_ARENA, assalto: () => TUTORIAL_ASSALTO };

let tutStep = 0, tutVar = null;
function showTutorial(step = 0) {
  closeModal();
  if (!MODES[tutVar]) tutVar = curMode();
  const TUT = TUTORIALS[tutVar]();
  tutStep = Math.max(0, Math.min(TUT.length - 1, step));
  const t = TUT[tutStep], last = tutStep === TUT.length - 1;
  app.innerHTML = `<main class="tutorial">
    <header class="pg-head">
      <button class="btn ghost" data-act="title">${ICONS.back}Menu principale</button>
      <div class="pg-title"><h1>🎓 Tutorial ${MODES[tutVar].icon} ${MODES[tutVar].name}</h1><p>Una partita spiegata passo passo</p></div>
      <div class="variant tut-var">${Object.entries(MODES).map(([id, v]) => `<button class="vbtn ${tutVar === id ? 'on' : ''}" data-act="tutvar" data-id="${id}">${v.icon} ${v.name}</button>`).join('')}</div>
    </header>
    <section class="tut-card">
      <div class="tut-art">${t.art()}</div>
      <div class="tut-text"><h2>${t.title}</h2>${t.text.map((p) => `<p>${p}</p>`).join('')}</div>
    </section>
    <nav class="tut-nav">
      <button class="btn" data-act="tut" data-step="${tutStep - 1}" ${tutStep === 0 ? 'disabled' : ''}>← Indietro</button>
      <div class="tut-dots">${TUT.map((_, i) => `<button class="${i === tutStep ? 'on' : ''}" data-act="tut" data-step="${i}" aria-label="Passo ${i + 1}"></button>`).join('')}</div>
      ${last ? `<button class="btn primary" data-act="newgame" ${pcOnly(tutVar) ? 'disabled title="Per ora solo da computer"' : ''}>Gioca ora 🐷</button>` : `<button class="btn primary" data-act="tut" data-step="${tutStep + 1}">Avanti →</button>`}
    </nav>
  </main>`;
}

// =====================================================================
// Flusso fra le giornate
// =====================================================================
function proceed() {
  if (relax()) { startNext(); return; }
  if (run.result.ok) { E.makeOffers(run); save(); showReward(); }
  else afterReward();
}
function afterReward() {
  if (E.isMarketDay(run.day)) { E.makeShop(run); save(); showShop(); }
  else startNext();
}
function startNext() {
  closeModal();
  E.nextDay(run);
  undo = []; targeting = null;
  save();
  if (!$('#tiles')) showGame(); else render();
  dayBanner();
}

// =====================================================================
// Eventi globali
// =====================================================================
const ACTIONS = {
  pregame: (b) => showPregame(b.dataset.mode || 'normal'),
  tutorial: () => { tutVar = curMode(); showTutorial(0); },
  tutvar: (b) => { tutVar = b.dataset.id; if (!pcOnly(tutVar)) setMode(tutVar); A.sfx('pop'); showTutorial(0); },
  modemenu: () => { const m = $('.mode-menu'); if (m) m.hidden = !m.hidden; },
  mode: (b) => {
    const id = b.dataset.id;
    if (pcOnly(id)) { toast(`Per ora la modalità ${MODES[id].name} si gioca solo da computer.`); return; }
    setMode(id); A.sfx('pop'); showTitle();
  },
  newgame: () => {
    const m = tutVar && $('.tutorial') ? tutVar : curMode();
    if (pcOnly(m)) { toast(`Per ora la modalità ${MODES[m].name} si gioca solo da computer.`); return; }
    setMode(m);
    if (m === 'arena') ACTIONS.arena();
    else if (m === 'assalto') ACTIONS.assalto();
    else showPregame('normal');
  },
  assalto: () => {
    if (arenaLocked()) { toast('Per ora l’Assalto si gioca solo da computer.'); return; }
    run = null; openAssault({ app, openModal, closeModal, showTitle, toast, store, load }); },
  arena: () => {
    if (arenaLocked()) { toast('Per ora l’Arena si gioca solo da computer: serve uno schermo grande per trascinare i maialini.'); return; }
    run = null; openArena({ app, openModal, closeModal, showTitle, toast, store, load }); },
  tut: (b) => { A.sfx('card'); showTutorial(+b.dataset.step); },
  variant: (b) => { store(VARIANT, b.dataset.id); A.sfx('pop'); showTitle(); },
  wait: relaxWait,
  pickpig: (b) => { pickPig = b.dataset.id; A.sfx('oink'); renderPigs(); },
  equip,
  shoppage: showShopPage,
  'buy-real': buyReal,
  restore: async () => { await S.restore(); openModal('<h2>Ripristina acquisti</h2><p>Non ci sono acquisti da ripristinare: i pagamenti non sono ancora attivi.</p><div class="m-foot"><button class="btn primary" data-act="close">Ok</button></div>', { cls: 'narrow center' }); },
  settings: showSettings,
  'reset-seen': () => { if (!confirm('Rimettere in ombra tutto il compendio?')) return; seen.clear(); store(SEEN, []); showSettings(); toast('Compendio azzerato'); },
  'reset-stats': () => { if (!confirm('Cancellare statistiche e record? Gli acquisti restano.')) return; store(PROF, null); showSettings(); toast('Statistiche azzerate'); },
  startrun: startRun,
  continue: resume,
  help: () => { closeMenu(); showHelp(); },
  career: showCareer,
  close: userClose,
  title: () => { closeMenu(); if (run && run.screen === 'over') store(SAVE, null); showTitle(); },
  abandon: () => {
    closeMenu();
    if (!confirm('Abbandonare la partita? Verrà registrata nelle statistiche.')) return;
    run.screen = 'over'; save(); showGameOver();
  },
  menu: () => { const d = $('#dropdown'); d.hidden = !d.hidden; },
  diary: () => showDiary(),
  deckview: () => { closeMenu(); showDiary('deck'); },
  pile: (b) => showPile(b.dataset.k),
  dtab: (b) => showDiary(b.dataset.k),
  cfilter: (b) => { cardFilter = b.dataset.k; showDiary('cards'); },
  stats: showStats,
  stab: (b) => { statsTab = b.dataset.k; showStats(); },
  relic: (b) => { const r = RELICS[b.dataset.id]; openModal(`<div class="relic-big">${r.icon}</div><h2>${r.name}</h2><p>${r.desc}</p>`, { cls: 'narrow center' }); },
  undo: doUndo,
  end: endTurn,
  proceed,
  hintok: () => { hintOff = `${run.day}-${run.D.turn}`; renderHint(); },
  peek: () => { peek = true; renderDayEnd(); },
  unpeek: () => { peek = false; renderDayEnd(); },
  take: (b) => {
    const o = run.offers[+b.dataset.i];
    const need = E.grant(run, o);
    run.offers = null; save();
    if (need === 'remove') showRemovePicker(afterReward); else afterReward();
  },
  skip: () => { E.skipReward(run); run.offers = null; save(); afterReward(); },
  buy: (b) => {
    const i = +b.dataset.i, o = run.shop.items[i];
    if (run.shop.sold.includes(i) || run.ghiande < o.price) return;
    run.ghiande -= o.price; run.shop.sold.push(i); A.sfx('coin');
    const need = E.grant(run, o);
    save(); render();
    if (need === 'remove') showRemovePicker(showShop); else showShop();
  },
  leaveshop: startNext,
  removepick: (b) => { E.removeCard(run, +b.dataset.uid); save(); const d = pendingRemove; pendingRemove = null; if (d) d(); },
};

// Impostazioni: interruttori e cursori applicati subito.
document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.set;
  if (!k) return;
  A.settings[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'radio' ? e.target.value : +e.target.value;
  if (k === 'track') $$('.track').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
  A.saveSettings();
  if (k === 'music' || k === 'sfx') $$(`[data-set="${k}Vol"]`).forEach((r) => { r.disabled = !A.settings[k]; });
  if (k === 'cosmetics' && run && $('#pig')) { $('#pig').remove(); render(); }
  if (k === 'sfxVol' || k === 'sfx') A.sfx('eat');
});
// L'audio parte solo dopo il primo gesto dell'utente (regola dei browser).
document.addEventListener('pointerdown', () => A.unlock(), { once: true });
document.addEventListener('keydown', () => A.unlock(), { once: true });

document.addEventListener('click', (e) => {
  if (e.target.closest('.btn, .hbtn, .tab, .chipf, .pile, .dropdown button')) A.sfx('click');
  if (!e.target.closest('.menu-wrap')) closeMenu();
  if (!e.target.closest('.tile, #hand .card, .relic')) hideTip();
  const card = e.target.closest('#hand .card');
  if (card && !modalOpen()) { onCard(+card.dataset.card); return; }
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled || !b.dataset.act) return;
  const fn = ACTIONS[b.dataset.act];
  if (fn) fn(b);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
    if (modalOpen()) { if ($('#modal').dataset.closable) userClose(); return; }
    if (targeting) { targeting = null; render(); }
    return;
  }
  if (!modalOpen() && $('.tutorial')) {
    if (e.key === 'ArrowRight') showTutorial(tutStep + 1);
    if (e.key === 'ArrowLeft') showTutorial(tutStep - 1);
    return;
  }
  if (modalOpen() || !canAct() || (e.ctrlKey && e.key !== 'z') || e.altKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  const dirs = { arrowright: [1, 0], d: [1, 0], arrowleft: [-1, 0], a: [-1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
  if (dirs[k]) {
    e.preventDefault();
    const [dx, dy] = dirs[k], P = run.D.pig;
    if (targeting) {
      const t = targeting.targets.find((p) => Math.sign(p.x - P.x) === dx && Math.sign(p.y - P.y) === dy);
      if (t) onTile(t.y * run.D.w + t.x);
      return;
    }
    doMove(P.x + dx, P.y + dy);
  } else if (/^[1-9]$/.test(k)) onCard(+k - 1);
  else if (relax() && (k === 'enter' || k === ' ')) { e.preventDefault(); relaxWait(); }
  else if (k === 'enter') { e.preventDefault(); endTurn(); }
  else if (k === 'z' && !relax()) { e.preventDefault(); doUndo(); }
});

showTitle();

// Il menu delle modalità si chiude cliccando altrove.
document.addEventListener('click', (e) => {
  const m = document.querySelector('.mode-menu');
  if (m && !m.hidden && !e.target.closest('#mode-pick')) m.hidden = true;
});
