import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// טבלת אתרים
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  siteId: text("site_id").notNull().unique(), // מזהה ייחודי לאתר בכתובת ה-URL
  name: text("name").notNull(), // שם האתר להצגה
  description: text("description"), // תיאור האתר
  sheetUrl: text("sheet_url").notNull(), // כתובת גיליון Google Sheets
  createdAt: timestamp("created_at").defaultNow().notNull(), // זמן יצירת האתר
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // זמן עדכון אחרון
  isActive: boolean("is_active").default(true).notNull(), // האם האתר פעיל
  createdBy: integer("created_by").references(() => users.id), // מי יצר את האתר
});

export const insertSiteSchema = createInsertSchema(sites).pick({
  siteId: true,
  name: true,
  description: true,
  sheetUrl: true,
  isActive: true,
  createdBy: true,
});

export const updateSiteSchema = createInsertSchema(sites).pick({
  name: true,
  description: true,
  sheetUrl: true,
  isActive: true,
}).partial();

export type InsertSite = z.infer<typeof insertSiteSchema>;
export type UpdateSite = z.infer<typeof updateSiteSchema>;
export type Site = typeof sites.$inferSelect;
