import { 
  users, type User, type InsertUser,
  tables, type Table, type InsertTable,
  reservations, type Reservation, type InsertReservation,
  clubSettings, type ClubSettings, type InsertClubSettings
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Table operations
  getTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;
  
  // Reservation operations
  getReservations(): Promise<Reservation[]>;
  getReservationsByUser(userId: number): Promise<Reservation[]>;
  getReservationsByTable(tableId: number): Promise<Reservation[]>;
  getReservationsByDate(date: string): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  
  // Club settings operations
  getClubSettings(): Promise<ClubSettings>;
  updateClubSettings(settings: Partial<InsertClubSettings>): Promise<ClubSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tables: Map<number, Table>;
  private reservations: Map<number, Reservation>;
  private clubSettings: ClubSettings;
  
  private userId: number;
  private tableId: number;
  private reservationId: number;
  
  constructor() {
    this.users = new Map();
    this.tables = new Map();
    this.reservations = new Map();
    
    this.userId = 1;
    this.tableId = 1;
    this.reservationId = 1;
    
    // Initialize with default club settings
    this.clubSettings = {
      id: 1,
      opening_time: "15:00",
      closing_time: "00:00",
      slot_duration: 2,
      club_name: "Бильярдный клуб"
    };
    
    // Initialize with 9 tables according to reference layout
    this.createTable({ number: 1, status: "available" });
    this.createTable({ number: 2, status: "available" });
    this.createTable({ number: 3, status: "available" });
    this.createTable({ number: 4, status: "available" });
    this.createTable({ number: 5, status: "available" });
    this.createTable({ number: 6, status: "available" });
    this.createTable({ number: 7, status: "available" });
    this.createTable({ number: 8, status: "available" });
    this.createTable({ number: 9, status: "available" });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.telegram_id === telegramId);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      is_admin: insertUser.is_admin ?? false 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Table operations
  async getTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }
  
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }
  
  async createTable(tableData: InsertTable): Promise<Table> {
    const id = this.tableId++;
    const table: Table = { 
      ...tableData, 
      id,
      status: tableData.status || "available"
    };
    this.tables.set(id, table);
    return table;
  }
  
  async updateTable(id: number, tableData: Partial<InsertTable>): Promise<Table | undefined> {
    const table = this.tables.get(id);
    if (!table) return undefined;
    
    const updatedTable = { ...table, ...tableData };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }
  
  async deleteTable(id: number): Promise<boolean> {
    return this.tables.delete(id);
  }
  
  // Reservation operations
  async getReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }
  
  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      reservation => reservation.user_id === userId
    );
  }
  
  async getReservationsByTable(tableId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      reservation => reservation.table_id === tableId
    );
  }
  
  async getReservationsByDate(date: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      reservation => reservation.date === date
    );
  }
  
  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }
  
  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    const id = this.reservationId++;
    const created_at = new Date();
    const reservation: Reservation = { 
      ...reservationData, 
      id, 
      created_at,
      status: reservationData.status || "active",
      comment: reservationData.comment || null
    };
    this.reservations.set(id, reservation);
    return reservation;
  }
  
  async updateReservation(id: number, reservationData: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id);
    if (!reservation) return undefined;
    
    const updatedReservation = { ...reservation, ...reservationData };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }
  
  async deleteReservation(id: number): Promise<boolean> {
    return this.reservations.delete(id);
  }
  
  // Club settings operations
  async getClubSettings(): Promise<ClubSettings> {
    return this.clubSettings;
  }
  
  async updateClubSettings(settings: Partial<InsertClubSettings>): Promise<ClubSettings> {
    this.clubSettings = { ...this.clubSettings, ...settings };
    return this.clubSettings;
  }
}

// Import the DatabaseStorage
import { DatabaseStorage } from './DatabaseStorage';

// Use DatabaseStorage for persistent storage
export const storage = new DatabaseStorage();
