'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, ArrowRight, Ban, BarChart3, Check, ChevronDown, ChevronLeft, ChevronRight, CirclePlus, Crown, Download,
  Eye, EyeOff, Filter, Grid2X2, Hand, Heart, Images, LandPlot, Layers3, Library, List, Minus, Move, PackageOpen, Plus, RotateCcw, RotateCw, Scissors,
  Search, ShieldCheck, Shuffle, SkipForward, Sparkles, Skull, Swords, UserRound, WandSparkles, X, Zap, ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getBoosterProducts, loadSet, loadSetCatalog, simulateBooster, type BoosterProduct, type MtgSetData, type MtgSetSummary } from '@/lib/mtgjson';
import { loadProteinProxyMetadata, proteinProxyCardImage, proteinProxyDeck } from '@/lib/protein-proxy-deck';

type AppView = 'packs' | 'collection' | 'builder' | 'playtest';
type ViewMode = 'automatic' | 'stack' | 'grid';
type DeckFormat = 'commander' | 'standard' | 'modern' | 'legacy' | 'pauper' | 'limited';
type ProxyDetails = { originalName: string; oracleText: string; flavor: string; images: string[]; deck: string };
type Card = { id?: string; uuid?: string; name: string; rarity: string; slot: string; set: string; setName: string; image: string; foil: boolean; type: string; mana: string; color: string; tags: string[]; types?: string[]; subtypes?: string[]; supertypes?: string[]; manaValue?: number; power?: string; toughness?: string; qty: number; proxy?: ProxyDetails };

const image = (name: string) => `https://api.scryfall.com/cards/named?format=image&version=normal&exact=${encodeURIComponent(name)}`;
const cards: Card[] = [
  { name: 'Kaito, Bane of Nightmares', rarity: 'Mítica', slot: 'Borderless', set: 'DSK · 220', setName: 'Duskmourn', image: image('Kaito, Bane of Nightmares'), foil: true, type: 'Legendary Planeswalker — Kaito', mana: '2UB', color: 'UB', tags: ['ninjutsu', 'draw'], supertypes: ['Legendary'], types: ['Planeswalker'], subtypes: ['Kaito'], manaValue: 4, qty: 1 },
  { name: 'Overlord of the Hauntwoods', rarity: 'Mítica', slot: 'Foil tradicional', set: 'DSK · 194', setName: 'Duskmourn', image: image('Overlord of the Hauntwoods'), foil: true, type: 'Enchantment Creature — Avatar Horror', mana: '3GG', color: 'G', tags: ['ramp', 'landfall'], types: ['Enchantment', 'Creature'], subtypes: ['Avatar', 'Horror'], manaValue: 5, power: '6', toughness: '5', qty: 1 },
  { name: 'Unholy Annex // Ritual Chamber', rarity: 'Rara', slot: 'Double-faced', set: 'DSK · 118', setName: 'Duskmourn', image: image('Unholy Annex'), foil: false, type: 'Enchantment — Room', mana: '2B', color: 'B', tags: ['draw', 'demon'], types: ['Enchantment'], subtypes: ['Room'], manaValue: 3, qty: 2 },
  { name: 'Enduring Curiosity', rarity: 'Rara', slot: 'Rare / Mythic', set: 'DSK · 51', setName: 'Duskmourn', image: image('Enduring Curiosity'), foil: false, type: 'Enchantment Creature — Cat Glimmer', mana: '2UU', color: 'U', tags: ['draw', 'flash'], types: ['Enchantment', 'Creature'], subtypes: ['Cat', 'Glimmer'], manaValue: 4, power: '4', toughness: '3', qty: 1 },
  { name: 'Fear of Missing Out', rarity: 'Rara', slot: 'Wildcard', set: 'DSK · 136', setName: 'Duskmourn', image: image('Fear of Missing Out'), foil: false, type: 'Creature — Nightmare', mana: '1R', color: 'R', tags: ['discard', 'extra combat'], types: ['Creature'], subtypes: ['Nightmare'], manaValue: 2, power: '2', toughness: '3', qty: 2 },
  { name: 'Sol Ring', rarity: 'Infrecuente', slot: 'Commander staple', set: 'CMM · 396', setName: 'Commander Masters', image: image('Sol Ring'), foil: false, type: 'Artifact', mana: '1', color: 'C', tags: ['ramp', 'artifact'], qty: 3 },
  { name: 'Command Tower', rarity: 'Común', slot: 'Land', set: 'CMM · 991', setName: 'Commander Masters', image: image('Command Tower'), foil: false, type: 'Land', mana: '—', color: 'C', tags: ['mana fixing', 'land'], qty: 4 },
  { name: 'Arcane Signet', rarity: 'Infrecuente', slot: 'Commander staple', set: 'CMM · 378', setName: 'Commander Masters', image: image('Arcane Signet'), foil: true, type: 'Artifact', mana: '2', color: 'C', tags: ['ramp', 'mana fixing'], qty: 2 },
  { name: 'Beast Within', rarity: 'Infrecuente', slot: 'Interaction', set: 'CMM · 271', setName: 'Commander Masters', image: image('Beast Within'), foil: false, type: 'Instant', mana: '2G', color: 'G', tags: ['removal', 'instant'], qty: 2 },
  { name: 'Cultivate', rarity: 'Infrecuente', slot: 'Ramp', set: 'M21 · 177', setName: 'Core Set 2021', image: image('Cultivate'), foil: false, type: 'Sorcery', mana: '2G', color: 'G', tags: ['ramp', 'land'], qty: 3 },
];

const proxyCategoryType: Record<string, string> = { commander: 'Legendary Planeswalker — Quintorius', creature: 'Creature', artifact: 'Artifact', enchantment: 'Enchantment', instant: 'Instant', sorcery: 'Sorcery', land: 'Land' };
const proxyCategoryTypes: Record<string, string[]> = { commander: ['Planeswalker'], creature: ['Creature'], artifact: ['Artifact'], enchantment: ['Enchantment'], instant: ['Instant'], sorcery: ['Sorcery'], land: ['Land'] };
const proteinProxyCards: Card[] = proteinProxyDeck.map((seed, index) => { const images = Array.from({ length: seed.quantity ?? 1 }, (_, copy) => proteinProxyCardImage(seed, copy + 1)); return ({
  uuid: `lorehold-protein:${seed.original}`,
  name: seed.proxy,
  rarity: seed.category === 'commander' ? 'Mítica' : seed.category === 'land' ? 'Común' : 'Proxy',
  slot: seed.category === 'commander' ? 'Comandante proxy' : 'Lorehold Proteína+',
  set: `LHP · ${String(index + 1).padStart(3, '0')}`,
  setName: 'Lorehold Proteína+',
  image: images[0],
  foil: seed.category === 'commander',
  type: seed.spirit ? 'Creature — GymBro (Spirit)' : proxyCategoryType[seed.category],
  mana: '—',
  color: ['artifact', 'land'].includes(seed.category) ? 'C' : 'RW',
  tags: ['proxy', 'lorehold', seed.spirit ? 'gymbro' : seed.category, seed.category === 'commander' ? 'commander' : 'proteína+'],
  types: proxyCategoryTypes[seed.category],
  subtypes: seed.spirit ? ['GymBro', '(Spirit)'] : seed.category === 'commander' ? ['Quintorius'] : [],
  supertypes: seed.category === 'commander' || seed.original.startsWith('Quintorius') ? ['Legendary'] : [],
  manaValue: 0,
  qty: seed.quantity ?? 1,
  proxy: { originalName: seed.original, oracleText: seed.category === 'commander' ? 'Siempre que una o más cartas salgan de tu cementerio, crea una ficha de criatura GymBro (Spirit) roja y blanca 3/2.\n+1: Puedes descartar una carta. Si lo haces, roba dos cartas y luego muele una carta.\n−4: Los GymBros (Spirits) que controlas ganan dañar dos veces y vigilancia hasta el final del turno.\nQuintorius puede ser tu comandante.' : `Proxy temático de ${seed.original}. Conserva el texto de reglas de la carta original.`, flavor: seed.flavor, images, deck: 'Lorehold Proteína+ — GymBros del Más Allá' },
}); });

const proteinProxyGalleryCards: Card[] = proteinProxyCards.flatMap((card) => (card.proxy?.images ?? [card.image]).map((imagePath, index) => ({ ...card, uuid: `${card.uuid}:copy-${index + 1}`, image: imagePath, qty: 1 })));

const startingLibrary = [...proteinProxyCards, ...cards];

const collectionIdentity = (card: Card) => card.uuid ?? `${card.name}:${card.set}:${card.foil ? 'foil' : 'regular'}`;

export function PackStudio({ userName, signInPath = '/signin-with-chatgpt?return_to=%2F', staticDemo = false }: { userName?: string | null; signInPath?: string; staticDemo?: boolean }) {
  const [view, setView] = useState<AppView>('packs');
  const [viewMode, setViewMode] = useState<ViewMode>('automatic');
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(12);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState(() => Object.fromEntries(startingLibrary.map((card) => [collectionIdentity(card), card.qty])));
  const [libraryCards, setLibraryCards] = useState<Card[]>(startingLibrary);
  const [deck, setDeck] = useState<Record<string, number>>({ 'Kaito, Bane of Nightmares': 1, 'Overlord of the Hauntwoods': 1, 'Unholy Annex // Ritual Chamber': 1, 'Enduring Curiosity': 1, 'Fear of Missing Out': 1, 'Sol Ring': 1, 'Arcane Signet': 1, Cultivate: 1, 'Command Tower': 31, 'Beast Within': 1 });
  const [deckFormat, setDeckFormat] = useState<DeckFormat>('commander');
  const [notice, setNotice] = useState<string | null>(null);
  const [sets, setSets] = useState<MtgSetSummary[]>([]);
  const [selectedSetCode, setSelectedSetCode] = useState('DSK');
  const [selectedSet, setSelectedSet] = useState<MtgSetData | null>(null);
  const [products, setProducts] = useState<BoosterProduct[]>([]);
  const [selectedProductCode, setSelectedProductCode] = useState('collector');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [packCards, setPackCards] = useState<Card[]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [faceDownCards, setFaceDownCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>(['DSK · Collector', 'WOE · Draft', 'MH3 · Play']);

  const deckCount = Object.values(deck).reduce((sum, qty) => sum + qty, 0);
  const selectedProduct = products.find((product) => product.code === selectedProductCode) ?? null;
  const saved = packCards.length > 0 && packCards.every((card) => savedCards.has(card.id ?? card.name));

  useEffect(() => {
    let cancelled = false;
    loadSetCatalog()
      .then((catalog) => { if (!cancelled) setSets(catalog); })
      .catch(() => { if (!cancelled) setDataError('No se pudo cargar el catálogo de ediciones.'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadProteinProxyMetadata().then((metadata) => {
      if (cancelled) return;
      setLibraryCards((current) => current.map((card) => {
        if (!card.proxy) return card;
        const details = metadata.get(card.proxy.originalName);
        if (!details) return card;
        return { ...card, mana: details.mana, type: details.type, color: details.color, tags: [...new Set([...card.tags, ...details.keywords.map((keyword) => keyword.toLowerCase())])], types: details.types, subtypes: details.subtypes, supertypes: details.supertypes, manaValue: details.manaValue, power: details.power, toughness: details.toughness, proxy: { ...card.proxy, oracleText: details.oracleText } };
      }));
    }).catch(() => { /* El mazo proxy conserva sus metadatos locales si Scryfall no está disponible. */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const preference = window.localStorage.getItem('vaultforge:pack-animation');
    if (preference !== null) setAnimationEnabled(preference === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('vaultforge:pack-animation', String(animationEnabled));
  }, [animationEnabled]);

  useEffect(() => {
    const preference = window.localStorage.getItem('vaultforge:view-mode');
    if (preference === 'automatic' || preference === 'stack' || preference === 'grid') setViewMode(preference);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('vaultforge:view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const savedFormat = window.localStorage.getItem('vaultforge:deck-format') as DeckFormat | null;
    if (savedFormat && ['commander', 'standard', 'modern', 'legacy', 'pauper', 'limited'].includes(savedFormat)) setDeckFormat(savedFormat);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('vaultforge:deck-format', deckFormat);
  }, [deckFormat]);

  useEffect(() => {
    const savedDeck = window.localStorage.getItem('vaultforge:deck');
    if (!savedDeck) return;
    try { setDeck(JSON.parse(savedDeck) as Record<string, number>); } catch { /* Conserva el mazo inicial si el dato local está dañado. */ }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('vaultforge:deck', JSON.stringify(deck));
  }, [deck]);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    setDataError(null);
    setPackCards([]);
    loadSet(selectedSetCode)
      .then((set) => {
        if (cancelled) return;
        const available = getBoosterProducts(set);
        setSelectedSet(set);
        setProducts(available);
        setSelectedProductCode(available.find((product) => product.code === 'collector')?.code ?? available[0]?.code ?? '');
        if (!available.length) setDataError('Esta edición no tiene productos simulables en MTGJSON.');
      })
      .catch(() => { if (!cancelled) setDataError('No se pudieron cargar los datos de esta edición.'); })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSetCode]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 2200); }
  function openPack() {
    if (!selectedSet || !selectedProductCode) return;
    try {
      const generated = simulateBooster(selectedSet, selectedProductCode);
      setPackCards(generated);
      setActiveCard(0);
      setSavedCards(new Set());
      setFaceDownCards(new Set(generated.map((card) => card.id ?? card.name)));
      setOpening(animationEnabled);
      const historyLabel = `${selectedSet.code} · ${selectedProduct?.subtype ?? selectedProductCode}`;
      setHistory((current) => [historyLabel, ...current.filter((item) => item !== historyLabel)].slice(0, 3));
      window.setTimeout(() => {
        setOpened((value) => value + 1);
        setOpening(false);
      }, animationEnabled ? 1900 : 0);
    } catch (error) {
      flash(error instanceof Error ? error.message : 'No se pudo generar el sobre.');
    }
  }
  async function saveCards(cardsToSave: Card[]) {
    const pending = cardsToSave.filter((card) => !savedCards.has(card.id ?? card.name));
    if (!pending.length) return true;
    if (!staticDemo) {
      try {
        const response = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ cards: pending }),
        });
        if (response.status === 401) { flash('Inicia sesión para guardar tu colección'); return; }
        if (!response.ok) throw new Error('save_failed');
      } catch {
        flash('No se pudo sincronizar; inténtalo de nuevo');
        return false;
      }
    }
    setCollection((current) => { const next = { ...current }; pending.forEach((card) => { const key = collectionIdentity(card); next[key] = (next[key] ?? 0) + 1; }); return next; });
    setLibraryCards((current) => {
      const known = new Set(current.map(collectionIdentity));
      return [...pending.filter((card) => !known.has(collectionIdentity(card))), ...current];
    });
    setSavedCards((current) => new Set([...current, ...pending.map((card) => card.id ?? card.name)]));
    return true;
  }
  async function savePack() {
    const ok = await saveCards(packCards);
    if (ok) flash(`${packCards.length} cartas añadidas a ${staticDemo ? 'la colección local' : 'tu colección'}`);
  }
  async function addCurrentAndNext(cardIndex = activeCard) {
    const current = packCards[cardIndex];
    if (!current) return;
    const ok = await saveCards([current]);
    if (ok) {
      if (cardIndex < packCards.length - 1) setActiveCard(cardIndex + 1);
      else flash('Sobre completado: todas las cartas revisadas');
    }
  }
  function toggleCardFace(card: Card) {
    const key = card.id ?? card.name;
    setFaceDownCards((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }
  function revealAllCards() { setFaceDownCards(new Set()); }
  function addToDeck(card: Card) { setDeck((current) => ({ ...current, [card.name]: (current[card.name] ?? 0) + 1 })); flash(`${card.name} añadida al mazo`); }
  function loadProteinProxyDeck() { setDeck(Object.fromEntries(proteinProxyCards.map((card) => [card.name, card.qty]))); setDeckFormat('commander'); setView('builder'); flash('Lorehold Proteína+ cargado en el constructor'); }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0b0e0d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 sm:px-6">
          <button onClick={() => setView('packs')} className="flex items-center gap-2.5" aria-label="Vaultforge — inicio">
            <span className="grid size-9 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200"><WandSparkles className="size-4" /></span>
            <span className="font-display text-lg font-semibold tracking-tight">Vaultforge</span>
          </button>
          <nav className="ml-4 hidden h-full items-center gap-1 md:flex" aria-label="Navegación principal">
            <NavButton active={view === 'packs'} onClick={() => setView('packs')} icon={<PackageOpen />}>Abrir sobres</NavButton>
            <NavButton active={view === 'collection'} onClick={() => setView('collection')} icon={<Library />}>Colección</NavButton>
            <NavButton active={view === 'builder'} onClick={() => setView('builder')} icon={<Layers3 />}>Mazos</NavButton>
            <NavButton active={view === 'playtest'} onClick={() => setView('playtest')} icon={<Swords />}>Prueba tu mazo</NavButton>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => setView('collection')} className="hidden text-stone-300 sm:inline-flex"><Search /> Buscar cartas</Button>
            {userName ? <Button variant="outline" className="border-white/10 bg-white/4 text-stone-100"><span className="avatar-dot">{userName.charAt(0)}</span>{userName}</Button> : <Button nativeButton={false} render={<a href={signInPath} target="_top" />} variant="outline" className="border-white/10 bg-white/4 text-stone-100"><UserRound /> Entrar</Button>}
          </div>
        </div>
        <div className="mobile-nav md:hidden"><NavButton active={view === 'packs'} onClick={() => setView('packs')} icon={<PackageOpen />}>Sobres</NavButton><NavButton active={view === 'collection'} onClick={() => setView('collection')} icon={<Library />}>Colección</NavButton><NavButton active={view === 'builder'} onClick={() => setView('builder')} icon={<Layers3 />}>Mazos</NavButton><NavButton active={view === 'playtest'} onClick={() => setView('playtest')} icon={<Swords />}>Probar</NavButton></div>
      </header>

      {view === 'packs' && <PackView viewMode={viewMode} setViewMode={setViewMode} opening={opening} opened={opened} openPack={openPack} saved={saved} savePack={savePack} goBuilder={() => setView('builder')} sets={sets} selectedSetCode={selectedSetCode} setSelectedSetCode={setSelectedSetCode} selectedSet={selectedSet} products={products} selectedProductCode={selectedProductCode} setSelectedProductCode={setSelectedProductCode} selectedProduct={selectedProduct} dataLoading={dataLoading} dataError={dataError} animationEnabled={animationEnabled} setAnimationEnabled={setAnimationEnabled} packCards={packCards} activeCard={activeCard} setActiveCard={setActiveCard} faceDownCards={faceDownCards} toggleCardFace={toggleCardFace} revealAllCards={revealAllCards} savedCards={savedCards} addCurrentAndNext={addCurrentAndNext} history={history} collectionTotal={Object.values(collection).reduce((sum, qty) => sum + qty, 0)} />}
      {view === 'collection' && <CollectionView search={search} setSearch={setSearch} cards={libraryCards} collection={collection} setCollection={setCollection} addToDeck={addToDeck} goBuilder={() => setView('builder')} loadProxyDeck={loadProteinProxyDeck} />}
      {view === 'builder' && <BuilderView search={search} setSearch={setSearch} cards={libraryCards} deck={deck} setDeck={setDeck} deckCount={deckCount} addToDeck={addToDeck} format={deckFormat} setFormat={setDeckFormat} goPlaytest={() => setView('playtest')} />}
      {view === 'playtest' && <PlaytestView cards={libraryCards} deck={deck} format={deckFormat} goBuilder={() => setView('builder')} />}

      {notice && <div className="toast-notice"><Check />{notice}</div>}
    </main>
  );
}

function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button className={`nav-link ${active ? 'nav-link-active' : ''}`} onClick={onClick}>{icon}{children}</button>;
}

type PackViewProps = {
  viewMode: ViewMode; setViewMode: (mode: ViewMode) => void; opening: boolean; opened: number; openPack: () => void;
  saved: boolean; savePack: () => void | Promise<void>; goBuilder: () => void; sets: MtgSetSummary[];
  selectedSetCode: string; setSelectedSetCode: (code: string) => void; selectedSet: MtgSetData | null;
  products: BoosterProduct[]; selectedProductCode: string; setSelectedProductCode: (code: string) => void;
  selectedProduct: BoosterProduct | null; dataLoading: boolean; dataError: string | null;
  animationEnabled: boolean; setAnimationEnabled: (enabled: boolean) => void; packCards: Card[]; activeCard: number;
  setActiveCard: (index: number) => void; faceDownCards: Set<string>; toggleCardFace: (card: Card) => void; revealAllCards: () => void;
  savedCards: Set<string>; addCurrentAndNext: (index?: number) => void | Promise<void>;
  history: string[]; collectionTotal: number;
};

function PackView({ viewMode, setViewMode, opening, opened, openPack, saved, savePack, goBuilder, sets, selectedSetCode, setSelectedSetCode, selectedSet, products, selectedProductCode, setSelectedProductCode, selectedProduct, dataLoading, dataError, animationEnabled, setAnimationEnabled, packCards, activeCard, setActiveCard, faceDownCards, toggleCardFace, revealAllCards, savedCards, addCurrentAndNext, history, collectionTotal }: PackViewProps) {
  const foilCount = packCards.filter((card) => card.foil).length;
  const [packPose, setPackPose] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0, dragging: false, anchorX: 0, anchorY: 0, baseX: 0, baseY: 0 });
  const [cardDrag, setCardDrag] = useState({ x: 0, dragging: false, settling: false, anchorX: 0 });
  const [showObtained, setShowObtained] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);
  const packMovedRef = useRef(false);
  const cardGestureRef = useRef(false);
  const cardXRef = useRef(0);
  const packImage = 'assets/vaultforge-booster.webp';
  const displayEntries = packCards.map((card, index) => ({ card, index, key: card.id ?? `${card.name}-${index}` })).filter((entry) => showObtained || !savedCards.has(entry.key));
  const requestedPosition = displayEntries.findIndex((entry) => entry.index === activeCard);
  const currentPosition = requestedPosition >= 0 ? requestedPosition : 0;
  const currentEntry = displayEntries[currentPosition];
  const currentCard = currentEntry?.card;
  const currentCardIndex = currentEntry?.index ?? activeCard;
  const visibleEntries = viewMode === 'automatic' ? (currentEntry ? [currentEntry] : []) : displayEntries;
  const zoomedIsFaceDown = zoomedCard ? faceDownCards.has(zoomedCard.id ?? zoomedCard.name) : false;

  useEffect(() => {
    setPackPose({ x: 0, y: 0, rotateX: 0, rotateY: 0, dragging: false, anchorX: 0, anchorY: 0, baseX: 0, baseY: 0 });
  }, [selectedSetCode, selectedProductCode]);

  useEffect(() => { setShowObtained(false); setZoomedCard(null); }, [packCards]);

  useEffect(() => {
    if (viewMode === 'automatic' && currentEntry && currentEntry.index !== activeCard) setActiveCard(currentEntry.index);
  }, [activeCard, currentEntry, setActiveCard, viewMode]);

  useEffect(() => {
    if (!zoomedCard) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setZoomedCard(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [zoomedCard]);

  useEffect(() => {
    setCardDrag({ x: 0, dragging: false, settling: false, anchorX: 0 });
    cardGestureRef.current = false;
    cardXRef.current = 0;
  }, [activeCard]);

  function handlePackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    packMovedRef.current = false;
    setPackPose((pose) => ({ ...pose, dragging: true, anchorX: event.clientX, anchorY: event.clientY, baseX: pose.x, baseY: pose.y }));
  }
  function handlePackPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (packPose.dragging) {
      const dx = event.clientX - packPose.anchorX;
      const dy = event.clientY - packPose.anchorY;
      if (Math.abs(dx) + Math.abs(dy) > 6) packMovedRef.current = true;
      setPackPose((pose) => ({ ...pose, x: Math.max(-135, Math.min(135, pose.baseX + dx)), y: Math.max(-70, Math.min(70, pose.baseY + dy)), rotateX: Math.max(-14, Math.min(14, -dy / 7)), rotateY: Math.max(-18, Math.min(18, dx / 7)) }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - rect.left) / rect.width - .5;
    const vertical = (event.clientY - rect.top) / rect.height - .5;
    setPackPose((pose) => ({ ...pose, rotateX: vertical * -18, rotateY: horizontal * 24 }));
  }
  function handlePackPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPackPose((pose) => ({ ...pose, dragging: false, rotateX: 0, rotateY: 0 }));
  }
  function handlePackClick() { if (!packMovedRef.current) openPack(); }
  function handleCardPointerDown(event: React.PointerEvent<HTMLElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    cardGestureRef.current = false;
    cardXRef.current = 0;
    setCardDrag({ x: 0, dragging: true, settling: false, anchorX: event.clientX });
  }
  function handleCardPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!cardDrag.dragging) return;
    const x = event.clientX - cardDrag.anchorX;
    cardXRef.current = x;
    if (Math.abs(x) > 7) cardGestureRef.current = true;
    setCardDrag((drag) => ({ ...drag, x: Math.max(-230, Math.min(230, x)) }));
  }
  function handleCardPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (Math.abs(cardXRef.current) >= 72) {
      const direction = cardXRef.current < 0 ? -1 : 1;
      cardGestureRef.current = true;
      setCardDrag((drag) => ({ ...drag, x: direction * 620, dragging: false, settling: true }));
      window.setTimeout(() => { void Promise.resolve(addCurrentAndNext(currentCardIndex)).finally(() => { cardXRef.current = 0; setCardDrag({ x: 0, dragging: false, settling: false, anchorX: 0 }); }); }, 190);
      return;
    }
    cardXRef.current = 0;
    setCardDrag({ x: 0, dragging: false, settling: true, anchorX: 0 });
    window.setTimeout(() => setCardDrag((drag) => ({ ...drag, settling: false })), 180);
  }
  function handleCardClick(card: Card) {
    if (cardGestureRef.current) { cardGestureRef.current = false; return; }
    toggleCardFace(card);
  }
  function moveBetweenCards(direction: -1 | 1) {
    const target = displayEntries[Math.max(0, Math.min(displayEntries.length - 1, currentPosition + direction))];
    if (target) setActiveCard(target.index);
  }
  function resetPackPose() { setPackPose({ x: 0, y: 0, rotateX: 0, rotateY: 0, dragging: false, anchorX: 0, anchorY: 0, baseX: 0, baseY: 0 }); }
  return <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
    <aside className="border-white/8 p-5 xl:min-h-[calc(100vh-64px)] xl:border-r xl:p-6">
      <div className="mb-6 flex items-start justify-between"><div><p className="eyebrow">Simulador</p><h1 className="mt-1 font-display text-2xl font-semibold">Abrir producto</h1></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300">ODDS REALES</span></div>
      <div className="space-y-5">
        <label className="control-label">Edición<div className="native-select-wrap"><select value={selectedSetCode} onChange={(event) => setSelectedSetCode(event.target.value)} aria-label="Edición de Magic">{sets.length === 0 && <option value="DSK">Cargando ediciones…</option>}{sets.map((set) => <option key={set.code} value={set.code}>{set.name} · {set.code} ({set.releaseDate?.slice(0, 4) ?? '—'})</option>)}</select><ChevronDown /></div></label>
        <label className="control-label">Producto<div className="native-select-wrap"><select value={selectedProductCode} onChange={(event) => setSelectedProductCode(event.target.value)} disabled={dataLoading || products.length === 0} aria-label="Producto sellado">{dataLoading && <option value={selectedProductCode}>Cargando productos…</option>}{!dataLoading && products.map((product) => <option key={product.code} value={product.code}>{product.name} · {product.cardCount} cartas</option>)}</select><ChevronDown /></div></label>
        <div className="animation-toggle"><div><strong>Animación de apertura</strong><span>Desactívala para abrir al instante</span></div><Switch checked={animationEnabled} onCheckedChange={setAnimationEnabled} aria-label="Activar animación de apertura" /></div>
      </div>
      <Button onClick={openPack} disabled={opening || dataLoading || !selectedProduct} className="mt-7 h-12 w-full bg-amber-300 text-sm font-bold text-[#17150e] shadow-[0_12px_30px_-12px_rgba(252,211,77,.75)] hover:bg-amber-200"><Sparkles />{opening ? 'Abriendo…' : dataLoading ? 'Cargando datos…' : 'Abrir sobre'}</Button>
      {dataError ? <p className="mt-3 text-center text-xs leading-relaxed text-red-300">{dataError}</p> : <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">Slots, rarezas, foil y probabilidades se generan desde la colación publicada del producto.</p>}
      <div className="mt-8 border-t border-white/7 pt-5"><p className="eyebrow">Historial reciente</p>{history.map((item, index) => <div key={item} className="history-row"><span>{item}</span><small>{index === 0 && packCards.length ? 'ahora' : `hace ${index * 4 + 2} min`}</small></div>)}</div>
    </aside>

    <section className="min-w-0 border-y border-white/8 px-4 py-6 sm:px-8 xl:border-y-0 xl:py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Apertura #{opened}</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{selectedProduct?.name ?? 'Elige un producto'} · {selectedSet?.name ?? selectedSetCode}</h2><p className="mt-1 text-sm text-stone-500">{packCards.length || selectedProduct?.cardCount || 0} cartas · orden de slots conservado</p></div><div className="view-switcher" aria-label="Modo de visualización"><button onClick={() => setViewMode('automatic')} data-active={viewMode === 'automatic'}><WandSparkles />Automatic</button><button onClick={() => setViewMode('stack')} data-active={viewMode === 'stack'}><Layers3 />Card stack</button><button onClick={() => setViewMode('grid')} data-active={viewMode === 'grid'}><Grid2X2 />Card grid</button></div></div>
      <div className={`pack-stage pack-stage-${viewMode} ${opening ? 'is-opening' : ''}`}>
        <div className="stage-glow" />
        {opening && <div className="booster-opening" aria-live="polite"><div className="booster-wrapper"><div className="pack-body"><img className="pack-product-image" src={packImage} alt="" /></div><div className="pack-dynamic-label"><small>{selectedSetCode}</small><strong>{selectedProduct?.name}</strong></div><div className="pack-top-piece"><img src={packImage} alt="" /></div><span className="cut-track" /><span className="cut-blade"><Scissors /></span><div className="cards-emerging"><img src="assets/magic-card-back.png" alt="Reverso de una carta de Magic" /></div></div><p>Cortando el cierre superior y extrayendo las cartas…</p></div>}
        {!opening && packCards.length === 0 && selectedProduct && <div className="interactive-pack-area"><div role="button" tabIndex={0} className={`interactive-pack ${packPose.dragging ? 'is-dragging' : ''}`} aria-label="Sobre interactivo. Haz clic para abrirlo o arrástralo para moverlo y girarlo" onPointerDown={handlePackPointerDown} onPointerMove={handlePackPointerMove} onPointerUp={handlePackPointerUp} onPointerCancel={handlePackPointerUp} onPointerLeave={() => { if (!packPose.dragging) setPackPose((pose) => ({ ...pose, rotateX: 0, rotateY: 0 })); }} onClick={handlePackClick} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openPack(); }} style={{ transform: `translate3d(${packPose.x}px,${packPose.y}px,0) rotateX(${packPose.rotateX}deg) rotateY(${packPose.rotateY}deg)` }}><img src={packImage} alt={`Sobre ${selectedProduct.name} de ${selectedSet?.name ?? selectedSetCode}`} draggable={false} /><div className="pack-dynamic-label"><small>{selectedSetCode}</small><strong>{selectedProduct.name}</strong></div><span className="pack-grab-hint"><Move /> Arrastra o pulsa para abrir</span></div><div className="pack-ready-actions"><button onClick={resetPackPose}>Centrar</button><Button onClick={openPack} className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><Scissors />Abrir sobre</Button></div></div>}
        {!opening && packCards.length === 0 && !selectedProduct && <div className="empty-pack-stage"><PackageOpen /><strong>Tu sobre aparecerá aquí</strong><span>Selecciona una edición y un producto para generar cartas reales.</span></div>}
        {!opening && packCards.length > 0 && displayEntries.length === 0 && <div className="obtained-empty-state"><Check /><strong>Sobre guardado</strong><span>Las cartas ya están en tu colección.</span><button onClick={() => setShowObtained(true)}><Eye />Mostrar cartas obtenidas en el sobre</button></div>}
        {!opening && displayEntries.length > 0 && <div className="cards-shell">{visibleEntries.map(({ card, index: actualIndex, key }, visualIndex) => {
          const faceDown = faceDownCards.has(key);
          const isSaved = savedCards.has(key);
          const automaticGesture = viewMode === 'automatic';
          return <article role="button" tabIndex={0} aria-label={`${faceDown ? 'Revelar' : 'Ocultar'} ${card.name}. Desliza a izquierda o derecha para añadirla.`} onClick={() => handleCardClick(card)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCardFace(card); } }} onPointerDown={automaticGesture ? handleCardPointerDown : undefined} onPointerMove={automaticGesture ? handleCardPointerMove : undefined} onPointerUp={automaticGesture ? handleCardPointerUp : undefined} onPointerCancel={automaticGesture ? handleCardPointerUp : undefined} className={`mtg-card ${card.foil ? 'is-foil' : ''} ${faceDown ? 'is-face-down' : ''} ${isSaved ? 'is-collected' : ''} ${automaticGesture && (cardDrag.dragging || cardDrag.settling) ? 'is-card-dragging' : ''} ${automaticGesture && cardDrag.settling ? 'is-card-settling' : ''}`} key={key} style={{ '--card-index': visualIndex, '--card-center': Math.floor(displayEntries.length / 2), '--swipe-x': `${automaticGesture ? cardDrag.x : 0}px`, '--swipe-rotate': `${automaticGesture ? cardDrag.x / 22 : 0}deg` } as React.CSSProperties}>{cardDrag.x < -12 && <span className="swipe-save-hint swipe-save-left"><Check />Guardar</span>}{cardDrag.x > 12 && <span className="swipe-save-hint swipe-save-right"><Check />Guardar</span>}<button className="card-zoom-button" aria-label={`Ampliar ${card.name}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setZoomedCard(card); }}><ZoomIn /></button><div className="card-flipper"><div className="card-face card-front"><img src={card.image} alt={card.name} />{card.foil && <span className="foil-sheen" aria-hidden="true" />}{isSaved && <span className="collected-mark"><Check />Colección</span>}</div><div className="card-face card-back"><img src="assets/magic-card-back.png" alt="Reverso original de Magic: The Gathering" /></div></div></article>;
        })}</div>}
        {!opening && currentCard && <div className="stage-caption"><div><span className="rarity-gem" /><strong>{faceDownCards.has(currentCard.id ?? currentCard.name) ? 'Carta sin revelar' : currentCard.name}</strong></div><span>{faceDownCards.has(currentCard.id ?? currentCard.name) ? `Slot ${currentCardIndex + 1}` : `${currentCard.slot} · ${currentCard.set}${currentCard.foil ? ' · FOIL' : ''}`}</span></div>}
        {!opening && viewMode === 'automatic' && currentCard && <div className="automatic-controls"><button onClick={() => moveBetweenCards(-1)} disabled={currentPosition === 0} aria-label="Carta anterior"><ChevronLeft /></button><span>{currentPosition + 1} / {displayEntries.length}</span><button onClick={() => moveBetweenCards(1)} disabled={currentPosition === displayEntries.length - 1} aria-label="Carta siguiente"><ChevronRight /></button></div>}
      </div>
      {packCards.length > 0 && <div className="reveal-actions"><Button variant="outline" onClick={() => currentCard && toggleCardFace(currentCard)} disabled={!currentCard}><RotateCw />{currentCard && faceDownCards.has(currentCard.id ?? currentCard.name) ? 'Revelar carta' : 'Volver a ocultar'}</Button><Button variant="outline" onClick={revealAllCards} disabled={faceDownCards.size === 0}><Sparkles />Revelar todas</Button><Button onClick={savePack} disabled={saved} className="bg-emerald-300 font-bold text-[#102018] hover:bg-emerald-200"><Archive />{saved ? 'Todas añadidas' : 'Añadir todas'}</Button>{savedCards.size > 0 && <Button variant="outline" onClick={() => setShowObtained((value) => !value)}>{showObtained ? <EyeOff /> : <Eye />}{showObtained ? 'Ocultar cartas obtenidas' : 'Mostrar cartas obtenidas en el sobre'}</Button>}{viewMode === 'automatic' && <><Button onClick={() => addCurrentAndNext(currentCardIndex)} disabled={!currentCard || savedCards.has(currentCard.id ?? currentCard.name)} className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><CirclePlus />{currentCard && savedCards.has(currentCard.id ?? currentCard.name) ? 'Añadida' : 'Añadir y siguiente'}</Button><Button variant="ghost" onClick={() => moveBetweenCards(1)} disabled={!currentCard || currentPosition === displayEntries.length - 1}><SkipForward />Omitir</Button></>}</div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500"><p><strong className="text-stone-300">{packCards.length || selectedProduct?.cardCount || 0} cartas</strong>{packCards.length ? ` · ${foilCount} foil en esta apertura` : ' · esperando apertura'}</p><p>{packCards.length ? 'Pulsa una carta para voltearla y revelar el frente' : 'Arrastra el sobre, gíralo y córtalo para abrirlo'}</p></div>
    </section>

    <aside className="p-5 xl:min-h-[calc(100vh-64px)] xl:border-l xl:border-white/8 xl:p-6">
      <div className="flex items-center justify-between"><div><p className="eyebrow">Tu cuenta</p><h2 className="mt-1 font-display text-xl font-semibold">Colección</h2></div><Archive className="size-5 text-stone-500" /></div>
      <div className="mt-5 rounded-2xl border border-white/8 bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-sm text-stone-400">Cartas guardadas</span><strong className="font-display text-2xl">{collectionTotal}</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/6"><span className="block h-full w-[68%] rounded-full bg-amber-300" /></div><div className="mt-2 flex justify-between text-[11px] text-stone-500"><span>{savedCards.size} de este sobre</span><span>{foilCount} foil abiertas</span></div></div>
      <div className="mt-6 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Contenido del sobre</h3><span className="text-xs text-stone-500">{displayEntries.length} visibles</span></div><div className="pack-slot-list">{displayEntries.map(({ card, index, key }) => { const faceDown = faceDownCards.has(key); return <button onClick={() => { setViewMode('automatic'); setActiveCard(index); }} key={key} className={`mini-card-row ${index === currentCardIndex ? 'is-active' : ''}`}><img src={faceDown ? 'assets/magic-card-back.png' : card.image} alt="" /><div className="min-w-0 flex-1"><strong>{faceDown ? `Carta ${index + 1} sin revelar` : card.name}</strong><span>{faceDown ? `Slot ${index + 1}` : `${card.slot} · ${card.rarity}`}</span></div>{savedCards.has(key) && <Check className="size-3 text-emerald-300" />}</button>; })}{displayEntries.length === 0 && <p className="pack-list-empty">No quedan cartas por revisar.</p>}</div></div>
      <div className="mt-7 rounded-2xl border border-emerald-300/12 bg-emerald-300/[.035] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><Sparkles className="size-4" /> Siguiente paso</div><p className="mt-2 text-xs leading-relaxed text-stone-400">Desliza una carta a cualquier lado para guardarla o añade todo el sobre.</p><Button onClick={savePack} disabled={saved || packCards.length === 0} variant="outline" className="mt-4 w-full border-emerald-300/20 bg-emerald-300/5 text-emerald-100">{saved ? <><Check />Todas añadidas</> : `Añadir ${Math.max(0, packCards.length - savedCards.size)} a la colección`}</Button>{saved && <button onClick={goBuilder} className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-amber-200">Ir al constructor <ArrowRight className="size-3" /></button>}</div>
    </aside>
    {zoomedCard && <div className="card-zoom-overlay" role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${zoomedIsFaceDown ? 'una carta sin revelar' : zoomedCard.name}`} onClick={() => setZoomedCard(null)}><div className="card-zoom-panel" onClick={(event) => event.stopPropagation()}><button className="card-zoom-close" onClick={() => setZoomedCard(null)} aria-label="Cerrar ampliación"><X /></button><img src={zoomedIsFaceDown ? 'assets/magic-card-back.png' : zoomedCard.image} alt={zoomedIsFaceDown ? 'Reverso original de Magic: The Gathering' : zoomedCard.name} /><div><strong>{zoomedIsFaceDown ? 'Carta sin revelar' : zoomedCard.name}</strong><span>{zoomedIsFaceDown ? 'Pulsa la carta para revelar su frente' : `${zoomedCard.type} · ${zoomedCard.mana} · ${zoomedCard.rarity}`}</span></div></div></div>}
  </div>;
}

type CollectionGroup = { key: string; card: Card; quantity: number; order: number };
type FilterOption = { value: string; label: string; count: number };

const typeLabels: Record<string, string> = { Creature: 'Criatura', Instant: 'Instantáneo', Sorcery: 'Conjuro', Artifact: 'Artefacto', Land: 'Tierra', Enchantment: 'Encantamiento', Planeswalker: 'Planeswalker', Battle: 'Batalla', Kindred: 'Kindred' };
const colorLabels: Record<string, string> = { W: 'Blanco', U: 'Azul', B: 'Negro', R: 'Rojo', G: 'Verde', M: 'Multicolor', C: 'Incoloro' };

function cardTypes(card: Card) {
  if (card.types?.length) return card.types;
  const beforeDash = card.type.split(/\s+[—-]\s+/)[0];
  return Object.keys(typeLabels).filter((type) => new RegExp(`\\b${type}\\b`, 'i').test(beforeDash));
}
function cardSubtypes(card: Card) {
  if (card.subtypes?.length) return card.subtypes;
  const afterDash = card.type.split(/\s+[—-]\s+/)[1];
  return afterDash ? afterDash.split(/\s+/).filter(Boolean) : [];
}
function isLegendary(card: Card) { return Boolean(card.supertypes?.some((type) => type.toLowerCase() === 'legendary') || /\blegendary\b/i.test(card.type)); }
function setCode(card: Card) { return card.set.split(' · ')[0]; }
function colorMatches(card: Card, value: string) {
  const colors = card.color === 'C' ? [] : [...new Set(card.color.split(''))];
  if (value === 'C') return colors.length === 0;
  if (value === 'M') return colors.length > 1;
  return colors.includes(value);
}

function CardArtwork({ card, className = '', faceDown = false }: { card: Card; className?: string; faceDown?: boolean }) {
  if (faceDown) return <img className={`card-artwork ${className}`} src="assets/magic-card-back.png" alt="Reverso original de Magic: The Gathering" />;
  return <img className={`card-artwork ${card.proxy ? 'proxy-card-image' : ''} ${className}`} src={card.image} alt={card.proxy ? `${card.name}, proxy temático de ${card.proxy.originalName}` : card.name} />;
}

function CollectionView({ search, setSearch, cards, collection, setCollection, addToDeck, goBuilder, loadProxyDeck }: { search: string; setSearch: (value: string) => void; cards: Card[]; collection: Record<string, number>; setCollection: React.Dispatch<React.SetStateAction<Record<string, number>>>; addToDeck: (card: Card) => void; goBuilder: () => void; loadProxyDeck: () => void }) {
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);
  const [zoomFaceDown, setZoomFaceDown] = useState(false);
  const [showProxyGallery, setShowProxyGallery] = useState(false);
  const [faceDownCards, setFaceDownCards] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'quantity' | 'set' | 'rarity'>('recent');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
  const [legendaryOnly, setLegendaryOnly] = useState(false);

  useEffect(() => {
    const savedMode = window.localStorage.getItem('vaultforge:collection-view');
    if (savedMode === 'grid' || savedMode === 'list') setDisplayMode(savedMode);
  }, []);
  useEffect(() => { window.localStorage.setItem('vaultforge:collection-view', displayMode); }, [displayMode]);
  useEffect(() => {
    if (!zoomedCard && !showProxyGallery) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (zoomedCard) setZoomedCard(null);
      else setShowProxyGallery(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [showProxyGallery, zoomedCard]);

  const groups = useMemo(() => {
    const grouped = new Map<string, CollectionGroup>();
    cards.forEach((card, order) => {
      const key = collectionIdentity(card);
      const quantity = collection[key] ?? card.qty ?? 0;
      if (quantity <= 0) return;
      const existing = grouped.get(key);
      if (existing) existing.quantity = Math.max(existing.quantity, quantity);
      else grouped.set(key, { key, card, quantity, order });
    });
    return [...grouped.values()];
  }, [cards, collection]);

  const optionFromValues = (values: string[], label: (value: string) => string = (value) => value): FilterOption[] => [...new Set(values)].sort((a, b) => label(a).localeCompare(label(b), 'es')).map((value) => ({ value, label: label(value), count: groups.filter((group) => valuesForOption(group.card, value)).length }));
  function valuesForOption(card: Card, value: string) { return cardTypes(card).includes(value) || cardSubtypes(card).includes(value) || card.rarity === value || setCode(card) === value; }

  const colorOptions: FilterOption[] = Object.entries(colorLabels).map(([value, label]) => ({ value, label, count: groups.filter((group) => colorMatches(group.card, value)).length })).filter((option) => option.count > 0);
  const typeOptions = optionFromValues(groups.flatMap((group) => cardTypes(group.card)), (value) => typeLabels[value] ?? value);
  const rarityOptions = optionFromValues(groups.map((group) => group.card.rarity));
  const setOptions = optionFromValues(groups.map((group) => setCode(group.card)), (value) => `${groups.find((group) => setCode(group.card) === value)?.card.setName ?? value} · ${value}`);
  const subtypeOptions = optionFromValues(groups.flatMap((group) => cardSubtypes(group.card)));
  const legendaryCount = groups.filter((group) => isLegendary(group.card)).length;
  const activeFilterCount = selectedColors.length + selectedTypes.length + selectedRarities.length + selectedSets.length + selectedSubtypes.length + (legendaryOnly ? 1 : 0);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const clearFilters = () => { setSelectedColors([]); setSelectedTypes([]); setSelectedRarities([]); setSelectedSets([]); setSelectedSubtypes([]); setLegendaryOnly(false); };

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rarityOrder: Record<string, number> = { 'Mítica': 0, 'Rara': 1, 'Infrecuente': 2, 'Común': 3 };
    return groups.filter(({ card }) => {
      const corpus = `${card.name} ${card.proxy?.originalName ?? ''} ${card.proxy?.oracleText ?? ''} ${card.setName} ${card.set} ${card.type} ${cardSubtypes(card).join(' ')} ${card.tags.join(' ')}`.toLowerCase();
      return (!query || corpus.includes(query))
        && (!selectedColors.length || selectedColors.some((value) => colorMatches(card, value)))
        && (!selectedTypes.length || selectedTypes.some((value) => cardTypes(card).includes(value)))
        && (!selectedRarities.length || selectedRarities.includes(card.rarity))
        && (!selectedSets.length || selectedSets.includes(setCode(card)))
        && (!selectedSubtypes.length || selectedSubtypes.some((value) => cardSubtypes(card).includes(value)))
        && (!legendaryOnly || isLegendary(card));
    }).sort((a, b) => sortBy === 'name' ? a.card.name.localeCompare(b.card.name, 'es') : sortBy === 'quantity' ? b.quantity - a.quantity : sortBy === 'set' ? a.card.setName.localeCompare(b.card.setName, 'es') : sortBy === 'rarity' ? (rarityOrder[a.card.rarity] ?? 9) - (rarityOrder[b.card.rarity] ?? 9) : a.order - b.order);
  }, [groups, legendaryOnly, search, selectedColors, selectedRarities, selectedSets, selectedSubtypes, selectedTypes, sortBy]);

  const total = groups.reduce((sum, group) => sum + group.quantity, 0);
  const setCount = new Set(groups.map((group) => setCode(group.card))).size;
  const foilCount = groups.filter((group) => group.card.foil).reduce((sum, group) => sum + group.quantity, 0);
  const mythicCount = groups.filter((group) => group.card.rarity === 'Mítica').reduce((sum, group) => sum + group.quantity, 0);
  const adjust = (card: Card, amount: number) => setCollection((current) => { const key = collectionIdentity(card); return { ...current, [key]: Math.max(0, (current[key] ?? card.qty) + amount) }; });
  const toggleFace = (card: Card) => setFaceDownCards((current) => { const next = new Set(current); const key = collectionIdentity(card); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const openZoom = (card: Card) => { setZoomedCard(card); setZoomFaceDown(faceDownCards.has(collectionIdentity(card))); };

  return <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Biblioteca personal</p><h1 className="mt-1 font-display text-4xl font-semibold">Mi colección</h1><p className="mt-2 text-sm text-stone-500">Copias agrupadas con metadatos de edición, color, tipo, subtipo y rareza.</p></div><Button onClick={goBuilder} className="h-10 bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><Layers3 /> Construir un mazo</Button></div>
    <div className="proxy-deck-banner"><div><Badge>LHP · 100 CARTAS</Badge><strong>Lorehold Proteína+ — GymBros del Más Allá</strong><span>100 imágenes terminadas: 85 cartas únicas y 15 variantes de tierras básicas. Cada proxy es un archivo individual listo para ampliar o descargar.</span></div><div><b>100</b><span>imágenes proxy</span><div className="proxy-deck-actions"><button onClick={() => setShowProxyGallery(true)}><Images />Ver las 100</button><button onClick={loadProxyDeck}><Layers3 />Cargar mazo</button></div></div></div>
    <div className="stats-grid mt-7"><Stat value={String(total)} label="Cartas totales" detail={`${groups.length} impresiones únicas`} /><Stat value={String(groups.length)} label="Cartas agrupadas" detail={`de ${setCount} ediciones`} /><Stat value={String(foilCount)} label="Cartas foil" detail={`${total ? Math.round((foilCount / total) * 100) : 0}% del total`} /><Stat value={String(mythicCount)} label="Míticas" detail={`${legendaryCount} legendarias únicas`} /></div>
    <div className="toolbar mt-7"><div className="search-field"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre, edición, tipo, subtipo o keyword…" /><kbd>⌘ K</kbd></div><Button variant="outline" onClick={() => setFiltersOpen((value) => !value)} className="border-white/10 bg-white/[.025] text-stone-300"><Filter />Filtros{activeFilterCount > 0 && <Badge className="filter-count">{activeFilterCount}</Badge>}</Button><div className="collection-view-toggle" aria-label="Vista de colección"><button onClick={() => setDisplayMode('grid')} data-active={displayMode === 'grid'} aria-label="Vista en grilla"><Grid2X2 /></button><button onClick={() => setDisplayMode('list')} data-active={displayMode === 'list'} aria-label="Vista en lista"><List /></button></div><div className="native-select-wrap collection-sort"><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Ordenar colección"><option value="recent">Más recientes</option><option value="name">Nombre</option><option value="quantity">Cantidad</option><option value="set">Edición</option><option value="rarity">Rareza</option></select><ChevronDown /></div></div>
    <div className="collection-layout mt-5">
      <aside className={`filter-panel ${filtersOpen ? 'is-open' : ''}`}><div className="filter-panel-head"><strong>Filtrar colección</strong>{activeFilterCount > 0 && <button onClick={clearFilters}>Limpiar</button>}</div><FilterGroup title="Color" items={colorOptions} selected={selectedColors} onToggle={(value) => toggle(setSelectedColors, value)} /><FilterGroup title="Tipo de carta" items={typeOptions} selected={selectedTypes} onToggle={(value) => toggle(setSelectedTypes, value)} /><FilterGroup title="Edición / Set" items={setOptions} selected={selectedSets} onToggle={(value) => toggle(setSelectedSets, value)} scrollable /><FilterGroup title="Rareza" items={rarityOptions} selected={selectedRarities} onToggle={(value) => toggle(setSelectedRarities, value)} /><FilterGroup title="Super-tipo" items={[{ value: 'legendary', label: 'Legendaria', count: legendaryCount }]} selected={legendaryOnly ? ['legendary'] : []} onToggle={() => setLegendaryOnly((value) => !value)} /><FilterGroup title="Subtipo" items={subtypeOptions} selected={selectedSubtypes} onToggle={(value) => toggle(setSelectedSubtypes, value)} scrollable /></aside>
      <section className="min-w-0"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-stone-500">Mostrando <strong className="text-stone-300">{visibleGroups.length}</strong> impresiones · <strong className="text-stone-300">{visibleGroups.reduce((sum, group) => sum + group.quantity, 0)}</strong> cartas</p><span className="grouping-status"><Layers3 />Copias idénticas agrupadas</span></div>
        {visibleGroups.length === 0 ? <div className="collection-empty"><Filter /><strong>No hay cartas con estos filtros</strong><span>Prueba otra combinación o limpia los filtros activos.</span><button onClick={clearFilters}>Limpiar filtros</button></div> : displayMode === 'grid' ? <div className="collection-grid">{visibleGroups.map(({ key, card, quantity }) => { const faceDown = faceDownCards.has(key); return <article className="collection-card" key={key}><div className="card-image-wrap"><button className="collection-card-face" onClick={() => toggleFace(card)} aria-label={faceDown ? `Mostrar frente de ${card.name}` : `Dar vuelta ${card.name}`}><CardArtwork card={card} faceDown={faceDown} /></button>{card.foil && !faceDown && <span className="foil-sheen" />}<button onClick={() => openZoom(card)} className="collection-zoom" aria-label={`Ampliar ${card.name}`}><ZoomIn /></button><button onClick={() => addToDeck(card)} className="quick-add" aria-label={`Añadir ${card.name} al mazo`}><CirclePlus /></button><span className={`rarity rarity-${card.rarity.toLowerCase().replace('í','i')}`}>{card.rarity}</span><span className="copy-count">{quantity}×</span></div><div className="collection-card-info"><strong>{card.name}</strong><span>{card.proxy ? `Proxy de ${card.proxy.originalName}` : `${card.setName} · ${card.set.split(' · ')[1]}`}{card.foil ? ' · Foil' : ''}</span><div><small>{card.type} · {card.mana}</small><CollectionStepper quantity={quantity} onMinus={() => adjust(card, -1)} onPlus={() => adjust(card, 1)} /></div>{cardSubtypes(card).length > 0 && <div className="metadata-tags">{cardSubtypes(card).slice(0, 3).map((subtype) => <i key={subtype}>{subtype}</i>)}{isLegendary(card) && <i>Legendaria</i>}</div>}</div></article>; })}</div> : <div className="collection-list">{visibleGroups.map(({ key, card, quantity }) => <article className="collection-list-row" key={key}><button className="list-card-preview" onClick={() => openZoom(card)}><CardArtwork card={card} faceDown={faceDownCards.has(key)} /></button><div className="list-card-main"><strong>{card.name}</strong><span>{card.type}</span><small>{card.proxy ? `Proxy de ${card.proxy.originalName}` : card.tags.slice(0, 3).join(' · ') || 'Sin keywords detectadas'}</small></div><div className="list-meta"><small>Edición</small><strong>{setCode(card)} · {card.set.split(' · ')[1]}</strong><span>{card.setName}</span></div><div className="list-meta"><small>Rareza</small><strong>{card.rarity}{card.foil ? ' · Foil' : ''}</strong><span>{cardSubtypes(card).join(' · ') || 'Sin subtipo'}</span></div><div className="list-meta"><small>Maná</small><strong>{card.mana}</strong><span>MV {card.manaValue ?? '—'}{card.power && card.toughness ? ` · ${card.power}/${card.toughness}` : ''}</span></div><CollectionStepper quantity={quantity} onMinus={() => adjust(card, -1)} onPlus={() => adjust(card, 1)} /><button className="list-add-deck" onClick={() => addToDeck(card)} aria-label={`Añadir ${card.name} al mazo`}><Plus /></button></article>)}</div>}
      </section>
    </div>
    {showProxyGallery && <div className="proxy-gallery-overlay" role="dialog" aria-modal="true" aria-label="Galería de las 100 cartas proxy" onClick={() => setShowProxyGallery(false)}><section className="proxy-gallery-panel" onClick={(event) => event.stopPropagation()}><header><div><Badge>LHP · MAZO COMPLETO</Badge><h2>Las 100 imágenes proxy</h2><p>85 diseños únicos, seis Montañas y once Llanuras con arte individual. Pulsa cualquier carta para ampliarla, girarla o descargarla.</p></div><button onClick={() => setShowProxyGallery(false)} aria-label="Cerrar galería"><X /></button></header><div className="proxy-gallery-grid">{proteinProxyGalleryCards.map((card, index) => <button key={card.uuid} onClick={() => openZoom(card)} aria-label={`Ampliar proxy ${index + 1}: ${card.name}`}><CardArtwork card={card} /><span><b>{String(index + 1).padStart(3, '0')}</b>{card.name}</span></button>)}</div></section></div>}
    {zoomedCard && <div className="card-zoom-overlay" role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${zoomedCard.name}`} onClick={() => setZoomedCard(null)}><div className="card-zoom-panel collection-zoom-panel" onClick={(event) => event.stopPropagation()}><button className="card-zoom-close" onClick={() => setZoomedCard(null)} aria-label="Cerrar ampliación"><X /></button><div className="zoom-card-actions"><button className="zoom-card-flip" onClick={() => setZoomFaceDown((value) => !value)} aria-label={zoomFaceDown ? 'Mostrar frente' : 'Mostrar reverso'}><RotateCw />{zoomFaceDown ? 'Mostrar frente' : 'Dar vuelta'}</button>{zoomedCard.proxy && !zoomFaceDown && <a className="zoom-card-download" href={zoomedCard.image} download><Download />Descargar WebP</a>}</div><CardArtwork card={zoomedCard} faceDown={zoomFaceDown} /><div><strong>{zoomFaceDown ? 'Reverso de Magic' : zoomedCard.name}</strong><span>{zoomFaceDown ? 'Pulsa “Mostrar frente” para volver a la carta.' : zoomedCard.proxy ? `Proxy temático de ${zoomedCard.proxy.originalName}` : `${zoomedCard.type} · ${zoomedCard.mana} · ${zoomedCard.rarity}`}</span></div></div></div>}
  </div>;
}

function Stat({ value, label, detail }: { value: string; label: string; detail: string }) { return <div className="stat-card"><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>; }
function CollectionStepper({ quantity, onMinus, onPlus }: { quantity: number; onMinus: () => void; onPlus: () => void }) { return <div className="stepper"><button onClick={onMinus} aria-label="Quitar una copia"><Minus /></button><b>{quantity}</b><button onClick={onPlus} aria-label="Añadir una copia"><Plus /></button></div>; }
function FilterGroup({ title, items, selected, onToggle, scrollable = false }: { title: string; items: FilterOption[]; selected: string[]; onToggle: (value: string) => void; scrollable?: boolean }) { return <div className={`filter-group ${scrollable ? 'is-scrollable' : ''}`}><p>{title}</p><div>{items.map((item) => <label key={item.value}><input type="checkbox" checked={selected.includes(item.value)} onChange={() => onToggle(item.value)} /><span>{item.label}</span><small>{item.count}</small></label>)}{items.length === 0 && <span className="filter-empty">Sin opciones</span>}</div></div>; }

const formatLabels: Record<DeckFormat, string> = { commander: 'Commander', standard: 'Standard', modern: 'Modern', legacy: 'Legacy', pauper: 'Pauper', limited: 'Limitado / Draft' };
const deckSections = [
  { key: 'Creature', label: 'Criaturas' }, { key: 'Planeswalker', label: 'Planeswalkers' }, { key: 'Artifact', label: 'Artefactos' },
  { key: 'Enchantment', label: 'Encantamientos' }, { key: 'Instant', label: 'Instantáneos' }, { key: 'Sorcery', label: 'Conjuros' }, { key: 'Land', label: 'Tierras' },
];
function primaryDeckSection(card: Card) { return deckSections.find((section) => cardTypes(card).includes(section.key))?.key ?? 'Other'; }
function formatTarget(format: DeckFormat) { return format === 'commander' ? 100 : format === 'limited' ? 40 : 60; }

function BuilderView({ search, setSearch, cards, deck, setDeck, deckCount, addToDeck, format, setFormat, goPlaytest }: { search: string; setSearch: (value: string) => void; cards: Card[]; deck: Record<string, number>; setDeck: React.Dispatch<React.SetStateAction<Record<string, number>>>; deckCount: number; addToDeck: (card: Card) => void; format: DeckFormat; setFormat: (format: DeckFormat) => void; goPlaytest: () => void }) {
  const target = formatTarget(format);
  const deckCards = cards.filter((card) => deck[card.name]);
  const visibleSource = cards.filter((card) => `${card.name} ${card.proxy?.originalName ?? ''} ${card.type} ${card.setName} ${card.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const remove = (name: string) => setDeck((current) => { const next = { ...current }; if ((next[name] ?? 0) <= 1) delete next[name]; else next[name] -= 1; return next; });
  const landCount = deckCards.filter((card) => primaryDeckSection(card) === 'Land').reduce((sum, card) => sum + (deck[card.name] ?? 0), 0);
  const creatureCount = deckCards.filter((card) => primaryDeckSection(card) === 'Creature').reduce((sum, card) => sum + (deck[card.name] ?? 0), 0);
  const rampCount = deckCards.filter((card) => card.tags.includes('ramp')).reduce((sum, card) => sum + (deck[card.name] ?? 0), 0);
  const interactionCount = deckCards.filter((card) => card.tags.some((tag) => ['removal', 'counter', 'protection'].includes(tag))).reduce((sum, card) => sum + (deck[card.name] ?? 0), 0);
  const recommendedLands = format === 'commander' ? '36–38' : format === 'limited' ? '16–18' : '23–26';
  const score = Math.max(28, Math.min(96, Math.round(42 + Math.min(deckCount / target, 1) * 30 + Math.min(rampCount / 10, 1) * 12 + Math.min(interactionCount / 8, 1) * 12)));
  return <div className="builder-shell">
    <div className="builder-top"><div><div className="flex items-center gap-2"><Badge className="bg-emerald-300/10 text-emerald-200">{formatLabels[format].toUpperCase()}</Badge><span className="text-xs text-stone-500">Cambios guardados en este dispositivo</span></div><input className="deck-title" defaultValue="Horror en la espesura" aria-label="Nombre del mazo" /></div><div className="flex flex-wrap items-center gap-2"><div className="native-select-wrap deck-format-select"><select value={format} onChange={(event) => setFormat(event.target.value as DeckFormat)} aria-label="Formato del mazo">{Object.entries(formatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown /></div><Button onClick={goPlaytest} variant="outline" className="border-emerald-300/20 bg-emerald-300/5 text-emerald-100"><Swords /> Probar mazo</Button><Button className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200">Guardar mazo</Button></div></div>
    <div className="builder-grid">
      <aside className="builder-collection"><div className="builder-panel-head"><div><p className="eyebrow">Fuente</p><h2>Tu colección</h2></div><Badge variant="outline" className="border-white/10 text-stone-400">{cards.length}</Badge></div><div className="search-field compact"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en colección…" /></div><div className="mt-3 flex gap-2"><button className="filter-chip active">Todas</button><button className="filter-chip">Compatibles</button><button className="filter-chip">Sin usar</button></div><div className="builder-source-list">{visibleSource.slice(0, 12).map((card) => <div className="source-card" key={collectionIdentity(card)}><CardArtwork card={card} /><div><strong>{card.name}</strong><span>{card.type} · {card.mana}</span><small>En el mazo: {deck[card.name] ?? 0}</small></div><button onClick={() => addToDeck(card)} aria-label={`Añadir ${card.name}`}><Plus /></button></div>)}</div></aside>
      <section className="deck-canvas"><div className="deck-summary"><div><span className="deck-count-ring" style={{ '--progress': `${Math.min((deckCount / target) * 100, 100)}%` } as React.CSSProperties}><strong>{deckCount}</strong><small>/ {target}</small></span><div><p className="eyebrow">Mazo principal</p><h2>Horror en la espesura</h2><span className="text-xs text-stone-500">{deckCards.length} cartas únicas · {formatLabels[format]}</span></div></div><div className="deck-summary-metrics"><span><b>{landCount}</b> tierras</span><span><b>{creatureCount}</b> criaturas</span><span><b>{rampCount}</b> ramp</span></div></div>
        <div className="deck-groups">{deckSections.map((section) => { const grouped = deckCards.filter((card) => primaryDeckSection(card) === section.key); if (!grouped.length) return null; return <div className="deck-group" key={section.key}><div className="deck-group-title"><span>{section.label}</span><Badge variant="outline" className="border-white/8 text-stone-500">{grouped.reduce((sum, card) => sum + (deck[card.name] ?? 0), 0)}</Badge></div>{grouped.map((card) => <div className="deck-row" key={card.name}><CardArtwork card={card} /><span className="deck-qty">{deck[card.name]}×</span><div><strong>{card.name}</strong><small>{card.type} · {card.tags.join(' · ')}</small></div><span className="mana-cost">{card.mana}</span><button onClick={() => remove(card.name)} aria-label={`Quitar ${card.name}`}><X /></button></div>)}</div>; })}<button className="empty-slot"><CirclePlus />Añadir una sección personalizada</button></div>
      </section>
      <aside className="insights-panel"><div className="builder-panel-head"><div><p className="eyebrow">Asistente</p><h2>Salud del mazo</h2></div><span className="health-score">{score}</span></div><div className="health-track"><span style={{ width: `${score}%` }} /></div><p className="mt-2 text-xs text-stone-500">Recomendaciones orientativas para {formatLabels[format]}. No sustituyen las reglas del formato.</p><div className="recommendations"><Insight icon={<LandPlot />} tone="amber" title={`Objetivo: ${recommendedLands} tierras`} text={`Actualmente tienes ${landCount}. Ajusta según tu curva y fuentes de maná.`} action="Revisar tierras" /><Insight icon={<Zap />} tone="green" title="Aceleración y fijación" text={`${rampCount} piezas de ramp detectadas. ${format === 'commander' ? 'Objetivo habitual: 10–12.' : 'Añade las que requiera tu curva.'}`} action="Ver ramp" /><Insight icon={<ShieldCheck />} tone="blue" title="Interacción" text={`${interactionCount} respuestas detectadas entre removal, protección y counters.`} action="Ver respuestas" /></div><div className="analysis-block"><div className="flex items-center justify-between"><h3>Curva de maná</h3><span>MV medio visible</span></div><div className="mana-chart">{[12, 42, 88, 70, 44, 25, 14].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{index === 6 ? '6+' : index}</small></div>)}</div></div><div className="analysis-block"><h3>Sinergias detectadas</h3><div className="synergy-list">{[...new Set(deckCards.flatMap((card) => card.tags))].slice(0, 8).map((tag) => <span key={tag}>{tag} <b>{deckCards.filter((card) => card.tags.includes(tag)).length}</b></span>)}</div></div><Button onClick={goPlaytest} variant="outline" className="mt-5 w-full border-amber-300/20 bg-amber-300/5 text-amber-100"><Swords />Abrir mesa de prueba</Button></aside>
    </div>
  </div>;
}

type GamePiece = { instanceId: string; card: Card; tapped: boolean; plusOne: number; markers: string[]; token?: boolean };
function shuffled<T>(items: T[]) { const next = [...items]; for (let index = next.length - 1; index > 0; index -= 1) { const other = Math.floor(Math.random() * (index + 1)); [next[index], next[other]] = [next[other], next[index]]; } return next; }
function makePiece(card: Card, suffix: string, token = false): GamePiece { return { instanceId: `${card.name}:${suffix}:${Math.random().toString(36).slice(2)}`, card, tapped: false, plusOne: 0, markers: [], token }; }
function tokenCard(name: string, power: string, toughness: string, color: string): Card { return { name, rarity: 'Token', slot: 'Token', set: 'TKN · 001', setName: 'Ficha', image: `https://api.scryfall.com/cards/named?format=image&version=normal&fuzzy=${encodeURIComponent(name)}`, foil: false, type: `Token Creature — ${name.replace(' Token', '')}`, mana: '—', color, tags: ['token'], types: ['Creature'], subtypes: [name.replace(' Token', '')], manaValue: 0, power, toughness, qty: 1 }; }

function PlaytestView({ cards, deck, format, goBuilder }: { cards: Card[]; deck: Record<string, number>; format: DeckFormat; goBuilder: () => void }) {
  const [library, setLibrary] = useState<GamePiece[]>([]);
  const [hand, setHand] = useState<GamePiece[]>([]);
  const [lands, setLands] = useState<GamePiece[]>([]);
  const [spells, setSpells] = useState<GamePiece[]>([]);
  const [graveyard, setGraveyard] = useState<GamePiece[]>([]);
  const [exile, setExile] = useState<GamePiece[]>([]);
  const [command, setCommand] = useState<GamePiece[]>([]);
  const [life, setLife] = useState(format === 'commander' ? 40 : 20);
  const [turn, setTurn] = useState(1);
  const [marker, setMarker] = useState('Vigilancia');

  function resetGame() {
    const pieces = cards.flatMap((card) => Array.from({ length: Math.max(0, deck[card.name] ?? 0) }, (_, index) => {
      const variant = card.proxy?.images[index % card.proxy.images.length];
      return makePiece(variant ? { ...card, image: variant } : card, String(index));
    }));
    const commanderIndex = format === 'commander' ? pieces.findIndex((piece) => isLegendary(piece.card)) : -1;
    const commander = commanderIndex >= 0 ? pieces.splice(commanderIndex, 1) : [];
    const nextLibrary = shuffled(pieces);
    setHand(nextLibrary.slice(-7));
    setLibrary(nextLibrary.slice(0, -7));
    setCommand(commander);
    setLands([]); setSpells([]); setGraveyard([]); setExile([]);
    setLife(format === 'commander' ? 40 : 20); setTurn(1);
  }
  useEffect(() => { resetGame(); }, [format]);

  function drawCard() { const card = library[library.length - 1]; if (!card) return; setLibrary((current) => current.slice(0, -1)); setHand((current) => [...current, card]); }
  function newHand() { const next = shuffled([...library, ...hand]); setHand(next.slice(-7)); setLibrary(next.slice(0, -7)); }
  function playFromHand(piece: GamePiece) { setHand((current) => current.filter((item) => item.instanceId !== piece.instanceId)); if (cardTypes(piece.card).includes('Land')) setLands((current) => [...current, piece]); else setSpells((current) => [...current, piece]); }
  function updateBattlefield(id: string, updater: (piece: GamePiece) => GamePiece) { setLands((current) => current.map((piece) => piece.instanceId === id ? updater(piece) : piece)); setSpells((current) => current.map((piece) => piece.instanceId === id ? updater(piece) : piece)); }
  function moveFromBattlefield(piece: GamePiece, destination: 'graveyard' | 'exile') { setLands((current) => current.filter((item) => item.instanceId !== piece.instanceId)); setSpells((current) => current.filter((item) => item.instanceId !== piece.instanceId)); (destination === 'graveyard' ? setGraveyard : setExile)((current) => [...current, { ...piece, tapped: false }]); }
  function addToken(card: Card) { setSpells((current) => [...current, makePiece(card, 'token', true)]); }
  function playCommander(piece: GamePiece) { setCommand((current) => current.filter((item) => item.instanceId !== piece.instanceId)); setSpells((current) => [...current, piece]); }
  const nextTurn = () => { setTurn((value) => value + 1); setLands((current) => current.map((piece) => ({ ...piece, tapped: false }))); setSpells((current) => current.map((piece) => ({ ...piece, tapped: false }))); drawCard(); };
  return <div className="playtest-shell">
    <header className="playtest-toolbar"><div><p className="eyebrow">Sandbox sin reglas automáticas</p><h1>Prueba tu mazo</h1><span>{formatLabels[format]} · Turno {turn} · {library.length + hand.length + lands.length + spells.length + graveyard.length + exile.length + command.length} cartas en juego</span></div><div className="playtest-actions"><Button variant="outline" onClick={goBuilder} className="border-white/10 bg-white/3"><Layers3 />Constructor</Button><Button variant="outline" onClick={() => setLibrary((current) => shuffled(current))} className="border-white/10 bg-white/3"><Shuffle />Mezclar</Button><Button variant="outline" onClick={newHand} className="border-white/10 bg-white/3"><Hand />Nueva mano de 7</Button><Button onClick={nextTurn} className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><SkipForward />Siguiente turno</Button><button className="reset-table" onClick={resetGame} aria-label="Reiniciar mesa"><RotateCcw /></button></div></header>
    <div className="playmat">
      <div className="upper-zones">
        <PlayZone title="Comandante" icon={<Crown />} count={command.length} className="command-zone">{command.map((piece) => <button key={piece.instanceId} className="zone-card-face" onClick={() => playCommander(piece)} title="Bajar comandante"><CardArtwork card={piece.card} /><span>Bajar</span></button>)}</PlayZone>
        <PlayZone title="Exilio" icon={<Ban />} count={exile.length}><ZonePile cards={exile} empty="Vacío" /></PlayZone>
        <PlayZone title="Biblioteca" icon={<Library />} count={library.length}><button className="library-pile" onClick={drawCard} disabled={!library.length} title="Robar una carta">{library.length > 0 && <><i /><i /><img src="assets/magic-card-back.png" alt="Reverso de Magic" /></>}<b>{library.length}</b><span>Robar</span></button></PlayZone>
        <div className="life-panel"><Heart /><span>Vidas</span><div><button onClick={() => setLife((value) => value - 1)}><Minus /></button><strong>{life}</strong><button onClick={() => setLife((value) => value + 1)}><Plus /></button></div><small>Turno {turn}</small></div>
        <PlayZone title="Cementerio" icon={<Skull />} count={graveyard.length}><ZonePile cards={graveyard} empty="Vacío" /></PlayZone>
      </div>

      <section className="battlefield-zone spells-zone"><div className="battlefield-zone-head"><div><Swords /><span>Hechizos y permanentes</span><b>{spells.length}</b></div><div className="token-tools"><span>Añadir ficha:</span><button onClick={() => addToken(tokenCard('Treasure Token', '—', '—', 'C'))}>Tesoro</button><button onClick={() => addToken(tokenCard('Spirit Token', '1', '1', 'W'))}>Espíritu 1/1</button><button onClick={() => addToken(tokenCard('Beast Token', '3', '3', 'G'))}>Bestia 3/3</button></div></div><div className="battlefield-cards">{spells.map((piece) => <BattlefieldPiece key={piece.instanceId} piece={piece} marker={marker} onTap={() => updateBattlefield(piece.instanceId, (item) => ({ ...item, tapped: !item.tapped }))} onCounter={(amount) => updateBattlefield(piece.instanceId, (item) => ({ ...item, plusOne: Math.max(0, item.plusOne + amount) }))} onMarker={() => updateBattlefield(piece.instanceId, (item) => ({ ...item, markers: item.markers.includes(marker) ? item.markers.filter((value) => value !== marker) : [...item.markers, marker] }))} onGrave={() => moveFromBattlefield(piece, 'graveyard')} onExile={() => moveFromBattlefield(piece, 'exile')} />)}{spells.length === 0 && <span className="zone-empty">Baja aquí criaturas, artefactos, encantamientos y otros hechizos.</span>}</div></section>
      <section className="battlefield-zone lands-zone"><div className="battlefield-zone-head"><div><LandPlot /><span>Tierras</span><b>{lands.length}</b></div><div className="marker-picker"><span>Marcador:</span>{['Vigilancia', 'Prisa', 'Toque mortal', 'Escudo'].map((value) => <button key={value} data-active={marker === value} onClick={() => setMarker(value)}>{value}</button>)}</div></div><div className="battlefield-cards compact">{lands.map((piece) => <BattlefieldPiece key={piece.instanceId} piece={piece} marker={marker} onTap={() => updateBattlefield(piece.instanceId, (item) => ({ ...item, tapped: !item.tapped }))} onCounter={(amount) => updateBattlefield(piece.instanceId, (item) => ({ ...item, plusOne: Math.max(0, item.plusOne + amount) }))} onMarker={() => updateBattlefield(piece.instanceId, (item) => ({ ...item, markers: item.markers.includes(marker) ? item.markers.filter((value) => value !== marker) : [...item.markers, marker] }))} onGrave={() => moveFromBattlefield(piece, 'graveyard')} onExile={() => moveFromBattlefield(piece, 'exile')} />)}{lands.length === 0 && <span className="zone-empty">Las tierras que juegues aparecerán aquí.</span>}</div></section>

      <section className="hand-zone"><div className="hand-zone-head"><div><Hand /><span>Tu mano</span><b>{hand.length}</b></div><button onClick={drawCard} disabled={!library.length}><Plus /> Robar una</button></div><div className="hand-cards">{hand.map((piece, index) => <button key={piece.instanceId} className="hand-card" style={{ '--hand-index': index, '--hand-center': (hand.length - 1) / 2 } as React.CSSProperties} onClick={() => playFromHand(piece)} title={`Bajar ${piece.card.name}`}><CardArtwork card={piece.card} /><span>{cardTypes(piece.card).includes('Land') ? 'Jugar tierra' : 'Bajar a mesa'}</span></button>)}{hand.length === 0 && <span className="zone-empty">No tienes cartas en la mano. Roba de la biblioteca.</span>}</div></section>
    </div>
  </div>;
}

function PlayZone({ title, icon, count, className = '', children }: { title: string; icon: React.ReactNode; count: number; className?: string; children: React.ReactNode }) { return <section className={`play-zone ${className}`}><header>{icon}<span>{title}</span><b>{count}</b></header><div>{children}</div></section>; }
function ZonePile({ cards, empty }: { cards: GamePiece[]; empty: string }) { const top = cards[cards.length - 1]; return top ? <div className="zone-pile"><i /><CardArtwork card={top.card} /><b>{cards.length}</b><span>{top.card.name}</span></div> : <span className="zone-empty">{empty}</span>; }
function BattlefieldPiece({ piece, marker, onTap, onCounter, onMarker, onGrave, onExile }: { piece: GamePiece; marker: string; onTap: () => void; onCounter: (amount: number) => void; onMarker: () => void; onGrave: () => void; onExile: () => void }) { return <article className={`battlefield-piece ${piece.tapped ? 'is-tapped' : ''}`}><button className="physical-card" onClick={onTap} title={piece.tapped ? 'Enderezar carta' : 'Tapear carta'}><CardArtwork card={piece.card} />{piece.plusOne > 0 && <b className="counter-badge">+{piece.plusOne}/+{piece.plusOne}</b>}{piece.markers.map((value) => <i className="ability-marker" key={value}>{value}</i>)}</button><div className="piece-controls"><button onClick={() => onCounter(1)}>+1/+1</button><button onClick={() => onCounter(-1)} disabled={!piece.plusOne}>−</button><button onClick={onMarker}>{marker}</button><button onClick={onGrave} title="Enviar al cementerio"><Skull /></button><button onClick={onExile} title="Exiliar"><Ban /></button></div></article>; }

function Insight({ icon, tone, title, text, action }: { icon: React.ReactNode; tone: string; title: string; text: string; action: string }) { return <div className={`insight insight-${tone}`}><div className="insight-icon">{icon}</div><div><strong>{title}</strong><p>{text}</p><button>{action} <ArrowRight /></button></div></div>; }
