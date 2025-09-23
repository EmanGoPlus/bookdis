import db from "../db/config.js";
import { claimedPromos, promos } from "../db/schema.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm"; // <-- add this


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

      if (
        data.maxRedemptionsPerUser !== undefined &&
        data.maxRedemptionsPerUser !== null
      ) {
        insertData.maxRedemptionsPerUser = data.maxRedemptionsPerUser;
      }

      if (data.cooldownHours !== undefined && data.cooldownHours !== null) {
        insertData.cooldownHours = data.cooldownHours;
      }

      if (data.eligibleMemberships && data.eligibleMemberships.length > 0) {
        insertData.eligibleMemberships = JSON.stringify(
          data.eligibleMemberships
        );
      }

      console.log("Final insert data:", insertData);

      const result = await db.insert(promos).values(insertData).returning();

      return result[0];
    } catch (error) {
      console.error("Database insert error:", error);
      throw error;
    }
  },

  async getPromos() {
    const result = await db.select().from(promos);
    return result;
  },

  async claimPromo({ promoId, customerId, membershipLevel = null }) {
    const [promoDetails] = await db
      .select()
      .from(promos)
      .where(eq(promos.id, promoId))
      .limit(1);

    const qrCode = JSON.stringify({
      promoId,
      customerId,
      code: `PROMO_${nanoid(10)}`,
      title: promoDetails?.title,
      description: promoDetails?.description,
      discount: promoDetails?.discount,
      validUntil: promoDetails?.validUntil,
    });

    const [result] = await db
      .insert(claimedPromos)
      .values({
        promoId,
        customerId,
        qrCode,
        membershipLevel,
      })
      .returning();

    return result;
  },

  async getPromoById(promoId) {
    return db.select().from(promos).where(eq(promos.id, promoId)).limit(1);
  },
};

export default promoModel;
