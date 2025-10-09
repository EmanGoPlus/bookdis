import db from "../db/config.js";
import { customerMemberships, businesses } from "../db/schema.js";
import { eq } from "drizzle-orm";

const membershipModel = {
  
  // Insert a new membership
  async createMembership(values) {
    return await db.insert(customerMemberships)
      .values(values)
      .returning();
  },

  // Get membership by customerId and businessId
  async getMembershipByCustomerAndBusiness(customerId, businessId) {
    const result = await db.select()
      .from(customerMemberships)
      .where(
        eq(customerMemberships.customerId, customerId),
        eq(customerMemberships.businessId, businessId)
      )
      .limit(1);
    return result[0];
  },

  // Get all memberships of a customer
  async getMembershipsByCustomer(customerId) {
    return await db.select()
      .from(customerMemberships)
      .where(eq(customerMemberships.customerId, customerId));
  },

  // deactivate a membership
  async deactivateMembership(customerId, businessId) {
    const [updated] = await db.update(customerMemberships)
      .set({ isActive: false })
      .where(
        eq(customerMemberships.customerId, customerId),
        eq(customerMemberships.businessId, businessId)
      )
      .returning();
    return updated;
  },

async getMembershipsByCustomer(customerId) {
    return await db
      .select({
        membershipId: customerMemberships.id,
        customerId: customerMemberships.customerId,
        businessId: customerMemberships.businessId,
        membershipLevel: customerMemberships.membershipLevel,
        isActive: customerMemberships.isActive,
        createdAt: customerMemberships.createdAt,
        // Business details
        businessName: businesses.businessName,
        businessCode: businesses.businessCode,
        logo: businesses.logo,
        mainCategory: businesses.mainCategory,
        subCategory: businesses.subCategory,
        city: businesses.city,
        region: businesses.region,
        province: businesses.province,
      })
      .from(customerMemberships)
      .leftJoin(businesses, eq(customerMemberships.businessId, businesses.id))
      .where(eq(customerMemberships.customerId, customerId));
  },

};

export default membershipModel;
