import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// ----------------------
// Merchants (owners)
// ----------------------
export const merchants = pgTable("tbl_merchants", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  password: varchar("password").notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 11 }).unique(),
  role: varchar("role", { length: 50 }).default("merchant"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------------
// Employees (assigned to ONE business)
// ----------------------
export const employees = pgTable("tbl_employees", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  username: varchar("username", {length: 50}).notNull().unique(),
  password: varchar("password").notNull(),
  role: varchar("role", { length: 50 }).default("employee"),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------------
// Businesses
// ----------------------
export const businesses = pgTable("tbl_businesses", {

  id: serial("id").primaryKey(),

  businessCode: varchar("business_code", { length: 6 }).notNull().unique(),

  userId: integer("user_id").references(() => merchants.id).notNull(), // owner (merchant)
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

  // credits
  creditsBalance: integer("credits_balance").default(0).notNull(),

  // status
  verificationStatus: boolean("is_verified").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------------
// Business Documents
// ----------------------
export const businessDocuments = pgTable("tbl_business_documents", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  governmentID: varchar("government_id", { length: 255 }),
  businessPermit: varchar("business_permit", { length: 255 }),
  DTI: varchar("dti_sec", { length: 255 }),
  taxID: varchar("tax_id", { length: 255 }),
  isVerified: boolean("is_verified").default(false),
  rejectedReason: varchar("rejected_reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------------
// Permissions
// ----------------------

export const employeePermissions = pgTable("tbl_employee_permissions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  elementId: integer("element_id").references(() => elements.id).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const elements = pgTable("tbl_elements", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // e.g., "buyCredits"
  label: varchar("label", { length: 100 }).notNull(),      // e.g., "Buy Credits Button"
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------------
// Credit Transactions
// ----------------------
export const creditTransactions = pgTable("tbl_credit_transactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // e.g. "purchase", "deduction"
  amount: integer("amount").notNull(), // +1000 for purchase, -10 for deduction
  description: varchar("description", { length: 255 }),
  referenceNo: varchar("reference_no", { length: 100 }),
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

// ----------------------
// Products/Service
// ----------------------

export const products = pgTable("tbl_products", {
  id: serial("id").primaryKey(),

  // Link to business
  businessId: integer("business_id").references(() => businesses.id).notNull(),

  // Basic info
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"), // longer text
  category: varchar("category", { length: 50 }), // optional category
  price: integer("price").notNull(), // stored in centavos or smallest currency unit
  isActive: boolean("is_active").default(true).notNull(),

  // Optional image
  imageUrl: varchar("image_url", { length: 255 }),

  // Stock / inventory (optional)
  stock: integer("stock").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

