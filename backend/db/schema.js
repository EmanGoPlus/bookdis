import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const merchants = pgTable("tbl_merchants", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  password: varchar("password").notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 11 }).unique(),
  role: varchar("role", { length: 50 }).default("merchant"), // merchant or employee
  businessId: integer("business_id").references(() => businesses.id), // optional, only for employees
});


export const businesses = pgTable("tbl_businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => merchants.id), // allow multiple businesses per user
  businessName: varchar("business_name", { length: 50 }).notNull(),

  // categories
  mainCategory: varchar("main_category", { length: 50 }).notNull(),
  subCategory: varchar("sub_category", { length: 50 }),

  // logo
  logo: varchar("logo_url").notNull(),

  // address
  region: varchar("region", { length: 100 }),
  province: varchar("province", { length: 100 }),
  city: varchar("city", { length: 100 }),
  barangay: varchar("barangay", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  addressDetails: varchar("address_details", { length: 255 }),

  // operating hours
  openTime: varchar("open_time", { length: 10 }).notNull(),   // "09:00 AM"
  closeTime: varchar("close_time", { length: 10 }).notNull(), // "06:00 PM"

  // here kasi isang type lang naman ng credits. wag na iseperate
  creditsBalance: integer("credits_balance").default(0).notNull(), //

  // status
  verificationStatus: boolean("is_verified").default(false).notNull(),
});

export const businessDocuments = pgTable("tbl_business_documents", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  governmentID: varchar("government_id", { length: 255 }),
  businessPermit: varchar("business_permit", { length: 255 }),
  DTI: varchar("dti_sec", { length: 255 }),
  taxID: varchar("tax_id", { length: 255 }),
  isVerified: boolean("is_verified").default(false),
  rejectedReason: varchar("rejected_reason", { length: 255 }), // optional
createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creditTransactions = pgTable("tbl_credit_transactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(), // +1000 for purchase, -10 for deduction
  description: varchar("description", { length: 255 }), // e.g. "To: Member ID 8453627843"
  referenceNo: varchar("reference_no", { length: 100 }), // PayMongo RN, internal ref, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const creditPackages = pgTable("tbl_credit_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  credits: integer("credits").notNull(),
  price: integer("price").notNull(), // stored in centavos
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});



