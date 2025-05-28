import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Licenciados Schema
export const licenciados = pgTable("licenciados", {
  id: serial("id").primaryKey(),
  codigo: integer("codigo").notNull().unique(),
  nome: text("nome").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ativo"), // 'ativo' | 'inativo' | 'pendente'
  clientesAtivos: integer("clientes_ativos").notNull().default(0),
  clientesTelecom: integer("clientes_telecom").notNull().default(0),
  graduacao: text("graduacao").notNull(),
  patrocinadorId: integer("patrocinador_id"),
  cidade: text("cidade").notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  dataAtivacao: timestamp("data_ativacao").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Network Tree Schema
export const networkTree = pgTable("network_tree", {
  id: serial("id").primaryKey(),
  licenciadoId: integer("licenciado_id").notNull(),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(0),
  path: text("path").notNull(), // Materialized path para hierarquia
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sync Log Schema
export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 50 }).notNull(), // 'google_sheets'
  status: varchar("status", { length: 20 }).notNull(), // 'success' | 'error' | 'pending'
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  change: decimal("change", { precision: 5, scale: 2 }).notNull(),
  changeType: varchar("change_type", { length: 20 }).notNull(), // 'increase' | 'decrease'
  period: varchar("period", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  revenue: decimal("revenue", { precision: 15, scale: 2 }).notNull(),
  users: integer("users").notNull(),
  orders: integer("orders").notNull(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).notNull(),
  organicTraffic: decimal("organic_traffic", { precision: 5, scale: 2 }).notNull(),
  socialTraffic: decimal("social_traffic", { precision: 5, scale: 2 }).notNull(),
  directTraffic: decimal("direct_traffic", { precision: 5, scale: 2 }).notNull(),
  emailTraffic: decimal("email_traffic", { precision: 5, scale: 2 }).notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id"),
});

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastAccess: timestamp("last_access").defaultNow().notNull(),
  avatar: text("avatar"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  timezone: text("timezone").notNull(),
  language: text("language").notNull(),
  darkMode: boolean("dark_mode").notNull().default(true),
  animations: boolean("animations").notNull().default(true),
  sounds: boolean("sounds").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMetricSchema = createInsertSchema(metrics).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertAppUserSchema = createInsertSchema(appUsers).omit({
  id: true,
  lastAccess: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Licenciados Schemas
export const licenciadoStatusEnum = z.enum(["ativo", "inativo", "pendente"]);

export const insertLicenciadoSchema = createInsertSchema(licenciados).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: licenciadoStatusEnum,
});

export const licenciadoQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: licenciadoStatusEnum.optional(),
  uf: z.string().length(2).optional(),
  graduacao: z.string().optional(),
  sortBy: z.enum(["nome", "codigo", "clientesAtivos", "dataAtivacao"]).default("nome"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const insertNetworkTreeSchema = createInsertSchema(networkTree).omit({
  id: true,
  createdAt: true,
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metrics.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertAppUser = z.infer<typeof insertAppUserSchema>;
export type AppUser = typeof appUsers.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertLicenciado = z.infer<typeof insertLicenciadoSchema>;
export type Licenciado = typeof licenciados.$inferSelect;
export type LicenciadoQuery = z.infer<typeof licenciadoQuerySchema>;

export type InsertNetworkTree = z.infer<typeof insertNetworkTreeSchema>;
export type NetworkTree = typeof networkTree.$inferSelect;

export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;

// Additional interfaces for Google Sheets integration
export interface LicenciadoWithMetadata extends Licenciado {
  metadata: {
    cidade: string;
    uf: string;
    dataAtivacao: Date;
  };
}

export interface NetworkNode extends Licenciado {
  children?: NetworkNode[];
  level: number;
  parentId: number | null;
}

export interface KPIData {
  totalLicenciados: number;
  licenciadosAtivos: number;
  clientesTotais: number;
  clientesTelecom: number;
  crescimentoMensal: number;
}
