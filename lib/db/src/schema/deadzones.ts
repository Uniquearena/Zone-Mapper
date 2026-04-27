import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const deadzonesTable = pgTable("deadzones", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  carrier: text("carrier").notNull(),
  reporter: text("reporter").notNull(),
  address: text("address"),
  confirmations: integer("confirmations").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Deadzone = typeof deadzonesTable.$inferSelect;
export type InsertDeadzone = typeof deadzonesTable.$inferInsert;
