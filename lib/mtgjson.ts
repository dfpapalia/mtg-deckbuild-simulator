const API_ROOT = 'https://mtgjson.com/api/v5';

export type MtgSetSummary = {
  code: string;
  name: string;
  releaseDate?: string;
  type: string;
  isOnlineOnly?: boolean;
  sealedProduct?: SealedProduct[];
};

type PackReference = { code: string; set: string };
type SealedReference = { count?: number; name: string; set: string; uuid: string };

export type SealedProduct = {
  uuid: string;
  name: string;
  category: string;
  subtype?: string;
  cardCount?: number;
  identifiers?: { tcgplayerProductId?: string };
  contents?: { pack?: PackReference[]; sealed?: SealedReference[] };
};

type BoosterSheet = {
  foil: boolean;
  allowDuplicates?: boolean;
  totalWeight: number;
  cards: Record<string, number>;
};

type BoosterConfig = {
  name: string;
  boostersTotalWeight: number;
  boosters: Array<{ weight: number; contents: Record<string, number> }>;
  sheets: Record<string, BoosterSheet>;
  sourceSetCodes?: string[];
};

type MtgJsonCard = {
  uuid: string;
  name: string;
  number: string;
  rarity: string;
  type: string;
  manaCost?: string;
  text?: string;
  colors?: string[];
  colorIdentity?: string[];
  keywords?: string[];
  identifiers?: { scryfallId?: string };
  otherFaceIds?: string[];
};

export type MtgSetData = MtgSetSummary & {
  cards: MtgJsonCard[];
  booster?: Record<string, BoosterConfig>;
};

export type BoosterProduct = {
  code: string;
  name: string;
  cardCount: number;
  subtype: string;
  image: string | null;
};

export type OpenedCard = {
  id: string;
  uuid: string;
  name: string;
  rarity: string;
  slot: string;
  set: string;
  setName: string;
  image: string;
  foil: boolean;
  type: string;
  mana: string;
  color: string;
  tags: string[];
  qty: number;
};

const setCache = new Map<string, MtgSetData>();
const rawSetCache = new Map<string, Promise<MtgSetData>>();

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`MTGJSON respondió ${response.status}`);
  return response.json() as Promise<T>;
}

export async function loadSetCatalog(): Promise<MtgSetSummary[]> {
  const payload = await getJson<{ data: MtgSetSummary[] }>(`${API_ROOT}/SetList.json`);
  const today = new Date().toISOString().slice(0, 10);
  return payload.data
    .filter((set) => !set.isOnlineOnly && (!set.releaseDate || set.releaseDate <= today) && set.sealedProduct?.some((product) => product.contents?.pack?.length))
    .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
}

export async function loadSet(code: string): Promise<MtgSetData> {
  const normalized = code.toUpperCase();
  const cached = setCache.get(normalized);
  if (cached) return cached;
  const base = await loadRawSet(normalized);
  const sourceCodes = [...new Set(Object.values(base.booster ?? {}).flatMap((config) => config.sourceSetCodes ?? []))]
    .filter((sourceCode) => sourceCode.toUpperCase() !== normalized);
  const sources = await Promise.all(sourceCodes.map((sourceCode) => loadRawSet(sourceCode).catch(() => null)));
  const merged = { ...base, cards: dedupeCards([base, ...sources.filter((source): source is MtgSetData => Boolean(source))].flatMap((source) => source.cards)) };
  setCache.set(normalized, merged);
  return merged;
}

export function getBoosterProducts(set: MtgSetData): BoosterProduct[] {
  const configs = set.booster ?? {};
  const products = new Map<string, BoosterProduct>();
  for (const product of set.sealedProduct ?? []) {
    for (const pack of product.contents?.pack ?? []) {
      const config = configs[pack.code];
      if (!config || products.has(pack.code)) continue;
      products.set(pack.code, {
        code: pack.code,
        name: product.name.replace(new RegExp(`^${escapeRegExp(set.name)}\\s*`, 'i'), ''),
        cardCount: product.cardCount ?? countCards(config),
        subtype: product.subtype ?? pack.code,
        image: product.identifiers?.tcgplayerProductId ? tcgplayerProductImage(product.identifiers.tcgplayerProductId) : null,
      });
    }
  }
  return [...products.values()];
}

export function simulateBooster(set: MtgSetData, productCode: string): OpenedCard[] {
  const config = set.booster?.[productCode];
  if (!config) throw new Error('Este producto no tiene una configuración de sobre disponible.');
  const variation = weightedPick(config.boosters, (entry) => entry.weight);
  const cardMap = new Map(set.cards.map((card) => [card.uuid, card]));
  const selectedAcrossPack = new Set<string>();
  const result: OpenedCard[] = [];

  Object.entries(variation.contents).forEach(([sheetName, count]) => {
    const sheet = config.sheets[sheetName];
    if (!sheet) return;
    const available = Object.entries(sheet.cards);
    const selectedInSheet = new Set<string>();
    for (let index = 0; index < count; index += 1) {
      const candidates = available.filter(([uuid]) => sheet.allowDuplicates || (!selectedInSheet.has(uuid) && !selectedAcrossPack.has(uuid)));
      const pool = candidates.length ? candidates : available.filter(([uuid]) => sheet.allowDuplicates || !selectedInSheet.has(uuid));
      const [uuid] = weightedPick(pool.length ? pool : available, (entry) => entry[1]);
      const source = cardMap.get(uuid);
      if (!source) continue;
      selectedInSheet.add(uuid);
      selectedAcrossPack.add(uuid);
      const scryfallId = source.identifiers?.scryfallId;
      result.push({
        id: `${uuid}:${sheetName}:${index}:${crypto.randomUUID()}`,
        uuid,
        name: source.name,
        rarity: rarityLabel(source.rarity),
        slot: humanize(sheetName),
        set: `${set.code.toUpperCase()} · ${source.number}`,
        setName: set.name,
        image: scryfallId ? scryfallImage(scryfallId) : namedImage(source.name),
        foil: Boolean(sheet.foil),
        type: source.type,
        mana: source.manaCost || '—',
        color: (source.colors?.length ? source.colors : source.colorIdentity ?? []).join('') || 'C',
        tags: [...new Set([...(source.keywords ?? []), ...keywordTags(source.text ?? '')])].map((tag) => tag.toLowerCase()),
        qty: 1,
      });
    }
  });
  return result;
}

function countCards(config: BoosterConfig) {
  const variation = config.boosters[0];
  return variation ? Object.values(variation.contents).reduce((total, count) => total + count, 0) : 0;
}

function loadRawSet(code: string) {
  const normalized = code.toUpperCase();
  const existing = rawSetCache.get(normalized);
  if (existing) return existing;
  const request = getJson<{ data: MtgSetData }>(`${API_ROOT}/${normalized}.json`).then((payload) => payload.data);
  rawSetCache.set(normalized, request);
  return request;
}

function dedupeCards(cards: MtgJsonCard[]) {
  return [...new Map(cards.map((card) => [card.uuid, card])).values()];
}

function weightedPick<T>(values: T[], weight: (value: T) => number): T {
  if (!values.length) throw new Error('No hay opciones disponibles en este slot.');
  const total = values.reduce((sum, value) => sum + Math.max(0, weight(value)), 0);
  let cursor = Math.random() * total;
  for (const value of values) {
    cursor -= Math.max(0, weight(value));
    if (cursor <= 0) return value;
  }
  return values[values.length - 1];
}

function rarityLabel(rarity: string) {
  return ({ common: 'Común', uncommon: 'Infrecuente', rare: 'Rara', mythic: 'Mítica', special: 'Especial', bonus: 'Bonus' } as Record<string, string>)[rarity] ?? humanize(rarity);
}

function keywordTags(text: string) {
  const known = ['ramp', 'draw', 'discard', 'landfall', 'lifelink', 'flying', 'trample', 'haste', 'deathtouch', 'vigilance', 'menace', 'ward', 'surveil', 'manifest dread'];
  const normalized = text.toLowerCase();
  return known.filter((keyword) => normalized.includes(keyword));
}

function scryfallImage(id: string) {
  return `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg`;
}

function namedImage(name: string) {
  return `https://api.scryfall.com/cards/named?format=image&version=normal&exact=${encodeURIComponent(name)}`;
}

function tcgplayerProductImage(id: string) {
  return `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg`;
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
