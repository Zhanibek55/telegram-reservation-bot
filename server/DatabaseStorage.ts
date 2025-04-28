import { db } from './db';
import { IStorage } from './storage';
import {
  users, 
  tables, 
  reservations, 
  clubSettings, 
  type User, 
  type Table, 
  type Reservation, 
  type ClubSettings,
  type InsertUser,
  type InsertTable,
  type InsertReservation,
  type InsertClubSettings
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Table operations
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables);
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table || undefined;
  }

  async createTable(tableData: InsertTable): Promise<Table> {
    const [table] = await db
      .insert(tables)
      .values(tableData)
      .returning();
    return table;
  }

  async updateTable(id: number, tableData: Partial<InsertTable>): Promise<Table | undefined> {
    const [table] = await db
      .update(tables)
      .set(tableData)
      .where(eq(tables.id, id))
      .returning();
    return table || undefined;
  }

  async deleteTable(id: number): Promise<boolean> {
    const [deletedTable] = await db
      .delete(tables)
      .where(eq(tables.id, id))
      .returning();
    return !!deletedTable;
  }

  // Reservation operations
  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.user_id, userId));
  }

  async getReservationsByTable(tableId: number): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.table_id, tableId));
  }

  async getReservationsByDate(date: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.date, date));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    const [reservation] = await db
      .insert(reservations)
      .values({
        ...reservationData,
        created_at: new Date()
      })
      .returning();
    return reservation;
  }

  async updateReservation(id: number, reservationData: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const [reservation] = await db
      .update(reservations)
      .set(reservationData)
      .where(eq(reservations.id, id))
      .returning();
    return reservation || undefined;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const [deletedReservation] = await db
      .delete(reservations)
      .where(eq(reservations.id, id))
      .returning();
    return !!deletedReservation;
  }

  // Club settings operations
  async getClubSettings(): Promise<ClubSettings> {
    const [settings] = await db.select().from(clubSettings);
    if (!settings) {
      // Create default settings if none exist
      return this.updateClubSettings({
        opening_time: "15:00",
        closing_time: "00:00",
        slot_duration: 2,
        club_name: "Бильярдный клуб"
      });
    }
    return settings;
  }

  async updateClubSettings(settingsData: Partial<InsertClubSettings>): Promise<ClubSettings> {
    // Try to update existing settings
    const [existingSettings] = await db.select().from(clubSettings);
    
    if (existingSettings) {
      const [settings] = await db
        .update(clubSettings)
        .set(settingsData)
        .where(eq(clubSettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      // Create new settings if none exist
      const [settings] = await db
        .insert(clubSettings)
        .values({
          ...settingsData as InsertClubSettings, // Type assertion since we know all fields are provided
          id: 1
        })
        .returning();
      return settings;
    }
  }
}