import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertTableSchema,
  insertReservationSchema,
  insertClubSettingsSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function to format validation errors
function handleZodError(err: ZodError, res: Response) {
  const validationError = fromZodError(err);
  return res.status(400).json({ 
    message: validationError.message,
    errors: err.errors 
  });
}

// Check if user is admin
async function isAdmin(telegramId: string): Promise<boolean> {
  const user = await storage.getUserByTelegramId(telegramId);
  return user?.is_admin || false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByTelegramId(userData.telegram_id);
      if (existingUser) {
        return res.status(200).json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/me", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) {
        return res.status(401).json({ message: "Unauthorized: Telegram ID not provided" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Table routes
  app.get("/api/tables", async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.status(200).json(tables);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/tables", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId || !(await isAdmin(telegramId))) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const tableData = insertTableSchema.parse(req.body);
      const table = await storage.createTable(tableData);
      res.status(201).json(table);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/tables/:id", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId || !(await isAdmin(telegramId))) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid table ID" });
      }
      
      const tableData = insertTableSchema.partial().parse(req.body);
      const table = await storage.updateTable(id, tableData);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.status(200).json(table);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/tables/:id", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId || !(await isAdmin(telegramId))) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid table ID" });
      }
      
      const success = await storage.deleteTable(id);
      if (!success) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Reservation routes
  app.get("/api/reservations", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) {
        return res.status(401).json({ message: "Unauthorized: Telegram ID not provided" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Admins can see all reservations, users can only see their own
      let reservations;
      if (user.is_admin && req.query.all === "true") {
        reservations = await storage.getReservations();
      } else {
        reservations = await storage.getReservationsByUser(user.id);
      }
      
      res.status(200).json(reservations);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/reservations/date/:date", async (req, res) => {
    try {
      const date = req.params.date;
      const reservations = await storage.getReservationsByDate(date);
      res.status(200).json(reservations);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/reservations", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) {
        return res.status(401).json({ message: "Unauthorized: Telegram ID not provided" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Override user_id with the authenticated user's ID
      const reservationData = insertReservationSchema.parse({
        ...req.body,
        user_id: user.id
      });
      
      // Check if table exists
      const table = await storage.getTable(reservationData.table_id);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      // Check if table is available
      if (table.status !== "available") {
        return res.status(400).json({ message: "Table is not available" });
      }
      
      // Check for conflicting reservations
      const dateReservations = await storage.getReservationsByDate(reservationData.date);
      const tableReservations = dateReservations.filter(
        r => r.table_id === reservationData.table_id && r.status === "active"
      );
      
      const newStart = reservationData.start_time;
      const newEnd = reservationData.end_time;
      
      for (const reservation of tableReservations) {
        const existingStart = reservation.start_time;
        const existingEnd = reservation.end_time;
        
        // Check for overlap
        if (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          return res.status(400).json({ 
            message: "Time slot already booked",
            conflict: reservation
          });
        }
      }
      
      const reservation = await storage.createReservation(reservationData);
      res.status(201).json(reservation);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) {
        return res.status(401).json({ message: "Unauthorized: Telegram ID not provided" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }
      
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      // Only allow users to update their own reservations unless they're an admin
      if (reservation.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({ message: "Forbidden: Cannot update another user's reservation" });
      }
      
      const reservationData = insertReservationSchema.partial().parse(req.body);
      
      // Don't allow changing user_id
      if (reservationData.user_id && reservationData.user_id !== reservation.user_id) {
        delete reservationData.user_id;
      }
      
      const updatedReservation = await storage.updateReservation(id, reservationData);
      res.status(200).json(updatedReservation);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/reservations/:id", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) {
        return res.status(401).json({ message: "Unauthorized: Telegram ID not provided" });
      }
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }
      
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      // Only allow users to delete their own reservations unless they're an admin
      if (reservation.user_id !== user.id && !user.is_admin) {
        return res.status(403).json({ message: "Forbidden: Cannot delete another user's reservation" });
      }
      
      await storage.deleteReservation(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Club settings routes
  app.get("/api/club-settings", async (req, res) => {
    try {
      const settings = await storage.getClubSettings();
      res.status(200).json(settings);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/club-settings", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId || !(await isAdmin(telegramId))) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const settingsData = insertClubSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateClubSettings(settingsData);
      res.status(200).json(settings);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Utility routes
  
  // Get time slots for a specific date and table
  app.get("/api/time-slots/:date/:tableId", async (req, res) => {
    try {
      const date = req.params.date;
      const tableId = parseInt(req.params.tableId);
      
      if (isNaN(tableId)) {
        return res.status(400).json({ message: "Invalid table ID" });
      }
      
      // Get club settings
      const settings = await storage.getClubSettings();
      const openingTime = settings.opening_time;
      const closingTime = settings.closing_time;
      const slotDuration = settings.slot_duration;
      
      // Generate time slots
      const timeSlots = [];
      let currentHour = parseInt(openingTime.split(":")[0]);
      const endHour = parseInt(closingTime.split(":")[0]) || 24; // Handle midnight (00:00)
      
      while (currentHour < endHour) {
        const startTime = `${currentHour.toString().padStart(2, "0")}:00`;
        const endTimeHour = (currentHour + slotDuration) % 24;
        const endTime = `${endTimeHour.toString().padStart(2, "0")}:00`;
        
        timeSlots.push({
          start_time: startTime,
          end_time: endTime
        });
        
        currentHour += slotDuration;
      }
      
      // Get existing reservations for this date and table
      const dateReservations = await storage.getReservationsByDate(date);
      const tableReservations = dateReservations.filter(
        r => r.table_id === tableId && r.status === "active"
      );
      
      // Mark slots as available or not
      const availableSlots = timeSlots.map(slot => {
        const isBooked = tableReservations.some(reservation => {
          return (
            (slot.start_time >= reservation.start_time && slot.start_time < reservation.end_time) ||
            (slot.end_time > reservation.start_time && slot.end_time <= reservation.end_time) ||
            (slot.start_time <= reservation.start_time && slot.end_time >= reservation.end_time)
          );
        });
        
        return {
          ...slot,
          is_available: !isBooked
        };
      });
      
      res.status(200).json(availableSlots);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
