import { pgTable, serial, varchar, integer, boolean, timestamp, text, date, unique } from "drizzle-orm/pg-core";

// ----------------------
// Merchants (owners)
// ----------------------
export const merchants = pgTable("tbl_merchants", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  password: varchar("password").notNull(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  phone: varchar("phone", { length: 11 }).unique().notNull(),
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
// Customers
// ----------------------

export const customers = pgTable("tbl_customers", {
  id: serial("id").primaryKey(),
  customerCode: varchar("customer_code", { length: 20 }).unique().notNull(),
  profilePic: varchar("profile_path", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  phone: varchar("phone", { length: 11 }).unique().notNull(),
  birthday: date("birthday").notNull(),
  password: varchar("password").notNull(),
  
  // Address fields
  region: varchar("region", { length: 50 }).notNull(),
  province: varchar("province", { length: 50 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  barangay: varchar("barangay", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  addressDetails: text("address_details").notNull(),
  
  role: varchar("role", { length: 50 }).default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const customerMemberships = pgTable("tbl_customer_memberships", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  membershipLevel: varchar("membership_level", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("unique_customer_business").on(table.customerId, table.businessId),
]);


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
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"), // longer text
  category: varchar("category", { length: 50 }),
  price: integer("price").notNull(),
  isActive: boolean("is_active").default(true).notNull(),


  imageUrl: varchar("image_url", { length: 255 }),

  stock: integer("stock").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// ----------------------
// Promos
// ----------------------

export const promos = pgTable("tbl_promos", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),

  title: varchar("title", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),

  promoType: varchar("promo_type", { length: 20 }).notNull(), // "b1s1" or "share"

  imageUrl: varchar("image_url", { length: 500 }),

  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  maxClaims: integer("max_claims"),
  maxClaimsPerUser: integer("max_claims_per_user"),
  remainingClaims: integer("remaining_claim"),

  eligibleMemberships: varchar("eligible_memberships", { length: 255 }),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const claimedPromos = pgTable("tbl_claimed_promos", {
  id: serial("id").primaryKey(),
  promoId: integer("promo_id").references(() => promos.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),

  qrCode: varchar("qr_code", { length: 255 }).notNull(),   // persistent
  qrExpiresAt: timestamp("qr_expires_at"),                // optional

  isRedeemed: boolean("is_redeemed").default(false),      // still false until scan
  redeemedAt: timestamp("redeemed_at"),

  isShared: boolean("is_shared").default(false).notNull(),
  sharedAt: timestamp("shared_at"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const sharedPromos = pgTable("tbl_shared_promos", {
  id: serial("id").primaryKey(),

  promoId: integer("promo_id").references(() => promos.id).notNull(),
  claimedPromoId: integer("claimed_promo_id").references(() => claimedPromos.id).notNull(),

  fromCustomerId: integer("from_customer_id").references(() => customers.id).notNull(),
  toCustomerId: integer("to_customer_id").references(() => customers.id).notNull(),

  qrCode: varchar("qr_code", { length: 255 }).notNull(),

  // <-- This mirrors tbl_promos.endDate
  qrExpiresAt: timestamp("qr_expires_at").notNull(),

  isRedeemed: boolean("is_redeemed").default(false),
  redeemedBy: integer("redeemed_by").references(() => customers.id),
  redeemedAt: timestamp("redeemed_at"),

  shareTheme: varchar("share_theme", { length: 50 }),   // e.g. "love", "sorry", "friendship", "neutral"
  shareMessage: text("share_message"),                  // custom message from sender
  sharedAt: timestamp("shared_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------------
// Friends
// ----------------------

export const friends = pgTable("tbl_friends", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  friendId: integer("friend_id").references(() => customers.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("unique_friend_pair").on(table.customerId, table.friendId),
]);

