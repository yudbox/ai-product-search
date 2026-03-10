/**
 * Color Name Normalizations
 * Production-grade color mappings with shades, tints, and multilingual support
 * Based on CSS color names and fashion industry terminology
 */

export const COLOR_MAP: Record<string, string> = {
  // ============================================
  // RED FAMILY (25+ variations)
  // ============================================
  red: "red",
  crimson: "red",
  scarlet: "red",
  ruby: "red",
  burgundy: "red",
  maroon: "red",
  cherry: "red",
  wine: "red",
  brick: "red",
  rust: "red",
  coral: "red",
  salmon: "red",

  // Russian
  красный: "red",
  красные: "red",
  красная: "red",
  бордовый: "red",
  бордо: "red",
  вишневый: "red",
  алый: "red",
  рубиновый: "red",
  коралловый: "red",

  // ============================================
  // BLUE FAMILY (25+ variations)
  // ============================================
  blue: "blue",
  navy: "blue",
  royal: "blue",
  cobalt: "blue",
  azure: "blue",
  cerulean: "blue",
  sky: "blue",
  "sky blue": "blue",
  teal: "blue",
  turquoise: "blue",
  aqua: "blue",
  cyan: "blue",
  sapphire: "blue",

  // Russian
  синий: "blue",
  синие: "blue",
  синяя: "blue",
  голубой: "blue",
  голубые: "blue",
  небесный: "blue",
  лазурный: "blue",
  бирюзовый: "blue",

  // ============================================
  // BLACK FAMILY (20+ variations)
  // ============================================
  black: "black",
  noir: "black",
  ebony: "black",
  jet: "black",
  onyx: "black",
  charcoal: "black",
  midnight: "black",
  obsidian: "black",
  "jet black": "black",

  // Russian
  черный: "black",
  черные: "black",
  черная: "black",
  чёрный: "black",
  угольный: "black",

  // ============================================
  // WHITE FAMILY (20+ variations)
  // ============================================
  white: "white",
  ivory: "white",
  cream: "white",
  pearl: "white",
  snow: "white",
  eggshell: "white",
  "off white": "white",
  "off-white": "white",
  offwhite: "white",
  beige: "white",
  vanilla: "white",

  // Russian
  белый: "white",
  белые: "white",
  белая: "white",
  кремовый: "white",
  молочный: "white",
  слоновая_кость: "white",
  бежевый: "white",

  // ============================================
  // GRAY FAMILY (20+ variations)
  // ============================================
  gray: "gray",
  grey: "gray",
  silver: "gray",
  slate: "gray",
  ash: "gray",
  smoke: "gray",
  steel: "gray",
  pewter: "gray",
  graphite: "gray",
  "light gray": "gray",
  "dark gray": "gray",

  // Russian
  серый: "gray",
  серые: "gray",
  серая: "gray",
  серебристый: "gray",
  стальной: "gray",
  пепельный: "gray",
  графитовый: "gray",

  // ============================================
  // GREEN FAMILY (25+ variations)
  // ============================================
  green: "green",
  lime: "green",
  olive: "green",
  forest: "green",
  mint: "green",
  emerald: "green",
  jade: "green",
  sage: "green",
  pine: "green",
  moss: "green",
  hunter: "green",
  seafoam: "green",

  // Russian
  зеленый: "green",
  зелёный: "green",
  зеленые: "green",
  зеленая: "green",
  салатовый: "green",
  оливковый: "green",
  мятный: "green",
  изумрудный: "green",
  хаки: "green",

  // ============================================
  // YELLOW FAMILY (20+ variations)
  // ============================================
  yellow: "yellow",
  gold: "yellow",
  golden: "yellow",
  lemon: "yellow",
  mustard: "yellow",
  butter: "yellow",
  canary: "yellow",
  honey: "yellow",
  amber: "yellow",

  // Russian
  желтый: "yellow",
  жёлтый: "yellow",
  желтые: "yellow",
  желтая: "yellow",
  золотой: "yellow",
  золотистый: "yellow",
  лимонный: "yellow",
  горчичный: "yellow",

  // ============================================
  // BROWN FAMILY (20+ variations)
  // ============================================
  brown: "brown",
  tan: "brown",
  bronze: "brown",
  chocolate: "brown",
  coffee: "brown",
  caramel: "brown",
  mocha: "brown",
  chestnut: "brown",
  mahogany: "brown",
  sepia: "brown",

  // Russian
  коричневый: "brown",
  коричневые: "brown",
  коричневая: "brown",
  шоколадный: "brown",
  кофейный: "brown",
  бронзовый: "brown",
  каштановый: "brown",
  светло_коричневый: "brown",

  // ============================================
  // PINK FAMILY (20+ variations)
  // ============================================
  pink: "pink",
  rose: "pink",
  blush: "pink",
  fuchsia: "pink",
  magenta: "pink",
  hot_pink: "pink",
  "hot pink": "pink",
  flamingo: "pink",
  bubblegum: "pink",

  // Russian
  розовый: "pink",
  розовые: "pink",
  розовая: "pink",
  малиновый: "pink",
  фуксия: "pink",

  // ============================================
  // ORANGE FAMILY (20+ variations)
  // ============================================
  orange: "orange",
  tangerine: "orange",
  peach: "orange",
  apricot: "orange",
  pumpkin: "orange",
  terracotta: "orange",
  burnt_orange: "orange",
  "burnt orange": "orange",

  // Russian
  оранжевый: "orange",
  оранжевые: "orange",
  оранжевая: "orange",
  персиковый: "orange",
  абрикосовый: "orange",
  морковный: "orange",

  // ============================================
  // PURPLE FAMILY (25+ variations)
  // ============================================
  purple: "purple",
  violet: "purple",
  lavender: "purple",
  plum: "purple",
  mauve: "purple",
  indigo: "purple",
  lilac: "purple",
  orchid: "purple",
  eggplant: "purple",
  amethyst: "purple",
  grape: "purple",

  // Russian
  фиолетовый: "purple",
  фиолетовые: "purple",
  фиолетовая: "purple",
  сиреневый: "purple",
  лиловый: "purple",
  пурпурный: "purple",
  баклажанный: "purple",

  // ============================================
  // MULTICOLOR & SPECIAL (15+ variations)
  // ============================================
  multicolor: "multicolor",
  multi: "multicolor",
  rainbow: "multicolor",
  colorful: "multicolor",
  mixed: "multicolor",

  // Metallics
  metallic: "metallic",
  chrome: "metallic",
  reflective: "metallic",
  iridescent: "metallic",
  holographic: "metallic",

  // Russian
  разноцветный: "multicolor",
  цветной: "multicolor",
  металлик: "metallic",
  хром: "metallic",
};
