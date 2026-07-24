import { pgTable, serial, text, boolean, timestamp, integer, real, primaryKey } from "drizzle-orm/pg-core";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const avatarsTable = pgTable("avatars", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .references(() => playersTable.id)
    .notNull()
    .unique(),
  skinColor: text("skin_color").notNull(),
  hairColor: text("hair_color").notNull(),
  hairStyle: text("hair_style").notNull(),
  shirtColor: text("shirt_color").notNull(),
  pantsColor: text("pants_color").notNull(),
  hatStyle: text("hat_style"),
  accessory: text("accessory"),
});

export const playerPositionsTable = pgTable("player_positions", {
  playerId: integer("player_id")
    .primaryKey()
    .references(() => playersTable.id),
  posX: real("pos_x").default(5).notNull(),
  posY: real("pos_y").default(5).notNull(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .references(() => playersTable.id)
    .notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
