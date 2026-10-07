// Negozio: catalogo dei prodotti, cosa possiede il giocatore, e il punto dove collegare i pagamenti.
//
// Stato attuale: nessun metodo di pagamento è attivo (provider 'none'), quindi «Compra» non addebita nulla.
// Per attivarli servirà un piccolo backend (per esempio Stripe Checkout con un webhook) che confermi
// il pagamento e restituisca una ricevuta firmata: il solo browser non è un posto sicuro dove decidere
// chi ha pagato, perché chiunque può modificare il proprio localStorage. Un nuovo provider deve solo
// implementare checkout(product) → { ok, receipt? , reason? } e registrarsi con setProvider().
import { PIGS, COSMETICS } from './data.js';

const OWNED = 'piggy.owned.v1', RECEIPTS = 'piggy.receipts.v1';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage non disponibile */ } };

// Ogni prodotto concede una lista di «diritti» (es. 'pig:lampo', 'look:corona').
export const PRODUCTS = [
  ...Object.entries(PIGS).filter(([, p]) => p.price).map(([id, p]) => ({
    id: `pig_${id}`, kind: 'pig', ref: id, name: p.name, price: p.price, grants: [`pig:${id}`],
  })),
  ...Object.entries(COSMETICS).filter(([, c]) => c.price).map(([id, c]) => ({
    id: `look_${id}`, kind: 'look', ref: id, name: c.name, price: c.price, grants: [`look:${id}`],
  })),
  { id: 'bundle_pigs', kind: 'bundle', name: 'Tutti i maialini', icon: '🐷', price: 299,
    desc: 'Sblocca subito Grufolo, Lampo, Ciccio e Nebbia.', grants: Object.keys(PIGS).filter((id) => PIGS[id].price).map((id) => `pig:${id}`) },
  { id: 'bundle_looks', kind: 'bundle', name: 'Guardaroba completo', icon: '🎩', price: 499,
    desc: 'Tutti gli accessori in vendita, per tutti i maialini.', grants: Object.keys(COSMETICS).filter((id) => COSMETICS[id].price).map((id) => `look:${id}`) },
];
export const product = (id) => PRODUCTS.find((p) => p.id === id);

export const owned = () => new Set(read(OWNED, []));
function grant(p, receipt) {
  const set = owned();
  p.grants.forEach((g) => set.add(g));
  write(OWNED, [...set]);
  write(RECEIPTS, [...read(RECEIPTS, []), { product: p.id, at: new Date().toISOString(), receipt }]);
}
export const ownsAll = (p) => { const set = owned(); return p.grants.every((g) => set.has(g)); };

// ---------- pagamenti ----------
export const providers = {
  none: {
    name: 'Nessuno',
    active: false,
    async checkout() { return { ok: false, reason: 'pending' }; },
  },
};
let provider = providers.none;
export const paymentsActive = () => provider.active;
export function setProvider(p) { provider = p; }

export async function purchase(id) {
  const p = product(id);
  if (!p) return { ok: false, reason: 'unknown' };
  if (ownsAll(p)) return { ok: true, already: true };
  const res = await provider.checkout(p);
  if (res.ok) grant(p, res.receipt || null);
  return res;
}
export async function restore() { return { ok: false, reason: 'pending' }; }

export const formatPrice = (cents) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

// ---------- sblocchi: giocando oppure comprando ----------
const goalReached = (goal, prof) => !!goal && (prof[goal.stat] || 0) >= goal.n;
export function pigStatus(id, prof) {
  const p = PIGS[id];
  if (!p.goal) return { ok: true, how: 'free' };
  if (owned().has(`pig:${id}`)) return { ok: true, how: 'bought' };
  if (goalReached(p.goal, prof)) return { ok: true, how: 'goal' };
  return { ok: false, goal: p.goal, progress: Math.min(prof[p.goal.stat] || 0, p.goal.n), price: p.price };
}
export function lookStatus(id, prof) {
  const c = COSMETICS[id];
  if (c.free) return { ok: true, how: 'free' };
  if (owned().has(`look:${id}`)) return { ok: true, how: 'bought' };
  if (goalReached(c.goal, prof)) return { ok: true, how: 'goal' };
  return { ok: false, goal: c.goal || null, progress: c.goal ? Math.min(prof[c.goal.stat] || 0, c.goal.n) : 0, price: c.price };
}
