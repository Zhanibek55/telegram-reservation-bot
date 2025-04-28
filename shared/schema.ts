import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegram_id: varchar("telegram_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  telegram_id: true,
  name: true,
  phone: true,
  is_admin: true,
});

// Table (billiard table) table
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, busy, inactive
});

export const insertTableSchema = createInsertSchema(tables).pick({
  number: true,
  status: true,
});

// Reservation table
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  table_id: integer("table_id").notNull().references(() => tables.id),
  date: varchar("date", { length: 10 }).notNull(), // Format: YYYY-MM-DD
  start_time: varchar("start_time", { length: 5 }).notNull(), // Format: HH:MM
  end_time: varchar("end_time", { length: 5 }).notNull(), // Format: HH:MM
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, cancelled
  comment: text("comment"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  user_id: true,
  table_id: true,
  date: true,
  start_time: true,
  end_time: true,
  status: true,
  comment: true,
});

// Club settings table
export const clubSettings = pgTable("club_settings", {
  id: serial("id").primaryKey(),
  opening_time: varchar("opening_time", { length: 5 }).notNull().default("15:00"), // Format: HH:MM
  closing_time: varchar("closing_time", { length: 5 }).notNull().default("00:00"), // Format: HH:MM
  slot_duration: integer("slot_duration").notNull().default(2), // in hours
  club_name: varchar("club_name", { length: 255 }).notNull().default("Бильярдный клуб"),
});

export const insertClubSettingsSchema = createInsertSchema(clubSettings).pick({
  opening_time: true,
  closing_time: true,
  slot_duration: true,
  club_name: true,
});

// Types exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type ClubSettings = typeof clubSettings.$inferSelect;
export type InsertClubSettings = z.infer<typeof insertClubSettingsSchema>;
