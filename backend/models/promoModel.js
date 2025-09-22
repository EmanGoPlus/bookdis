import db from "../db/config.js";
import { promos } from "../db/schema.js"; // Updated import path

const promoModel = {
  async createPromo(data) {
    try {
      // Build the insert object, only including defined values
      const insertData = {
        businessId: data.businessId,
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };

      // Only add optional fields if they have values
      if (data.conditions) {
        insertData.conditions = JSON.stringify(data.conditions);
      }

      if (data.validDays && data.validDays.length > 0) {
        insertData.validDays = JSON.stringify(data.validDays);
      }

      if (data.maxRedemptions !== undefined && data.maxRedemptions !== null) {
        insertData.maxRedemptions = data.maxRedemptions;
      }

      if (data.maxRedemptionsPerUser !== undefined && data.maxRedemptionsPerUser !== null) {
        insertData.maxRedemptionsPerUser = data.maxRedemptionsPerUser;
      }

      if (data.cooldownHours !== undefined && data.cooldownHours !== null) {
        insertData.cooldownHours = data.cooldownHours;
      }

      if (data.eligibleMemberships && data.eligibleMemberships.length > 0) {
        insertData.eligibleMemberships = JSON.stringify(data.eligibleMemberships);
      }

      console.log("Final insert data:", insertData);

      const result = await db
        .insert(promos)
        .values(insertData)
        .returning();

      return result[0];
    } catch (error) {
      console.error("Database insert error:", error);
      throw error;
    }
  },
};

export default promoModel;