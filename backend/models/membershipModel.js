import db from "../db/config.js";
import { customerMemberships } from "../db/schema.js";
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
  }

};

export default membershipModel;
