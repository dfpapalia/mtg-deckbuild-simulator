'use client';

import { useMemo, useState } from 'react';
import {
  Archive, ArrowRight, BarChart3, Boxes, Check, ChevronDown, CirclePlus, Filter, Grid2X2,
  LandPlot, Layers3, Library, Minus, PackageOpen, Plus, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, UserRound, WandSparkles, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AppView = 'packs' | 'collection' | 'builder';
type ViewMode = 'automatic' | 'stack' | 'grid';
type Card = { name: string; rarity: string; slot: string; set: string; setName: string; image: string; foil: boolean; type: string; mana: string; color: string; tags: string[]; qty: number };

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

const openingCards = cards.slice(0, 5);

export function PackStudio({ userName, signInPath = '/signin-with-chatgpt?return_to=%2F' }: { userName?: string | null; signInPath?: string }) {
  const [view, setView] = useState<AppView>('packs');
  const [viewMode, setViewMode] = useState<ViewMode>('stack');
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(12);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState(() => Object.fromEntries(cards.map((card) => [card.name, card.qty])));
  const [deck, setDeck] = useState<Record<string, number>>({ 'Overlord of the Hauntwoods': 1, 'Sol Ring': 1, 'Arcane Signet': 1, Cultivate: 1, 'Command Tower': 1, 'Beast Within': 1 });
  const [notice, setNotice] = useState<string | null>(null);

  const filteredCards = useMemo(() => cards.filter((card) => `${card.name} ${card.setName} ${card.type}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const deckCount = Object.values(deck).reduce((sum, qty) => sum + qty, 0);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 2200); }
  function openPack() { setOpening(true); setSaved(false); window.setTimeout(() => { setOpened((value) => value + 1); setOpening(false); }, 650); }
  async function savePack() {
    const packCards = Array.from({ length: 15 }, (_, index) => openingCards[index % openingCards.length]);
    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cards: packCards }),
      });
      if (response.status === 401) { flash('Inicia sesión para guardar tu colección'); return; }
      if (!response.ok) throw new Error('save_failed');
    } catch {
      flash('No se pudo sincronizar; inténtalo de nuevo');
      return;
    }
    setCollection((current) => { const next = { ...current }; openingCards.forEach((card) => { next[card.name] = (next[card.name] ?? 0) + 1; }); return next; });
    setSaved(true); flash('15 cartas añadidas a tu colección');
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

      {view === 'packs' && <PackView viewMode={viewMode} setViewMode={setViewMode} opening={opening} opened={opened} openPack={openPack} saved={saved} savePack={savePack} goBuilder={() => setView('builder')} />}
      {view === 'collection' && <CollectionView search={search} setSearch={setSearch} cards={filteredCards} collection={collection} setCollection={setCollection} addToDeck={addToDeck} goBuilder={() => setView('builder')} />}
      {view === 'builder' && <BuilderView search={search} setSearch={setSearch} cards={filteredCards} deck={deck} setDeck={setDeck} deckCount={deckCount} addToDeck={addToDeck} />}

      {notice && <div className="toast-notice"><Check />{notice}</div>}
    </main>
  );
}

function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button className={`nav-link ${active ? 'nav-link-active' : ''}`} onClick={onClick}>{icon}{children}</button>;
}

function PackView({ viewMode, setViewMode, opening, opened, openPack, saved, savePack, goBuilder }: { viewMode: ViewMode; setViewMode: (mode: ViewMode) => void; opening: boolean; opened: number; openPack: () => void; saved: boolean; savePack: () => void | Promise<void>; goBuilder: () => void }) {
  return <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
    <aside className="border-white/8 p-5 xl:min-h-[calc(100vh-64px)] xl:border-r xl:p-6">
      <div className="mb-6 flex items-start justify-between"><div><p className="eyebrow">Simulador</p><h1 className="mt-1 font-display text-2xl font-semibold">Abrir producto</h1></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300">ODDS REALES</span></div>
      <div className="space-y-5">
        <label className="control-label">Edición<button className="select-like" type="button"><span><strong>Duskmourn</strong><small>House of Horror · DSK</small></span><ChevronDown /></button></label>
        <label className="control-label">Producto<button className="select-like" type="button"><span><strong>Collector Booster</strong><small>15 cartas · 5 foil</small></span><ChevronDown /></button></label>
        <label className="control-label">Cantidad<div className="grid grid-cols-2 gap-2"><button className="quantity-active" type="button"><PackageOpen />1 sobre</button><button className="quantity-button" type="button"><Boxes />Caja · 12</button></div></label>
      </div>
      <Button onClick={openPack} disabled={opening} className="mt-7 h-12 w-full bg-amber-300 text-sm font-bold text-[#17150e] shadow-[0_12px_30px_-12px_rgba(252,211,77,.75)] hover:bg-amber-200"><Sparkles />{opening ? 'Abriendo…' : 'Abrir collector booster'}</Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">La colación replica el orden y las probabilidades del producto físico.</p>
      <div className="mt-8 border-t border-white/7 pt-5"><p className="eyebrow">Historial reciente</p>{['DSK · Collector', 'WOE · Draft', 'MH3 · Play'].map((item, index) => <button key={item} className="history-row"><span>{item}</span><small>hace {index * 4 + 2} min</small></button>)}</div>
    </aside>

    <section className="min-w-0 border-y border-white/8 px-4 py-6 sm:px-8 xl:border-y-0 xl:py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Apertura #{opened}</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">Collector Booster · Duskmourn</h2><p className="mt-1 text-sm text-stone-500">15 cartas · orden de impresión conservado</p></div><div className="view-switcher" aria-label="Modo de visualización"><button onClick={() => setViewMode('automatic')} data-active={viewMode === 'automatic'}><WandSparkles />Automatic</button><button onClick={() => setViewMode('stack')} data-active={viewMode === 'stack'}><Layers3 />Card stack</button><button onClick={() => setViewMode('grid')} data-active={viewMode === 'grid'}><Grid2X2 />Card grid</button></div></div>
      <div className={`pack-stage pack-stage-${viewMode} ${opening ? 'is-opening' : ''}`}><div className="stage-glow" /><div className="cards-shell">{openingCards.map((card, index) => <article className={`mtg-card ${card.foil ? 'is-foil' : ''}`} key={card.name} style={{ '--card-index': index } as React.CSSProperties}><img src={card.image} alt={card.name} />{card.foil && <span className="foil-sheen" aria-hidden="true" />}</article>)}</div><div className="stage-caption"><div><span className="rarity-gem" /><strong>{openingCards[0].name}</strong></div><span>{openingCards[0].slot} · {openingCards[0].set}</span></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500"><p><strong className="text-stone-300">5 de 15</strong> cartas destacadas · el prototipo conserva los 15 slots</p><p>Arrastra o usa las flechas para explorar el stack</p></div>
    </section>

    <aside className="p-5 xl:min-h-[calc(100vh-64px)] xl:border-l xl:border-white/8 xl:p-6">
      <div className="flex items-center justify-between"><div><p className="eyebrow">Tu cuenta</p><h2 className="mt-1 font-display text-xl font-semibold">Colección</h2></div><Archive className="size-5 text-stone-500" /></div>
      <div className="mt-5 rounded-2xl border border-white/8 bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-sm text-stone-400">Cartas guardadas</span><strong className="font-display text-2xl">{saved ? 263 : 248}</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/6"><span className="block h-full w-[68%] rounded-full bg-amber-300" /></div><div className="mt-2 flex justify-between text-[11px] text-stone-500"><span>{saved ? 201 : 196} únicas</span><span>{saved ? 17 : 12} foil</span></div></div>
      <div className="mt-6 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Contenido del sobre</h3><span className="text-xs text-stone-500">15 slots</span></div>{openingCards.slice(0, 3).map((card, index) => <div key={card.name} className="mini-card-row"><img src={card.image} alt="" /><div className="min-w-0 flex-1"><strong>{card.name}</strong><span>{card.rarity} · {card.set}</span></div><span className="quantity-pill">+{index === 2 ? 2 : 1}</span></div>)}</div>
      <div className="mt-7 rounded-2xl border border-emerald-300/12 bg-emerald-300/[.035] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><Sparkles className="size-4" /> Siguiente paso</div><p className="mt-2 text-xs leading-relaxed text-stone-400">Guarda este sobre y empieza un mazo Commander con las cartas compatibles.</p><Button onClick={savePack} disabled={saved} variant="outline" className="mt-4 w-full border-emerald-300/20 bg-emerald-300/5 text-emerald-100">{saved ? <><Check />Guardadas</> : 'Guardar 15 cartas'}</Button>{saved && <button onClick={goBuilder} className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-amber-200">Ir al constructor <ArrowRight className="size-3" /></button>}</div>
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
