import { pgTable, serial, varchar, integer, boolean } from "drizzle-orm/pg-core";

export const merchants = pgTable("tbl_merchants", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  password: varchar("password").notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 11 }).unique(),
  role: varchar("role", { length: 50 }).default("merchant"),
});

export const businesses = pgTable("tbl_businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => merchants.id).unique(), // Fixed: merchants_new -> merchants
  businessName: varchar("business_name", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  logo: varchar("logo_url").notNull(),
  operatingHours: varchar("operating_hours").notNull(),
  verificationStatus: boolean("is_verified").default(false).notNull(),
});

