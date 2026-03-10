/**
 * Footwear Synonym Mappings
 * Production-grade synonym dictionary with typos, slang, and regional variations
 * Based on real e-commerce search patterns (Amazon, eBay, Zappos)
 */

export const SYNONYM_MAP: Record<string, string> = {
  // ============================================
  // SNEAKERS/TRAINERS (25+ variations)
  // ============================================
  sneakers: "sneakers",
  sneaker: "sneakers",
  trainers: "sneakers",
  trainer: "sneakers",
  kicks: "sneakers",
  tennis_shoes: "sneakers",
  "tennis shoes": "sneakers",
  athletic_shoes: "sneakers",
  "athletic shoes": "sneakers",
  gym_shoes: "sneakers",
  "gym shoes": "sneakers",
  court_shoes: "sneakers",
  "court shoes": "sneakers",

  // Typos
  sneecker: "sneakers",
  sneeker: "sneakers",
  sneekers: "sneakers",
  sneackers: "sneakers",

  // Regional slang (UK/Ireland)
  runners: "sneakers",
  creps: "sneakers",
  daps: "sneakers",
  pumps: "sneakers",
  plimsolls: "sneakers",

  // Russian variations
  кроссовки: "sneakers",
  кроссы: "sneakers",
  кеды: "sneakers",
  сникерсы: "sneakers",
  кроссовок: "sneakers",

  // ============================================
  // RUNNING SHOES (20+ variations)
  // ============================================
  "running shoes": "running shoes",
  "running shoe": "running shoes",
  "runners shoes": "running shoes",
  runners_shoes: "running shoes",
  joggers: "running shoes",
  "jogging shoes": "running shoes",
  marathoners: "running shoes",

  // Russian
  "беговые кроссовки": "running shoes",
  беговые: "running shoes",
  бегалки: "running shoes",
  "для бега": "running shoes",

  // ============================================
  // BOOTS (20+ variations)
  // ============================================
  boots: "boots",
  boot: "boots",
  booties: "boots",
  bootie: "boots",
  ankle_boots: "boots",
  "ankle boots": "boots",
  chelsea_boots: "boots",
  "chelsea boots": "boots",
  chukka_boots: "boots",
  "chukka boots": "boots",
  combat_boots: "boots",
  "combat boots": "boots",
  work_boots: "boots",
  "work boots": "boots",
  "hiking boots": "boots",
  hiking_boots: "boots",
  "trekking boots": "boots",
  trekking_boots: "boots",

  // Russian
  ботинки: "boots",
  ботинок: "boots",
  сапоги: "boots",
  сапог: "boots",
  берцы: "boots",
  челси: "boots",

  // ============================================
  // SANDALS (20+ variations)
  // ============================================
  sandals: "sandals",
  sandal: "sandals",
  slides: "sandals",
  slide: "sandals",
  flip_flops: "sandals",
  "flip flops": "sandals",
  flipflops: "sandals",
  thongs: "sandals",
  open_toe: "sandals",
  "open toe": "sandals",
  gladiators: "sandals",
  espadrilles: "sandals",

  // Russian
  сандалии: "sandals",
  сандалия: "sandals",
  шлепанцы: "sandals",
  шлепки: "sandals",
  вьетнамки: "sandals",

  // ============================================
  // SLIPPERS (20+ variations)
  // ============================================
  slippers: "slippers",
  slipper: "slippers",
  house_shoes: "slippers",
  "house shoes": "slippers",
  indoor_shoes: "slippers",
  "indoor shoes": "slippers",
  moccasins: "slippers",
  moccasin: "slippers",

  // Russian
  тапки: "slippers",
  тапочки: "slippers",
  домашние: "slippers",
  "домашняя обувь": "slippers",

  // ============================================
  // LOAFERS (20+ variations)
  // ============================================
  loafers: "loafers",
  loafer: "loafers",
  slip_ons: "loafers",
  "slip ons": "loafers",
  "slip on": "loafers",
  slip_on: "loafers",
  penny_loafers: "loafers",
  "penny loafers": "loafers",
  driving_shoes: "loafers",
  "driving shoes": "loafers",
  boat_shoes: "loafers",
  "boat shoes": "loafers",
  deck_shoes: "loafers",
  "deck shoes": "loafers",

  // Russian
  лоферы: "loafers",
  лофер: "loafers",
  мокасины: "loafers",
  "без шнурков": "loafers",

  // ============================================
  // HEELS (20+ variations)
  // ============================================
  heels: "heels",
  heel: "heels",
  high_heels: "heels",
  "high heels": "heels",
  stilettos: "heels",
  stiletto: "heels",
  pumps_heel: "heels",
  platforms: "heels",
  platform: "heels",
  wedges: "heels",
  wedge: "heels",
  kitten_heels: "heels",
  "kitten heels": "heels",

  // Russian
  каблуки: "heels",
  каблук: "heels",
  "на каблуках": "heels",
  туфли: "heels",
  шпильки: "heels",
  платформа: "heels",

  // ============================================
  // BASKETBALL SHOES (20+ variations)
  // ============================================
  "basketball shoes": "basketball shoes",
  "basketball shoe": "basketball shoes",
  "bball shoes": "basketball shoes",
  bball_shoes: "basketball shoes",
  "hoops shoes": "basketball shoes",
  hoops_shoes: "basketball shoes",
  "court shoes basketball": "basketball shoes",

  // Slang/Brand-agnostic
  jordans: "basketball shoes",
  dunks: "basketball shoes",

  // Russian
  "баскетбольные кроссовки": "basketball shoes",
  "для баскетбола": "basketball shoes",

  // ============================================
  // ATHLETIC/SPORT GENERAL (20+ variations)
  // ============================================
  athletic: "athletic",
  sports_shoes: "athletic",
  "sports shoes": "athletic",
  sporty: "athletic",
  gym: "athletic",
  training_shoes: "athletic",
  "training shoes": "athletic",
  cross_trainers: "athletic",
  "cross trainers": "athletic",
  workout_shoes: "athletic",
  "workout shoes": "athletic",

  // Russian
  спортивные: "athletic",
  спорт: "athletic",
  "для спорта": "athletic",
  "для зала": "athletic",
  качалка: "athletic",
  тренировки: "athletic",

  // ============================================
  // CASUAL SHOES (15+ variations)
  // ============================================
  casual: "casual",
  everyday: "casual",
  lifestyle: "casual",
  streetwear: "casual",
  street: "casual",
  urban: "casual",

  // Russian
  повседневные: "casual",
  "на каждый день": "casual",
  уличные: "casual",

  // ============================================
  // DRESS SHOES (15+ variations)
  // ============================================
  "dress shoes": "dress shoes",
  "dress shoe": "dress shoes",
  formal: "dress shoes",
  oxfords: "dress shoes",
  oxford: "dress shoes",
  derbies: "dress shoes",
  derby: "dress shoes",
  brogues: "dress shoes",
  brogue: "dress shoes",

  // Russian
  туфли_классика: "dress shoes",
  классика: "dress shoes",
  "для офиса": "dress shoes",
  официальные: "dress shoes",
};
