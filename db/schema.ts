import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  bio: text("bio").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  portfolio: text("portfolio").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  open: integer("open").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const works = sqliteTable("works", {
  id: text("id").primaryKey(),
  artistId: text("artist_id").notNull().references(() => artists.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  tags: text("tags").notNull().default(""),
  imageKey: text("image_key").notNull(),
  mimeType: text("mime_type").notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("works_artist_idx").on(table.artistId), index("works_created_idx").on(table.createdAt)]);
