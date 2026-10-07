// Assalto: disegni dei difensori (SVG → immagini per il canvas) e disegno della mappa.
import { arenaPigSVG } from './art.js';
import { APIGS } from './arena-data.js';
import { MAP_W, MAP_H } from './assault-data.js';
import { HOUSE } from './assault-engine.js';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const toImg = (svg) => { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg ${NS} `)); return im; };

// ---------- contadini ----------
function farmer({ skin = '#f2c9a5', shirt = '#e8413c', pants = '#3f6fb5', hat = '', tool = '', extra = '', beard = '' }) {
  return `<svg viewBox="0 0 64 80">
  <ellipse cx="32" cy="76" rx="18" ry="4" fill="#000" opacity=".2"/>
  <rect x="22" y="54" width="8" height="20" rx="3" fill="${pants}" stroke="#2b2433" stroke-width="2"/>
  <rect x="34" y="54" width="8" height="20" rx="3" fill="${pants}" stroke="#2b2433" stroke-width="2"/>
  <path d="M20 72h11v4H18zM33 72h11l2 4H33z" fill="#5a3a22"/>
  <path d="M17 38q15-8 30 0l-2 20H19z" fill="${shirt}" stroke="#2b2433" stroke-width="2" stroke-linejoin="round"/>
  <path d="M23 40h18v16H23z" fill="${pants}" stroke="#2b2433" stroke-width="1.6"/>
  <circle cx="25.5" cy="43" r="1.4" fill="#ffd34d"/><circle cx="38.5" cy="43" r="1.4" fill="#ffd34d"/>
  ${extra}
  <circle cx="32" cy="27" r="11" fill="${skin}" stroke="#2b2433" stroke-width="2"/>
  <circle cx="28" cy="26" r="1.6" fill="#2b2433"/><circle cx="36" cy="26" r="1.6" fill="#2b2433"/>
  <ellipse cx="32" cy="30" rx="2.4" ry="1.8" fill="#e09a7c"/>
  <circle cx="26" cy="30.5" r="2" fill="#ff8f8f" opacity=".5"/><circle cx="38" cy="30.5" r="2" fill="#ff8f8f" opacity=".5"/>
  ${beard}
  <path d="M28 34q4 2 8 0" stroke="#2b2433" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  ${hat}
  ${tool}
</svg>`;
}
const HATS = {
  paglia: '<ellipse cx="32" cy="17" rx="17" ry="4.5" fill="#f2cf6b" stroke="#b08a2a" stroke-width="2"/><path d="M23 17c0-9 18-9 18 0z" fill="#f2cf6b" stroke="#b08a2a" stroke-width="2"/><path d="M23.5 14.5h17" stroke="#e8413c" stroke-width="2.4"/>',
  caccia: '<path d="M21 20c0-11 22-11 22 0z" fill="#ff7a1c" stroke="#9c4a0e" stroke-width="2"/><path d="M41 19l8 2-8 1z" fill="#ff7a1c" stroke="#9c4a0e" stroke-width="1.6"/>',
  berretto: '<path d="M21 21c0-12 22-12 22 0z" fill="#3f86e0" stroke="#1f4f8f" stroke-width="2"/><path d="M21 20l-8 1 8 2z" fill="#3f86e0" stroke="#1f4f8f" stroke-width="1.6"/>',
  fazzoletto: '<path d="M20 26c0-15 24-15 24 0-4-4-20-4-24 0z" fill="#d94f9b" stroke="#8a2a5e" stroke-width="2"/><circle cx="32" cy="13" r="4" fill="#d9d9d9" stroke="#8a8a8a" stroke-width="1.4"/><circle cx="24" cy="18" r="1.2" fill="#fff"/><circle cx="36" cy="16" r="1.2" fill="#fff"/>',
  cuffia: '<path d="M21 22c0-12 22-12 22 0z" fill="#fff" stroke="#9aa3ad" stroke-width="2"/><path d="M30 13h4v3h3v4h-3v3h-4v-3h-3v-4h3z" fill="#e8413c"/>',
  cowboy: '<path d="M14 19c4 4 32 4 36 0-2 4-34 4-36 0z" fill="#8a5a33" stroke="#4e2f16" stroke-width="2"/><path d="M23 19c0-11 4-12 9-7 5-5 9-4 9 7z" fill="#8a5a33" stroke="#4e2f16" stroke-width="2"/><path d="M23.5 15.5h17" stroke="#4e2f16" stroke-width="2.6"/>',
};
const TOOLS = {
  forcone: '<g stroke="#5a3a22" stroke-width="3" stroke-linecap="round"><path d="M48 70L54 18"/></g><g stroke="#9aa3ad" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M48 18q6-4 12 2M54 18V6M48.5 19l-1-12M59.5 20l1.5-12"/></g><circle cx="47" cy="48" r="4" fill="#f2c9a5" stroke="#2b2433" stroke-width="1.6"/>',
  fucile: '<g transform="rotate(-35 40 50)"><rect x="18" y="47" width="40" height="4" rx="1.5" fill="#2b2433"/><path d="M14 46h14l2 8H14z" fill="#8a5a33" stroke="#4e2f16" stroke-width="1.4"/></g><circle cx="44" cy="46" r="4" fill="#f2c9a5" stroke="#2b2433" stroke-width="1.6"/>',
  fionda: '<path d="M46 60V44M46 44l-6-10M46 44l6-10" stroke="#8a5a33" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M40 34q6 10 12 0" stroke="#e8413c" stroke-width="1.6" fill="none"/><circle cx="46" cy="52" r="4" fill="#f2c9a5" stroke="#2b2433" stroke-width="1.6"/>',
  scopa: '<path d="M50 20L46 62" stroke="#a8743f" stroke-width="3" stroke-linecap="round"/><path d="M40 60l12 2 2 12-18-3z" fill="#f2cf6b" stroke="#b08a2a" stroke-width="1.8" stroke-linejoin="round"/><circle cx="48" cy="44" r="4" fill="#f2c9a5" stroke="#2b2433" stroke-width="1.6"/>',
  borsa: '<rect x="40" y="50" width="16" height="12" rx="3" fill="#fff" stroke="#9aa3ad" stroke-width="2"/><path d="M45 50v-3h6v3" stroke="#9aa3ad" stroke-width="2" fill="none"/><path d="M47 53h2v2h2v2h-2v2h-2v-2h-2v-2h2z" fill="#e8413c"/>',
  doppietta: '<g transform="rotate(-30 40 50)"><rect x="18" y="45" width="42" height="3.2" rx="1.2" fill="#2b2433"/><rect x="18" y="49" width="42" height="3.2" rx="1.2" fill="#3b3550"/><path d="M12 44h14l2 10H12z" fill="#6b4420" stroke="#3f2612" stroke-width="1.4"/></g><circle cx="44" cy="46" r="4" fill="#f2c9a5" stroke="#2b2433" stroke-width="1.6"/>',
};
const SCARECROW = `<svg viewBox="0 0 64 80"><ellipse cx="32" cy="77" rx="12" ry="3" fill="#000" opacity=".2"/>
  <path d="M32 30v46" stroke="#8a5a33" stroke-width="4"/><path d="M8 40h48" stroke="#8a5a33" stroke-width="4" stroke-linecap="round"/>
  <path d="M16 36h32l-4 26H20z" fill="#5c9e3f" stroke="#2f5a1e" stroke-width="2" stroke-linejoin="round"/><path d="M22 44l4 4M36 52l5-3" stroke="#e8d27a" stroke-width="1.6"/>
  <g stroke="#e8c45a" stroke-width="2" stroke-linecap="round"><path d="M8 40l-5-3M8 40l-5 3M56 40l5-3M56 40l5 3M22 62l-2 6M42 62l2 6M32 62v6"/></g>
  <circle cx="32" cy="24" r="11" fill="#d9b98a" stroke="#8a6a3f" stroke-width="2"/>
  <path d="M26 21l4 3M30 21l-4 3M34 21l4 3M38 21l-4 3" stroke="#2b2433" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M25 30q7 4 14 0" stroke="#2b2433" stroke-width="1.6" fill="none"/><path d="M27 30v2M31 31v2M35 31v2M38 30v2" stroke="#2b2433" stroke-width="1"/>
  <ellipse cx="32" cy="14" rx="17" ry="4" fill="#f2cf6b" stroke="#b08a2a" stroke-width="2"/><path d="M23 14c0-9 18-9 18 0z" fill="#f2cf6b" stroke="#b08a2a" stroke-width="2"/></svg>`;
const TRACTOR = `<svg viewBox="0 0 80 80"><ellipse cx="40" cy="74" rx="32" ry="5" fill="#000" opacity=".22"/>
  <path d="M30 26h18v20H30z" fill="#bfe6ff" stroke="#2b2433" stroke-width="2.4"/><path d="M26 22h26v4H26z" fill="#c62828" stroke="#2b2433" stroke-width="2"/>
  <path d="M10 46h52l6 12H8z" fill="#e53935" stroke="#2b2433" stroke-width="2.4" stroke-linejoin="round"/><path d="M48 40h16v8H48z" fill="#e53935" stroke="#2b2433" stroke-width="2"/>
  <path d="M60 30v12" stroke="#3b3550" stroke-width="4"/><path d="M58 28h4" stroke="#3b3550" stroke-width="3"/>
  <g transform="rotate(-20 36 30)"><rect x="34" y="20" width="30" height="8" rx="3" fill="#6b7a8f" stroke="#2b2433" stroke-width="2"/><circle cx="64" cy="24" r="4" fill="#3b3550"/></g>
  <circle cx="22" cy="60" r="14" fill="#2b2433"/><circle cx="22" cy="60" r="7" fill="#ffd34d" stroke="#2b2433" stroke-width="2"/>
  <circle cx="60" cy="64" r="8" fill="#2b2433"/><circle cx="60" cy="64" r="3.6" fill="#ffd34d"/>
  <circle cx="40" cy="34" r="6" fill="#f2c9a5" stroke="#2b2433" stroke-width="1.6"/><path d="M33 31c0-7 14-7 14 0z" fill="#3f86e0" stroke="#1f4f8f" stroke-width="1.4"/></svg>`;
const SVGS = {
  forcone: farmer({ hat: HATS.paglia, tool: TOOLS.forcone, shirt: '#e8413c', pants: '#3f6fb5' }),
  fionda: farmer({ hat: HATS.berretto, tool: TOOLS.fionda, shirt: '#ffd34d', pants: '#5c9e3f', skin: '#f5d0b0' }),
  fucile: farmer({ hat: HATS.caccia, tool: TOOLS.fucile, shirt: '#5a7a3a', pants: '#6b5a3a', beard: '<path d="M24 31q8 10 16 0" fill="#8a5a33"/>' }),
  nonna: farmer({ hat: HATS.fazzoletto, tool: TOOLS.scopa, shirt: '#8b3fd8', pants: '#8b3fd8', skin: '#f2d0b5', extra: '<path d="M19 54h26l3 12H16z" fill="#8b3fd8" stroke="#2b2433" stroke-width="2"/>' }),
  vet: farmer({ hat: HATS.cuffia, tool: TOOLS.borsa, shirt: '#ffffff', pants: '#7cc4ff' }),
  doppietta: farmer({ hat: HATS.cowboy, tool: TOOLS.doppietta, shirt: '#3b3550', pants: '#4e2f16', beard: '<path d="M23 30q9 14 18 0q-9 4-18 0z" fill="#c9c2d6"/>' }),
  spaventa: SCARECROW,
  trattore: TRACTOR,
};
export const DEF_SVG = SVGS;
const defCache = {}, pigCache = {};
export const defImg = (k) => defCache[k] || (defCache[k] = toImg(k === 'tagliola' ? TRAP_SVG : SVGS[k] || SVGS.forcone));
export const pigImg = (id) => pigCache[id] || (pigCache[id] = toImg(arenaPigSVG(APIGS[id].look)));
export const defIconHTML = (k) => (k === 'tagliola' ? TRAP_SVG : SVGS[k]).replace('<svg ', '<svg class="def-svg" ');
const TRAP_SVG = '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="40" rx="24" ry="9" fill="#000" opacity=".2"/><circle cx="32" cy="36" r="18" fill="none" stroke="#6b7a8f" stroke-width="4"/><path d="M14 36l4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6" stroke="#b8c2cc" stroke-width="2.4" fill="none" stroke-linejoin="round"/><rect x="28" y="32" width="8" height="8" rx="2" fill="#8a5a33"/></svg>';

// ---------- mappa ----------
// Sfondo disegnato una volta sola: prato, strade, cancelli, decorazioni, fattoria.
export function drawMapBG(ctx, map, T) {
  const W = MAP_W * T, H = MAP_H * T;
  ctx.clearRect(0, 0, W, H);
  // prato a scacchi morbidi
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#9fd87a' : '#a8de83';
    ctx.fillRect(x * T, y * T, T + 1, T + 1);
  }
  // ciuffi d'erba
  let s = map.seed | 0;
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  ctx.strokeStyle = '#7fc25a'; ctx.lineWidth = Math.max(1, T * 0.04); ctx.lineCap = 'round';
  for (let i = 0; i < MAP_W * MAP_H * 1.2; i++) {
    const x = r() * W, y = r() * H;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - T * 0.06, y - T * 0.14); ctx.moveTo(x, y); ctx.lineTo(x + T * 0.06, y - T * 0.14); ctx.stroke();
  }
  // strade: linee spesse fra caselle vicine, bordo più scuro
  const road = (x, y) => x >= 0 && x < MAP_W && y >= 0 && y < MAP_H && map.road[y][x] === '1';
  const segs = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (road(x, y)) {
    segs.push([x, y, x, y]);
    if (road(x + 1, y)) segs.push([x, y, x + 1, y]);
    if (road(x, y + 1)) segs.push([x, y, x, y + 1]);
  }
  const strokeRoad = (w, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [a, b, c, d] of segs) { ctx.moveTo((a + 0.5) * T, (b + 0.5) * T); ctx.lineTo((c + 0.5) * T + 0.01, (d + 0.5) * T); }
    ctx.stroke();
  };
  strokeRoad(T * 0.92, '#b8905e');
  strokeRoad(T * 0.78, '#e2c290');
  // la strada arriva fino alla porta
  ctx.strokeStyle = '#e2c290'; ctx.lineWidth = T * 0.78;
  ctx.beginPath(); ctx.moveTo(16.5 * T, 5.5 * T); ctx.lineTo(HOUSE.x * T + T * 0.4, 5.5 * T); ctx.stroke();
  ctx.fillStyle = '#c9a674';
  for (let i = 0; i < 160; i++) {
    const [a, b] = segs[Math.floor(r() * segs.length)] || [0, 0];
    ctx.beginPath(); ctx.arc((a + 0.2 + r() * 0.6) * T, (b + 0.2 + r() * 0.6) * T, T * (0.03 + r() * 0.03), 0, Math.PI * 2); ctx.fill();
  }
  // decorazioni
  for (const d of map.decor) drawDecor(ctx, d, T);
  // recinto e fattoria
  drawHouse(ctx, T);
  // cancelli
  map.gates.forEach((g, i) => drawGate(ctx, g, i, T));
}
function drawDecor(ctx, d, T) {
  const cx = (d.x + 0.5) * T, cy = (d.y + 0.5) * T;
  ctx.save();
  if (d.k === 'albero') {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(cx, cy + T * 0.36, T * 0.38, T * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a33'; ctx.fillRect(cx - T * 0.06, cy, T * 0.12, T * 0.36);
    ctx.fillStyle = '#4fae4c'; ctx.beginPath(); ctx.arc(cx, cy - T * 0.08, T * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6ac65f'; ctx.beginPath(); ctx.arc(cx - T * 0.1, cy - T * 0.18, T * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8413c'; ctx.beginPath(); ctx.arc(cx + T * 0.14, cy, T * 0.05, 0, Math.PI * 2); ctx.arc(cx - T * 0.16, cy + T * 0.06, T * 0.05, 0, Math.PI * 2); ctx.fill();
  } else if (d.k === 'cespuglio') {
    ctx.fillStyle = '#5cb84f';
    for (const [dx, dy, rr] of [[-0.15, 0.05, 0.2], [0.12, 0.05, 0.22], [0, -0.08, 0.22]]) { ctx.beginPath(); ctx.arc(cx + dx * T, cy + dy * T, rr * T, 0, Math.PI * 2); ctx.fill(); }
  } else if (d.k === 'sasso') {
    ctx.fillStyle = '#a9b0bb'; ctx.strokeStyle = '#6c7884'; ctx.lineWidth = T * 0.04;
    ctx.beginPath(); ctx.ellipse(cx, cy + T * 0.08, T * 0.26, T * 0.18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (d.k === 'fieno') {
    ctx.fillStyle = '#f2cf6b'; ctx.strokeStyle = '#b08a2a'; ctx.lineWidth = T * 0.04;
    ctx.beginPath(); ctx.roundRect(cx - T * 0.3, cy - T * 0.18, T * 0.6, T * 0.4, T * 0.08); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - T * 0.3, cy); ctx.lineTo(cx + T * 0.3, cy); ctx.stroke();
  } else if (d.k === 'fiori') {
    for (const [dx, dy, c] of [[-0.18, 0, '#ff8fb0'], [0.1, -0.12, '#ffd34d'], [0.15, 0.14, '#ffffff'], [-0.05, 0.18, '#d9b8ff']]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + dx * T, cy + dy * T, T * 0.07, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
function drawHouse(ctx, T) {
  const x = HOUSE.x * T, y = HOUSE.y * T, w = HOUSE.w * T, h = HOUSE.h * T;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h - T * 0.05, w * 0.55, T * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  // muri
  ctx.fillStyle = '#d6453a'; ctx.strokeStyle = '#7a1f17'; ctx.lineWidth = T * 0.06;
  ctx.beginPath(); ctx.rect(x + T * 0.15, y + h * 0.38, w - T * 0.3, h * 0.58); ctx.fill(); ctx.stroke();
  // tetto
  ctx.fillStyle = '#5a3a2e';
  ctx.beginPath(); ctx.moveTo(x - T * 0.05, y + h * 0.42); ctx.lineTo(x + w / 2, y + T * 0.05); ctx.lineTo(x + w + T * 0.05, y + h * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
  // finestra del fienile e porta a X
  ctx.fillStyle = '#fff3c4'; ctx.strokeStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.3, T * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2cf6b'; ctx.fillRect(x + w / 2 - T * 0.12, y + h * 0.3, T * 0.24, T * 0.12);
  const dx = x + T * 0.35, dy = y + h * 0.55, dw = T * 0.9, dh = h * 0.41;
  ctx.fillStyle = '#b8352c'; ctx.fillRect(dx, dy, dw, dh);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = T * 0.07;
  ctx.strokeRect(dx, dy, dw, dh); ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + dw, dy + dh); ctx.moveTo(dx + dw, dy); ctx.lineTo(dx, dy + dh); ctx.stroke();
  ctx.strokeRect(x + T * 1.6, y + h * 0.58, T * 0.9, h * 0.25);
  ctx.restore();
}
function drawGate(ctx, g, i, T) {
  const cx = (g.x + 0.5) * T, cy = (g.y + 0.5) * T;
  ctx.save();
  ctx.fillStyle = '#8a5a33'; ctx.strokeStyle = '#4e2f16'; ctx.lineWidth = T * 0.05;
  ctx.fillRect(cx - T * 0.45, cy - T * 0.55, T * 0.12, T * 1.1); ctx.strokeRect(cx - T * 0.45, cy - T * 0.55, T * 0.12, T * 1.1);
  ctx.fillRect(cx + T * 0.33, cy - T * 0.55, T * 0.12, T * 1.1); ctx.strokeRect(cx + T * 0.33, cy - T * 0.55, T * 0.12, T * 1.1);
  ctx.fillRect(cx - T * 0.5, cy - T * 0.62, T, T * 0.16); ctx.strokeRect(cx - T * 0.5, cy - T * 0.62, T, T * 0.16);
  ctx.restore();
}
export const GATE_NAMES = ['A', 'B', 'C'];
export { HOUSE };
