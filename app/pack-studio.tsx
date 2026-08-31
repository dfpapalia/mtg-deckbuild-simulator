'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive, ArrowRight, BarChart3, Check, ChevronDown, ChevronLeft, ChevronRight, CirclePlus,
  Filter, Grid2X2, LandPlot, Layers3, Library, Minus, Move, PackageOpen, Plus, RotateCw, Scissors,
  Search, ShieldCheck, SkipForward, SlidersHorizontal, Sparkles, UserRound, WandSparkles, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getBoosterProducts, loadSet, loadSetCatalog, simulateBooster, type BoosterProduct, type MtgSetData, type MtgSetSummary } from '@/lib/mtgjson';

type AppView = 'packs' | 'collection' | 'builder';
type ViewMode = 'automatic' | 'stack' | 'grid';
type Card = { id?: string; name: string; rarity: string; slot: string; set: string; setName: string; image: string; foil: boolean; type: string; mana: string; color: string; tags: string[]; qty: number };

const image = (name: string) => `https://api.scryfall.com/cards/named?format=image&version=normal&exact=${encodeURIComponent(name)}`;
const cards: Card[] = [
  { name: 'Kaito, Bane of Nightmares', rarity: 'Mítica', slot: 'Borderless', set: 'DSK · 220', setName: 'Duskmourn', image: image('Kaito, Bane of Nightmares'), foil: true, type: 'Planeswalker', mana: '2UB', color: 'UB', tags: ['ninjutsu', 'draw'], qty: 1 },
  { name: 'Overlord of the Hauntwoods', rarity: 'Mítica', slot: 'Foil tradicional', set: 'DSK · 194', setName: 'Duskmourn', image: image('Overlord of the Hauntwoods'), foil: true, type: 'Creature', mana: '3GG', color: 'G', tags: ['ramp', 'landfall'], qty: 1 },
  { name: 'Unholy Annex // Ritual Chamber', rarity: 'Rara', slot: 'Double-faced', set: 'DSK · 118', setName: 'Duskmourn', image: image('Unholy Annex'), foil: false, type: 'Enchantment', mana: '2B', color: 'B', tags: ['draw', 'demon'], qty: 2 },
  { name: 'Enduring Curiosity', rarity: 'Rara', slot: 'Rare / Mythic', set: 'DSK · 51', setName: 'Duskmourn', image: image('Enduring Curiosity'), foil: false, type: 'Creature', mana: '2UU', color: 'U', tags: ['draw', 'flash'], qty: 1 },
  { name: 'Fear of Missing Out', rarity: 'Rara', slot: 'Wildcard', set: 'DSK · 136', setName: 'Duskmourn', image: image('Fear of Missing Out'), foil: false, type: 'Creature', mana: '1R', color: 'R', tags: ['discard', 'extra combat'], qty: 2 },
  { name: 'Sol Ring', rarity: 'Infrecuente', slot: 'Commander staple', set: 'CMM · 396', setName: 'Commander Masters', image: image('Sol Ring'), foil: false, type: 'Artifact', mana: '1', color: 'C', tags: ['ramp', 'artifact'], qty: 3 },
  { name: 'Command Tower', rarity: 'Común', slot: 'Land', set: 'CMM · 991', setName: 'Commander Masters', image: image('Command Tower'), foil: false, type: 'Land', mana: '—', color: 'C', tags: ['mana fixing', 'land'], qty: 4 },
  { name: 'Arcane Signet', rarity: 'Infrecuente', slot: 'Commander staple', set: 'CMM · 378', setName: 'Commander Masters', image: image('Arcane Signet'), foil: true, type: 'Artifact', mana: '2', color: 'C', tags: ['ramp', 'mana fixing'], qty: 2 },
  { name: 'Beast Within', rarity: 'Infrecuente', slot: 'Interaction', set: 'CMM · 271', setName: 'Commander Masters', image: image('Beast Within'), foil: false, type: 'Instant', mana: '2G', color: 'G', tags: ['removal', 'instant'], qty: 2 },
  { name: 'Cultivate', rarity: 'Infrecuente', slot: 'Ramp', set: 'M21 · 177', setName: 'Core Set 2021', image: image('Cultivate'), foil: false, type: 'Sorcery', mana: '2G', color: 'G', tags: ['ramp', 'land'], qty: 3 },
];

export function PackStudio({ userName, signInPath = '/signin-with-chatgpt?return_to=%2F', staticDemo = false }: { userName?: string | null; signInPath?: string; staticDemo?: boolean }) {
  const [view, setView] = useState<AppView>('packs');
  const [viewMode, setViewMode] = useState<ViewMode>('automatic');
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(12);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState(() => Object.fromEntries(cards.map((card) => [card.name, card.qty])));
  const [libraryCards, setLibraryCards] = useState<Card[]>(cards);
  const [deck, setDeck] = useState<Record<string, number>>({ 'Overlord of the Hauntwoods': 1, 'Sol Ring': 1, 'Arcane Signet': 1, Cultivate: 1, 'Command Tower': 1, 'Beast Within': 1 });
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

  const filteredCards = useMemo(() => libraryCards.filter((card) => `${card.name} ${card.setName} ${card.type}`.toLowerCase().includes(search.toLowerCase())), [libraryCards, search]);
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
    const preference = window.localStorage.getItem('vaultforge:pack-animation');
    if (preference !== null) setAnimationEnabled(preference === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('vaultforge:pack-animation', String(animationEnabled));
  }, [animationEnabled]);

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
      setViewMode('automatic');
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
    setCollection((current) => { const next = { ...current }; pending.forEach((card) => { next[card.name] = (next[card.name] ?? 0) + 1; }); return next; });
    setLibraryCards((current) => {
      const known = new Set(current.map((card) => `${card.name}:${card.set}:${card.foil}`));
      return [...pending.filter((card) => !known.has(`${card.name}:${card.set}:${card.foil}`)), ...current];
    });
    setSavedCards((current) => new Set([...current, ...pending.map((card) => card.id ?? card.name)]));
    return true;
  }
  async function savePack() {
    const ok = await saveCards(packCards);
    if (ok) flash(`${packCards.length} cartas añadidas a ${staticDemo ? 'la colección de demostración' : 'tu colección'}`);
  }
  async function addCurrentAndNext() {
    const current = packCards[activeCard];
    if (!current) return;
    const ok = await saveCards([current]);
    if (ok) {
      if (activeCard < packCards.length - 1) setActiveCard((value) => value + 1);
      else flash('Sobre completado: todas las cartas revisadas');
    }
  }
  function nextCard() { setActiveCard((value) => Math.min(packCards.length - 1, value + 1)); }
  function previousCard() { setActiveCard((value) => Math.max(0, value - 1)); }
  function toggleCardFace(card: Card) {
    const key = card.id ?? card.name;
    setFaceDownCards((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }
  function addToDeck(card: Card) { setDeck((current) => ({ ...current, [card.name]: (current[card.name] ?? 0) + 1 })); flash(`${card.name} añadida al mazo`); }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0b0e0d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 sm:px-6">
          <button onClick={() => setView('packs')} className="flex items-center gap-2.5" aria-label="Vaultforge — inicio">
            <span className="grid size-9 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200"><WandSparkles className="size-4" /></span>
            <span className="font-display text-lg font-semibold tracking-tight">Vaultforge</span>
            <Badge className="hidden border-amber-300/20 bg-amber-300/10 text-amber-200 sm:inline-flex">PROTOTIPO</Badge>
          </button>
          <nav className="ml-4 hidden h-full items-center gap-1 md:flex" aria-label="Navegación principal">
            <NavButton active={view === 'packs'} onClick={() => setView('packs')} icon={<PackageOpen />}>Abrir sobres</NavButton>
            <NavButton active={view === 'collection'} onClick={() => setView('collection')} icon={<Library />}>Colección</NavButton>
            <NavButton active={view === 'builder'} onClick={() => setView('builder')} icon={<Layers3 />}>Mazos</NavButton>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => setView('collection')} className="hidden text-stone-300 sm:inline-flex"><Search /> Buscar cartas</Button>
            {userName ? <Button variant="outline" className="border-white/10 bg-white/4 text-stone-100"><span className="avatar-dot">{userName.charAt(0)}</span>{userName}</Button> : <Button nativeButton={false} render={<a href={signInPath} target="_top" />} variant="outline" className="border-white/10 bg-white/4 text-stone-100"><UserRound /> Entrar</Button>}
          </div>
        </div>
        <div className="mobile-nav md:hidden"><NavButton active={view === 'packs'} onClick={() => setView('packs')} icon={<PackageOpen />}>Sobres</NavButton><NavButton active={view === 'collection'} onClick={() => setView('collection')} icon={<Library />}>Colección</NavButton><NavButton active={view === 'builder'} onClick={() => setView('builder')} icon={<Layers3 />}>Mazos</NavButton></div>
      </header>

      {view === 'packs' && <PackView viewMode={viewMode} setViewMode={setViewMode} opening={opening} opened={opened} openPack={openPack} saved={saved} savePack={savePack} goBuilder={() => setView('builder')} sets={sets} selectedSetCode={selectedSetCode} setSelectedSetCode={setSelectedSetCode} selectedSet={selectedSet} products={products} selectedProductCode={selectedProductCode} setSelectedProductCode={setSelectedProductCode} selectedProduct={selectedProduct} dataLoading={dataLoading} dataError={dataError} animationEnabled={animationEnabled} setAnimationEnabled={setAnimationEnabled} packCards={packCards} activeCard={activeCard} setActiveCard={setActiveCard} faceDownCards={faceDownCards} toggleCardFace={toggleCardFace} savedCards={savedCards} addCurrentAndNext={addCurrentAndNext} nextCard={nextCard} previousCard={previousCard} history={history} collectionTotal={Object.values(collection).reduce((sum, qty) => sum + qty, 0)} />}
      {view === 'collection' && <CollectionView search={search} setSearch={setSearch} cards={filteredCards} collection={collection} setCollection={setCollection} addToDeck={addToDeck} goBuilder={() => setView('builder')} />}
      {view === 'builder' && <BuilderView search={search} setSearch={setSearch} cards={filteredCards} deck={deck} setDeck={setDeck} deckCount={deckCount} addToDeck={addToDeck} />}

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
  setActiveCard: (index: number) => void; faceDownCards: Set<string>; toggleCardFace: (card: Card) => void;
  savedCards: Set<string>; addCurrentAndNext: () => void | Promise<void>; nextCard: () => void; previousCard: () => void;
  history: string[]; collectionTotal: number;
};

function PackView({ viewMode, setViewMode, opening, opened, openPack, saved, savePack, goBuilder, sets, selectedSetCode, setSelectedSetCode, selectedSet, products, selectedProductCode, setSelectedProductCode, selectedProduct, dataLoading, dataError, animationEnabled, setAnimationEnabled, packCards, activeCard, setActiveCard, faceDownCards, toggleCardFace, savedCards, addCurrentAndNext, nextCard, previousCard, history, collectionTotal }: PackViewProps) {
  const currentCard = packCards[activeCard];
  const visibleCards = viewMode === 'automatic' ? (currentCard ? [currentCard] : []) : packCards;
  const foilCount = packCards.filter((card) => card.foil).length;
  const [packPose, setPackPose] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0, dragging: false, anchorX: 0, anchorY: 0, baseX: 0, baseY: 0 });

  useEffect(() => {
    setPackPose({ x: 0, y: 0, rotateX: 0, rotateY: 0, dragging: false, anchorX: 0, anchorY: 0, baseX: 0, baseY: 0 });
  }, [selectedSetCode, selectedProductCode]);

  function handlePackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setPackPose((pose) => ({ ...pose, dragging: true, anchorX: event.clientX, anchorY: event.clientY, baseX: pose.x, baseY: pose.y }));
  }
  function handlePackPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (packPose.dragging) {
      const dx = event.clientX - packPose.anchorX;
      const dy = event.clientY - packPose.anchorY;
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
  function resetPackPose() { setPackPose({ x: 0, y: 0, rotateX: 0, rotateY: 0, dragging: false, anchorX: 0, anchorY: 0, baseX: 0, baseY: 0 }); }
  return <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
    <aside className="border-white/8 p-5 xl:min-h-[calc(100vh-64px)] xl:border-r xl:p-6">
      <div className="mb-6 flex items-start justify-between"><div><p className="eyebrow">Simulador</p><h1 className="mt-1 font-display text-2xl font-semibold">Abrir producto</h1></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300">ODDS REALES</span></div>
      <div className="space-y-5">
        <label className="control-label">Edición<div className="native-select-wrap"><select value={selectedSetCode} onChange={(event) => setSelectedSetCode(event.target.value)} aria-label="Edición de Magic">{sets.length === 0 && <option value="DSK">Cargando ediciones…</option>}{sets.map((set) => <option key={set.code} value={set.code}>{set.name} · {set.code} ({set.releaseDate?.slice(0, 4) ?? '—'})</option>)}</select><ChevronDown /></div></label>
        <label className="control-label">Producto<div className="native-select-wrap"><select value={selectedProductCode} onChange={(event) => setSelectedProductCode(event.target.value)} disabled={dataLoading || products.length === 0} aria-label="Producto sellado">{dataLoading && <option value={selectedProductCode}>Cargando productos…</option>}{!dataLoading && products.map((product) => <option key={product.code} value={product.code}>{product.name} · {product.cardCount} cartas</option>)}</select><ChevronDown /></div></label>
        <div className="animation-toggle"><div><strong>Animación de apertura</strong><span>Desactívala para abrir al instante</span></div><Switch checked={animationEnabled} onCheckedChange={setAnimationEnabled} aria-label="Activar animación de apertura" /></div>
      </div>
      <Button onClick={openPack} disabled={opening || dataLoading || !selectedProduct} className="mt-7 h-12 w-full bg-amber-300 text-sm font-bold text-[#17150e] shadow-[0_12px_30px_-12px_rgba(252,211,77,.75)] hover:bg-amber-200"><Sparkles />{opening ? 'Abriendo…' : dataLoading ? 'Cargando datos…' : `Abrir ${selectedProduct?.name ?? 'sobre'}`}</Button>
      {dataError ? <p className="mt-3 text-center text-xs leading-relaxed text-red-300">{dataError}</p> : <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">Slots, rarezas, foil y probabilidades se generan desde la colación publicada del producto.</p>}
      <div className="mt-8 border-t border-white/7 pt-5"><p className="eyebrow">Historial reciente</p>{history.map((item, index) => <div key={item} className="history-row"><span>{item}</span><small>{index === 0 && packCards.length ? 'ahora' : `hace ${index * 4 + 2} min`}</small></div>)}</div>
    </aside>

    <section className="min-w-0 border-y border-white/8 px-4 py-6 sm:px-8 xl:border-y-0 xl:py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Apertura #{opened}</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{selectedProduct?.name ?? 'Elige un producto'} · {selectedSet?.name ?? selectedSetCode}</h2><p className="mt-1 text-sm text-stone-500">{packCards.length || selectedProduct?.cardCount || 0} cartas · orden de slots conservado</p></div><div className="view-switcher" aria-label="Modo de visualización"><button onClick={() => setViewMode('automatic')} data-active={viewMode === 'automatic'}><WandSparkles />Automatic</button><button onClick={() => setViewMode('stack')} data-active={viewMode === 'stack'}><Layers3 />Card stack</button><button onClick={() => setViewMode('grid')} data-active={viewMode === 'grid'}><Grid2X2 />Card grid</button></div></div>
      <div className={`pack-stage pack-stage-${viewMode} ${opening ? 'is-opening' : ''}`}>
        <div className="stage-glow" />
        {opening && <div className="booster-opening" aria-live="polite"><div className="booster-wrapper"><img className="pack-main-image" src="assets/vaultforge-booster.webp" alt="" /><div className="pack-dynamic-label"><small>{selectedSetCode}</small><strong>{selectedProduct?.name}</strong></div><div className="pack-top-piece"><img src="assets/vaultforge-booster.webp" alt="" /></div><span className="cut-track" /><span className="cut-blade"><Scissors /></span><div className="cards-emerging"><img src="assets/vaultforge-card-back.webp" alt="Reverso de una carta" /></div></div><p>Cortando el cierre superior y extrayendo las cartas…</p></div>}
        {!opening && packCards.length === 0 && selectedProduct && <div className="interactive-pack-area"><div role="button" tabIndex={0} className={`interactive-pack ${packPose.dragging ? 'is-dragging' : ''}`} aria-label="Sobre interactivo. Arrástralo o mueve el puntero para girarlo" onPointerDown={handlePackPointerDown} onPointerMove={handlePackPointerMove} onPointerUp={handlePackPointerUp} onPointerCancel={handlePackPointerUp} onPointerLeave={() => { if (!packPose.dragging) setPackPose((pose) => ({ ...pose, rotateX: 0, rotateY: 0 })); }} onDoubleClick={openPack} style={{ transform: `translate3d(${packPose.x}px,${packPose.y}px,0) rotateX(${packPose.rotateX}deg) rotateY(${packPose.rotateY}deg)` }}><img src="assets/vaultforge-booster.webp" alt={`Sobre ${selectedProduct.name} de ${selectedSet?.name ?? selectedSetCode}`} draggable={false} /><div className="pack-dynamic-label"><small>{selectedSetCode}</small><strong>{selectedProduct.name}</strong></div><span className="pack-grab-hint"><Move /> Arrastra para mover y girar</span></div><div className="pack-ready-actions"><button onClick={resetPackPose}>Centrar</button><Button onClick={openPack} className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><Scissors />Cortar y abrir</Button></div></div>}
        {!opening && packCards.length === 0 && !selectedProduct && <div className="empty-pack-stage"><PackageOpen /><strong>Tu sobre aparecerá aquí</strong><span>Selecciona una edición y un producto para generar cartas reales.</span></div>}
        {!opening && packCards.length > 0 && <div className="cards-shell">{visibleCards.map((card, index) => {
          const key = card.id ?? `${card.name}-${index}`;
          const actualIndex = viewMode === 'automatic' ? activeCard : index;
          const faceDown = faceDownCards.has(key);
          const isSaved = savedCards.has(key);
          return <article role="button" tabIndex={0} aria-label={`${faceDown ? 'Revelar' : 'Ocultar'} ${card.name}`} onClick={() => toggleCardFace(card)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCardFace(card); } }} className={`mtg-card ${card.foil ? 'is-foil' : ''} ${faceDown ? 'is-face-down' : ''} ${isSaved ? 'is-collected' : ''}`} key={key} style={{ '--card-index': actualIndex, '--card-center': Math.floor(packCards.length / 2) } as React.CSSProperties}><div className="card-flipper"><div className="card-face card-front"><img src={card.image} alt={card.name} />{card.foil && <span className="foil-sheen" aria-hidden="true" />}{isSaved && <span className="collected-mark"><Check />Colección</span>}</div><div className="card-face card-back"><img src="assets/vaultforge-card-back.webp" alt="Reverso de la carta" /></div></div></article>;
        })}</div>}
        {!opening && currentCard && <div className="stage-caption"><div><span className="rarity-gem" /><strong>{faceDownCards.has(currentCard.id ?? currentCard.name) ? 'Carta sin revelar' : currentCard.name}</strong></div><span>{faceDownCards.has(currentCard.id ?? currentCard.name) ? `Slot ${activeCard + 1}` : `${currentCard.slot} · ${currentCard.set}${currentCard.foil ? ' · FOIL' : ''}`}</span></div>}
        {!opening && viewMode === 'automatic' && currentCard && <div className="automatic-controls"><button onClick={previousCard} disabled={activeCard === 0} aria-label="Carta anterior"><ChevronLeft /></button><span>{activeCard + 1} / {packCards.length}</span><button onClick={nextCard} disabled={activeCard === packCards.length - 1} aria-label="Carta siguiente"><ChevronRight /></button></div>}
      </div>
      {packCards.length > 0 && <div className="reveal-actions"><Button variant="outline" onClick={() => currentCard && toggleCardFace(currentCard)}><RotateCw />{currentCard && faceDownCards.has(currentCard.id ?? currentCard.name) ? 'Revelar carta' : 'Volver a ocultar'}</Button>{viewMode === 'automatic' && <><Button onClick={addCurrentAndNext} disabled={!currentCard || savedCards.has(currentCard.id ?? currentCard.name)} className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><CirclePlus />{currentCard && savedCards.has(currentCard.id ?? currentCard.name) ? 'Añadida' : 'Añadir y siguiente'}</Button><Button variant="ghost" onClick={nextCard} disabled={activeCard === packCards.length - 1}><SkipForward />Omitir</Button></>}</div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500"><p><strong className="text-stone-300">{packCards.length || selectedProduct?.cardCount || 0} cartas</strong>{packCards.length ? ` · ${foilCount} foil en esta apertura` : ' · esperando apertura'}</p><p>{packCards.length ? 'Pulsa una carta para voltearla y revelar el frente' : 'Arrastra el sobre, gíralo y córtalo para abrirlo'}</p></div>
    </section>

    <aside className="p-5 xl:min-h-[calc(100vh-64px)] xl:border-l xl:border-white/8 xl:p-6">
      <div className="flex items-center justify-between"><div><p className="eyebrow">Tu cuenta</p><h2 className="mt-1 font-display text-xl font-semibold">Colección</h2></div><Archive className="size-5 text-stone-500" /></div>
      <div className="mt-5 rounded-2xl border border-white/8 bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-sm text-stone-400">Cartas guardadas</span><strong className="font-display text-2xl">{collectionTotal}</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/6"><span className="block h-full w-[68%] rounded-full bg-amber-300" /></div><div className="mt-2 flex justify-between text-[11px] text-stone-500"><span>{savedCards.size} de este sobre</span><span>{foilCount} foil abiertas</span></div></div>
      <div className="mt-6 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Contenido del sobre</h3><span className="text-xs text-stone-500">{packCards.length} slots</span></div><div className="pack-slot-list">{packCards.map((card, index) => { const key = card.id ?? `${card.name}-${index}`; const faceDown = faceDownCards.has(key); return <button onClick={() => { setViewMode('automatic'); setActiveCard(index); }} key={key} className={`mini-card-row ${index === activeCard ? 'is-active' : ''}`}><img src={faceDown ? 'assets/vaultforge-card-back.webp' : card.image} alt="" /><div className="min-w-0 flex-1"><strong>{faceDown ? `Carta ${index + 1} sin revelar` : card.name}</strong><span>{faceDown ? `Slot ${index + 1}` : `${card.slot} · ${card.rarity}`}</span></div>{savedCards.has(key) && <Check className="size-3 text-emerald-300" />}</button>; })}</div></div>
      <div className="mt-7 rounded-2xl border border-emerald-300/12 bg-emerald-300/[.035] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><Sparkles className="size-4" /> Siguiente paso</div><p className="mt-2 text-xs leading-relaxed text-stone-400">Añade las cartas una por una en Automatic o guarda todo el sobre.</p><Button onClick={savePack} disabled={saved || packCards.length === 0} variant="outline" className="mt-4 w-full border-emerald-300/20 bg-emerald-300/5 text-emerald-100">{saved ? <><Check />Guardadas</> : `Guardar ${Math.max(0, packCards.length - savedCards.size)} cartas`}</Button>{saved && <button onClick={goBuilder} className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-amber-200">Ir al constructor <ArrowRight className="size-3" /></button>}</div>
    </aside>
  </div>;
}

function CollectionView({ search, setSearch, cards, collection, setCollection, addToDeck, goBuilder }: { search: string; setSearch: (value: string) => void; cards: Card[]; collection: Record<string, number>; setCollection: React.Dispatch<React.SetStateAction<Record<string, number>>>; addToDeck: (card: Card) => void; goBuilder: () => void }) {
  const total = Object.values(collection).reduce((a, b) => a + b, 0);
  const adjust = (name: string, amount: number) => setCollection((current) => ({ ...current, [name]: Math.max(0, (current[name] ?? 0) + amount) }));
  return <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Biblioteca personal</p><h1 className="mt-1 font-display text-4xl font-semibold">Mi colección</h1><p className="mt-2 text-sm text-stone-500">Todas las cartas abiertas, tierras básicas y tokens en un solo lugar.</p></div><Button onClick={goBuilder} className="h-10 bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200"><Layers3 /> Construir un mazo</Button></div>
    <div className="stats-grid mt-7"><Stat value={String(total)} label="Cartas totales" detail="+15 esta semana" /><Stat value="196" label="Cartas únicas" detail="de 14 ediciones" /><Stat value="17" label="Cartas foil" detail="6,4% del total" /><Stat value="7" label="Míticas" detail="3 sin usar" /></div>
    <div className="toolbar mt-7"><div className="search-field"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, tipo o edición…" /><kbd>⌘ K</kbd></div><Button variant="outline" className="border-white/10 bg-white/[.025] text-stone-300"><Filter />Filtros</Button><button className="select-compact">Más recientes <ChevronDown /></button></div>
    <div className="collection-layout mt-5"><aside className="filter-panel"><FilterGroup title="Color" items={['Blanco', 'Azul', 'Negro', 'Rojo', 'Verde', 'Incoloro']} /><FilterGroup title="Tipo" items={['Criatura', 'Instantáneo', 'Conjuro', 'Artefacto', 'Tierra']} /><FilterGroup title="Rareza" items={['Mítica', 'Rara', 'Infrecuente', 'Común']} /></aside><section><div className="mb-3 flex items-center justify-between"><p className="text-xs text-stone-500">Mostrando <strong className="text-stone-300">{cards.length}</strong> cartas del prototipo</p><button className="text-xs text-stone-500"><SlidersHorizontal className="mr-1 inline size-3" />Agrupar por edición</button></div><div className="collection-grid">{cards.map((card) => <article className="collection-card" key={card.name}><div className="card-image-wrap"><img src={card.image} alt={card.name} />{card.foil && <span className="foil-sheen" />}<button onClick={() => addToDeck(card)} className="quick-add" aria-label={`Añadir ${card.name} al mazo`}><CirclePlus /></button><span className={`rarity rarity-${card.rarity.toLowerCase().replace('í','i')}`}>{card.rarity}</span></div><div className="collection-card-info"><strong>{card.name}</strong><span>{card.setName} · {card.set.split(' · ')[1]}</span><div><small>{card.type} · {card.mana}</small><div className="stepper"><button onClick={() => adjust(card.name, -1)}><Minus /></button><b>{collection[card.name] ?? 0}</b><button onClick={() => adjust(card.name, 1)}><Plus /></button></div></div></div></article>)}</div></section></div>
  </div>;
}

function Stat({ value, label, detail }: { value: string; label: string; detail: string }) { return <div className="stat-card"><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>; }
function FilterGroup({ title, items }: { title: string; items: string[] }) { return <div className="filter-group"><p>{title}</p>{items.map((item, index) => <label key={item}><input type="checkbox" defaultChecked={index === 5 && title === 'Color'} /><span>{item}</span><small>{12 + index * 7}</small></label>)}</div>; }

function BuilderView({ search, setSearch, cards, deck, setDeck, deckCount, addToDeck }: { search: string; setSearch: (value: string) => void; cards: Card[]; deck: Record<string, number>; setDeck: React.Dispatch<React.SetStateAction<Record<string, number>>>; deckCount: number; addToDeck: (card: Card) => void }) {
  const deckCards = cards.filter((card) => deck[card.name]);
  const groups = ['Creature', 'Artifact', 'Instant', 'Sorcery', 'Land'];
  const remove = (name: string) => setDeck((current) => { const next = { ...current }; if ((next[name] ?? 0) <= 1) delete next[name]; else next[name] -= 1; return next; });
  return <div className="builder-shell">
    <div className="builder-top"><div><div className="flex items-center gap-2"><Badge className="bg-emerald-300/10 text-emerald-200">COMMANDER</Badge><span className="text-xs text-stone-500">Guardado hace unos segundos</span></div><input className="deck-title" defaultValue="Horror en la espesura" aria-label="Nombre del mazo" /></div><div className="flex items-center gap-2"><button className="select-compact">Commander <ChevronDown /></button><Button variant="outline" className="border-white/10 bg-white/3">Vista <Grid2X2 /></Button><Button className="bg-amber-300 font-bold text-[#17150e] hover:bg-amber-200">Guardar mazo</Button></div></div>
    <div className="builder-grid">
      <aside className="builder-collection"><div className="builder-panel-head"><div><p className="eyebrow">Fuente</p><h2>Tu colección</h2></div><Badge variant="outline" className="border-white/10 text-stone-400">248</Badge></div><div className="search-field compact"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en colección…" /></div><div className="mt-3 flex gap-2"><button className="filter-chip active">Todas</button><button className="filter-chip">Compatibles</button><button className="filter-chip">Sin usar</button></div><div className="builder-source-list">{cards.slice(0, 8).map((card) => <div className="source-card" key={card.name}><img src={card.image} alt="" /><div><strong>{card.name}</strong><span>{card.type} · {card.mana}</span><small>Disponibles: {card.qty}</small></div><button onClick={() => addToDeck(card)}><Plus /></button></div>)}</div></aside>
      <section className="deck-canvas"><div className="deck-summary"><div><span className="deck-count-ring" style={{ '--progress': `${Math.min(deckCount, 100)}%` } as React.CSSProperties}><strong>{deckCount}</strong><small>/ 100</small></span><div><p className="eyebrow">Mazo principal</p><h2>Horror en la espesura</h2><span className="text-xs text-stone-500">{deckCards.length} cartas únicas · Commander casual</span></div></div><div className="mana-pips"><i className="pip pip-u">U</i><i className="pip pip-b">B</i><i className="pip pip-g">G</i></div></div>
        <div className="deck-groups">{groups.map((group) => { const grouped = deckCards.filter((card) => card.type === group); if (!grouped.length) return null; return <div className="deck-group" key={group}><div className="deck-group-title"><span>{group === 'Creature' ? 'Criaturas' : group === 'Artifact' ? 'Artefactos' : group === 'Instant' ? 'Instantáneos' : group === 'Sorcery' ? 'Conjuros' : 'Tierras'}</span><Badge variant="outline" className="border-white/8 text-stone-500">{grouped.reduce((sum, card) => sum + (deck[card.name] ?? 0), 0)}</Badge></div>{grouped.map((card) => <div className="deck-row" key={card.name}><img src={card.image} alt="" /><span className="deck-qty">{deck[card.name]}×</span><div><strong>{card.name}</strong><small>{card.tags.join(' · ')}</small></div><span className="mana-cost">{card.mana}</span><button onClick={() => remove(card.name)} aria-label={`Quitar ${card.name}`}><X /></button></div>)}</div>; })}<button className="empty-slot"><CirclePlus />Añadir una sección</button></div>
      </section>
      <aside className="insights-panel"><div className="builder-panel-head"><div><p className="eyebrow">Asistente</p><h2>Salud del mazo</h2></div><span className="health-score">72</span></div><div className="health-track"><span /></div><p className="mt-2 text-xs text-stone-500">Buena base. Faltan tierras y respuestas para llegar al equilibrio recomendado.</p><div className="recommendations"><Insight icon={<LandPlot />} tone="amber" title="Añade 32–34 tierras" text={`Tienes 1. Para Commander recomendamos 36–38 en total.`} action="Ver tierras" /><Insight icon={<Zap />} tone="green" title="Ramp bien encaminado" text="3 piezas detectadas. Objetivo recomendado: 10–12." action="Ver ramp" /><Insight icon={<ShieldCheck />} tone="blue" title="Falta interacción" text="Solo 1 respuesta. Añade removal y protección." action="Sugerir cartas" /></div><div className="analysis-block"><div className="flex items-center justify-between"><h3>Curva de maná</h3><span>Media 2,8</span></div><div className="mana-chart">{[18, 52, 88, 64, 39, 22, 12].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{index === 6 ? '6+' : index}</small></div>)}</div></div><div className="analysis-block"><h3>Sinergias detectadas</h3><div className="synergy-list"><span>Landfall <b>4</b></span><span>Ramp <b>3</b></span><span>Artefactos <b>2</b></span><span>Robo de cartas <b>2</b></span></div></div><Button variant="outline" className="mt-5 w-full border-amber-300/20 bg-amber-300/5 text-amber-100"><BarChart3 />Análisis completo</Button></aside>
    </div>
  </div>;
}

function Insight({ icon, tone, title, text, action }: { icon: React.ReactNode; tone: string; title: string; text: string; action: string }) { return <div className={`insight insight-${tone}`}><div className="insight-icon">{icon}</div><div><strong>{title}</strong><p>{text}</p><button>{action} <ArrowRight /></button></div></div>; }
