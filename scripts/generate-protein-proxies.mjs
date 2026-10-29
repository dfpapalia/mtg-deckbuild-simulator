import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { proteinProxyDeck } from '../lib/protein-proxy-deck.ts';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const atlasDir = path.join(root, 'public', 'assets', 'proxy-atlas');
const outputDir = path.join(root, 'public', 'assets', 'protein-proxy', 'cards');
const manifestPath = path.join(root, 'public', 'assets', 'protein-proxy', 'manifest.json');

const fallbackType = {
  commander: 'Legendary Planeswalker — Quintorius',
  creature: 'Creature',
  artifact: 'Artifact',
  enchantment: 'Enchantment',
  instant: 'Instant',
  sorcery: 'Sorcery',
  land: 'Land',
};

const gymBroText = (value = '') => value
  .replace(/\bSpirits\b/g, '__GYMBRO_SPIRITS_PLURAL__')
  .replace(/\bSpirit\b/g, 'GymBro (Spirit)')
  .replace(/__GYMBRO_SPIRITS_PLURAL__/g, 'GymBros (Spirits)');

export function proxySlug(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function assetFilename(seed, copy) {
  const slug = proxySlug(seed.original);
  return (seed.quantity ?? 1) > 1 ? `${slug}-${copy}.webp` : `${slug}.webp`;
}

function escapeXml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function cleanMana(value = '—') {
  const symbols = [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  return symbols.length ? symbols.join(' · ') : value;
}

function wrapParagraph(text, maxChars) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= maxChars) current += ` ${word}`;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapText(text, maxChars) {
  return String(text || '').split(/\n+/).flatMap((paragraph, index) => {
    const lines = wrapParagraph(paragraph, maxChars);
    return index === 0 ? lines : ['', ...lines];
  });
}

function textBlock(lines, { x, y, size, lineHeight, color = '#f9f2df', weight = 400, italic = false, family = 'Arial, sans-serif' }) {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}>${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line || ' ')}</tspan>`).join('')}</text>`;
}

function framePalette(seed) {
  if (seed.category === 'land') return { edge: '#e7c77a', ink: '#17120e', glass: '#16120ee6', accent: '#fff2c4' };
  if (seed.category === 'artifact') return { edge: '#d6c6a0', ink: '#171819', glass: '#111416e8', accent: '#f5e8c4' };
  if (seed.category === 'commander' || seed.original.startsWith('Quintorius')) return { edge: '#ffd36b', ink: '#2b0c08', glass: '#2b0c08e8', accent: '#fff0ae' };
  return { edge: '#e9b75f', ink: '#260e0a', glass: '#260e0ae8', accent: '#fff0c2' };
}

function assignBaseArt(metadata) {
  const cursors = [0, 0, 0, 0, 0, 0];
  const claim = (sheet) => ({ file: path.join(atlasDir, `atlas-${sheet}.webp`), columns: 5, rows: 4, index: cursors[sheet]++ });
  return proteinProxyDeck.map((seed) => {
    const cardMetadata = lookupMetadata(metadata, seed);
    const isSpirit = /\bSpirit\b/i.test(cardMetadata.rawType ?? '');
    if (seed.category === 'commander' || seed.original.startsWith('Quintorius')) return claim(1);
    if (isSpirit) return claim(2);
    if (seed.category === 'creature') return cursors[3] < 20 ? claim(3) : claim(1);
    if (seed.category === 'artifact' || seed.category === 'enchantment') return cursors[4] < 20 ? claim(4) : claim(1);
    if (seed.category === 'instant' || seed.category === 'sorcery') return cursors[5] < 20 ? claim(5) : claim(4);
    const available = [5, 4, 1, 2, 3].find((sheet) => cursors[sheet] < 20) ?? 5;
    return claim(available);
  });
}

async function cropCell(spec) {
  const metadata = await sharp(spec.file).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const column = spec.index % spec.columns;
  const row = Math.floor(spec.index / spec.columns);
  const x0 = Math.round((column * width) / spec.columns);
  const x1 = Math.round(((column + 1) * width) / spec.columns);
  const y0 = Math.round((row * height) / spec.rows);
  const y1 = Math.round(((row + 1) * height) / spec.rows);
  const inset = Math.max(2, Math.round(Math.min(width / spec.columns, height / spec.rows) * 0.015));
  return sharp(spec.file)
    .extract({ left: x0 + inset, top: y0 + inset, width: Math.max(1, x1 - x0 - inset * 2), height: Math.max(1, y1 - y0 - inset * 2) })
    .resize(744, 1039, { fit: 'cover', position: 'attention' })
    .webp({ quality: 92 })
    .toBuffer();
}

async function fetchMetadata() {
  const chunks = [];
  for (let index = 0; index < proteinProxyDeck.length; index += 75) chunks.push(proteinProxyDeck.slice(index, index + 75));
  const result = new Map();
  for (const chunk of chunks) {
    const response = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'VaultForge-Proxy-Renderer/1.0' },
      body: JSON.stringify({ identifiers: chunk.map((seed) => ({ name: seed.original })) }),
    });
    if (!response.ok) throw new Error(`Scryfall respondió ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    for (const card of payload.data ?? []) {
      const faces = card.card_faces ?? [];
      const rawType = card.type_line || faces.map((face) => face.type_line).filter(Boolean).join(' // ');
      result.set(card.name.toLowerCase(), {
        name: card.name,
        mana: card.mana_cost || faces.map((face) => face.mana_cost).filter(Boolean).join(' // ') || '—',
        rawType,
        type: gymBroText(rawType),
        rules: gymBroText(card.oracle_text || faces.map((face) => face.oracle_text).filter(Boolean).join('\n//\n')),
        power: card.power,
        toughness: card.toughness,
        loyalty: card.loyalty,
      });
    }
  }
  return result;
}

function lookupMetadata(metadata, seed) {
  const exact = metadata.get(seed.original.toLowerCase());
  if (exact) return exact;
  const firstFace = seed.original.split(' // ')[0].toLowerCase();
  const found = [...metadata.values()].find((card) => card.name.toLowerCase() === firstFace || card.name.toLowerCase().startsWith(`${firstFace} //`));
  return found ?? { name: seed.original, mana: '—', rawType: seed.spirit ? 'Creature — Spirit' : fallbackType[seed.category], type: seed.spirit ? 'Creature — GymBro (Spirit)' : fallbackType[seed.category], rules: `Proxy temático de ${seed.original}. Conserva el texto de reglas de la carta original.` };
}

async function renderCard({ seed, metadata, art, cardNumber, copy, filename }) {
  const palette = framePalette(seed);
  const titleSize = Math.max(18, Math.min(34, Math.floor(510 / Math.max(1, seed.proxy.length * 0.56))));
  const typeSize = metadata.type.length > 58 ? 19 : metadata.type.length > 42 ? 21 : 23;
  let rulesSize = metadata.rules.length > 520 ? 15 : metadata.rules.length > 360 ? 17 : metadata.rules.length > 230 ? 19 : 21;
  let rulesLines = wrapText(metadata.rules, Math.round(72 * (19 / rulesSize)));
  while (rulesLines.length > 12 && rulesSize > 13) {
    rulesSize -= 1;
    rulesLines = wrapText(metadata.rules, Math.round(72 * (19 / rulesSize)));
  }
  const flavorLines = wrapText(seed.flavor, 67).slice(0, 2);
  const stat = metadata.power && metadata.toughness ? `${metadata.power}/${metadata.toughness}` : metadata.loyalty ? `L ${metadata.loyalty}` : '';
  const originalLabel = metadata.name.length > 44 ? `${metadata.name.slice(0, 41)}…` : metadata.name;
  const overlay = Buffer.from(`<svg width="744" height="1039" viewBox="0 0 744 1039" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".67"/><stop offset=".24" stop-color="#000" stop-opacity=".03"/><stop offset=".55" stop-color="#000" stop-opacity=".08"/><stop offset=".68" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".82"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity=".8"/></filter>
    </defs>
    <rect width="744" height="1039" fill="url(#shade)"/>
    <rect x="13" y="13" width="718" height="1013" rx="38" fill="none" stroke="${palette.edge}" stroke-width="12"/>
    <rect x="25" y="25" width="694" height="989" rx="31" fill="none" stroke="#fff5cf" stroke-opacity=".38" stroke-width="2"/>
    <rect x="35" y="37" width="674" height="79" rx="18" fill="${palette.glass}" stroke="${palette.edge}" stroke-width="2" filter="url(#shadow)"/>
    <text x="53" y="59" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="12" font-weight="800" letter-spacing="2.1">LECHE MERCADONA PROTEÍNA+ · LOREHOLD</text>
    <text x="53" y="96" fill="#fff9e9" font-family="Georgia, serif" font-size="${titleSize}" font-weight="700">${escapeXml(seed.proxy)}</text>
    <text x="688" y="96" fill="#fff3ca" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="800">${escapeXml(cleanMana(metadata.mana))}</text>
    <rect x="35" y="616" width="674" height="54" rx="12" fill="${palette.glass}" stroke="${palette.edge}" stroke-width="2" filter="url(#shadow)"/>
    <text x="53" y="651" fill="#fff8e6" font-family="Georgia, serif" font-size="${typeSize}" font-weight="700">${escapeXml(metadata.type)}</text>
    <text x="691" y="651" fill="${palette.accent}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="900">LHP</text>
    <rect x="35" y="682" width="674" height="299" rx="18" fill="${palette.glass}" stroke="${palette.edge}" stroke-width="2" filter="url(#shadow)"/>
    ${textBlock(rulesLines, { x: 54, y: 718, size: rulesSize, lineHeight: Math.round(rulesSize * 1.28), color: '#fffaf0' })}
    ${textBlock(flavorLines, { x: 54, y: 925, size: 16, lineHeight: 20, color: palette.accent, italic: true, family: 'Georgia, serif' })}
    <text x="52" y="1005" fill="#f7e9c5" font-family="Arial, sans-serif" font-size="10" font-weight="700">BASE: ${escapeXml(originalLabel.toUpperCase())}</text>
    <text x="472" y="1005" fill="#d9c8a3" text-anchor="middle" font-family="Arial, sans-serif" font-size="9">PROXY NO OFICIAL</text>
    <text x="692" y="1005" fill="#f7e9c5" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="800">${String(cardNumber).padStart(3, '0')}/100${copy > 1 ? ` · V${copy}` : ''}</text>
    ${stat ? `<rect x="616" y="927" width="76" height="42" rx="11" fill="#fff4d5" stroke="${palette.edge}" stroke-width="3"/><text x="654" y="956" fill="${palette.ink}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900">${escapeXml(stat)}</text>` : ''}
  </svg>`);

  await sharp(art)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .webp({ quality: 89, effort: 5 })
    .toFile(path.join(outputDir, filename));
}

await fs.mkdir(outputDir, { recursive: true });
const metadata = await fetchMetadata();
const baseArt = assignBaseArt(metadata);
const basicVariantAtlas = path.join(atlasDir, 'basic-land-variants.png');
const manifest = [];
let physicalIndex = 0;

for (let seedIndex = 0; seedIndex < proteinProxyDeck.length; seedIndex += 1) {
  const seed = proteinProxyDeck[seedIndex];
  const cardMetadata = lookupMetadata(metadata, seed);
  const quantity = seed.quantity ?? 1;
  for (let copy = 1; copy <= quantity; copy += 1) {
    physicalIndex += 1;
    let artSpec = baseArt[seedIndex];
    if (copy > 1 && seed.original === 'Mountain') artSpec = { file: basicVariantAtlas, columns: 5, rows: 3, index: copy - 2 };
    if (copy > 1 && seed.original === 'Plains') artSpec = { file: basicVariantAtlas, columns: 5, rows: 3, index: copy + 3 };
    const filename = assetFilename(seed, copy);
    const art = await cropCell(artSpec);
    await renderCard({ seed, metadata: cardMetadata, art, cardNumber: physicalIndex, copy, filename });
    manifest.push({ index: physicalIndex, copy, quantity, original: seed.original, proxy: seed.proxy, category: seed.category, file: `assets/protein-proxy/cards/${filename}` });
  }
}

await fs.mkdir(path.dirname(manifestPath), { recursive: true });
await fs.writeFile(manifestPath, `${JSON.stringify({ title: 'Lorehold Proteína+ — GymBros del Más Allá', uniqueDesigns: proteinProxyDeck.length, physicalCards: manifest.length, cards: manifest }, null, 2)}\n`, 'utf8');
console.log(`Generated ${manifest.length} proxy card images in ${outputDir}`);
