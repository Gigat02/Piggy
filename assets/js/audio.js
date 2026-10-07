// Musica ed effetti sintetizzati al volo con Web Audio: nessun file da scaricare.
// Il browser permette l'audio solo dopo un gesto dell'utente: unlock() va chiamato al primo clic.

const KEY = 'piggy.settings.v1';
const DEFAULTS = { music: true, sfx: true, musicVol: 0.5, sfxVol: 0.7, cosmetics: true, fast: false, track: 'fattoria' };
export const settings = (() => {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return { ...DEFAULTS }; }
})();
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage non disponibile */ }
  applyVolumes();
  if (settings.music) startMusic(); else stopMusic();
}

let ctx = null, musicBus = null, sfxBus = null, noiseBuf = null;
function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  musicBus = ctx.createGain(); sfxBus = ctx.createGain();
  musicBus.connect(ctx.destination); sfxBus.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVolumes();
  return ctx;
}
function applyVolumes() {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(settings.music ? settings.musicVol * 0.2 : 0, ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(settings.sfx ? settings.sfxVol * 0.45 : 0, ctx.currentTime, 0.02);
}
export function unlock() {
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (settings.music) startMusic();
}

// ---------- strumenti di base ----------
const hz = (semi) => 261.63 * 2 ** (semi / 12); // 0 = do centrale
function tone(f, t, d, type = 'square', g = 0.3, bus = sfxBus, f2 = null) {
  const o = ctx.createOscillator(), a = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  a.gain.setValueAtTime(0.0001, t);
  a.gain.exponentialRampToValueAtTime(g, t + 0.012);
  a.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(a); a.connect(bus);
  o.start(t); o.stop(t + d + 0.03);
}
function noise(t, d, g, freq, kind = 'lowpass', bus = sfxBus) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), a = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = kind; f.frequency.value = freq;
  a.gain.setValueAtTime(g, t);
  a.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f); f.connect(a); a.connect(bus);
  src.start(t, Math.random() * 0.5); src.stop(t + d + 0.03);
}

// ---------- effetti ----------
const SFX = {
  click: (t) => tone(720, t, 0.05, 'triangle', 0.15),
  step: (t) => tone(320, t, 0.06, 'sine', 0.12, sfxBus, 240),
  eat: (t) => { tone(660, t, 0.08, 'square', 0.18, sfxBus, 990); tone(990, t + 0.07, 0.09, 'square', 0.14); },
  gold: (t) => [880, 1109, 1319, 1760].forEach((f, i) => tone(f, t + i * 0.06, 0.12, 'square', 0.13)),
  mud: (t) => { noise(t, 0.28, 0.35, 420); tone(190, t, 0.24, 'sine', 0.3, sfxBus, 85); },
  pop: (t) => tone(480, t, 0.1, 'sine', 0.25, sfxBus, 900),
  card: (t) => { noise(t, 0.07, 0.18, 2400, 'bandpass'); tone(880, t, 0.06, 'triangle', 0.08); },
  draw: (t) => noise(t, 0.05, 0.1, 3200, 'bandpass'),
  bump: (t) => { tone(170, t, 0.13, 'square', 0.22, sfxBus, 80); noise(t, 0.08, 0.2, 900); },
  hit: (t) => tone(320, t, 0.12, 'sawtooth', 0.15, sfxBus, 140),
  hurt: (t) => tone(420, t, 0.28, 'sawtooth', 0.15, sfxBus, 120),
  splash: (t) => { noise(t, 0.4, 0.35, 1600, 'highpass'); noise(t + 0.05, 0.3, 0.2, 700, 'bandpass'); },
  coin: (t) => { tone(988, t, 0.07, 'square', 0.15); tone(1319, t + 0.07, 0.16, 'square', 0.15); },
  win: (t) => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.22, 'square', 0.13)),
  lose: (t) => [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.14, 0.3, 'triangle', 0.2)),
  oink: (t) => { tone(230, t, 0.13, 'sawtooth', 0.16, sfxBus, 170); tone(250, t + 0.15, 0.15, 'sawtooth', 0.16, sfxBus, 160); },
  fart: (t) => { tone(95, t, 0.45, 'sawtooth', 0.22, sfxBus, 55); noise(t, 0.45, 0.2, 260); },
  thunder: (t) => { noise(t, 0.9, 0.55, 220); noise(t, 0.2, 0.3, 2000, 'highpass'); },
  whoosh: (t) => noise(t, 0.3, 0.22, 1300, 'bandpass'),
  rain: (t) => noise(t, 0.9, 0.12, 4000, 'highpass'),
  dry: (t) => noise(t, 0.25, 0.1, 5000, 'highpass'),
  turn: (t) => { tone(523, t, 0.08, 'triangle', 0.12); tone(784, t + 0.08, 0.12, 'triangle', 0.12); },
};
export function sfx(name) {
  if (!settings.sfx || !ensure() || ctx.state !== 'running') return;
  const f = SFX[name];
  if (f) f(ctx.currentTime + 0.005);
}

// ---------- musica: due brani in loop, scelti dalle impostazioni ----------
// Ogni brano dichiara la durata di un ottavo e suona un ottavo alla volta.

// «Aia felice»: folk di campagna in sol maggiore. Fisarmonica, chitarra pizzicata,
// basso um-pa e un campanaccio all'inizio di ogni giro.
function accordion(f, t, d, g = 0.07) {
  const out = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 2000; lp.Q.value = 0.6;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.linearRampToValueAtTime(g, t + 0.035);
  out.gain.setValueAtTime(g, t + Math.max(0.04, d - 0.08));
  out.gain.linearRampToValueAtTime(0.0001, t + d);
  const vib = ctx.createOscillator(), vibAmt = ctx.createGain();
  vib.frequency.value = 5.5; vibAmt.gain.value = f * 0.004;
  vib.connect(vibAmt);
  for (const [type, mul, det, lvl] of [['sawtooth', 1, -5, 1], ['sawtooth', 1, 5, 1], ['square', 0.5, 0, 0.35]]) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = type; o.frequency.value = f * mul; o.detune.value = det; og.gain.value = lvl;
    vibAmt.connect(o.frequency);
    o.connect(og); og.connect(lp);
    o.start(t); o.stop(t + d + 0.05);
  }
  lp.connect(out); out.connect(musicBus);
  vib.start(t); vib.stop(t + d + 0.05);
}
function pluck(f, t, g = 0.06) {
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), a = ctx.createGain(), m = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = f;
  o2.type = 'sawtooth'; o2.frequency.value = f; m.gain.value = 0.35;
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.3);
  a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.006); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(lp); o2.connect(m); m.connect(lp); lp.connect(a); a.connect(musicBus);
  o.start(t); o2.start(t); o.stop(t + 0.5); o2.stop(t + 0.5);
}
function bassNote(f, t, d, g = 0.32) {
  const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), a = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = f;
  lp.type = 'lowpass'; lp.frequency.value = 500;
  a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(lp); lp.connect(a); a.connect(musicBus);
  o.start(t); o.stop(t + d + 0.03);
}
function cowbell(t, g = 0.05) { for (const f of [800, 540]) tone(f, t, 0.5, 'square', g, musicBus); }

const G = 7, C = 0, D = 2;
const FARM_CHORDS = [G, G, C, G, G, D, G, D, C, G, C, G, D, G, D, G];
const FARM_MELODY = [ // [nota in semitoni dal do centrale, durata in ottavi]
  [[11, 1], [12, 1], [14, 2], [14, 1], [16, 1], [14, 2]], [[11, 1], [9, 1], [7, 2], [11, 2], [14, 2]],
  [[16, 1], [16, 1], [16, 1], [14, 1], [12, 2], [16, 2]], [[14, 3], [11, 1], [7, 4]],
  [[11, 1], [12, 1], [14, 2], [19, 2], [14, 2]], [[18, 1], [16, 1], [14, 1], [12, 1], [9, 2], [6, 2]],
  [[7, 1], [9, 1], [11, 1], [12, 1], [14, 2], [11, 2]], [[9, 2], [6, 2], [7, 4]],
  [[16, 2], [16, 1], [19, 1], [16, 2], [12, 2]], [[14, 2], [11, 1], [14, 1], [19, 4]],
  [[16, 1], [19, 1], [16, 1], [14, 1], [12, 2], [16, 2]], [[14, 6], [null, 2]],
  [[18, 1], [19, 1], [21, 2], [18, 2], [14, 2]], [[19, 2], [14, 2], [11, 2], [7, 2]],
  [[9, 1], [11, 1], [12, 1], [14, 1], [16, 2], [18, 2]], [[19, 4], [null, 4]],
];
const farm = {
  eighth: 60 / 118 / 2,
  play(step, t) {
    const E8 = this.eighth, bar = Math.floor(step / 8) % 16, e = step % 8, root = FARM_CHORDS[bar];
    if (bar === 0 && e === 0) cowbell(t);
    if (e === 0) bassNote(hz(root - 24), t, E8 * 1.8);          // um…
    if (e === 4) bassNote(hz(root - 17), t, E8 * 1.8);          // …pa, sulla quinta
    if (e === 2 || e === 6) [0, 4, 7].forEach((iv, k) => pluck(hz(root + iv), t + k * 0.018, 0.045));
    let at = 0;
    for (const [n, len] of FARM_MELODY[bar]) {
      if (at === e && n != null) accordion(hz(n), t, len * E8 * 0.95);
      at += len;
    }
    if (e % 2 === 1) noise(t, 0.035, 0.035, 7000, 'highpass', musicBus);
  },
};

// «Chiptune»: il motivetto elettronico originale.
const ROOTS = [0, -3, 5, 7, 0, -3, 5, 7];
const MELODY = [
  [16, null, 19, 16, 21, 19, 16, null], [12, null, 16, 12, 21, null, 19, null],
  [17, null, 21, 17, 24, 21, 17, null], [19, 23, 26, 23, 19, null, 14, null],
  [16, 19, 21, 19, 16, null, 12, 14], [16, null, 12, null, 9, 12, 16, null],
  [17, 21, 24, 21, 17, null, 21, 19], [19, null, 16, null, 14, null, 12, null],
];
const chip = {
  eighth: 60 / 104 / 2,
  play(step, t) {
    const E8 = this.eighth, bar = Math.floor(step / 8) % 8, e = step % 8, root = ROOTS[bar];
    if (e === 0 || e === 4) tone(hz(root - 24), t, E8 * 3.2, 'triangle', 0.5, musicBus);
    if (e === 2 || e === 6) { tone(hz(root), t, E8 * 0.9, 'square', 0.06, musicBus); tone(hz(root + (bar % 4 === 1 ? 3 : 4)), t, E8 * 0.9, 'square', 0.05, musicBus); }
    const n = MELODY[bar][e];
    if (n != null) tone(hz(n), t, E8 * 0.85, 'square', 0.1, musicBus);
    if (e % 2 === 0) noise(t, 0.03, e === 0 ? 0.12 : 0.05, 6000, 'highpass', musicBus);
  },
};

export const TRACKS = {
  fattoria: { name: 'Aia felice', desc: 'Fisarmonica e chitarra di campagna', song: farm },
  chiptune: { name: 'Chiptune', desc: 'Il motivetto elettronico originale', song: chip },
};

let timer = null, nextAt = 0, step = 0, playing = null;
function schedule() {
  const song = (TRACKS[settings.track] || TRACKS.fattoria).song;
  if (song !== playing) { playing = song; step = 0; nextAt = Math.max(nextAt, ctx.currentTime + 0.05); }
  while (nextAt < ctx.currentTime + 0.25) {
    song.play(step, nextAt);
    nextAt += song.eighth; step++;
  }
}
function startMusic() {
  if (!ctx || timer) return;
  nextAt = ctx.currentTime + 0.1; playing = null;
  timer = setInterval(schedule, 60);
}
function stopMusic() { clearInterval(timer); timer = null; }
