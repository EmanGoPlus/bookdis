import db from "../db/config.js";
import {
  claimedPromos,
  sharedPromos,
  promos,
  customerMemberships,
  customers,
  businesses,
} from "../db/schema.js";
import { sql, eq, and, lte, gte, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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

  async getClaimsByCustomer(customerId) {
    return await db
      .select({
        claimId: claimedPromos.id,
        promoId: claimedPromos.promoId,
        qrCode: claimedPromos.qrCode,
        qrExpiresAt: claimedPromos.qrExpiresAt,
        isRedeemed: claimedPromos.isRedeemed,
        redeemedAt: claimedPromos.redeemedAt,
        claimedAt: claimedPromos.createdAt, // Changed from createdAt to claimedAt for clarity
        promoTitle: promos.title,
        promoDescription: promos.description,
        promoImage: promos.imageUrl,
        promoType: promos.promoType,
        businessId: promos.businessId,
        businessName: businesses.businessName, // FIXED: was businesses.name
      })
      .from(claimedPromos)
      .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
      .innerJoin(businesses, eq(promos.businessId, businesses.id))
      .where(eq(claimedPromos.customerId, customerId));
  },

  async getOrCreateClaimByPromoAndCustomer(promoId, customerId) {
    let claim = await db
      .select()
      .from(claimedPromos)
      .where(
        and(
          eq(claimedPromos.promoId, promoId),
          eq(claimedPromos.customerId, customerId),
          eq(claimedPromos.isRedeemed, false) // ✅ only unredeemed
        )
      )
      .limit(1)
      .then((res) => res[0] || null);

    if (!claim) {
      // generate QR and insert claim row
      const qrCode = uuidv4();
      const qrExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry

      const [newClaim] = await db
        .insert(claimedPromos)
        .values({
          promoId,
          customerId,
          qrCode,
          qrExpiresAt,
          isRedeemed: false,
        })
        .returning();

      claim = newClaim;
    }

    return claim;
  },

  async redeemPromoByQr(qrCode) {
    return await db.transaction(async (tx) => {
      console.log("🔒 Starting transaction for QR:", qrCode);

      // 1. Lock the claim row for update
      const claim = await tx
        .select({
          claimId: claimedPromos.id,
          promoId: claimedPromos.promoId,
          customerId: claimedPromos.customerId,
          isRedeemed: claimedPromos.isRedeemed,
          redeemedAt: claimedPromos.redeemedAt,
          qrExpiresAt: claimedPromos.qrExpiresAt,
          promoTitle: promos.title,
          customerFirstName: customers.firstName,
          customerLastName: customers.lastName,
        })
        .from(claimedPromos)
        .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
        .innerJoin(customers, eq(claimedPromos.customerId, customers.id))
        .where(eq(claimedPromos.qrCode, qrCode))
        .for("update") // ✅ PostgreSQL row lock
        .limit(1);

      console.log("📋 Claim found:", claim.length > 0 ? "YES" : "NO");

      if (!claim[0]) {
        console.log("❌ QR code invalid");
        throw new Error("QR code is invalid");
      }

      const c = claim[0];
      console.log("📊 Claim data:", {
        claimId: c.claimId,
        promoId: c.promoId,
        customerId: c.customerId,
        isRedeemed: c.isRedeemed,
      });

      const now = new Date();

      // 2. Check if already redeemed (with strict check)
      if (c.isRedeemed === true) {
        console.log("❌ Already redeemed at:", c.redeemedAt);
        throw new Error("Promo has already been redeemed");
      }

      // 3. Check expiration (if set)
      if (c.qrExpiresAt && c.qrExpiresAt < now) {
        console.log("❌ QR expired at:", c.qrExpiresAt);
        throw new Error("QR code has expired");
      }

      // 4. Mark as redeemed
      console.log("✅ Marking as redeemed...");
      const [redeemed] = await tx
        .update(claimedPromos)
        .set({
          isRedeemed: true,
          redeemedAt: now,
        })
        .where(eq(claimedPromos.id, c.claimId))
        .returning();

      console.log("✅ Redemption complete:", {
        claimId: redeemed.id,
        isRedeemed: redeemed.isRedeemed,
        redeemedAt: redeemed.redeemedAt,
      });

      // 5. Return complete data
      return {
        claimId: redeemed.id,
        promoId: c.promoId,
        customerId: c.customerId,
        promoTitle: c.promoTitle,
        customerName: `${c.customerFirstName} ${c.customerLastName}`,
        redeemedAt: redeemed.redeemedAt,
        isRedeemed: true,
      };
    });
  },

  async getClaimByPromoAndCustomer(promoId, customerId) {
    const result = await db
      .select()
      .from(claimedPromos)
      .where(
        and(
          eq(claimedPromos.promoId, promoId),
          eq(claimedPromos.customerId, customerId)
        )
      )
      .limit(1);

    return result[0] || null;
  },

  async redeemPromo(promoId, customerId) {},

  async getClaimByQrCode(qrCode) {
    const result = await db
      .select({
        claimId: claimedPromos.id,
        promoId: claimedPromos.promoId,
        customerId: claimedPromos.customerId,
        qrCode: claimedPromos.qrCode,
        qrExpiresAt: claimedPromos.qrExpiresAt,
        isRedeemed: claimedPromos.isRedeemed,
        redeemedAt: claimedPromos.redeemedAt,
        claimedAt: claimedPromos.createdAt,
        // Promo details
        promoTitle: promos.title,
        promoDescription: promos.description,
        promoType: promos.promoType,
        businessId: promos.businessId,
        // Customer details
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerEmail: customers.email,
      })
      .from(claimedPromos)
      .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
      .innerJoin(customers, eq(claimedPromos.customerId, customers.id))
      .where(eq(claimedPromos.qrCode, qrCode))
      .limit(1);

    return result[0] || null;
  },

  async redeemClaim(claimId) {
    const result = await db
      .update(claimedPromos)
      .set({
        isRedeemed: true,
        redeemedAt: new Date(),
      })
      .where(
        and(eq(claimedPromos.id, claimId), eq(claimedPromos.isRedeemed, false))
      )
      .returning();

    if (!result[0]) {
      throw new Error("Promo has already been redeemed");
    }

    return result[0];
  },

  async getBusinessByPromo(promoId) {
    const result = await db
      .select({
        businessId: promos.businessId,
        businessName: businesses.businessName,
      })
      .from(promos)
      .innerJoin(businesses, eq(promos.businessId, businesses.id))
      .where(eq(promos.id, promoId))
      .limit(1);

    return result[0] || null;
  },

  async getBusinessByMerchant(merchantId) {
    const result = await db
      .select({
        businessId: businesses.id,
        businessName: businesses.businessName,
      })
      .from(businesses)
      .where(eq(businesses.userId, merchantId))
      .limit(1);

    return result[0] || null;
  },

async sharedPromosInventory(customerId) {
  const result = await db
    .select({
      sharedId: sharedPromos.id,
      promoId: sharedPromos.promoId,
      claimedPromoId: sharedPromos.claimedPromoId,
      fromCustomerId: sharedPromos.fromCustomerId,
      toCustomerId: sharedPromos.toCustomerId,
      qrCode: sharedPromos.qrCode,
      qrExpiresAt: sharedPromos.qrExpiresAt,
      isRedeemed: sharedPromos.isRedeemed,
      redeemedAt: sharedPromos.redeemedAt,
      redeemedBy: sharedPromos.redeemedBy,
      createdAt: sharedPromos.createdAt,

      promoTitle: promos.title,
      promoDescription: promos.description,
      promoImage: promos.imageUrl,
      promoType: promos.promoType,
      promoStart: promos.startDate,
      promoEnd: promos.endDate,

      businessName: businesses.businessName,
      senderName:
        sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`.as(
          "senderName"
        ),
      senderProfile: customers.profilePic,
    })
    .from(sharedPromos)
    .innerJoin(promos, eq(sharedPromos.promoId, promos.id))
    .innerJoin(businesses, eq(promos.businessId, businesses.id))
    .innerJoin(customers, eq(sharedPromos.fromCustomerId, customers.id))
    .where(
      and(
        eq(sharedPromos.toCustomerId, customerId),
        eq(sharedPromos.isRedeemed, false) // ✅ Show unredeemed (available to use)
      )
    );

  return result;
},

  async claimedPromosInventory(customerId) {
    const result = await db
      .select({
        claimId: claimedPromos.id,
        promoId: claimedPromos.promoId,
        claimedAt: claimedPromos.createdAt,
        isRedeemed: claimedPromos.isRedeemed,
        redeemedAt: claimedPromos.redeemedAt,
        promoTitle: promos.title,
        businessName: businesses.businessName,
        businessLogo: businesses.logo,
      })
      .from(claimedPromos)
      .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
      .innerJoin(businesses, eq(promos.businessId, businesses.id))
      .where(
        and(
          eq(claimedPromos.customerId, customerId),
          sql`${claimedPromos.isRedeemed} = true` // ✅ force boolean filter
        )
      );

    return result;
  },

  async sharePromo(customerId, claimId, toCustomerIdOrPhone) {
    let toCustomerId = toCustomerIdOrPhone;

    if (isNaN(toCustomerIdOrPhone) || toCustomerIdOrPhone.length > 6) {
      const phoneNumber = String(toCustomerIdOrPhone).trim();
      const recipient = await this.findCustomerByPhone(phoneNumber);
      if (!recipient) {
        throw new Error("Recipient not found with this phone number");
      }
      toCustomerId = recipient.id;
    }

    if (parseInt(toCustomerId) === parseInt(customerId)) {
      throw new Error("You cannot share a promo with yourself");
    }

    const [claim] = await db
      .select({
        promoId: claimedPromos.promoId,
        isRedeemed: claimedPromos.isRedeemed,
        isShared: claimedPromos.isShared,
      })
      .from(claimedPromos)
      .where(eq(claimedPromos.id, claimId))
      .limit(1);

    if (!claim) {
      throw new Error("Claimed promo not found");
    }

    if (!claim.isRedeemed) {
      throw new Error("You must redeem this promo before sharing");
    }

    if (claim.isShared) {
      throw new Error("You have already shared this promo");
    }

    const [existingShare] = await db
      .select()
      .from(sharedPromos)
      .where(
        and(
          eq(sharedPromos.claimedPromoId, claimId),
          eq(sharedPromos.toCustomerId, toCustomerId)
        )
      )
      .limit(1);

    if (existingShare) {
      throw new Error("You have already shared this promo with this person");
    }

    const [promo] = await db
      .select({ endDate: promos.endDate })
      .from(promos)
      .where(eq(promos.id, claim.promoId))
      .limit(1);

    if (!promo) {
      throw new Error("Promo not found");
    }

    const qrCode = uuidv4();
    const qrExpiresAt = promo.endDate;

    await db
      .update(claimedPromos)
      .set({
        isShared: true,
        sharedAt: new Date(),
      })
      .where(eq(claimedPromos.id, claimId));

    const [shared] = await db
      .insert(sharedPromos)
      .values({
        promoId: claim.promoId,
        claimedPromoId: claimId,
        fromCustomerId: customerId,
        toCustomerId,
        qrCode,
        qrExpiresAt,
        isRedeemed: false,
      })
      .returning();

    return {
      qrCode,
      qrExpiresAt: shared.qrExpiresAt,
      toCustomerId,
    };
  },

async findCustomerByPhone(phone) {
  const trimmedPhone = String(phone).trim();
  
  console.log("🔍 findCustomerByPhone:", {
    original: phone,
    trimmed: trimmedPhone,
    length: trimmedPhone.length,
  });
  
  const result = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
    })
    .from(customers)
    .where(eq(customers.phone, trimmedPhone))
    .limit(1);

  console.log("🔍 Query result:", result);
  
  // Debug: show all customers if not found
  if (!result[0]) {
    const allCustomers = await db
      .select({ id: customers.id, phone: customers.phone })
      .from(customers)
      .limit(5);
    console.log("📋 Sample customers in DB:", allCustomers);
  }
  
  return result[0] || null;
},
};

export default promoModel;
