export type ProteinProxyCategory = 'commander' | 'creature' | 'artifact' | 'enchantment' | 'instant' | 'sorcery' | 'land';

export type ProteinProxySeed = {
  original: string;
  proxy: string;
  category: ProteinProxyCategory;
  quantity?: number;
  spirit?: boolean;
  flavor: string;
};

const gymBro = 'La historia se escribe con leche, disciplina y una serie más.';
const recovery = 'Los músculos desaparecen. Las ganancias ancestrales permanecen.';
const study = 'El verdadero conocimiento comienza después del calentamiento.';
const protein = 'Ninguna excavación está completa sin proteína post-entreno.';
const spot = 'Si puedes invocarlo, puedes spottearlo.';

export const proteinProxyDeck: ProteinProxySeed[] = [
  { original: 'Quintorius, History Chaser', proxy: 'Quintorius, el Proteínico', category: 'commander', flavor: gymBro },

  { original: 'Angel of Indemnity', proxy: 'Ángel de la Repetición Pendiente', category: 'creature', flavor: recovery },
  { original: 'Anger', proxy: 'Rabia de Preentreno', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Ao, the Dawn Sky', proxy: 'Ao, el Spotter del Alba', category: 'creature', spirit: true, flavor: spot },
  { original: 'Atsushi, the Blazing Sky', proxy: 'Atsushi, Cardio Abrasador', category: 'creature', spirit: true, flavor: recovery },
  { original: 'Augusta, Order Returned', proxy: 'Augusta, Rutina Recuperada', category: 'creature', flavor: study },
  { original: 'Balefire Liege', proxy: 'Soberano del Press Ardiente', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Claim Jumper', proxy: 'Saltador de Máquina Ocupada', category: 'creature', flavor: protein },
  { original: 'Conspiracy Theorist', proxy: 'Teórico de la Ventana Anabólica', category: 'creature', flavor: study },
  { original: 'Containment Construct', proxy: 'Máquina de Aislamiento Muscular', category: 'creature', flavor: protein },
  { original: 'Drumbellower', proxy: 'Campanero de la Última Serie', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Excava, the Risen Past', proxy: 'Excava, Ganancias Resucitadas', category: 'creature', spirit: true, flavor: recovery },
  { original: 'Guardian of Faith', proxy: 'Guardián de la Fe en el Progreso', category: 'creature', spirit: true, flavor: spot },
  { original: 'Guardian Scalelord', proxy: 'Señor Escamado del Volumen', category: 'creature', flavor: protein },
  { original: 'Hofri Ghostforge', proxy: 'Hofri, Forjador de GymBros', category: 'creature', flavor: gymBro },
  { original: 'Kami of Ancient Law', proxy: 'Kami de la Técnica Ancestral', category: 'creature', spirit: true, flavor: study },
  { original: 'Karmic Guide', proxy: 'Guía Kármica del Entreno', category: 'creature', spirit: true, flavor: spot },
  { original: 'Kirol, History Buff // Pack a Punch', proxy: 'Kirol, Historiador Mamado // Puñetazo Proteico', category: 'creature', flavor: gymBro },
  { original: 'Laelia, the Blade Reforged', proxy: 'Laelia, Físico Reforjado', category: 'creature', spirit: true, flavor: recovery },
  { original: 'Lorehold Archivist // Restore Relic', proxy: 'Archivista del Volumen // Restaurar Mancuerna', category: 'creature', flavor: study },
  { original: 'Millikin', proxy: 'Molinillo de Avena Arcano', category: 'creature', flavor: protein },
  { original: 'Moonshaker Cavalry', proxy: 'Caballería Rompelunas', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Naktamun Lorespinner // Wheel of Fortune', proxy: 'Cronista de Naktamun // Rueda de Rutinas', category: 'creature', flavor: study },
  { original: 'Quintorius, Field Historian', proxy: 'Quintorius, Historiador del Hierro', category: 'creature', flavor: protein },
  { original: 'Quintorius, Loremaster', proxy: 'Quintorius, Maestro del Volumen', category: 'creature', flavor: study },
  { original: 'Relic Retriever', proxy: 'Recuperador de Discos Perdidos', category: 'creature', flavor: recovery },
  { original: 'Remorseful Cleric', proxy: 'Clérigo del Cheat Meal Arrepentido', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Selfless Spirit', proxy: 'GymBro (Spirit) sin Ego', category: 'creature', spirit: true, flavor: spot },
  { original: 'Serra Paragon', proxy: 'Paragón de la Proteína Limpia', category: 'creature', flavor: protein },
  { original: 'Skyclave Apparition', proxy: 'Aparición del Gimnasio Celeste', category: 'creature', spirit: true, flavor: recovery },
  { original: 'Spirit of Resilience', proxy: 'GymBro (Spirit) de la Resiliencia', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Squee, Goblin Nabob', proxy: 'Squee, Socio que Nunca se Rinde', category: 'creature', flavor: spot },
  { original: 'Sun Titan', proxy: 'Titán del Sol y la Proteína', category: 'creature', flavor: protein },
  { original: "Teshar, Ancestor's Apostle", proxy: 'Teshar, Apóstol de la Sobrecarga', category: 'creature', flavor: study },
  { original: 'Vanguard of the Restless', proxy: 'Vanguardia de los que Nunca Descansan', category: 'creature', spirit: true, flavor: gymBro },
  { original: 'Venerable Warsinger', proxy: 'Cantora Venerable del Récord Personal', category: 'creature', spirit: true, flavor: recovery },
  { original: 'White Orchid Phantom', proxy: 'Fantasma de la Orquídea Whey', category: 'creature', spirit: true, flavor: spot },

  { original: 'Arcane Signet', proxy: 'Sello Proteína+', category: 'artifact', flavor: protein },
  { original: "Archaeomancer's Map", proxy: 'Mapa de Gimnasios Arqueománticos', category: 'artifact', flavor: study },
  { original: "Bitterthorn, Nissa's Animus", proxy: 'Bitterthorn, Barra de Peso Muerto', category: 'artifact', flavor: gymBro },
  { original: 'Currency Converter', proxy: 'Conversor de Macros', category: 'artifact', flavor: protein },
  { original: 'Fellwar Stone', proxy: 'Piedra de Magnesio Fellwar', category: 'artifact', flavor: study },
  { original: 'Mind Stone', proxy: 'Piedra de Concentración', category: 'artifact', flavor: study },
  { original: 'Patchwork Banner', proxy: 'Estandarte de Series Completadas', category: 'artifact', flavor: gymBro },
  { original: 'Perpetual Timepiece', proxy: 'Cronómetro de Descanso Perpetuo', category: 'artifact', flavor: recovery },
  { original: 'Sol Ring', proxy: 'Anillo de la Serie Solar', category: 'artifact', flavor: protein },
  { original: 'Staff of the Storyteller', proxy: 'Bastón del Entrenador de Historias', category: 'artifact', flavor: study },

  { original: 'Advanced Reconstruction', proxy: 'Reconstrucción Muscular Avanzada', category: 'enchantment', flavor: recovery },
  { original: 'Monologue Tax', proxy: 'Impuesto al Monólogo del GymBro', category: 'enchantment', flavor: gymBro },
  { original: 'Primary Research', proxy: 'Investigación Primaria de Macros', category: 'enchantment', flavor: study },
  { original: "Tocasia's Welcome", proxy: 'Bienvenida al Gym de Tocasia', category: 'enchantment', flavor: spot },

  { original: 'Lorehold Charm', proxy: 'Encanto Proteico de Lorehold', category: 'instant', flavor: protein },
  { original: 'Path to Exile', proxy: 'Camino al Día de Descanso', category: 'instant', flavor: recovery },
  { original: 'Swords to Plowshares', proxy: 'Espadas por Barras Olímpicas', category: 'instant', flavor: gymBro },

  { original: 'Ceaseless Conflict', proxy: 'Serie sin Descanso', category: 'sorcery', flavor: gymBro },
  { original: 'Faithless Looting', proxy: 'Saqueo sin Rutina', category: 'sorcery', flavor: study },
  { original: 'Fateful Tempest', proxy: 'Tormenta de Leche Predestinada', category: 'sorcery', flavor: protein },
  { original: 'Rip Apart', proxy: 'Romper Fibras', category: 'sorcery', flavor: recovery },
  { original: 'Secret Rendezvous', proxy: 'Batido Secreto Postentreno', category: 'sorcery', flavor: protein },
  { original: 'Seize the Spoils', proxy: 'Apropiarse de las Ganancias', category: 'sorcery', flavor: gymBro },
  { original: "Sevinne's Reclamation", proxy: 'Recuperación Activa de Sevinne', category: 'sorcery', flavor: recovery },
  { original: 'Tragic Arrogance', proxy: 'Ego Lifting Trágico', category: 'sorcery', flavor: spot },
  { original: 'Wave of Reckoning', proxy: 'Oleada de Repeticiones', category: 'sorcery', flavor: gymBro },

  { original: 'Battlefield Forge', proxy: 'Forja del Campo de Entrenamiento', category: 'land', flavor: gymBro },
  { original: 'Clifftop Retreat', proxy: 'Retiro de Recuperación en la Cima', category: 'land', flavor: recovery },
  { original: 'Command Tower', proxy: 'Torre del Entrenador', category: 'land', flavor: spot },
  { original: 'Emeria, the Sky Ruin', proxy: 'Emeria, Ruina del Gym Celeste', category: 'land', flavor: study },
  { original: 'Exotic Orchard', proxy: 'Huerto de Batidos Exóticos', category: 'land', flavor: protein },
  { original: 'Fabled Passage', proxy: 'Pasillo del Récord Legendario', category: 'land', flavor: gymBro },
  { original: 'Fields of Strife', proxy: 'Campos de Sobrecarga Progresiva', category: 'land', flavor: spot },
  { original: 'Furycalm Snarl', proxy: 'Gimnasio Furia-Calma', category: 'land', flavor: recovery },
  { original: 'Glittering Massif', proxy: 'Macizo de Magnesio Brillante', category: 'land', flavor: study },
  { original: 'Lorehold Campus', proxy: 'Campus Lorehold Fitness', category: 'land', flavor: gymBro },
  { original: 'Lotus Field', proxy: 'Campo de Loto Proteico', category: 'land', flavor: protein },
  { original: 'Mistveil Plains', proxy: 'Llanuras del Velo de Leche', category: 'land', flavor: protein },
  { original: 'Mountain', proxy: 'Montaña de Proteína', category: 'land', quantity: 6, flavor: gymBro },
  { original: 'Plains', proxy: 'Llanura Desnatada', category: 'land', quantity: 11, flavor: protein },
  { original: 'Radiant Summit', proxy: 'Cumbre del Récord Radiante', category: 'land', flavor: gymBro },
  { original: 'Rugged Prairie', proxy: 'Pradera de Pesas Rústicas', category: 'land', flavor: study },
  { original: 'Sacred Peaks', proxy: 'Picos del Whey Sagrado', category: 'land', flavor: protein },
  { original: 'Study Hall', proxy: 'Aula de Anatomía Aplicada', category: 'land', flavor: study },
  { original: 'Sunscorched Divide', proxy: 'Divisoria del Cardio Solar', category: 'land', flavor: recovery },
  { original: 'Temple of Triumph', proxy: 'Templo del Récord Personal', category: 'land', flavor: gymBro },
  { original: 'Terramorphic Expanse', proxy: 'Expansión del Gimnasio Terramórfico', category: 'land', flavor: spot },
  { original: 'Turbulent Steppe', proxy: 'Estepa del Batido Agitado', category: 'land', flavor: protein },
];

export type ProteinProxyMetadata = {
  original: string;
  mana: string;
  type: string;
  oracleText: string;
  color: string;
  colors: string[];
  types: string[];
  subtypes: string[];
  supertypes: string[];
  manaValue: number;
  power?: string;
  toughness?: string;
  keywords: string[];
};

const gymBroText = (value = '') => value.replace(/Spirits/g, 'GymBros (Spirits)').replace(/Spirit/g, 'GymBro (Spirit)');

export async function loadProteinProxyMetadata(): Promise<Map<string, ProteinProxyMetadata>> {
  const chunks: ProteinProxySeed[][] = [];
  for (let index = 0; index < proteinProxyDeck.length; index += 75) chunks.push(proteinProxyDeck.slice(index, index + 75));
  const payloads = await Promise.all(chunks.map(async (chunk) => {
    const response = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifiers: chunk.map((seed) => ({ name: seed.original })) }),
    });
    if (!response.ok) throw new Error('No se pudieron cargar los metadatos del mazo proxy.');
    return response.json() as Promise<{ data: Array<{ name: string; mana_cost?: string; type_line: string; oracle_text?: string; colors?: string[]; color_identity?: string[]; cmc?: number; power?: string; toughness?: string; keywords?: string[]; card_faces?: Array<{ name: string; mana_cost?: string; type_line?: string; oracle_text?: string }> }> }>;
  }));
  const result = new Map<string, ProteinProxyMetadata>();
  payloads.flatMap((payload) => payload.data).forEach((card) => {
    const faces = card.card_faces ?? [];
    const typeLine = gymBroText(card.type_line || faces.map((face) => face.type_line).filter(Boolean).join(' // '));
    const oracleText = gymBroText(card.oracle_text || faces.map((face) => face.oracle_text).filter(Boolean).join('\n//\n'));
    const beforeDash = typeLine.split(/\s+[—-]\s+/)[0];
    const afterDash = typeLine.split(/\s+[—-]\s+/)[1];
    result.set(card.name, {
      original: card.name,
      mana: card.mana_cost || faces.map((face) => face.mana_cost).filter(Boolean).join(' // ') || '—',
      type: typeLine,
      oracleText,
      color: (card.colors?.length ? card.colors : card.color_identity ?? []).join('') || 'C',
      colors: card.colors ?? card.color_identity ?? [],
      types: ['Creature', 'Artifact', 'Enchantment', 'Instant', 'Sorcery', 'Planeswalker', 'Land', 'Battle', 'Kindred'].filter((type) => new RegExp(`\\b${type}\\b`, 'i').test(beforeDash)),
      subtypes: afterDash ? afterDash.split(/\s+/).filter(Boolean) : [],
      supertypes: /\bLegendary\b/i.test(beforeDash) ? ['Legendary'] : [],
      manaValue: card.cmc ?? 0,
      power: card.power,
      toughness: card.toughness,
      keywords: card.keywords ?? [],
    });
  });
  return result;
}
