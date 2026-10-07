// Assalto: tower defense al contrario. Le truppe sono i maialini dell'Arena (stessi tag, effetti e rarità),
// i difensori sono i contadini. Questo file contiene solo dati; le regole stanno in assault-engine.js.

// ---------- struttura della partita ----------
export const ASSAULTS = 3, MAX_WAVES = 7, WAVE_TIME = 60;          // 3 fattorie, al massimo 7 ondate ciascuna, 60 s a ondata
export const MAP_W = 20, MAP_H = 11;                                // mappa in caselle
export const START_GOLD = 22, START_RANCIO = 12, RANCIO_GROWTH = 1; // rancio = punti per schierare in un'ondata
export const MAX_SQUADS = 6, SQUAD_SLOT_MAX = 8;
export const SPAWN_GAP = 0.6;                                      // secondi fra due maialini dallo stesso cancello

export const DEPLOY_COST = { comune: 1, raro: 2, epico: 3, leggendario: 4, eroico: 5 };
export const BUY_COST = { comune: 4, raro: 7, epico: 10, leggendario: 14, eroico: 18 };
export const LEVEL_COST = [0, 6, 10, 15, 20];                        // da livello L a L+1 costa LEVEL_COST[L]
export const MAX_LEVEL = 5;
export const REROLL = 2;
export const rancioCost = (bought) => 6 + bought * 3;               // +2 rancio, sempre più caro
export const slotCost = (slots) => 10 + (slots - MAX_SQUADS) * 6;   // un posto squadra in più
export const CHARM_PRICE = 12;

// Probabilità (%) delle rarità nel mercato, secondo i progressi (assalto 1..3, ondata 1..7).
export function marketOdds(assault, wave) {
  const p = (assault - 1) * 7 + wave;
  if (p <= 2) return [70, 30, 0, 0, 0];
  if (p <= 5) return [50, 32, 15, 3, 0];
  if (p <= 9) return [35, 30, 22, 10, 3];
  if (p <= 14) return [25, 27, 26, 15, 7];
  return [18, 24, 28, 19, 11];
}

// ---------- ruoli: dipendono da statistiche, effetti e tag del maialino ----------
export const ROLES = {
  guerriero: { name: 'Guerriero', color: '#e2361f', desc: 'Si ferma a combattere i contadini a portata. Robusto: subisce il 20% di danni in meno e attira su di sé i colpi.' },
  untore:    { name: 'Untore', color: '#8b3fd8', desc: 'Non si ferma: colpisce i contadini mentre passa e li riempie di effetti (bruciatura, veleno, fango, stordimento).' },
  supporto:  { name: 'Supporto', color: '#3f9a45', desc: 'Non si ferma: cura e protegge i maialini vicini.' },
  corridore: { name: 'Corridore', color: '#2f7fe0', desc: 'Corre dritto alla fattoria senza combattere e fa più danni alla fattoria. Schiva il 20% dei colpi.' },
};

// ---------- difensori ----------
// hp e dmg crescono col livello del difensore (+40% a livello). range in caselle, cd in secondi.
export const DEFENDERS = {
  forcone:   { name: 'Contadino col forcone', hp: 90, dmg: 18, cd: 1.0, range: 1.6, targets: 2, desc: 'Infilza fino a 2 maialini vicini.' },
  fionda:    { name: 'Monello con la fionda', hp: 50, dmg: 8, cd: 0.5, range: 3.0, desc: 'Tira sassolini a raffica.' },
  fucile:    { name: 'Cacciatore col fucile', hp: 65, dmg: 48, cd: 2.0, range: 4.3, desc: 'Lento ma letale, da molto lontano.' },
  nonna:     { name: 'Nonna con la scopa', hp: 80, dmg: 10, cd: 1.6, range: 1.6, knock: 1.2, desc: 'Ricaccia indietro i maialini a colpi di scopa.' },
  spaventa:  { name: 'Spaventapasseri', hp: 120, dmg: 0, cd: 1, range: 2.2, slow: 40, desc: 'Spaventa i maialini vicini: camminano il 40% più lenti.' },
  vet:       { name: 'Veterinaria', hp: 70, dmg: 0, cd: 1.5, range: 2.6, heal: 12, desc: 'Cura i contadini vicini.' },
  doppietta: { name: 'Fattore con la doppietta', hp: 110, dmg: 26, cd: 1.6, range: 3.0, splash: 0.9, desc: 'Pallini a ventaglio: colpisce tutti i maialini vicini al bersaglio.' },
  trattore:  { name: 'Trattore lanciapatate', hp: 260, dmg: 34, cd: 1.4, range: 3.6, splash: 1.1, desc: 'Una fortezza su ruote che spara patate esplosive.' },
  tagliola:  { name: 'Tagliola', hp: 70, dmg: 25, cd: 6, range: 0.5, trap: true, stun: 2, desc: 'Sulla strada: blocca il primo maialino che ci passa. Si ricarica.' },
};
// Quali difensori compaiono in ogni assalto (peso di estrazione).
export const DEF_POOL = [
  { forcone: 5, fionda: 4, fucile: 2, nonna: 2, spaventa: 1 },
  { forcone: 4, fionda: 3, fucile: 3, nonna: 2, spaventa: 2, vet: 1, doppietta: 2, tagliola: 1 },
  { forcone: 3, fionda: 3, fucile: 3, nonna: 2, spaventa: 2, vet: 2, doppietta: 3, trattore: 2, tagliola: 2 },
];
export const DEF_START = [7, 10, 12];          // difensori all'inizio di ogni assalto
export const DEF_LEVEL = [1, 2, 3];            // livello base dei difensori
export const REINFORCE = [1, 2, 3];            // rinforzi prima di ogni ondata dalla seconda
export const FARMHOUSE_HP = [600, 2000, 4200];

export const FARM_NAMES = ['Cascina dei Rovi', 'Podere Forcone', 'Fattoria Doppietta', 'Masseria del Lupo', 'Cascina Spaventapasseri',
  'Tenuta Fienile Rosso', 'Podere della Nonna', 'Fattoria Tre Querce', 'Cascina Patata', 'Tenuta del Cacciatore'];

// ---------- ciondoli d'assalto (uno per accampamento) ----------
export const ACHARMS_A = {
  braciere:  { name: 'Braciere', icon: '🏮', text: 'Chi applica bruciatura ne applica +2 per colpo.' },
  fiala:     { name: 'Fiala di veleno', icon: '⚗️', text: 'Chi applica veleno ne applica +1 per colpo.' },
  palude:    { name: 'Palude portatile', icon: '🐸', text: 'Chi applica fango ne applica +2 per colpo.' },
  corno:     { name: 'Corno da guerra', icon: '📯', text: 'Tutti i maialini camminano il 15% più veloci.' },
  elmo:      { name: 'Elmo di latta', icon: '🪖', text: 'Tutti i maialini subiscono il 15% di danni in meno.' },
  coppa:     { name: 'Coppa del campione', icon: '🏆', text: 'Danni ai difensori +20%.' },
  ariete:    { name: 'Ariete', icon: '🐏', text: 'Danni alla fattoria +25%.' },
  sacco:     { name: 'Sacco di ghiande', icon: '💰', text: '+25% ghiande guadagnate.' },
  pentolone: { name: 'Pentolone', icon: '🍲', text: '+3 rancio a ogni ondata.' },
  ricettario:{ name: 'Ricettario della nonna', icon: '📖', text: 'Cure e scudi dei Supporti +50%.' },
  mirino:    { name: 'Mirino', icon: '🔭', text: 'Tutti i maialini +10% critico.' },
  stendardo: { name: 'Stendardo', icon: '🚩', text: 'Tutti i maialini +15% vita.' },
};
