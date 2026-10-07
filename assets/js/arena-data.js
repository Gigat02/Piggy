// Arena auto-battler: maialini, tratti, ciondoli, fattorie, effetti, tag e sinergie.
//
// Statistiche di un maialino: atk (danni per colpo, può essere 0) · hp (vita) · cd (attacca ogni cd secondi)
//   crit (% di colpo critico: danni ED effetti doppi) · hit = effetti applicati a ogni colpo:
//   burn (bruciatura) · poison (veleno) · mud (fango) · heal (cura la squadra) · shield (scudo alla squadra) · stun (% di stordire)
//
// Linguaggio dei poteri (interpretato da arena-engine.js, che ne scrive anche la descrizione):
//   power = { on, n?, t?, fx?, tag?, cond?, repeat?, repeatUp?, do: [effetti] }
//   on:  aura (sempre) · start (inizio battaglia) · end (dopo ogni battaglia) · win (alla vittoria) · lose (alla sconfitta)
//        attack (ogni n attacchi) · hurt (ogni n colpi subiti dalla squadra) · crit (al colpo critico)
//        ally (quando un alleato attiva un potere) · inflict (quando la squadra infligge l'effetto fx)
//        tagAttack (ogni n attacchi degli alleati col tag) · timer (ogni t secondi) · low (sotto metà vita, una volta)
//   effetti: stat (solo aure) · buff (fino a fine battaglia) · grow (permanente) · dmg · heal · shield · armor
//            burn · poison · mud · stun · haste · strike · gold · charm
//   stat/buff/grow agiscono su: atk · hp · spd (% velocità) · crit · burn · poison · mud · heal · shield · stun
//   I valori crescono col livello (v × livello); repeatUp aggiunge una ripetizione ai livelli 3 e 5.
//   Vita, cure, scudi e danni dei poteri sono moltiplicati dal moltiplicatore del giorno.

export const RARITIES = {
  comune:      { name: 'Comune', color: '#8e959f', cost: 3 },
  raro:        { name: 'Raro', color: '#2f7fe0', cost: 5 },
  epico:       { name: 'Epico', color: '#8b3fd8', cost: 7 },
  leggendario: { name: 'Leggendario', color: '#e0a20c', cost: 9 },
  eroico:      { name: 'Eroico', color: '#e2361f', cost: 12 },
};
export const RARITY_ORDER = ['comune', 'raro', 'epico', 'leggendario', 'eroico'];
// Probabilità (in %) di trovare ogni rarità nel negozio, in base al giorno.
export function shopOdds(day) {
  if (day <= 2) return [75, 25, 0, 0, 0];
  if (day <= 4) return [55, 30, 15, 0, 0];
  if (day <= 6) return [40, 30, 22, 8, 0];
  if (day <= 9) return [30, 28, 25, 13, 4];
  return [22, 25, 27, 18, 8];
}

// Vita della fattoria e moltiplicatore del giorno: ×1, ×1,5, ×2… fino al giorno 20.
export const FARM_HP = 250, MULT_STEP = 0.5, MULT_DAYS = 20;
export const dayMult = (day) => 1 + MULT_STEP * (Math.min(day, MULT_DAYS) - 1);

export const TAGS = {
  marinaio:  { name: 'Marinaio', plural: 'Marinai', color: '#2f7fe0', sets: [[2, 'I Marinai +2 attacco.'], [4, 'I Marinai +5 attacco e +10% critico.']] },
  lottatore: { name: 'Lottatore', plural: 'Lottatori', color: '#e2361f', sets: [[2, 'I Lottatori +25 vita.'], [4, 'I Lottatori +60 vita e la squadra parte con +2 corazza.']] },
  mago:      { name: 'Mago', plural: 'Maghi', color: '#8b3fd8', sets: [[2, 'I Maghi +1 bruciatura per colpo.'], [4, 'I Maghi +3 bruciatura per colpo.']] },
  cuoco:     { name: 'Cuoco', plural: 'Cuochi', color: '#f08a24', sets: [[2, 'I Cuochi +2 cura per colpo.'], [4, 'I Cuochi +4 cura per colpo e ogni 5 secondi la squadra si cura di 20.']] },
  musicista: { name: 'Musicista', plural: 'Musicisti', color: '#d94f9b', sets: [[2, 'Tutta la squadra +10% velocità.'], [4, 'Tutta la squadra +25% velocità.']] },
  ninja:     { name: 'Ninja', plural: 'Ninja', color: '#3b3550', sets: [[2, 'I Ninja +15% critico.'], [4, 'I Ninja +30% critico e i critici diventano ×2,5.']] },
  cavaliere: { name: 'Cavaliere', plural: 'Cavalieri', color: '#6b7a8f', sets: [[2, 'A inizio battaglia la squadra +2 corazza.'], [4, 'A inizio battaglia la squadra +5 corazza.']] },
  contadino: { name: 'Contadino', plural: 'Contadini', color: '#5c9e3f', sets: [[2, '+2 ghiande dopo ogni battaglia.'], [4, '+5 ghiande dopo ogni battaglia e i Contadini +3 attacco.']] },
  fangoso:   { name: 'Fangoso', plural: 'Fangosi', color: '#8a5a33', sets: [[2, 'I Fangosi +1 fango per colpo.'], [4, 'I Fangosi +2 fango per colpo e il nemico parte con 5 fango.']] },
  festaiolo: { name: 'Festaiolo', plural: 'Festaioli', color: '#e8960a', sets: [[2, 'Quando un alleato attiva un potere, la squadra si cura di 3.'], [4, 'Quando un alleato attiva un potere, la squadra si cura di 6 e chi l\'ha attivato +1 attacco.']] },
  alieno:    { name: 'Alieno', plural: 'Alieni', color: '#0f9e9e', sets: [[2, 'Gli Alieni +1 veleno per colpo.'], [4, 'Gli Alieni +2 veleno per colpo e +10% di stordire per colpo.']] },
  mostro:    { name: 'Mostro', plural: 'Mostri', color: '#7a2e3a', sets: [[2, 'Alla vittoria, i Mostri +1 attacco permanentemente.'], [4, 'Alla vittoria, i Mostri +2 attacco e +10 vita permanentemente.']] },
};

// Le 12 fattorie (una per tag): a inizio partita se ne sceglie una fra 3 estratte a caso. Vita base: 250 per tutte.
export const FARMS = {
  dojo:          { name: 'Dojo del Bambù', icon: '🎋', tag: 'ninja', bonus: 'I Ninja +10% critico.' },
  porto:         { name: 'Porto dei Pescatori', icon: '⛵', tag: 'marinaio', bonus: 'I Marinai +2 attacco.' },
  palestra:      { name: 'Palestra di Paese', icon: '🏋️', tag: 'lottatore', bonus: 'I Lottatori +15 vita.' },
  cucina:        { name: 'Cucina della Nonna', icon: '🥘', tag: 'cuoco', bonus: 'Cure e scudi +30%.' },
  torre:         { name: 'Torre del Mago', icon: '🗼', tag: 'mago', bonus: 'I Maghi +1 bruciatura per colpo.' },
  stalla:        { name: 'Stalla Fangosa', icon: '🛖', tag: 'fangoso', bonus: 'Il nemico parte con 4 fango.' },
  castello:      { name: 'Castello Pancetta', icon: '🏰', tag: 'cavaliere', bonus: 'A inizio battaglia la squadra +3 corazza.' },
  conservatorio: { name: 'Conservatorio Rosa', icon: '🎼', tag: 'musicista', bonus: 'Tutta la squadra +10% velocità.' },
  sagra:         { name: 'Sagra del Paese', icon: '🎡', tag: 'festaiolo', bonus: '+3 ghiande a ogni vittoria.' },
  cascina:       { name: 'Cascina Ghiandaia', icon: '🌳', tag: 'contadino', bonus: '+3 ghiande ogni giorno e cambiare il negozio costa 2.' },
  base:          { name: 'Base Spaziale Grugno', icon: '🛸', tag: 'alieno', bonus: 'I colpi degli Alieni hanno il 10% di stordire.' },
  grotta:        { name: 'Grotta dei Mostri', icon: '🕳️', tag: 'mostro', bonus: 'Alla vittoria, i Mostri +10 vita permanentemente.' },
};
export const FARM_TAG_WEIGHT = 3; // i maialini col tag della fattoria escono 3 volte più spesso

// Aspetto: c colore · shape n|grasso|mini|lungo|alto
//   eyes n|felici|arrabbiati|assonnati|matti|ciclope|puntini|quattro|robot|spirale|cuori
//   mouth sorriso|zanne|lingua|ghigno|o|broncio|baffi|denti · pat chiazze|strisce|galassia
//   body pinna|ali|aliangelo|guscio|mantello · fx fiamme|gocce|stelle|bolle|zzz|note|cuori
//   testa / occhi / collo = accessori di art.js (anche astronauta, antenne, corna, unicorno, cresta, fungo)
const A = (c, shape, eyes, mouth, extra = {}) => ({ c, shape, eyes, mouth, ...extra });
const S = (who, stat, v, more = {}) => ({ e: 'stat', who, stat, v, ...more });
const G = (who, stat, v, more = {}) => ({ e: 'grow', who, stat, v, ...more });
const B = (who, stat, v, more = {}) => ({ e: 'buff', who, stat, v, ...more });
const P = (name, r, tags, atk, hp, cd, look, power, more = {}) => ({ name, r, tags, atk, hp, cd, look, power, ...more });

// 90 maialini: 26 comuni, 23 rari, 18 epici, 14 leggendari, 9 eroici.
export const APIGS = {
  // ================= comuni (3 ghiande) =================
  zappetta:   P('Zappetta', 'comune', ['contadino', 'fangoso'], 6, 30, 2.5, A('#ffb6c9', 'n', 'felici', 'sorriso', { testa: 'paglia' }),
                { on: 'win', do: [G('self', 'hp', 6)] }, { hit: { mud: 1 } }),
  mozzo:      P('Mozzo Salsiccia', 'comune', ['marinaio', 'festaiolo'], 8, 26, 2.2, A('#ffc9a8', 'lungo', 'n', 'lingua', { testa: 'marinaio' }),
                { on: 'start', do: [B('adj', 'atk', 2)] }),
  pugnetto:   P('Pugnetto', 'comune', ['lottatore', 'contadino'], 8, 32, 2.6, A('#ff8f7e', 'grasso', 'arrabbiati', 'broncio', { testa: 'fascia' }),
                { on: 'aura', cond: 'front', do: [S('self', 'atk', 3)] }),
  scodellina: P('Scodellina', 'comune', ['cuoco', 'festaiolo'], 5, 28, 2.6, A('#f6efe9', 'mini', 'felici', 'o', { testa: 'cuoco' }),
                { on: 'timer', t: 5, do: [{ e: 'heal', v: 6 }] }, { hit: { heal: 2 } }),
  flautino:   P('Flautino', 'comune', ['musicista', 'contadino'], 6, 26, 2.2, A('#ffe066', 'alto', 'assonnati', 'o', { testa: 'basco', fx: 'note' }),
                { on: 'aura', do: [S('row', 'spd', 10)] }),
  ombretta:   P('Ombretta', 'comune', ['ninja', 'fangoso'], 8, 22, 2.0, A('#2b2d5a', 'lungo', 'n', 'sorriso', { testa: 'ninja' }),
                { on: 'crit', do: [{ e: 'mud', v: 2 }] }, { crit: 15, hit: { mud: 1 } }),
  scudetto:   P('Scudetto', 'comune', ['cavaliere', 'contadino'], 5, 36, 2.8, A('#a9b0bb', 'n', 'n', 'broncio', { testa: 'elmo' }),
                { on: 'start', do: [{ e: 'armor', v: 1 }] }),
  fanghino:   P('Fanghino', 'comune', ['fangoso', 'lottatore'], 5, 34, 2.6, A('#b7805a', 'grasso', 'puntini', 'ghigno', { pat: 'chiazze' }),
                { on: 'hurt', n: 5, do: [{ e: 'mud', v: 2 }] }, { hit: { mud: 2 } }),
  bollicina:  P('Bollicina', 'comune', ['mago', 'festaiolo'], 3, 24, 2.4, A('#d9b8ff', 'mini', 'matti', 'lingua', { testa: 'festa', fx: 'bolle' }),
                { on: 'start', do: [{ e: 'burn', v: 3 }] }, { hit: { burn: 2 } }),
  rametto:    P('Rametto', 'comune', ['contadino', 'musicista'], 6, 28, 2.5, A('#9be3c8', 'n', 'felici', 'sorriso', { testa: 'fiori' }),
                { on: 'ally', do: [{ e: 'heal', v: 3 }] }),
  ancoretta:  P('Ancoretta', 'comune', ['marinaio', 'lottatore'], 8, 28, 2.5, A('#7cc4ff', 'n', 'n', 'ghigno', { testa: 'marinaio', collo: 'ancora' }),
                { on: 'aura', do: [S('adj', 'atk', 2, { tag: 'marinaio' })] }),
  pentolino:  P('Pentolino', 'comune', ['cuoco', 'cavaliere'], 5, 34, 2.8, A('#ffb6c9', 'grasso', 'assonnati', 'o', { testa: 'cuoco', collo: 'farfallino' }),
                { on: 'low', do: [{ e: 'heal', v: 25 }] }, { hit: { shield: 2 } }),
  tamburino:  P('Tamburino', 'comune', ['musicista', 'cavaliere'], 6, 28, 2.4, A('#ffc9a8', 'n', 'n', 'lingua', { testa: 'basco', collo: 'farfallino', fx: 'note' }),
                { on: 'attack', n: 4, do: [{ e: 'haste', p: 15, s: 4 }] }),
  spillo:     P('Spillo', 'comune', ['ninja', 'marinaio'], 8, 22, 2.2, A('#ffd8a8', 'lungo', 'arrabbiati', 'ghigno', { collo: 'fazzoletto' }),
                { on: 'start', do: [{ e: 'stun', target: 'front', s: 2 }] }),
  lardello:   P('Lardello', 'comune', ['lottatore', 'cuoco'], 6, 36, 2.8, A('#f7a6b6', 'grasso', 'puntini', 'sorriso'),
                { on: 'aura', do: [S('self', 'hp', 8, { perTag: 'cuoco' })] }),
  coriandolo: P('Coriandolo', 'comune', ['festaiolo', 'mago'], 3, 24, 2.4, A('#ffe066', 'mini', 'matti', 'lingua', { testa: 'festa', occhi: 'stelle', fx: 'stelle' }),
                { on: 'ally', do: [{ e: 'burn', v: 2 }] }, { hit: { burn: 1 } }),
  pagliuzza:  P('Pagliuzza', 'comune', ['contadino', 'cavaliere'], 5, 32, 2.6, A('#f6efe9', 'n', 'assonnati', 'o', { testa: 'paglia', collo: 'campanella', fx: 'zzz' }),
                { on: 'end', do: [{ e: 'gold', v: 1 }] }),
  schizzo:    P('Schizzo', 'comune', ['fangoso', 'ninja'], 5, 26, 2.4, A('#8fe36b', 'lungo', 'matti', 'zanne', { occhi: 'pirata', fx: 'gocce' }),
                { on: 'start', do: [{ e: 'mud', v: 3 }] }, { hit: { poison: 1 } }),
  blip:       P('Blip il Marziano', 'comune', ['alieno', 'festaiolo'], 5, 24, 2.4, A('#8ee05a', 'mini', 'quattro', 'o', { testa: 'antenne' }),
                { on: 'ally', do: [{ e: 'poison', v: 1 }] }, { hit: { poison: 1 } }),
  pinnetta:   P('Pinnetta', 'comune', ['marinaio', 'mostro'], 8, 28, 2.4, A('#8fa8c0', 'lungo', 'arrabbiati', 'zanne', { body: 'pinna' }),
                { on: 'attack', n: 3, do: [{ e: 'strike' }] }),
  cometa:     P('Cometa', 'comune', ['alieno', 'musicista'], 6, 24, 2.0, A('#ffd0e0', 'mini', 'felici', 'sorriso', { testa: 'astronauta' }),
                { on: 'start', do: [{ e: 'haste', p: 20, s: 6 }] }),
  zombi:      P('Ciccio Zombi', 'comune', ['mostro', 'fangoso'], 6, 36, 2.8, A('#9fb59a', 'grasso', 'spirale', 'denti', { pat: 'chiazze' }),
                { on: 'lose', do: [G('self', 'hp', 10)] }, { hit: { poison: 1 } }),
  frittella:  P('Frittella', 'comune', ['cuoco', 'mago'], 5, 26, 2.5, A('#ffb347', 'n', 'felici', 'lingua', { testa: 'cuoco', fx: 'fiamme' }),
                { on: 'timer', t: 6, do: [{ e: 'burn', v: 2 }] }, { hit: { burn: 1, heal: 1 } }),
  cornetto:   P('Cornetto', 'comune', ['mostro', 'festaiolo'], 8, 28, 2.5, A('#ff5a5a', 'n', 'arrabbiati', 'ghigno', { testa: 'corna' }),
                { on: 'win', do: [G('self', 'atk', 2)] }),
  sapone:     P('Bolla di Sapone', 'comune', ['mago', 'cavaliere'], 3, 30, 2.6, A('#bfe6ff', 'mini', 'felici', 'o', { fx: 'bolle' }),
                { on: 'start', do: [{ e: 'shield', v: 15 }] }, { hit: { shield: 3 } }),
  punk:       P('Punk Prosciutto', 'comune', ['musicista', 'lottatore'], 8, 28, 2.2, A('#ff7eb6', 'n', 'arrabbiati', 'lingua', { testa: 'cresta', collo: 'collare' }),
                { on: 'attack', n: 2, do: [B('self', 'atk', 1)] }),

  // ================= rari (5 ghiande) =================
  prosciutto: P('Capitan Prosciutto', 'raro', ['marinaio', 'lottatore'], 11, 40, 2.4, A('#ff9fb6', 'n', 'arrabbiati', 'ghigno', { testa: 'tricorno', occhi: 'pirata' }),
                { on: 'attack', n: 3, repeat: 2, repeatUp: true, do: [{ e: 'dmg', v: 6 }] }),
  pancetta:   P('Chef Pancetta', 'raro', ['cuoco', 'festaiolo'], 8, 44, 2.5, A('#f6efe9', 'grasso', 'felici', 'lingua', { testa: 'cuoco', collo: 'farfallino' }),
                { on: 'ally', do: [{ e: 'shield', v: 4 }] }, { hit: { heal: 3 } }),
  cotechino:  P('Rocky Cotechino', 'raro', ['lottatore', 'cavaliere'], 11, 48, 2.6, A('#e85a4f', 'grasso', 'arrabbiati', 'zanne', { testa: 'fascia', collo: 'collare' }),
                { on: 'aura', cond: 'front', do: [S('self', 'atk', 5), S('adj', 'atk', 4, { tag: 'lottatore' })] }),
  strutto:    P('Maestro Strutto', 'raro', ['musicista', 'mago'], 6, 36, 2.2, A('#c9a2f0', 'alto', 'n', 'o', { testa: 'basco', occhi: 'monocolo', fx: 'note' }),
                { on: 'aura', do: [S('col', 'spd', 15)] }, { hit: { burn: 1 } }),
  salame:     P('Kenji Salame', 'raro', ['ninja', 'cavaliere'], 11, 36, 2.2, A('#2b2d5a', 'n', 'arrabbiati', 'broncio', { testa: 'ninja' }),
                { on: 'crit', do: [{ e: 'stun', target: 'random', s: 1 }] }, { crit: 15 }),
  lardone:    P('Ser Lardone', 'raro', ['cavaliere', 'lottatore'], 6, 60, 3.0, A('#a9b0bb', 'grasso', 'assonnati', 'broncio', { testa: 'elmo' }),
                { on: 'start', do: [{ e: 'armor', v: 2 }] }),
  pancetto:   P('Mago Pancetto', 'raro', ['mago', 'fangoso'], 6, 34, 2.5, A('#7a4fd0', 'n', 'matti', 'ghigno', { testa: 'mago', fx: 'fiamme' }),
                { on: 'timer', t: 5, do: [{ e: 'burn', v: 3 }] }, { hit: { burn: 2 } }),
  porchetta:  P('DJ Porchetta', 'raro', ['musicista', 'festaiolo'], 8, 36, 2.2, A('#3a3440', 'n', 'n', 'ghigno', { testa: 'cuffie', occhi: 'sole', fx: 'note' }),
                { on: 'ally', do: [{ e: 'haste', p: 6, s: 3 }] }),
  salmone:    P('Nonno Salmone', 'raro', ['marinaio', 'contadino'], 10, 44, 2.6, A('#ffa58a', 'n', 'assonnati', 'baffi', { testa: 'marinaio', occhi: 'tondi', collo: 'sciarpa' }),
                { on: 'win', do: [G('self', 'atk', 3)] }),
  melma:      P('Melma', 'raro', ['fangoso', 'mago'], 5, 42, 2.6, A('#6fbf4a', 'grasso', 'puntini', 'lingua', { pat: 'chiazze', fx: 'gocce' }),
                { on: 'aura', do: [S('adj', 'mud', 1)] }, { hit: { mud: 2 } }),
  mortadella: P('Zia Mortadella', 'raro', ['festaiolo', 'cuoco'], 6, 44, 2.6, A('#ffb6c9', 'grasso', 'felici', 'sorriso', { testa: 'fiori', collo: 'perle' }),
                { on: 'aura', do: [S('adj', 'hp', 25)] }),
  speck:      P('Ombra Speck', 'raro', ['ninja', 'lottatore'], 13, 30, 2.0, A('#1d1b26', 'lungo', 'arrabbiati', 'zanne', { occhi: 'maschera', body: 'mantello' }),
                { on: 'aura', cond: 'alone', do: [S('self', 'atk', 4), S('self', 'crit', 15)] }),
  polpettone: P('Polpettone', 'raro', ['cuoco', 'lottatore'], 8, 52, 2.8, A('#b7805a', 'grasso', 'n', 'lingua', { testa: 'cuoco' }),
                { on: 'hurt', n: 6, do: [{ e: 'heal', v: 8 }] }),
  trombetta:  P('Trombetta', 'raro', ['musicista', 'marinaio'], 10, 38, 2.4, A('#ffe066', 'n', 'n', 'o', { testa: 'marinaio', collo: 'medaglia', fx: 'note' }),
                { on: 'start', do: [B('tags', 'atk', 2, { tags: ['musicista', 'marinaio'] })] }),
  spaventa:   P('Spaventapasseri', 'raro', ['contadino', 'ninja'], 8, 44, 2.6, A('#e8cf8f', 'alto', 'matti', 'ghigno', { testa: 'paglia', occhi: 'pirata', collo: 'fazzoletto', pat: 'strisce' }),
                { on: 'start', do: [{ e: 'stun', target: 'random', n: 3, s: 2 }] }),
  zorg:       P('Zorg il Quadriocchio', 'raro', ['alieno', 'mago'], 6, 36, 2.4, A('#a46be8', 'n', 'quattro', 'denti', { testa: 'antenne' }),
                { on: 'aura', do: [S('adj', 'poison', 1)] }, { hit: { burn: 1 } }),
  squalotto:  P('Squalotto', 'raro', ['marinaio', 'mostro'], 13, 40, 2.4, A('#7f9bb5', 'lungo', 'arrabbiati', 'zanne', { body: 'pinna' }),
                { on: 'aura', do: [S('self', 'atk', 1, { perTag: 'marinaio' })] }, { crit: 10 }),
  astro:      P('Astro Porcello', 'raro', ['alieno', 'cavaliere'], 8, 46, 2.6, A('#f2f2f7', 'n', 'n', 'sorriso', { testa: 'astronauta', pat: 'galassia' }),
                { on: 'start', do: [{ e: 'shield', v: 20 }] }, { hit: { stun: 5 } }),
  draculino:  P('Conte Draculino', 'raro', ['mostro', 'ninja'], 10, 38, 2.3, A('#3a2a44', 'alto', 'arrabbiati', 'zanne', { body: 'mantello', collo: 'farfallino' }),
                { on: 'crit', do: [{ e: 'heal', v: 8 }] }, { crit: 10, hit: { heal: 2 } }),
  unicorna:   P('Unicorna', 'raro', ['festaiolo', 'mago'], 6, 40, 2.4, A('#ffd6f0', 'alto', 'cuori', 'sorriso', { testa: 'unicorno', fx: 'stelle' }),
                { on: 'ally', do: [B('random', 'atk', 1)] }, { hit: { shield: 2 } }),
  funghetto:  P('Funghetto Allegro', 'raro', ['contadino', 'fangoso'], 5, 42, 2.6, A('#f3dcc0', 'mini', 'felici', 'sorriso', { testa: 'fungo' }),
                { on: 'win', do: [G('self', 'poison', 1)] }, { hit: { poison: 1 } }),
  robo:       P('Robo-Maiale 3000', 'raro', ['cavaliere', 'musicista'], 10, 44, 2.0, A('#b8c2cc', 'n', 'robot', 'o', { testa: 'antenne', collo: 'collare' }),
                { on: 'attack', n: 5, do: [{ e: 'armor', v: 1 }] }),
  tartaruga:  P('Porcotartaruga', 'raro', ['cavaliere', 'fangoso'], 5, 60, 3.2, A('#9fd38a', 'grasso', 'assonnati', 'sorriso', { body: 'guscio' }),
                { on: 'hurt', n: 6, do: [{ e: 'shield', v: 5 }] }, { hit: { mud: 1 } }),

  // ================= epici (7 ghiande) =================
  culatello:  P('Ammiraglio Culatello', 'epico', ['marinaio', 'cavaliere'], 14, 60, 2.5, A('#5aa9e6', 'grasso', 'n', 'baffi', { testa: 'tricorno', occhi: 'monocolo', collo: 'medaglia' }),
                { on: 'aura', do: [S('all', 'atk', 5, { tag: 'marinaio', incSelf: true })] }),
  zampone:    P('Il Grande Zampone', 'epico', ['lottatore', 'festaiolo'], 14, 66, 2.5, A('#e85a4f', 'grasso', 'arrabbiati', 'zanne', { testa: 'fascia', collo: 'collare', pat: 'strisce' }),
                { on: 'attack', n: 1, do: [B('self', 'atk', 1)] }),
  porcini:    P('Arcimago Porcini', 'epico', ['mago', 'musicista'], 10, 52, 2.4, A('#7a4fd0', 'alto', 'matti', 'o', { testa: 'mago', occhi: 'stelle', fx: 'stelle' }),
                { on: 'inflict', fx: 'burn', do: [{ e: 'dmg', v: 3 }] }, { hit: { burn: 2 } }),
  brasato:    P('Gran Cuoco Brasato', 'epico', ['cuoco', 'cavaliere'], 10, 70, 2.6, A('#f6efe9', 'grasso', 'felici', 'baffi', { testa: 'cuoco', collo: 'perle' }),
                { on: 'aura', do: [S('all', 'hp', 18, { incSelf: true })] }, { hit: { heal: 2 } }),
  coppa:      P('Sensei Coppa', 'epico', ['ninja', 'mago'], 14, 46, 2.0, A('#1d1b26', 'lungo', 'arrabbiati', 'broncio', { testa: 'ninja', fx: 'fiamme' }),
                { on: 'crit', do: [{ e: 'burn', v: 4 }] }, { crit: 20, hit: { burn: 1 } }),
  paladino:   P('Paladino Pancia', 'epico', ['cavaliere', 'festaiolo'], 10, 80, 2.8, A('#ffd56a', 'grasso', 'felici', 'sorriso', { testa: 'elmo', collo: 'medaglia', fx: 'stelle' }),
                { on: 'low', do: [{ e: 'shield', v: 60 }, { e: 'armor', v: 2 }] }),
  velenella:  P('Dottoressa Velenella', 'epico', ['mago', 'alieno'], 8, 52, 2.3, A('#4b1f6e', 'lungo', 'matti', 'zanne', { testa: 'aureola', occhi: 'tondi', fx: 'gocce' }),
                { on: 'attack', n: 3, do: [{ e: 'poison', v: 2 }] }, { hit: { poison: 2 } }),
  pozza:      P('Re della Pozza', 'epico', ['fangoso', 'lottatore'], 13, 70, 2.6, A('#9a6a44', 'grasso', 'assonnati', 'ghigno', { testa: 'corona', pat: 'chiazze', fx: 'gocce' }),
                { on: 'start', do: [{ e: 'mud', v: 5 }] }, { hit: { mud: 2 } }),
  contessa:   P('Contessa Coppa', 'epico', ['festaiolo', 'contadino'], 10, 64, 2.5, A('#ff8fb0', 'alto', 'felici', 'sorriso', { testa: 'fiori', occhi: 'tondi', collo: 'perle' }),
                { on: 'win', do: [{ e: 'gold', v: 2 }, { e: 'charm', p: 10 }] }),
  barbanera:  P('Barbanera Lardo', 'epico', ['marinaio', 'ninja'], 16, 50, 2.4, A('#2a2730', 'n', 'arrabbiati', 'zanne', { testa: 'tricorno', occhi: 'pirata', collo: 'ancora' }),
                { on: 'attack', n: 3, do: [{ e: 'stun', target: 'front', s: 1 }, { e: 'dmg', v: 6 }] }),
  ghianda:    P('Druido Ghianda', 'epico', ['contadino', 'mago'], 8, 62, 2.5, A('#7ed6a5', 'n', 'ciclope', 'o', { testa: 'fiori', collo: 'campanella' }),
                { on: 'timer', t: 4, do: [B('random', 'atk', 2)] }, { hit: { heal: 1, burn: 1 } }),
  gladiatore: P('Gladiatore Prosciutto', 'epico', ['lottatore', 'cavaliere'], 14, 66, 2.6, A('#c8ccd4', 'alto', 'arrabbiati', 'ghigno', { testa: 'elmo', collo: 'collare' }),
                { on: 'aura', do: [S('diag', 'atk', 5)] }),
  xilla:      P('Regina Xilla', 'epico', ['alieno', 'festaiolo'], 10, 56, 2.4, A('#5fe0a0', 'alto', 'quattro', 'sorriso', { testa: 'antenne', collo: 'perle', fx: 'stelle' }),
                { on: 'aura', do: [S('all', 'poison', 1, { tag: 'alieno', incSelf: true })] }, { hit: { poison: 1 } }),
  megalodonte:P('Megalodonte', 'epico', ['mostro', 'marinaio'], 19, 64, 2.6, A('#4a6a8a', 'grasso', 'arrabbiati', 'zanne', { body: 'pinna' }),
                { on: 'hurt', n: 4, do: [B('self', 'atk', 2)] }),
  kosmo:      P('Cosmonauta Kosmo', 'epico', ['alieno', 'musicista'], 11, 56, 2.0, A('#ffffff', 'alto', 'n', 'lingua', { testa: 'astronauta', pat: 'galassia', fx: 'stelle' }),
                { on: 'start', do: [{ e: 'haste', p: 25, s: 10 }, { e: 'stun', target: 'random', n: 2, s: 1 }] }),
  diavoletto: P('Diavoletto Piccante', 'epico', ['mostro', 'mago'], 11, 52, 2.3, A('#e8331f', 'mini', 'arrabbiati', 'ghigno', { testa: 'corna', body: 'ali', fx: 'fiamme' }),
                { on: 'win', do: [G('self', 'burn', 1)] }, { hit: { burn: 3 } }),
  yeti:       P('Yeti Lardoso', 'epico', ['mostro', 'lottatore'], 14, 80, 2.8, A('#eef6ff', 'grasso', 'puntini', 'denti', { pat: 'chiazze', fx: 'zzz' }),
                { on: 'lose', do: [G('self', 'atk', 2), G('self', 'hp', 15)] }),
  confettina: P('Fata Confettina', 'epico', ['festaiolo', 'cuoco'], 6, 56, 2.4, A('#ffc4e6', 'mini', 'cuori', 'sorriso', { body: 'aliangelo', fx: 'cuori' }),
                { on: 'ally', do: [{ e: 'heal', v: 5 }] }, { hit: { heal: 3 } }),

  // ================= leggendari (9 ghiande) =================
  uncino:     P('Capitan Uncino di Maiale', 'leggendario', ['marinaio', 'lottatore'], 21, 80, 2.4, A('#ffd56a', 'grasso', 'arrabbiati', 'zanne', { testa: 'tricorno', occhi: 'pirata', collo: 'ancora' }),
                { on: 'tagAttack', tag: 'marinaio', n: 5, repeat: 2, repeatUp: true, do: [{ e: 'dmg', v: 8 }] }),
  kungpork:   P('Gran Maestro Kung Pork', 'leggendario', ['lottatore', 'ninja'], 19, 80, 2.0, A('#2a2730', 'n', 'arrabbiati', 'baffi', { testa: 'fascia', occhi: 'maschera', collo: 'collare' }),
                { on: 'start', do: [B('tags', 'atk', 3, { tags: ['lottatore', 'ninja'] }), B('tags', 'crit', 10, { tags: ['lottatore', 'ninja'] })] }, { crit: 15 }),
  merlino:    P('Merlino Maiale', 'leggendario', ['mago', 'festaiolo'], 13, 74, 2.3, A('#cfefff', 'alto', 'matti', 'baffi', { testa: 'mago', occhi: 'stelle', collo: 'perle', fx: 'stelle' }),
                { on: 'ally', do: [{ e: 'burn', v: 2 }, B('self', 'atk', 1)] }, { hit: { burn: 2 } }),
  lasagna:    P('Nonna Lasagna', 'leggendario', ['cuoco', 'contadino'], 11, 96, 2.6, A('#f6efe9', 'grasso', 'assonnati', 'sorriso', { testa: 'cuoco', occhi: 'tondi', collo: 'perle' }),
                { on: 'inflict', fx: 'heal', do: [{ e: 'shield', v: 4 }] }, { hit: { heal: 3 } }),
  artu:       P('Re Artù Porchetto', 'leggendario', ['cavaliere', 'festaiolo'], 18, 100, 2.6, A('#ffd56a', 'alto', 'n', 'sorriso', { testa: 'corona', collo: 'medaglia', body: 'mantello', fx: 'stelle' }),
                { on: 'aura', do: [S('row', 'atk', 4), S('row', 'hp', 25)] }),
  bacon:      P('Rockstar Bacon', 'leggendario', ['musicista', 'festaiolo'], 18, 74, 2.0, A('#ff5a3c', 'lungo', 'n', 'lingua', { testa: 'cresta', occhi: 'sole', collo: 'collare', fx: 'note' }),
                { on: 'start', do: [{ e: 'haste', p: 25, s: 15 }] }),
  drago:      P('Draghetto Arrosto', 'leggendario', ['mago', 'lottatore'], 16, 80, 2.4, A('#ff5a3c', 'grasso', 'arrabbiati', 'zanne', { pat: 'strisce', body: 'ali', fx: 'fiamme' }),
                { on: 'attack', n: 2, repeat: 2, repeatUp: true, do: [{ e: 'burn', v: 2 }] }, { hit: { burn: 3 } }),
  signorfango:P('Signore del Fango', 'leggendario', ['fangoso', 'mago'], 14, 88, 2.6, A('#7a5132', 'grasso', 'ciclope', 'zanne', { testa: 'mago', pat: 'chiazze', fx: 'gocce' }),
                { on: 'start', do: [{ e: 'poison', v: 3 }, { e: 'mud', v: 4 }] }, { hit: { mud: 2, poison: 1 } }),
  salsiccione:P('Granduca Salsiccione', 'leggendario', ['contadino', 'cavaliere'], 14, 100, 2.6, A('#ffb6c9', 'grasso', 'felici', 'baffi', { testa: 'cowboy', collo: 'campanella' }),
                { on: 'end', do: [G('self', 'atk', 2), G('self', 'hp', 12)] }),
  glorp:      P('Imperatore Glorp', 'leggendario', ['alieno', 'mago'], 13, 84, 2.3, A('#7d3fd8', 'grasso', 'quattro', 'zanne', { testa: 'antenne', collo: 'medaglia', pat: 'galassia' }),
                { on: 'timer', t: 5, do: [{ e: 'stun', target: 'random', n: 2, s: 1 }, { e: 'poison', v: 2 }] }, { hit: { poison: 2 } }),
  kraken:     P('Kraken Suino', 'leggendario', ['mostro', 'marinaio'], 19, 96, 2.5, A('#3fb3b3', 'grasso', 'ciclope', 'denti', { testa: 'tricorno', body: 'pinna', fx: 'bolle' }),
                { on: 'attack', n: 3, do: [{ e: 'stun', target: 'random', n: 2, s: 1.5 }] }),
  galassia:   P('Capitano Galassia', 'leggendario', ['alieno', 'cavaliere'], 16, 96, 2.4, A('#2d2a6e', 'alto', 'n', 'sorriso', { testa: 'astronauta', pat: 'galassia', body: 'mantello', fx: 'stelle' }),
                { on: 'aura', do: [S('all', 'spd', 10, { incSelf: true }), S('all', 'crit', 5, { incSelf: true })] }),
  fenicotto:  P('Fenicotto', 'leggendario', ['mago', 'mostro'], 14, 80, 2.3, A('#ff8a3c', 'alto', 'felici', 'ghigno', { body: 'aliangelo', fx: 'fiamme' }),
                { on: 'low', do: [{ e: 'heal', v: 80 }, { e: 'burn', v: 6 }] }, { hit: { burn: 2 } }),
  remostri:   P('Re dei Mostri', 'leggendario', ['mostro', 'lottatore'], 21, 100, 2.6, A('#5b8f3a', 'grasso', 'arrabbiati', 'zanne', { testa: 'corna', collo: 'collare', pat: 'strisce' }),
                { on: 'win', do: [G('all', 'atk', 1, { tag: 'mostro', incSelf: true })] }),

  // ================= eroici (12 ghiande) =================
  supremo:    P('Porcomandante Supremo', 'eroico', ['marinaio', 'cavaliere'], 24, 120, 2.4, A('#ffd56a', 'grasso', 'n', 'baffi', { testa: 'tricorno', occhi: 'monocolo', collo: 'medaglia', fx: 'stelle' }),
                { on: 'aura', do: [S('all', 'atk', 2, { incSelf: true }), S('all', 'hp', 20, { incSelf: true })] }),
  scrofa:     P('Mamma Scrofa Gigante', 'eroico', ['cuoco', 'lottatore'], 19, 160, 2.6, A('#ff8fb0', 'grasso', 'felici', 'lingua', { testa: 'cuoco', collo: 'perle' }),
                { on: 'attack', n: 2, do: [{ e: 'heal', v: 10 }] }, { hit: { heal: 5 } }),
  peste:      P('Peste Suina', 'eroico', ['mago', 'alieno'], 16, 110, 2.3, A('#3b0f52', 'lungo', 'ciclope', 'zanne', { testa: 'mago', fx: 'gocce', pat: 'chiazze' }),
                { on: 'inflict', fx: 'poison', do: [{ e: 'poison', v: 1 }] }, { hit: { poison: 2 } }),
  lardone1:   P('Imperatore Lardone I', 'eroico', ['lottatore', 'festaiolo'], 24, 125, 2.4, A('#ffd56a', 'grasso', 'arrabbiati', 'baffi', { testa: 'corona', collo: 'collare', body: 'mantello', fx: 'stelle' }),
                { on: 'attack', n: 1, do: [B('self', 'atk', 1)] }),
  deafango:   P('Dea del Fango', 'eroico', ['fangoso', 'festaiolo'], 18, 120, 2.4, A('#9a6a44', 'alto', 'felici', 'sorriso', { testa: 'aureola', collo: 'perle', pat: 'chiazze', body: 'aliangelo' }),
                { on: 'start', do: [{ e: 'mud', v: 8 }, { e: 'shield', v: 40 }] }, { hit: { mud: 3 } }),
  shogun:     P('Shogun Prosciutto', 'eroico', ['ninja', 'cavaliere'], 26, 105, 2.2, A('#1d1b26', 'grasso', 'arrabbiati', 'zanne', { testa: 'elmo', occhi: 'maschera', collo: 'fazzoletto' }),
                { on: 'crit', do: [{ e: 'stun', target: 'front', s: 1 }, { e: 'strike' }] }, { crit: 20 }),
  divoratore: P('Divoratore di Mondi', 'eroico', ['alieno', 'mostro'], 22, 130, 2.5, A('#24124a', 'grasso', 'quattro', 'zanne', { testa: 'antenne', pat: 'galassia', fx: 'stelle' }),
                { on: 'win', do: [G('self', 'atk', 2), G('self', 'poison', 1)] }, { hit: { poison: 2, burn: 2 } }),
  leviatano:  P('Leviatano Rosa', 'eroico', ['marinaio', 'mostro'], 27, 140, 2.6, A('#ff7fae', 'lungo', 'arrabbiati', 'zanne', { testa: 'corona', body: 'pinna', fx: 'bolle' }),
                { on: 'attack', n: 2, do: [{ e: 'strike' }] }, { crit: 10 }),
  madrina:    P('Fata Madrina Suina', 'eroico', ['festaiolo', 'cuoco'], 13, 130, 2.4, A('#c9a2f0', 'alto', 'cuori', 'sorriso', { testa: 'aureola', body: 'aliangelo', collo: 'perle', fx: 'cuori' }),
                { on: 'ally', do: [{ e: 'heal', v: 6 }, B('random', 'atk', 1)] }, { hit: { heal: 4, shield: 4 } }),
};

// Tratti: uno per maialino; applicandone un altro si sovrascrive. I valori non crescono col livello.
export const TRAITS = {
  robusto:     { name: 'Robusto', icon: '💪', r: 'comune', power: { on: 'aura', do: [S('self', 'hp', 20)] } },
  grintoso:    { name: 'Grintoso', icon: '😤', r: 'comune', power: { on: 'aura', do: [S('self', 'atk', 2)] } },
  svelto:      { name: 'Svelto', icon: '💨', r: 'comune', power: { on: 'aura', do: [S('self', 'spd', 15)] } },
  occhiofino:  { name: 'Occhio fino', icon: '🎯', r: 'comune', power: { on: 'aura', do: [S('self', 'crit', 15)] } },
  coccolone:   { name: 'Coccolone', icon: '🤗', r: 'comune', power: { on: 'start', do: [{ e: 'shield', v: 15 }] } },
  affamato:    { name: 'Affamato', icon: '🍎', r: 'comune', power: { on: 'aura', do: [S('self', 'heal', 2)] } },
  piromane:    { name: 'Piromane', icon: '🔥', r: 'raro', power: { on: 'aura', do: [S('self', 'burn', 2)] } },
  velenoso:    { name: 'Velenoso', icon: '🧪', r: 'raro', power: { on: 'aura', do: [S('self', 'poison', 1)] } },
  impiastro:   { name: 'Impiastro', icon: '🟤', r: 'raro', power: { on: 'aura', do: [S('self', 'mud', 2)] } },
  corazzato:   { name: 'Corazzato', icon: '🪖', r: 'raro', power: { on: 'start', do: [{ e: 'armor', v: 2 }] } },
  mascotte:    { name: 'Mascotte', icon: '🧸', r: 'raro', power: { on: 'aura', do: [S('adj', 'hp', 12)] } },
  testardo:    { name: 'Testardo', icon: '🐏', r: 'raro', power: { on: 'lose', do: [G('self', 'atk', 2), G('self', 'hp', 10)] } },
  festaiola:   { name: 'Anima festaiola', icon: '🎭', r: 'raro', extraTag: 'festaiolo' },
  vampiro:     { name: 'Vampiro', icon: '🧛', r: 'epico', power: { on: 'aura', do: [S('self', 'heal', 4)] } },
  esplosivo:   { name: 'Esplosivo', icon: '💣', r: 'epico', power: { on: 'start', do: [{ e: 'dmg', v: 40 }] } },
  furioso:     { name: 'Furioso', icon: '😡', r: 'epico', power: { on: 'low', do: [B('self', 'atk', 6)] } },
  raffica:     { name: 'Raffica', icon: '⚡', r: 'epico', power: { on: 'attack', n: 3, do: [{ e: 'strike' }] } },
  collezionista: { name: 'Collezionista', icon: '🧳', r: 'epico', power: { on: 'aura', do: [S('self', 'atk', 2, { perCharm: true }), S('self', 'hp', 10, { perCharm: true })] } },
  reRecinto:   { name: 'Re del recinto', icon: '👑', r: 'leggendario', power: { on: 'aura', do: [S('row', 'atk', 3), S('row', 'hp', 20)] } },
  fenice:      { name: 'Fenice', icon: '🕊️', r: 'leggendario', power: { on: 'low', do: [{ e: 'heal', v: 100 }] } },
  mentore:     { name: 'Mentore', icon: '📜', r: 'leggendario', power: { on: 'win', do: [G('adj', 'atk', 1)] } },
  campione:    { name: 'Campione', icon: '🏅', r: 'leggendario', power: { on: 'win', do: [G('self', 'hp', 20)] } },
  alchimista:  { name: 'Alchimista', icon: '⚗️', r: 'leggendario', amp: 1 },
};
export const TRAIT_COST = { comune: 2, raro: 3, epico: 5, leggendario: 7 };

// Ciondoli. cell = si mette su una casella del recinto e vale per il maialino che ci sta.
export const ACHARMS = {
  paglia:     { name: 'Paglia fresca', icon: '🌾', r: 'comune', cell: true, text: 'Il maialino su questa casella +20 vita.' },
  mangiatoia: { name: 'Mangiatoia', icon: '🥣', r: 'comune', cell: true, text: 'Il maialino su questa casella +2 attacco.' },
  coccio:     { name: 'Salvadanaio di coccio', icon: '🏺', r: 'comune', text: '+3 ghiande dopo ogni battaglia.' },
  tizzone:    { name: 'Tizzone', icon: '🪵', r: 'raro', cell: true, text: 'Il maialino su questa casella +2 bruciatura per colpo.' },
  ampolla:    { name: 'Ampolla verde', icon: '🧫', r: 'raro', cell: true, text: 'Il maialino su questa casella +1 veleno per colpo.' },
  secchio:    { name: 'Secchio di fango', icon: '🪣', r: 'raro', cell: true, text: 'Il maialino su questa casella +2 fango per colpo.' },
  mirino:     { name: 'Mirino', icon: '🔭', r: 'raro', cell: true, text: 'Il maialino su questa casella +20% critico.' },
  ventaglio:  { name: 'Ventaglio', icon: '🪭', r: 'raro', cell: true, text: 'Il maialino su questa casella +25% velocità.' },
  bandiera:   { name: 'Bandiera del recinto', icon: '🚩', r: 'raro', text: 'Tutta la squadra +15 vita.' },
  ferro:      { name: 'Ferro di cavallo', icon: '🐴', r: 'raro', text: 'Un cambio del negozio gratis a ogni giornata.' },
  campana:    { name: 'Campana del recinto', icon: '🔔', r: 'epico', cell: true, text: 'Quando il maialino su questa casella attiva un potere, i vicini +2 attacco fino a fine battaglia.' },
  braciere:   { name: 'Braciere', icon: '🏮', r: 'epico', text: 'Chi applica bruciatura ne applica +1 per colpo.' },
  fiala:      { name: 'Fiala di veleno', icon: '⚗️', r: 'epico', text: 'Chi applica veleno ne applica +1 per colpo.' },
  palude:     { name: 'Palude portatile', icon: '🐸', r: 'epico', text: 'Chi applica fango ne applica +1 per colpo; il fango rallenta del 3% invece del 2%.' },
  tamburo:    { name: 'Tamburo da guerra', icon: '🪘', r: 'epico', text: 'Tutta la squadra +15% velocità.' },
  fischietto: { name: 'Fischietto del capitano', icon: '📯', r: 'epico', text: 'I Marinai e i Lottatori +3 attacco.' },
  ricettario: { name: 'Ricettario della nonna', icon: '📖', r: 'epico', text: 'Cure e scudi +50%.' },
  altare:     { name: 'Altare d\'oro', icon: '⛩️', r: 'leggendario', cell: true, text: 'Il potere e gli effetti per colpo del maialino su questa casella valgono il doppio.' },
  coppa:      { name: 'Coppa del campione', icon: '🏆', r: 'leggendario', text: 'Tutti i danni della squadra +20%.' },
  bacchetta:  { name: 'Bacchetta stellata', icon: '🪄', r: 'leggendario', text: 'I poteri a inizio battaglia si attivano due volte.' },
  calderone:  { name: 'Calderone', icon: '🫕', r: 'leggendario', text: 'Bruciature e veleno fanno il 30% di danni in più.' },
  trono:      { name: 'Trono di fieno', icon: '🪑', r: 'eroico', cell: true, text: 'Il maialino su questa casella +6 attacco, +60 vita e +25% velocità.' },
  corona:     { name: 'Corona di alloro', icon: '🌿', r: 'eroico', text: 'Le sinergie dei tag si attivano con un maialino in meno.' },
  quadrifoglio: { name: 'Quadrifoglio d\'oro', icon: '🍀', r: 'eroico', text: 'Nel negozio compaiono più maialini rari e i maialini costano 1 ghianda in meno.' },
};
export const CHARM_COST = { comune: 6, raro: 9, epico: 12, leggendario: 15, eroico: 20 };

// Effetti: nome, icona e colore, usati per statistiche, poteri e stati in battaglia.
export const FX = {
  dmg:    { name: 'Danni', icon: '💥', color: '#e2361f', help: 'Tolgono vita alla squadra nemica (lo scudo li assorbe prima).' },
  heal:   { name: 'Cura', icon: '💚', color: '#3f9a45', help: 'Ridà vita alla squadra, fino al massimo.' },
  shield: { name: 'Scudo', icon: '🫧', color: '#3fa9e0', help: 'Assorbe i danni prima della vita.' },
  armor:  { name: 'Corazza', icon: '🛡️', color: '#6b7a8f', help: 'Ogni punto toglie 1 danno a ogni colpo subito (al massimo metà del colpo). Non ferma bruciature e veleno.' },
  burn:   { name: 'Bruciatura', icon: '🔥', color: '#f06a1c', help: 'Ogni secondo la squadra colpita perde tanta vita quante bruciature ha, poi le bruciature calano di un quinto.' },
  poison: { name: 'Veleno', icon: '☠️', color: '#7b3fb0', help: 'Ogni 2 secondi la squadra colpita perde tanta vita quanti veleni ha. Non passa mai.' },
  mud:    { name: 'Fango', icon: '🟤', color: '#8a5a33', help: 'Ogni fango rallenta gli attacchi della squadra colpita del 2% (al massimo 35%).' },
  stun:   { name: 'Stordimento', icon: '💫', color: '#d9a400', help: 'Il maialino stordito non attacca per un po\'.' },
  buff:   { name: 'Potenziamento', icon: '⬆️', color: '#e0a20c', help: 'Aumenta una statistica fino alla fine della battaglia.' },
  haste:  { name: 'Velocità', icon: '⏩', color: '#2f7fe0', help: 'La squadra attacca più in fretta per qualche secondo.' },
  strike: { name: 'Colpo in più', icon: '⚔️', color: '#e2361f', help: 'Un attacco extra, subito, con tutti i suoi effetti.' },
  grow:   { name: 'Crescita', icon: '🌱', color: '#3f9a45', help: 'Aumento permanente: resta per tutta la partita.' },
  gold:   { name: 'Ghiande', icon: '🌰', color: '#a8743f', help: 'Ghiande in più da spendere.' },
  charm:  { name: 'Ciondolo', icon: '💍', color: '#8b3fd8', help: 'Probabilità di ricevere in regalo un ciondolo di squadra.' },
  crit:   { name: 'Critico', icon: '🎯', color: '#e2361f', help: 'Probabilità che un colpo faccia il doppio dei danni e degli effetti.' },
  stat:   { name: 'Bonus', icon: '📈', color: '#5c9e3f', help: 'Un bonus fisso alle statistiche.' },
};
// Effetti per colpo, nell'ordine in cui compaiono sulle carte.
export const HIT_KEYS = ['burn', 'poison', 'mud', 'heal', 'shield', 'stun'];

export const WIN_TARGET = 15, START_GOLD = 30, START_HEARTS = 5, REROLL_COST = 3, CELLS = 8, COLS = 4, ROWS = 2;
export const OPP_NAMES = ['Fattoria Belpelo', 'Porcilaia del Nord', 'I Grugniti Furiosi', 'Cascina Pancetta', 'Club del Fango', 'Recinto Rosa', 'Banda Salsiccia',
  'Aia dei Campioni', 'Maialotti Ribelli', 'Stalla Stellata', 'Brigata Prosciutto', 'Le Codine Arricciate', 'Squadra Ciauscolo', 'I Re della Broda'];
