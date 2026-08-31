import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const collectionCards = sqliteTable('collection_cards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cardName: text('card_name').notNull(),
  setCode: text('set_code').notNull(),
  collectorNumber: text('collector_number').notNull(),
  quantity: integer('quantity').notNull().default(1),
  foil: integer('foil', { mode: 'boolean' }).notNull().default(false),
  imageUrl: text('image_url').notNull(),
  typeLine: text('type_line').notNull(),
  manaCost: text('mana_cost').notNull(),
  rarity: text('rarity').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => [uniqueIndex('collection_user_card_printing_idx').on(table.userId, table.cardName, table.setCode, table.foil)]);

export const decks = sqliteTable('decks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  format: text('format').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const deckCards = sqliteTable('deck_cards', {
  id: text('id').primaryKey(),
  deckId: text('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  cardName: text('card_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  section: text('section').notNull().default('mainboard'),
}, (table) => [uniqueIndex('deck_card_section_idx').on(table.deckId, table.cardName, table.section)]);
