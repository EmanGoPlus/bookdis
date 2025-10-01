import db from "../db/config.js";
import {
  claimedPromos,
  promos,
  customerMemberships,
  businesses,
} from "../db/schema.js";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { eq, and, lte, gte, count } from "drizzle-orm";

const promoModel = {

  async createPromo(data) {
    let eligibleMemberships = null;
    if (data.eligibleMemberships) {
      if (typeof data.eligibleMemberships === "string") {
        const trimmed = data.eligibleMemberships.trim();
        try {
          const parsed = JSON.parse(trimmed);
          eligibleMemberships = JSON.stringify(parsed);
        } catch (e) {
          eligibleMemberships = JSON.stringify([trimmed]);
        }
      } else if (Array.isArray(data.eligibleMemberships)) {
        eligibleMemberships = JSON.stringify(data.eligibleMemberships);
      }
    }

    const insertData = {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      promoType: data.promoType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      imageUrl: data.imageUrl || null,
      maxClaims: data.maxClaims ?? 0,
      maxClaimsPerUser: data.maxClaimsPerUser ?? 0,
      eligibleMemberships,
      isActive: true,
    };

    const result = await db.insert(promos).values(insertData).returning();
    return result[0];
  },


  async getAvailablePromos() {
    const now = new Date();

    return await db
      .select({
        promoId: promos.id,
        title: promos.title,
        description: promos.description,
        imageUrl: promos.imageUrl,
        startDate: promos.startDate,
        endDate: promos.endDate,
        businessId: businesses.id,
        businessName: businesses.businessName,
        logo: businesses.logo,
      })
      .from(promos)
      .innerJoin(businesses, eq(promos.businessId, businesses.id))
      .where(
        and(
          eq(promos.isActive, true),
          lte(promos.startDate, now),
          gte(promos.endDate, now)
        )
      );
  },

  async getMembership(customerId, businessId) {
    const result = await db
      .select()
      .from(customerMemberships)
      .where(
        and(
          eq(customerMemberships.customerId, customerId),
          eq(customerMemberships.businessId, businessId),
          eq(customerMemberships.isActive, true)
        )
      )
      .limit(1);
    
    return result[0];
  },


  async getClaimCount(promoId) {
    return await db
      .select({ count: count() })
      .from(claimedPromos)
      .where(eq(claimedPromos.promoId, promoId));
  },


  async getUserClaimCount(promoId, customerId) {
    return await db
      .select({ count: count() })
      .from(claimedPromos)
      .where(
        and(
          eq(claimedPromos.promoId, promoId),
          eq(claimedPromos.customerId, customerId)
        )
      );
  },


  async insertClaim(values) {
    return await db.insert(claimedPromos).values(values).returning();
  },

  async getPromoById(promoId) {
    const result = await db
      .select()
      .from(promos)
      .where(eq(promos.id, promoId))
      .limit(1);

    return result[0];
  },
};

export default promoModel;