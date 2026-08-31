import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';

type IncomingCard = {
  name: string;
  set: string;
  foil: boolean;
  image: string;
  type: string;
  mana: string;
  rarity: string;
};

async function ensureCollectionSchema() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS collection_cards (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      card_name TEXT NOT NULL,
      set_code TEXT NOT NULL,
      collector_number TEXT NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL,
      foil INTEGER DEFAULT 0 NOT NULL,
      image_url TEXT NOT NULL,
      type_line TEXT NOT NULL,
      mana_cost TEXT NOT NULL,
      rarity TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    env.DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS collection_user_card_printing_idx ON collection_cards (user_id, card_name, set_code, foil)'),
  ]);
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'authentication_required' }, { status: 401 });
  await ensureCollectionSchema();

  const result = await env.DB.prepare(
    'SELECT card_name AS name, SUM(quantity) AS quantity FROM collection_cards WHERE user_id = ? GROUP BY card_name',
  ).bind(user.userId).all();

  return Response.json({ cards: result.results });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'authentication_required' }, { status: 401 });
  await ensureCollectionSchema();

  const body = await request.json() as { cards?: IncomingCard[] };
  if (!Array.isArray(body.cards) || body.cards.length === 0 || body.cards.length > 36) {
    return Response.json({ error: 'invalid_cards' }, { status: 400 });
  }

  const statements = body.cards.map((card) => {
    const [setCode = 'UNK', collectorNumber = '0'] = card.set.split(' · ');
    const id = `${user.userId}:${card.name}:${setCode}:${card.foil ? 'foil' : 'regular'}`;
    return env.DB.prepare(
      `INSERT INTO collection_cards
        (id, user_id, card_name, set_code, collector_number, quantity, foil, image_url, type_line, mana_cost, rarity, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, card_name, set_code, foil)
       DO UPDATE SET quantity = quantity + 1`,
    ).bind(id, user.userId, card.name, setCode, collectorNumber, card.foil ? 1 : 0, card.image, card.type, card.mana, card.rarity, Date.now());
  });

  await env.DB.batch(statements);
  return Response.json({ ok: true, added: body.cards.length });
}
