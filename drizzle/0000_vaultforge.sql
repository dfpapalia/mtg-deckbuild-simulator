CREATE TABLE `collection_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_name` text NOT NULL,
	`set_code` text NOT NULL,
	`collector_number` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`foil` integer DEFAULT false NOT NULL,
	`image_url` text NOT NULL,
	`type_line` text NOT NULL,
	`mana_cost` text NOT NULL,
	`rarity` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_user_card_printing_idx` ON `collection_cards` (`user_id`,`card_name`,`set_code`,`foil`);
--> statement-breakpoint
CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`format` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deck_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`deck_id` text NOT NULL,
	`card_name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`section` text DEFAULT 'mainboard' NOT NULL,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deck_card_section_idx` ON `deck_cards` (`deck_id`,`card_name`,`section`);
