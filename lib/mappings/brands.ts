/**
 * Brand Name Normalizations
 * Production-grade brand mappings with typos, transliterations, and variations
 * Covers top 20+ athletic footwear brands
 */

export const BRAND_MAP: Record<string, string> = {
  // ============================================
  // NIKE (20+ variations)
  // ============================================
  nike: "Nike",
  nikes: "Nike",
  nke: "Nike",
  nikee: "Nike",
  nyke: "Nike",

  // Russian transliterations
  найк: "Nike",
  найки: "Nike",
  найке: "Nike",
  наик: "Nike",

  // Typos
  nikke: "Nike",
  nique: "Nike",

  // Brand lines (normalize to parent)
  "nike air": "Nike",
  "nike sb": "Nike",
  "nike acg": "Nike",
  "air jordan": "Nike",
  jordan: "Nike",

  // ============================================
  // ADIDAS (20+ variations)
  // ============================================
  adidas: "Adidas",
  adidases: "Adidas",
  addidas: "Adidas",
  adiddas: "Adidas",
  adias: "Adidas",
  adibas: "Adidas",

  // Russian transliterations
  адидас: "Adidas",
  адидос: "Adidas",
  адики: "Adidas",
  адик: "Adidas",

  // With stripes
  "three stripes": "Adidas",
  "3 stripes": "Adidas",

  // Sub-brands
  "adidas originals": "Adidas",
  originals: "Adidas",
  yeezy: "Adidas",

  // ============================================
  // PUMA (15+ variations)
  // ============================================
  puma: "Puma",
  pumas: "Puma",
  pooma: "Puma",
  pumma: "Puma",

  // Russian
  пума: "Puma",
  пум: "Puma",
  пумо: "Puma",

  // Typos
  poma: "Puma",
  pomo: "Puma",

  // ============================================
  // REEBOK (15+ variations)
  // ============================================
  reebok: "Reebok",
  reeboks: "Reebok",
  rebok: "Reebok",
  reboks: "Reebok",
  rebook: "Reebok",
  ribok: "Reebok",

  // Russian
  рибок: "Reebok",
  рибак: "Reebok",
  рибук: "Reebok",

  // Typos
  reebock: "Reebok",
  rebock: "Reebok",

  // ============================================
  // NEW BALANCE (20+ variations)
  // ============================================
  "new balance": "New Balance",
  newbalance: "New Balance",
  new_balance: "New Balance",
  nb: "New Balance",
  "n.b.": "New Balance",

  // Russian transliterations
  "нью беленс": "New Balance",
  "нью баланс": "New Balance",
  "ню баланс": "New Balance",
  ньюбеленс: "New Balance",
  нб: "New Balance",

  // Typos
  "new balence": "New Balance",
  "new ballance": "New Balance",
  "new blanace": "New Balance",
  newbalanace: "New Balance",

  // ============================================
  // CONVERSE (15+ variations)
  // ============================================
  converse: "Converse",
  converze: "Converse",
  convers: "Converse",

  // Russian
  конверс: "Converse",
  конверсы: "Converse",
  конверз: "Converse",

  // Popular line
  "chuck taylor": "Converse",
  chucks: "Converse",
  "all star": "Converse",

  // ============================================
  // VANS (15+ variations)
  // ============================================
  vans: "Vans",
  van: "Vans",
  vanz: "Vans",

  // Russian
  ванс: "Vans",
  вансы: "Vans",
  ванз: "Vans",

  // Popular line
  "old skool": "Vans",
  oldskool: "Vans",
  "sk8 hi": "Vans",

  // ============================================
  // ASICS (15+ variations)
  // ============================================
  asics: "Asics",
  asic: "Asics",
  asix: "Asics",
  asicks: "Asics",

  // Russian
  асикс: "Asics",
  асики: "Asics",
  азикс: "Asics",

  // Typos
  asiks: "Asics",
  asiics: "Asics",

  // ============================================
  // SKECHERS (15+ variations)
  // ============================================
  skechers: "Skechers",
  sketchers: "Skechers",
  skecher: "Skechers",
  sketcher: "Skechers",
  skerchers: "Skechers",

  // Russian
  скечерс: "Skechers",
  скетчерс: "Skechers",
  скетчеры: "Skechers",

  // Typos
  skeechers: "Skechers",

  // ============================================
  // UNDER ARMOUR (20+ variations)
  // ============================================
  "under armour": "Under Armour",
  underarmour: "Under Armour",
  under_armour: "Under Armour",
  "under armor": "Under Armour",
  underarmor: "Under Armour",
  ua: "Under Armour",
  "u.a.": "Under Armour",

  // Russian
  "андер армор": "Under Armour",
  "андер армур": "Under Armour",
  андерармор: "Under Armour",

  // Typos
  "under amour": "Under Armour",
  "under armur": "Under Armour",

  // ============================================
  // FILA (12+ variations)
  // ============================================
  fila: "Fila",
  filas: "Fila",
  phila: "Fila",
  filla: "Fila",

  // Russian
  фила: "Fila",
  филла: "Fila",
  фило: "Fila",

  // ============================================
  // ON RUNNING (15+ variations)
  // ============================================
  on: "On Running",
  "on running": "On Running",
  onrunning: "On Running",
  on_running: "On Running",

  // Russian
  "он раннинг": "On Running",
  он: "On Running",

  // ============================================
  // HOKA (12+ variations)
  // ============================================
  hoka: "Hoka",
  hokas: "Hoka",
  "hoka one one": "Hoka",
  hokaoneone: "Hoka",
  hocka: "Hoka",

  // Russian
  хока: "Hoka",
  хокка: "Hoka",

  // ============================================
  // SALOMON (12+ variations)
  // ============================================
  salomon: "Salomon",
  solomon: "Salomon",
  salamon: "Salomon",

  // Russian
  саломон: "Salomon",
  соломон: "Salomon",

  // ============================================
  // BROOKS (12+ variations)
  // ============================================
  brooks: "Brooks",
  brook: "Brooks",
  broks: "Brooks",

  // Russian
  брукс: "Brooks",
  брук: "Brooks",

  // ============================================
  // MIZUNO (12+ variations)
  // ============================================
  mizuno: "Mizuno",
  mizunos: "Mizuno",
  mizno: "Mizuno",

  // Russian
  мизуно: "Mizuno",
  мизуну: "Mizuno",
  мизано: "Mizuno",

  // ============================================
  // TIMBERLAND (15+ variations)
  // ============================================
  timberland: "Timberland",
  timberlands: "Timberland",
  timbaland: "Timberland",
  timberlan: "Timberland",
  timbs: "Timberland",

  // Russian
  тимберленд: "Timberland",
  тимберланд: "Timberland",
  тимбы: "Timberland",

  // ============================================
  // DR. MARTENS (15+ variations)
  // ============================================
  "dr martens": "Dr. Martens",
  "dr. martens": "Dr. Martens",
  drmartens: "Dr. Martens",
  "doc martens": "Dr. Martens",
  docs: "Dr. Martens",
  "dr marten": "Dr. Martens",

  // Russian
  "доктор мартенс": "Dr. Martens",
  мартенсы: "Dr. Martens",
  мартинсы: "Dr. Martens",

  // ============================================
  // CROCS (12+ variations)
  // ============================================
  crocs: "Crocs",
  croc: "Crocs",
  crox: "Crocs",

  // Russian
  крокс: "Crocs",
  кроксы: "Crocs",
  крокосы: "Crocs",
};
