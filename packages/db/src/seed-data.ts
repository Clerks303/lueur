/**
 * Seed data — curated to sit in the Lueur editorial universe (design-literate,
 * muted palettes, tactile materials, understated brands). Images are from
 * picsum.photos with deterministic seeds so the seed is reproducible.
 *
 * These are NOT real products with real URLs. Price and brand names are
 * approximations for UI testing. A later task (T-post-MVP) will replace
 * this seed with curated real-world catalogue imports.
 */
import type { NewDuelPair, NewItem } from "./schema.js";

const img = (seed: string, w = 800): string =>
  `https://picsum.photos/seed/lueur-${seed}/${w}/${w}`;

// --------------------------------------------------------------------------
// Duel pairs — 20 total across domains. Difficulty 1 = obvious, 3 = subtle.
// --------------------------------------------------------------------------

export const duelPairs: NewDuelPair[] = [
  // Interior — seating
  {
    domain: "interior",
    dimension: "seating_style",
    optionA: { image_url: img("sofa-linen"), label: "canapé en lin écru", tags: ["linen", "warm_neutrals", "understated"] },
    optionB: { image_url: img("sofa-velvet-emerald"), label: "canapé velours émeraude", tags: ["velvet", "saturated", "statement"] },
    difficulty: 1,
  },
  {
    domain: "interior",
    dimension: "seating_style",
    optionA: { image_url: img("chair-wegner"), label: "chaise Wegner CH24 chêne", tags: ["mid_century", "oak", "organic_line"] },
    optionB: { image_url: img("chair-baroque"), label: "fauteuil Louis XV doré", tags: ["ornamentation_rich", "gold", "historical"] },
    difficulty: 1,
  },
  {
    domain: "interior",
    dimension: "material_patina",
    optionA: { image_url: img("table-oak-raw"), label: "table chêne non verni", tags: ["raw_wood", "tactile", "wabi_sabi"] },
    optionB: { image_url: img("table-glass-chrome"), label: "table verre piètement chrome", tags: ["chrome", "minimal_cold", "glossy"] },
    difficulty: 2,
  },
  {
    domain: "interior",
    dimension: "lighting",
    optionA: { image_url: img("lamp-paper"), label: "lampe papier Isamu Noguchi", tags: ["paper", "diffuse", "japandi"] },
    optionB: { image_url: img("lamp-led-strip"), label: "bandeau LED multicolore", tags: ["saturated", "tech", "rgb"] },
    difficulty: 1,
  },
  {
    domain: "interior",
    dimension: "wall_finish",
    optionA: { image_url: img("wall-lime-wash"), label: "chaux blanc cassé", tags: ["matte", "warm_neutrals", "artisan"] },
    optionB: { image_url: img("wall-wallpaper-floral"), label: "papier peint fleuri", tags: ["pattern_busy", "saturated", "traditional"] },
    difficulty: 2,
  },
  {
    domain: "interior",
    dimension: "ceramics",
    optionA: { image_url: img("vase-handmade-matte"), label: "vase grès tourné à la main", tags: ["handmade", "matte", "earth_tones"] },
    optionB: { image_url: img("vase-porcelain-gold"), label: "vase porcelaine filet or", tags: ["glossy", "formal", "status_signaling"] },
    difficulty: 2,
  },
  {
    domain: "interior",
    dimension: "textile",
    optionA: { image_url: img("rug-berber"), label: "tapis berbère laine naturelle", tags: ["wool", "warm_neutrals", "handmade"] },
    optionB: { image_url: img("rug-shag-pink"), label: "tapis shaggy rose pétard", tags: ["synthetic", "saturated", "novelty"] },
    difficulty: 1,
  },

  // Clothing — fit & material
  {
    domain: "clothing",
    dimension: "fit_cut",
    optionA: { image_url: img("jeans-apc-straight"), label: "jean droit brut APC", tags: ["straight_cut", "raw_denim", "understated"] },
    optionB: { image_url: img("jeans-rhinestone"), label: "jean skinny strass", tags: ["tight_fit", "embellishment", "loud"] },
    difficulty: 1,
  },
  {
    domain: "clothing",
    dimension: "material",
    optionA: { image_url: img("shirt-linen-howell"), label: "chemise lin Margaret Howell", tags: ["linen", "relaxed", "quality_craft"] },
    optionB: { image_url: img("shirt-polyester-print"), label: "chemise polyester motif tropical", tags: ["synthetic", "loud_print", "fast_fashion"] },
    difficulty: 1,
  },
  {
    domain: "clothing",
    dimension: "palette",
    optionA: { image_url: img("coat-camel-lemaire"), label: "manteau camel Lemaire", tags: ["warm_neutrals", "timeless", "longevity"] },
    optionB: { image_url: img("coat-neon"), label: "parka neon vert", tags: ["saturated_primaries", "trend_driven"] },
    difficulty: 2,
  },
  {
    domain: "clothing",
    dimension: "footwear",
    optionA: { image_url: img("shoes-adidas-samba"), label: "adidas Samba cuir", tags: ["leather", "discreet_logo", "classic"] },
    optionB: { image_url: img("shoes-balenciaga-triple"), label: "Balenciaga Triple S", tags: ["visible_logos", "maximalist", "status_signaling"] },
    difficulty: 2,
  },
  {
    domain: "clothing",
    dimension: "knitwear",
    optionA: { image_url: img("sweater-norse-merino"), label: "pull mérinos Norse Projects", tags: ["natural_fiber", "quiet", "warm_neutrals"] },
    optionB: { image_url: img("sweater-logo-large"), label: "sweat logo XXL fluo", tags: ["visible_logos", "loud", "streetwear"] },
    difficulty: 1,
  },

  // Food — cuisine & presentation
  {
    domain: "food",
    dimension: "cuisine",
    optionA: { image_url: img("food-kaiseki"), label: "bol kaiseki petit déjeuner ryokan", tags: ["japanese", "minimal", "seasonal"] },
    optionB: { image_url: img("food-fastfood-combo"), label: "menu fast-food combo", tags: ["industrial", "saturated_sauce"] },
    difficulty: 1,
  },
  {
    domain: "food",
    dimension: "wine",
    optionA: { image_url: img("wine-natural-loire"), label: "vin nature domaine Loire", tags: ["natural_wine", "small_producer", "funky"] },
    optionB: { image_url: img("wine-mass-brand"), label: "rouge industriel supermarché", tags: ["industrial", "brand_generic"] },
    difficulty: 2,
  },
  {
    domain: "food",
    dimension: "tableware",
    optionA: { image_url: img("plates-stoneware-neutral"), label: "assiettes grès mat artisanales", tags: ["handmade", "matte", "earth_tones"] },
    optionB: { image_url: img("plates-gold-rim"), label: "assiettes filet or brillant", tags: ["glossy", "formal", "gold"] },
    difficulty: 2,
  },

  // Music
  {
    domain: "music",
    dimension: "genre",
    optionA: { image_url: img("music-ambient-vinyl"), label: "vinyle ambient Nils Frahm", tags: ["ambient", "instrumental", "texture"] },
    optionB: { image_url: img("music-edm-festival"), label: "EDM festival mainstage", tags: ["saturated_drop", "mass_market"] },
    difficulty: 1,
  },
  {
    domain: "music",
    dimension: "listening_context",
    optionA: { image_url: img("music-deep-house-lateshow"), label: "deep house set 2h du matin", tags: ["deep_house", "slow_build", "nocturnal"] },
    optionB: { image_url: img("music-top40-radio"), label: "top 40 radio généraliste", tags: ["mainstream", "formatted"] },
    difficulty: 2,
  },

  // Travel
  {
    domain: "travel",
    dimension: "accommodation",
    optionA: { image_url: img("travel-ryokan-tatami"), label: "ryokan Kyoto tatami onsen", tags: ["ryokan", "slow", "cultural"] },
    optionB: { image_url: img("travel-las-vegas-strip"), label: "hôtel casino Las Vegas Strip", tags: ["maximalist", "neon", "mass_tourism"] },
    difficulty: 1,
  },
  {
    domain: "travel",
    dimension: "pace",
    optionA: { image_url: img("travel-slow-one-base"), label: "10 jours dans un village des Pouilles", tags: ["slow_one_base", "immersive"] },
    optionB: { image_url: img("travel-checklist-tour"), label: "6 capitales en 8 jours", tags: ["checklist_tour", "fast_pace"] },
    difficulty: 2,
  },
  {
    domain: "travel",
    dimension: "souvenir",
    optionA: { image_url: img("souvenir-ceramic-local"), label: "bol céramique artisan local", tags: ["handmade", "local", "tactile"] },
    optionB: { image_url: img("souvenir-fridge-magnet"), label: "aimant frigo touristique", tags: ["mass_produced", "kitsch"] },
    difficulty: 1,
  },
];

// --------------------------------------------------------------------------
// Items — 50 total, ordered by domain then brand. Embeddings null; a worker
// job populates them later via OpenAI text-embedding-3-large.
// --------------------------------------------------------------------------

export const items: NewItem[] = [
  // --- Interior: seating (10) ---
  { domain: "interior", title: "Chaise CH24 Wishbone", brand: "Carl Hansen & Søn", priceEur: "899", imageUrl: img("item-ch24"), productUrl: null, tags: ["chair", "oak", "mid_century", "handwoven_paper_cord"], metadata: { designer: "Hans J. Wegner", year: 1949 } },
  { domain: "interior", title: "Chaise Fiber lounge", brand: "Muuto", priceEur: "549", imageUrl: img("item-muuto-fiber"), productUrl: null, tags: ["lounge_chair", "muted_palette", "scandinavian"], metadata: { designer: "Iskos-Berlin" } },
  { domain: "interior", title: "Canapé Togo modulaire 2 places", brand: "Ligne Roset", priceEur: "3200", imageUrl: img("item-togo"), productUrl: null, tags: ["sofa", "textile", "1970s", "statement"], metadata: { designer: "Michel Ducaroy" } },
  { domain: "interior", title: "Fauteuil Mags Soft", brand: "Hay", priceEur: "1890", imageUrl: img("item-mags-soft"), productUrl: null, tags: ["armchair", "wool", "understated"], metadata: {} },
  { domain: "interior", title: "Tabouret S01 chêne brut", brand: "Kann Design", priceEur: "410", imageUrl: img("item-kann-stool"), productUrl: null, tags: ["stool", "oak", "raw_wood"], metadata: {} },
  { domain: "interior", title: "Chaise Eames LCW", brand: "Vitra", priceEur: "1450", imageUrl: img("item-eames-lcw"), productUrl: null, tags: ["chair", "plywood", "mid_century"], metadata: { designer: "Charles & Ray Eames", year: 1945 } },
  { domain: "interior", title: "Banc Shaker chêne", brand: "Margaret Howell Home", priceEur: "1280", imageUrl: img("item-mh-bench"), productUrl: null, tags: ["bench", "oak", "shaker", "understated"], metadata: {} },
  { domain: "interior", title: "Chaise Thonet 214", brand: "Thonet", priceEur: "620", imageUrl: img("item-thonet-214"), productUrl: null, tags: ["chair", "bentwood", "historical"], metadata: { year: 1859 } },
  { domain: "interior", title: "Fauteuil Rufus", brand: "Ferm Living", priceEur: "1290", imageUrl: img("item-ferm-rufus"), productUrl: null, tags: ["armchair", "boucle", "muted"], metadata: {} },
  { domain: "interior", title: "Chaise Beetle velours côtelé", brand: "Gubi", priceEur: "980", imageUrl: img("item-gubi-beetle"), productUrl: null, tags: ["chair", "corduroy", "warm_neutrals"], metadata: { designer: "GamFratesi" } },

  // --- Interior: lighting (6) ---
  { domain: "interior", title: "Lampe de table Matin 300", brand: "Hay", priceEur: "319", imageUrl: img("item-hay-matin"), productUrl: null, tags: ["lamp", "fabric_shade", "warm_light"], metadata: { designer: "Inga Sempé" } },
  { domain: "interior", title: "Suspension IC S1", brand: "Flos", priceEur: "395", imageUrl: img("item-flos-ic"), productUrl: null, tags: ["pendant", "brass", "minimal"], metadata: { designer: "Michael Anastassiades" } },
  { domain: "interior", title: "Lampe papier Akari 10A", brand: "Vitra (Noguchi)", priceEur: "315", imageUrl: img("item-akari-10a"), productUrl: null, tags: ["floor_lamp", "paper", "japandi"], metadata: { designer: "Isamu Noguchi" } },
  { domain: "interior", title: "Applique 265", brand: "Flos", priceEur: "920", imageUrl: img("item-flos-265"), productUrl: null, tags: ["wall_sconce", "adjustable", "black_metal"], metadata: { designer: "Paolo Rizzatto" } },
  { domain: "interior", title: "Lampadaire Column", brand: "Astep", priceEur: "1480", imageUrl: img("item-astep-column"), productUrl: null, tags: ["floor_lamp", "architectural", "warm_neutrals"], metadata: {} },
  { domain: "interior", title: "Lampe TMM nogal", brand: "Santa & Cole", priceEur: "520", imageUrl: img("item-tmm"), productUrl: null, tags: ["floor_lamp", "walnut", "paper_shade"], metadata: { designer: "Miguel Milá", year: 1961 } },

  // --- Interior: tables & storage (6) ---
  { domain: "interior", title: "Table Superellipse PK54", brand: "Fritz Hansen", priceEur: "4900", imageUrl: img("item-pk54"), productUrl: null, tags: ["dining_table", "oak", "mid_century"], metadata: { designer: "Piet Hein & Bruno Mathsson" } },
  { domain: "interior", title: "Table basse Slab chêne", brand: "Tom Dixon", priceEur: "1650", imageUrl: img("item-slab"), productUrl: null, tags: ["coffee_table", "oak", "minimal"], metadata: {} },
  { domain: "interior", title: "Bibliothèque USM Haller blanc 3 modules", brand: "USM", priceEur: "2100", imageUrl: img("item-usm-haller"), productUrl: null, tags: ["shelving", "modular", "swiss_design"], metadata: {} },
  { domain: "interior", title: "Console Linea chêne huilé", brand: "Ethnicraft", priceEur: "1390", imageUrl: img("item-linea"), productUrl: null, tags: ["console", "oak", "understated"], metadata: {} },
  { domain: "interior", title: "Table d'appoint Drop", brand: "Menu", priceEur: "320", imageUrl: img("item-menu-drop"), productUrl: null, tags: ["side_table", "travertine", "organic_form"], metadata: {} },
  { domain: "interior", title: "Étagère String Pocket", brand: "String Furniture", priceEur: "139", imageUrl: img("item-string-pocket"), productUrl: null, tags: ["shelving", "steel_wire", "scandinavian"], metadata: { designer: "Nisse Strinning", year: 1949 } },

  // --- Interior: textiles & accessories (4) ---
  { domain: "interior", title: "Plaid mérinos Klippan", brand: "Klippan", priceEur: "160", imageUrl: img("item-klippan"), productUrl: null, tags: ["throw", "wool", "muted"], metadata: {} },
  { domain: "interior", title: "Vase grès Alinéa", brand: "Serax", priceEur: "85", imageUrl: img("item-serax-vase"), productUrl: null, tags: ["vase", "stoneware", "handmade_look"], metadata: {} },
  { domain: "interior", title: "Bougie Diptyque Baies", brand: "Diptyque", priceEur: "65", imageUrl: img("item-diptyque-baies"), productUrl: null, tags: ["candle", "parisian_staple"], metadata: {} },
  { domain: "interior", title: "Tapis berbère Beni Ourain", brand: "Beni Rugs", priceEur: "1490", imageUrl: img("item-beni-ourain"), productUrl: null, tags: ["rug", "wool", "handmade", "warm_neutrals"], metadata: {} },

  // --- Clothing: women (14) ---
  { domain: "clothing", title: "Martin jean droit brut", brand: "APC", priceEur: "195", imageUrl: img("item-apc-martin"), productUrl: null, tags: ["jeans", "raw_denim", "straight_cut"], metadata: {} },
  { domain: "clothing", title: "Manteau camel Wool-Cashmere", brand: "Lemaire", priceEur: "1490", imageUrl: img("item-lemaire-coat"), productUrl: null, tags: ["coat", "wool", "warm_neutrals", "quiet_luxury"], metadata: {} },
  { domain: "clothing", title: "Chemise lin Tropez", brand: "Margaret Howell", priceEur: "420", imageUrl: img("item-mh-shirt"), productUrl: null, tags: ["shirt", "linen", "relaxed_fit"], metadata: {} },
  { domain: "clothing", title: "Pull mérinos col rond", brand: "Norse Projects", priceEur: "220", imageUrl: img("item-norse-merino"), productUrl: null, tags: ["sweater", "merino", "discreet"], metadata: {} },
  { domain: "clothing", title: "Jupe midi plissée laine", brand: "Le17Septembre", priceEur: "340", imageUrl: img("item-17sep-skirt"), productUrl: null, tags: ["skirt", "wool", "understated"], metadata: {} },
  { domain: "clothing", title: "Trench coton Kilburn", brand: "Burberry", priceEur: "2390", imageUrl: img("item-trench"), productUrl: null, tags: ["trench", "cotton", "timeless"], metadata: {} },
  { domain: "clothing", title: "T-shirt coton bio boxy", brand: "Lady White Co.", priceEur: "85", imageUrl: img("item-ladywhite"), productUrl: null, tags: ["tshirt", "organic_cotton", "slightly_oversized"], metadata: {} },
  { domain: "clothing", title: "Sneakers Stan Smith cuir naturel", brand: "Adidas", priceEur: "100", imageUrl: img("item-stansmith"), productUrl: null, tags: ["sneakers", "leather", "discreet_logo"], metadata: {} },
  { domain: "clothing", title: "Bottines derby cuir", brand: "Paraboot", priceEur: "450", imageUrl: img("item-paraboot"), productUrl: null, tags: ["shoes", "leather", "artisan"], metadata: {} },
  { domain: "clothing", title: "Cardigan coton twist", brand: "Sézane", priceEur: "155", imageUrl: img("item-sezane"), productUrl: null, tags: ["cardigan", "cotton", "parisian_ease"], metadata: {} },
  { domain: "clothing", title: "Chemise rayée crème", brand: "Toast", priceEur: "175", imageUrl: img("item-toast-shirt"), productUrl: null, tags: ["shirt", "cotton", "muted"], metadata: {} },
  { domain: "clothing", title: "Pantalon carotte laine", brand: "The Row", priceEur: "890", imageUrl: img("item-therow"), productUrl: null, tags: ["pants", "wool", "quiet_luxury"], metadata: {} },
  { domain: "clothing", title: "Écharpe cachemire unie", brand: "Begg x Co", priceEur: "280", imageUrl: img("item-begg"), productUrl: null, tags: ["scarf", "cashmere", "warm_neutrals"], metadata: {} },
  { domain: "clothing", title: "Sac cabas toile", brand: "Hermès Cabas", priceEur: "720", imageUrl: img("item-cabas"), productUrl: null, tags: ["bag", "canvas", "understated"], metadata: {} },

  // --- Food / books (4) ---
  { domain: "food", title: "Livre: The NYT Cookbook", brand: "NYT", priceEur: "38", imageUrl: img("item-nyt-cookbook"), productUrl: null, tags: ["book", "recipes", "staple"], metadata: {} },
  { domain: "food", title: "Livre: Chez Panisse Menu Cookbook", brand: "Alice Waters", priceEur: "35", imageUrl: img("item-chez-panisse"), productUrl: null, tags: ["book", "seasonal", "california"], metadata: {} },
  { domain: "food", title: "Couteau Santoku Tadafusa", brand: "Tadafusa", priceEur: "210", imageUrl: img("item-santoku"), productUrl: null, tags: ["knife", "japanese", "handcrafted"], metadata: {} },
  { domain: "food", title: "Set 4 assiettes grès Ø24", brand: "Jars Céramistes", priceEur: "120", imageUrl: img("item-jars"), productUrl: null, tags: ["dinnerware", "stoneware", "matte"], metadata: {} },

  // --- Music (3) ---
  { domain: "music", title: "Vinyle Spaces (Nils Frahm)", brand: "Erased Tapes", priceEur: "28", imageUrl: img("item-frahm-spaces"), productUrl: null, tags: ["vinyl", "ambient", "instrumental"], metadata: {} },
  { domain: "music", title: "Platine Debut Carbon EVO", brand: "Pro-Ject", priceEur: "449", imageUrl: img("item-projet-debut"), productUrl: null, tags: ["turntable", "audiophile_entry"], metadata: {} },
  { domain: "music", title: "Enceinte M-20 MKII bois", brand: "Kanto", priceEur: "380", imageUrl: img("item-kanto-m20"), productUrl: null, tags: ["speaker", "wood_finish", "warm_sound"], metadata: {} },

  // --- Travel (3) ---
  { domain: "travel", title: "Nuit ryokan Hoshinoya Kyoto", brand: "Hoshinoya", priceEur: "650", imageUrl: img("item-hoshinoya"), productUrl: null, tags: ["accommodation", "ryokan", "japan"], metadata: {} },
  { domain: "travel", title: "Maison d'hôtes Le Convent à Lourmarin", brand: "Le Convent", priceEur: "280", imageUrl: img("item-convent"), productUrl: null, tags: ["accommodation", "provence", "boutique_hotel"], metadata: {} },
  { domain: "travel", title: "Guide Wallpaper* Kyoto", brand: "Wallpaper*", priceEur: "12", imageUrl: img("item-wallpaper-kyoto"), productUrl: null, tags: ["guidebook", "design_travel"], metadata: {} },
];
