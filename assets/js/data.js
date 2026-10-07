// Contenuti del gioco: maialini, carte, ciondoli, potenziamenti, compendio.
// Tutto ciò che qui è testo appare così com'è nell'interfaccia.

export const PIGS = {
  rosina: { name: 'Rosina', role: 'Equilibrata', hearts: 3, energia: 4, mano: 4, card: 'testata',
            power: 'Golosa', powerDesc: 'La prima mela di ogni turno vale doppio.',
            relaxPower: 'Cuore grande', relaxDesc: 'Parte con 3 vite invece di 2.' },
  grufolo: { name: 'Grufolo', role: 'Re del fango', hearts: 3, energia: 4, mano: 4, card: 'grufolata',
             power: 'Pelle di fango', powerDesc: 'Ogni rotolata dà +1 fango.',
             relaxPower: 'Pelle di fango', relaxDesc: 'Ogni rotolata dà +1 fango.',
             goal: { stat: 'giorni', n: 3, text: 'Supera 3 giornate in totale' }, price: 99 },
  lampo: { name: 'Lampo', role: 'Velocista', hearts: 2, energia: 3, mano: 4, card: 'scatto',
           power: 'Zampe leste', powerDesc: '2 passi gratis a ogni turno.',
           relaxPower: 'Zampe leste', relaxDesc: '4 passi per turno invece di 3.',
           goal: { stat: 'runs', n: 2, text: 'Gioca 2 partite' }, price: 99 },
  ciccio: { name: 'Ciccio', role: 'Forzuto', hearts: 4, energia: 4, mano: 3, card: 'spallata',
            power: 'Panzone', powerDesc: 'Gli spintoni non costano energia e fanno 2 danni.',
            relaxPower: 'Pellaccia', relaxDesc: 'Il primo colpo di ogni giornata non gli toglie la vita.',
            goal: { stat: 'bestDays', n: 5, text: 'Supera 5 giornate in una sola partita' }, price: 99 },
  nebbia: { name: 'Nebbia', role: 'Mistica', hearts: 2, energia: 4, mano: 5, card: 'fiuto',
            power: 'Incanto', powerDesc: 'La prima carta di ogni turno costa 1 in meno.',
            relaxPower: 'Mimetica', relaxDesc: 'Nel fango i contadini non la vedono.',
            goal: { stat: 'bestDays', n: 8, text: 'Supera 8 giornate in una sola partita' }, price: 99 },
};

// Famiglie di carte: il colore della fascia sulla carta.
export const TYPES = {
  move:  { name: 'Movimento', color: '#4f9fe0' },
  apple: { name: 'Mele', color: '#e5483e' },
  mud:   { name: 'Fango', color: '#8a5a33' },
  fight: { name: 'Lotta', color: '#ef8420' },
  trick: { name: 'Trucco', color: '#3f9a45' },
  magic: { name: 'Magia', color: '#8b5cd6' },
};

// target: tree = melo vicino (anche in diagonale) · grass = prato libero accanto
//   jump = 2 caselle in linea · jump3 = 2 o 3 caselle in linea · dir = direzione libera
//   dirAny = qualunque direzione · mud = qualunque pozza · foeAdj = animale accanto
//   foeRange = animale entro 3 caselle · fly = casella libera entro 3
// needs: belly = solo nei giorni con l'obiettivo pancia · onMud = devi essere su una pozza
// starter = solo nel mazzo iniziale, non compare fra i premi
export const CARDS = {
  // movimento
  passetto:    { name: 'Passetto', type: 'move', cost: 0, rarity: 'common', icon: '🐾', starter: true, desc: '+1 passo gratis.' },
  scatto:      { name: 'Scatto', type: 'move', cost: 0, rarity: 'common', icon: '💨', desc: '+2 passi gratis.' },
  trotto:      { name: 'Trotto', type: 'move', cost: 1, rarity: 'common', icon: '🏃', desc: '+3 passi gratis.' },
  galoppo:     { name: 'Galoppo', type: 'move', cost: 2, rarity: 'uncommon', icon: '🐎', desc: '+5 passi gratis.' },
  tuffo:       { name: 'Tuffo', type: 'move', cost: 1, rarity: 'common', icon: '🤸', target: 'jump', desc: 'Salti di 2 caselle in linea retta, anche sopra gli ostacoli.' },
  supersalto:  { name: 'Super salto', type: 'move', cost: 1, rarity: 'uncommon', icon: '🦘', target: 'jump3', desc: 'Salti di 2 o 3 caselle in linea retta, anche sopra gli ostacoli.' },
  scivolata:   { name: 'Scivolata', type: 'move', cost: 1, rarity: 'common', icon: '🛷', target: 'dir', desc: 'Scivoli dritto e ti fermi nella prima pozza che incontri.' },
  rotolone:    { name: 'Rotolone', type: 'move', cost: 2, rarity: 'uncommon', icon: '🎳', target: 'dir', desc: 'Rotoli dritto finché sbatti, raccogliendo tutto per strada.' },
  portale:     { name: 'Portale di fango', type: 'magic', cost: 2, rarity: 'rare', icon: '🌀', target: 'mud', desc: 'Ti tuffi in una pozza qualsiasi del campo, ovunque sia.' },
  ali:         { name: 'Ali di farfalla', type: 'magic', cost: 2, rarity: 'rare', icon: '🦋', target: 'fly', desc: 'Voli su una casella libera entro 3 di distanza.' },
  // mele
  scrollatina: { name: 'Scrollatina', type: 'apple', cost: 1, rarity: 'common', icon: '🍃', target: 'tree', starter: true, desc: 'Scuoti un melo vicino: cade 1 mela.' },
  testata:     { name: 'Testata', type: 'apple', cost: 1, rarity: 'common', icon: '🌳', target: 'tree', desc: 'Scuoti un melo vicino: cadono 2 mele.' },
  banchetto:   { name: 'Banchetto', type: 'apple', cost: 2, rarity: 'uncommon', icon: '🧺', desc: 'Ogni melo entro 2 caselle fa cadere una mela.' },
  spuntino:    { name: 'Spuntino', type: 'apple', cost: 1, rarity: 'common', icon: '🥪', desc: 'Mangi una mela tenuta da parte: +1 mela.' },
  raccolto:    { name: 'Raccolto', type: 'apple', cost: 1, rarity: 'uncommon', icon: '🧑‍🌾', desc: 'Mangi tutte le mele sulle caselle accanto a te.' },
  abbuffata:   { name: 'Abbuffata', type: 'apple', cost: 1, rarity: 'uncommon', icon: '🍽️', desc: 'Le prossime 3 mele di questo turno valgono +1.' },
  calamita:    { name: 'Naso calamita', type: 'magic', cost: 1, rarity: 'uncommon', icon: '🧲', desc: 'Le mele entro 2 caselle fanno un passo verso di te.' },
  doro:        { name: 'Mela d\'oro', type: 'magic', cost: 1, rarity: 'rare', icon: '✨', target: 'grass', exhaust: true, desc: 'Accanto a te spunta una mela d\'oro, che vale 3.' },
  semina:      { name: 'Seme magico', type: 'magic', cost: 2, rarity: 'rare', icon: '🌱', target: 'grass', exhaust: true, desc: 'Il prato accanto a te diventa un melo.' },
  pioggiamele: { name: 'Pioggia di mele', type: 'magic', cost: 3, rarity: 'rare', icon: '☔', exhaust: true, desc: '4 mele cadono dal cielo su prati a caso.' },
  // fango
  pozzanghera: { name: 'Pozzanghera', type: 'mud', cost: 1, rarity: 'common', icon: '💧', target: 'grass', starter: true, desc: 'Il prato accanto a te diventa una pozza profonda 1.' },
  grufolata:   { name: 'Grufolata', type: 'mud', cost: 1, rarity: 'common', icon: '🕳️', target: 'grass', desc: 'Scavi il prato accanto a te: pozza profonda 2.' },
  sorgente:    { name: 'Sorgente', type: 'mud', cost: 2, rarity: 'uncommon', icon: '⛲', target: 'grass', exhaust: true, desc: 'Il prato accanto a te diventa una pozza profonda 3.' },
  bis:         { name: 'Bis!', type: 'mud', cost: 1, rarity: 'common', icon: '🔁', needs: 'onMud', desc: 'Ti rotoli di nuovo nella pozza in cui sei.' },
  bagno:       { name: 'Bagno di lusso', type: 'mud', cost: 1, rarity: 'uncommon', icon: '🛁', desc: 'La prossima rotolata di questo turno vale doppio.' },
  perfetta:    { name: 'Rotolata perfetta', type: 'mud', cost: 1, rarity: 'uncommon', icon: '🎯', desc: 'Le rotolate di questo turno valgono +2.' },
  impacco:     { name: 'Impacco di bellezza', type: 'mud', cost: 0, rarity: 'uncommon', icon: '🧖', exhaust: true, desc: '+2 fango.' },
  tornado:     { name: 'Tornado di fango', type: 'mud', cost: 2, rarity: 'rare', icon: '🌪️', desc: 'Ti rotoli in tutte le pozze accanto a te, in catena.' },
  pioggerella: { name: 'Danza della pioggia', type: 'magic', cost: 1, rarity: 'uncommon', icon: '🌧️', exhaust: true, desc: 'Tutte le pozze +1 di profondità (massimo 3).' },
  // lotta
  grugnito:    { name: 'Grugnito', type: 'fight', cost: 1, rarity: 'common', icon: '📢', starter: true, desc: 'Scacci i corvi entro 3 caselle; i contadini non ti vedono per un turno.' },
  spallata:    { name: 'Spallata', type: 'fight', cost: 1, rarity: 'common', icon: '💥', target: 'foeAdj', desc: '2 danni a un animale accanto a te.' },
  fionda:      { name: 'Fionda di ghiande', type: 'fight', cost: 1, rarity: 'common', icon: '🪃', target: 'foeRange', desc: '1 danno a un animale entro 3 caselle.' },
  carica:      { name: 'Carica', type: 'fight', cost: 2, rarity: 'uncommon', icon: '🐗', target: 'dirAny', desc: 'Corri dritto: il primo animale che incontri subisce 2 danni.' },
  pelle:       { name: 'Pelle dura', type: 'fight', cost: 1, rarity: 'common', icon: '🛡️', desc: 'Pari il prossimo colpo che subisci in questo turno.' },
  strillo:     { name: 'Strillo acuto', type: 'fight', cost: 2, rarity: 'rare', icon: '😱', desc: '1 danno a tutti gli animali sul campo.' },
  scoreggia:   { name: 'Scoreggia sonica', type: 'magic', cost: 1, rarity: 'uncommon', icon: '🌫️', desc: 'Nube di gas qui e attorno per 2 turni: i nemici non ci entrano e lì sei al sicuro.' },
  // trucchi
  respiro:     { name: 'Respiro', type: 'trick', cost: 0, rarity: 'common', icon: '🫧', starter: true, desc: 'Peschi 1 carta.' },
  fiuto:       { name: 'Fiuto', type: 'trick', cost: 1, rarity: 'common', icon: '👃', desc: 'Peschi 2 carte.' },
  rimescolata: { name: 'Rimescolata', type: 'trick', cost: 0, rarity: 'uncommon', icon: '🔀', desc: 'Scarti le altre carte in mano e ne peschi altrettante.' },
  energetica:  { name: 'Merenda energetica', type: 'trick', cost: 0, rarity: 'rare', icon: '⚡', exhaust: true, desc: '+2 energia.' },
  tenerone:    { name: 'Faccia da tenerone', type: 'trick', cost: 1, rarity: 'uncommon', icon: '🥺', desc: 'In questo turno i contadini non si muovono e non ti vedono.' },
  travestimento: { name: 'Travestimento', type: 'trick', cost: 1, rarity: 'uncommon', icon: '🌿', desc: 'Ti travesti da cespuglio: a fine turno nessuno ti colpisce.' },
  tesoretto:   { name: 'Tesoretto', type: 'trick', cost: 1, rarity: 'common', icon: '💰', exhaust: true, desc: '+3 ghiande.' },
  calma:       { name: 'Calma piatta', type: 'trick', cost: 1, rarity: 'uncommon', icon: '🍂', desc: 'Annulli sole, nuvole e fulmini di questo turno.' },
  ruttino:     { name: 'Ruttino', type: 'trick', cost: 0, rarity: 'common', icon: '💭', needs: 'belly', desc: 'Pancia −3 (solo nei giorni con l\'obiettivo pancia).' },
  stomaco:     { name: 'Secondo stomaco', type: 'trick', cost: 1, rarity: 'uncommon', icon: '🍲', needs: 'belly', exhaust: true, desc: '+3 pancia massima fino a fine giornata.' },
  clessidra:   { name: 'Clessidra di fango', type: 'magic', cost: 2, rarity: 'rare', icon: '⏳', exhaust: true, desc: 'Questa giornata dura un turno in più.' },
};

export const STARTING_DECK = ['passetto', 'passetto', 'passetto', 'scrollatina', 'scrollatina', 'pozzanghera', 'grugnito', 'respiro'];

export const RELICS = {
  campanaccio:     { name: 'Campanaccio', icon: '🔔', desc: '+1 energia nel primo turno di ogni giornata.' },
  codino:          { name: 'Codino a cavatappi', icon: '➰', desc: 'Ogni terza mela mangiata nello stesso turno vale +2.' },
  stivali:         { name: 'Stivaletti di gomma', icon: '🥾', desc: 'La prima rotolata di ogni turno non consuma la pozza.' },
  bandana:         { name: 'Bandana rossa', icon: '🧣', desc: 'I contadini vedono una casella in meno.' },
  spaventapasseri: { name: 'Spaventapasseri tascabile', icon: '🎃', desc: 'Scacci i corvi anche da 2 caselle di distanza.' },
  ombrellino:      { name: 'Ombrellino', icon: '☂️', desc: 'Il sole non asciuga più le pozze.' },
  tartufo:         { name: 'Tartufo portafortuna', icon: '🍄', desc: 'Peschi una carta in più a ogni turno.' },
  panciadiferro:   { name: 'Pancia di ferro', icon: '🥘', desc: '+3 pancia massima.' },
  maschera:        { name: 'Maschera di fango', icon: '🎭', desc: 'Ogni rotolata dà +1 fango.' },
  melodoro:        { name: 'Seme dorato', icon: '🌟', desc: 'All\'inizio di ogni giornata spunta una mela d\'oro.' },
  nuvoletta:       { name: 'Nuvoletta', icon: '⛅', desc: 'A fine turno una pozza a caso cresce di 1.' },
  mantellina:      { name: 'Mantellina cerata', icon: '🧥', desc: 'Le secchiate ti tolgono solo 1 fango.' },
  salvadanaio:     { name: 'Salvadanaio', icon: '🏺', desc: '+50% di ghiande guadagnate.' },
  zoccoli:         { name: 'Zoccoli veloci', icon: '👟', desc: '+1 passo gratis a ogni turno.' },
  ghianda:         { name: 'Ghianda magica', icon: '🌰', desc: 'Ogni turno avanzato a fine giornata vale 1 ghianda in più.' },
  bavaglino:       { name: 'Bavaglino', icon: '🧷', desc: 'La prima mela di ogni giornata vale +2.' },
  zanne:           { name: 'Zanne di cinghiale', icon: '🦷', desc: 'Gli spintoni fanno 1 danno in più.' },
  parafulmine:     { name: 'Parafulmine', icon: '🗼', desc: 'I fulmini non ti colpiscono più.' },
  osso:            { name: 'Osso di gomma', icon: '🦴', desc: 'I cani non abbaiano più: ti seguono e basta.' },
};

export const UPGRADES = {
  energia: { name: '+1 Energia', icon: '⚡', weight: 2, desc: 'Un punto di energia in più a ogni turno.' },
  mano:    { name: '+1 Carta', icon: '🃏', weight: 2, desc: 'Peschi una carta in più a ogni turno.' },
  cuore:   { name: '+1 Cuore', icon: '❤️', weight: 3, desc: 'Un cuore massimo in più, già pieno.' },
  pancia:  { name: '+2 Pancia', icon: '🫃', weight: 2, desc: 'Nei giorni con l\'obiettivo pancia, contiene 2 mele in più.' },
  pota:    { name: 'Sfoltisci il mazzo', icon: '✂️', weight: 4, desc: 'Togli una carta a scelta dal mazzo.' },
  heal:    { name: 'Cura un cuore', icon: '💗', weight: 0, desc: 'Recuperi un cuore perso.' },
};

export const RARITY_NAME = { common: 'Comune', uncommon: 'Speciale', rare: 'Rara' };

// Il compendio: tutto ciò che si può incontrare sul campo. Si sblocca vedendolo.
export const BESTIARY = [
  { group: 'Animali e contadini', items: [
    { id: 'farmer', name: 'Contadino', relax: 'Guarda dritto davanti a sé (zona rossa). Se il turno finisce con te lì dentro, secchiata: −1 vita. Avanza di 2 caselle a turno e gira a destra davanti agli ostacoli.', desc: 'Guarda dritto davanti a sé (zona rossa). Se finisci il turno lì: secchiata, −3 fango. Poi avanza di 2 caselle, girando a destra davanti agli ostacoli. Non si può spingere.' },
    { id: 'crow', name: 'Corvo', hp: 1, relax: 'Si posa su una mela e la mangia dopo 2 turni (il numero sul corvo). Passagli accanto e scappa. Ruba solo mele, non vite.', desc: 'Si posa su una mela e a fine turno la mangia, a meno che tu non gli sia accanto. Se la mangi tu prima, scappa.' },
    { id: 'dog', name: 'Cane da guardia', hp: 2, relax: 'Corre di 2 passi verso di te a ogni turno. Se il turno finisce con te accanto a lui, morso: −1 vita. Dopo un morso si riposa per 2 turni.', desc: 'A fine turno, se gli sei accanto, abbaia: il turno dopo hai 1 energia in meno. Poi corre di 2 caselle verso di te.' },
    { id: 'goose', name: 'Oca guardiana', hp: 2, desc: 'Fa la guardia alle mele d\'oro e non si muove. Se finisci il turno vicino a lei (zona gialla): beccata, −2 mele.' },
    { id: 'bull', name: 'Toro', hp: 3, desc: 'Carica in linea retta (zona viola). Se sei sulla sua strada a fine turno: incornata, −3 fango e −2 mele. Calpesta le mele.' },
  ] },
  { group: 'Oggetti', items: [
    { id: 'apple', name: 'Mela', desc: 'Passaci sopra per mangiarla: +1 mela.' },
    { id: 'gold', name: 'Mela d\'oro', desc: 'Vale 3 mele. Spesso c\'è un\'oca a farle la guardia.' },
    { id: 'acorn', name: 'Ghianda', desc: '+1 ghianda, la moneta del Mercato.' },
    { id: 'mushroom', name: 'Fungo', desc: '+1 energia subito.' },
    { id: 'clover', name: 'Quadrifoglio', desc: 'Peschi subito una carta.' },
  ] },
  { group: 'Meteo e fenomeni', items: [
    { id: 'drop', name: 'Mela in caduta', relax: 'Alla fine del turno, da un melo vicino cade una mela qui.', desc: 'A fine turno, da un melo vicino cade una mela qui.' },
    { id: 'sun', name: 'Sole cocente', desc: 'A fine turno asciuga di 1 la pozza su cui splende.' },
    { id: 'cloud', name: 'Nuvola di pioggia', desc: 'A fine turno piove qui: nasce o cresce una pozza, e crescono quelle accanto.' },
    { id: 'rainbow', name: 'Arcobaleno', desc: 'A fine turno qui spunta una mela d\'oro.' },
    { id: 'bolt', name: 'Fulmine', desc: 'A fine turno colpisce qui: se ci sei, −2 fango e −2 mele. Brucia le mele.' },
    { id: 'gas', name: 'Nube di gas', desc: 'Nessun animale né contadino ci entra; se ci sei dentro a fine turno, sei al sicuro.' },
  ] },
  { group: 'Il campo', items: [
    { id: 'mud', name: 'Pozza di fango', desc: 'Entrandoci ti rotoli: fango pari alla profondità, +1 per ogni rotolata già fatta nel turno. La pozza cala di 1.' },
    { id: 'tree', name: 'Melo', desc: 'Non si attraversa. Le mele ci cadono attorno.' },
    { id: 'rock', name: 'Sasso', desc: 'Non si attraversa.' },
    { id: 'bush', name: 'Cespuglio', desc: 'Non si attraversa.' },
  ] },
];

// Regole speciali della sfida del giorno: ogni data ne pesca un vantaggio e uno svantaggio.
export const DAILY_RULES = {
  // vantaggi
  mano:     { good: true, icon: '🃏', name: 'Mano generosa', desc: 'Peschi una carta in più a ogni turno.' },
  ricchi:   { good: true, icon: '💰', name: 'Partenza ricca', desc: 'Inizi con 15 ghiande e un ciondolo a caso.' },
  scattanti: { good: true, icon: '💨', name: 'Zampe allenate', desc: 'Nel mazzo iniziale ci sono 2 Scatto in più.' },
  doro:     { good: true, icon: '🌟', name: 'Frutteto d\'oro', desc: 'Ogni giornata spunta una mela d\'oro in più.' },
  fango:    { good: true, icon: '🟤', name: 'Terreno fradicio', desc: 'Le pozze partono sempre 1 più profonde.' },
  pigri:    { good: true, icon: '😴', name: 'Contadini pigri', desc: 'I contadini avanzano di 1 sola casella per turno.' },
  // svantaggi
  appetito: { good: false, icon: '🍽️', name: 'Gara d\'appetito', desc: 'Gli obiettivi di mele sono più alti del 25%.' },
  sole:     { good: false, icon: '☀️', name: 'Estate torrida', desc: 'A ogni turno il sole asciuga una pozza in più.' },
  corvi:    { good: false, icon: '🐦', name: 'Stormo affamato', desc: 'In ogni giornata c\'è un corvo in più.' },
  corte:    { good: false, icon: '⏳', name: 'Giornate corte', desc: 'Solo 6 turni al giorno, ma ghiande raddoppiate.' },
  fragile:  { good: false, icon: '💔', name: 'Cuore fragile', desc: 'Un cuore in meno (minimo 1), ma +30% di ghiande.' },
  tori:     { good: false, icon: '🐂', name: 'Tori in anticipo', desc: 'Un toro sul campo già dal giorno 4.' },
};

// Accessori estetici per i maialini: non cambiano il gioco.
// free = subito disponibile · goal = si sblocca giocando · price = in vendita nel negozio (centesimi di euro)
export const SLOTS = { testa: 'Testa', occhi: 'Occhi', collo: 'Collo' };
export const COSMETICS = {
  paglia:     { slot: 'testa', name: 'Cappello di paglia', free: true },
  cappellino: { slot: 'testa', name: 'Cappellino', price: 49 },
  cilindro:   { slot: 'testa', name: 'Cilindro', price: 99 },
  vichingo:   { slot: 'testa', name: 'Elmo vichingo', price: 99 },
  corona:     { slot: 'testa', name: 'Corona', goal: { stat: 'bestDays', n: 15, text: 'Supera 15 giornate in una sola partita' }, price: 149 },
  tondi:      { slot: 'occhi', name: 'Occhiali tondi', free: true },
  sole:       { slot: 'occhi', name: 'Occhiali da sole', goal: { stat: 'bestDays', n: 6, text: 'Supera 6 giornate in una sola partita' }, price: 49 },
  monocolo:   { slot: 'occhi', name: 'Monocolo', price: 49 },
  pirata:     { slot: 'occhi', name: 'Benda da pirata', price: 49 },
  farfallino: { slot: 'collo', name: 'Farfallino', free: true },
  campanella: { slot: 'collo', name: 'Campanaccio', goal: { stat: 'giorni', n: 10, text: 'Supera 10 giornate in totale' }, price: 49 },
  sciarpa:    { slot: 'collo', name: 'Sciarpa a righe', price: 49 },
  perle:      { slot: 'collo', name: 'Collana di perle', price: 99 },
};

// Ciò che si incontra nella modalità Relax.
export const RELAX_IDS = ['farmer', 'crow', 'dog', 'apple', 'drop', 'mud', 'tree', 'rock', 'bush'];
