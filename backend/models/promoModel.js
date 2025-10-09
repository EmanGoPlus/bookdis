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
import { alias } from "drizzle-orm/pg-core";
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

    const maxClaims = data.maxClaims ?? 0;
    const maxClaimsPerUser = data.maxClaimsPerUser ?? 0;

    const insertData = {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      promoType: data.promoType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      imageUrl: data.imageUrl || null,
      maxClaims,
      maxClaimsPerUser,
      remainingClaims: maxClaims, // coppy the value of maxclaims
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
          eq(claimedPromos.isRedeemed, false)
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

  async getPromoWithBusiness(promoId) {
    const result = await db
      .select({
        promo: promos,
        businessId: promos.businessId,
      })
      .from(promos)
      .where(eq(promos.id, promoId))
      .limit(1);

    return result[0] || null;
  },

  async getScannerBusinessId(scannerId, scannerRole) {
    if (scannerRole === "employee") {
      const [employee] = await db
        .select({ businessId: employees.businessId })
        .from(employees)
        .where(eq(employees.id, scannerId))
        .limit(1);

      if (!employee) {
        throw new Error("Employee not found");
      }
      return employee.businessId;
    }

    if (scannerRole === "merchant") {
      return null;
    }
    throw new Error("Invalid scanner role");
  },

  async getClaimWithPromo(qrCode) {
    const result = await db
      .select({
        claim: claimedPromos,
        promo: promos,
      })
      .from(claimedPromos)
      .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
      .where(eq(claimedPromos.qrCode, qrCode))
      .limit(1);

    return result[0] || null;
  },

  async redeemPromoByQr(
    qrCode,
    scannerBusinessId,
    redeemedByCustomerId = null
  ) {
    return await db.transaction(async (tx) => {
      const now = new Date();
      const claim = await tx
        .select({
          claimId: claimedPromos.id,
          promoId: claimedPromos.promoId,
          customerId: claimedPromos.customerId,
          isRedeemed: claimedPromos.isRedeemed,
          redeemedAt: claimedPromos.redeemedAt,
          qrExpiresAt: claimedPromos.qrExpiresAt,
          promoTitle: promos.title,
          promoBusinessId: promos.businessId,
          remainingClaims: promos.remainingClaims,
          customerFirstName: customers.firstName,
          customerLastName: customers.lastName,
        })
        .from(claimedPromos)
        .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
        .innerJoin(customers, eq(claimedPromos.customerId, customers.id))
        .where(eq(claimedPromos.qrCode, qrCode))
        .for("update")
        .limit(1);

      if (claim[0]) {
        const c = claim[0];

        // Verify business match
        if (c.promoBusinessId !== scannerBusinessId) {
          throw new Error("This promo belongs to a different business.");
        }

        // Validate QR status
        if (c.isRedeemed) {
          throw new Error("Promo has already been redeemed");
        }
        if (c.qrExpiresAt && c.qrExpiresAt < now) {
          throw new Error("QR code has expired");
        }

        // FOR CLAIMED PROMOS ONLY: Check remaining claims before redemption
        if (c.remainingClaims <= 0) {
          throw new Error("Promo is no longer available");
        }
        const updatedPromo = await tx
          .update(promos)
          .set({ remainingClaims: sql`${promos.remainingClaims} - 1` })
          .where(
            and(eq(promos.id, c.promoId), sql`${promos.remainingClaims} > 0`)
          )
          .returning();

        if (updatedPromo.length === 0) {
          throw new Error("Promo is no longer available");
        }

        const [redeemed] = await tx
          .update(claimedPromos)
          .set({ isRedeemed: true, redeemedAt: now })
          .where(eq(claimedPromos.id, c.claimId))
          .returning();

        return {
          claimId: redeemed.id,
          promoId: c.promoId,
          customerId: c.customerId,
          promoTitle: c.promoTitle,
          customerName: `${c.customerFirstName} ${c.customerLastName}`,
          redeemedAt: redeemed.redeemedAt,
          source: "claim",
        };
      }

      const shared = await tx
        .select({
          shareId: sharedPromos.id,
          promoId: sharedPromos.promoId,
          fromCustomerId: sharedPromos.fromCustomerId,
          isRedeemed: sharedPromos.isRedeemed,
          redeemedAt: sharedPromos.redeemedAt,
          qrExpiresAt: sharedPromos.qrExpiresAt,
          promoTitle: promos.title,
          promoBusinessId: promos.businessId,
          remainingClaims: promos.remainingClaims,
          fromFirstName: customers.firstName,
          fromLastName: customers.lastName,
        })
        .from(sharedPromos)
        .innerJoin(promos, eq(sharedPromos.promoId, promos.id))
        .innerJoin(customers, eq(sharedPromos.fromCustomerId, customers.id))
        .where(eq(sharedPromos.qrCode, qrCode))
        .for("update")
        .limit(1);

      if (!shared[0]) {
        throw new Error("QR code is invalid");
      }

      const s = shared[0];

      if (s.promoBusinessId !== scannerBusinessId) {
        throw new Error("This promo belongs to a different business.");
      }

      if (s.isRedeemed) {
        throw new Error("Promo has already been redeemed");
      }
      if (s.qrExpiresAt && s.qrExpiresAt < now) {
        throw new Error("QR code has expired");
      }

      const [redeemedShared] = await tx
        .update(sharedPromos)
        .set({
          isRedeemed: true,
          redeemedBy: redeemedByCustomerId || null,
          redeemedAt: now,
        })
        .where(eq(sharedPromos.id, s.shareId))
        .returning();

      return {
        claimId: redeemedShared.id,
        promoId: s.promoId,
        customerId: s.fromCustomerId,
        promoTitle: s.promoTitle,
        customerName: `${s.fromFirstName} ${s.fromLastName}`,
        redeemedAt: redeemedShared.redeemedAt,
        source: "shared",
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

  //helper for getpromodetails
  async getBusinessId(user, providedBusinessId = null) {
    // If businessId is already in the token (for employees)
    if (user.businessId) {
      return user.businessId;
    }

    // For employees without businessId in token, get from DB
    if (user.role === "employee") {
      const [employee] = await db
        .select({ businessId: employees.businessId })
        .from(employees)
        .where(eq(employees.id, user.id))
        .limit(1);

      return employee?.businessId || null;
    }

    // For merchants with multiple businesses
    if (user.role === "merchant") {
      // If businessId is provided (from request), verify ownership
      if (providedBusinessId) {
        const [business] = await db
          .select({ id: businesses.id })
          .from(businesses)
          .where(
            and(
              eq(businesses.id, providedBusinessId),
              eq(businesses.userId, user.id)
            )
          )
          .limit(1);

        if (!business) {
          throw new Error("You don't have access to this business");
        }

        return business.id;
      }

      throw new Error(
        "Merchants with multiple businesses must provide businessId"
      );
    }

    return null;
  },

  async getPromoDetailsByQRCode(qrCode, businessId) {
    const now = new Date();

    // Check claimed promos
    let result = await db
      .select({
        promoId: promos.id,
        promoTitle: promos.title,
        description: promos.description,
        promoType: promos.promoType,
        imageUrl: promos.imageUrl,
        validUntil: promos.endDate,
        businessName: businesses.businessName,
        businessId: businesses.id,
        remainingClaims: promos.remainingClaims,
        claimId: claimedPromos.id,
        isRedeemed: claimedPromos.isRedeemed,
        redeemedAt: claimedPromos.redeemedAt,
        qrExpiresAt: claimedPromos.qrExpiresAt,
        customerId: customers.id,
        customerName: sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
        customerEmail: customers.email,
        customerCode: customers.customerCode,
        claimType: sql`'claimed'`.as("claimType"),
      })
      .from(claimedPromos)
      .innerJoin(promos, eq(claimedPromos.promoId, promos.id))
      .innerJoin(customers, eq(claimedPromos.customerId, customers.id))
      .innerJoin(businesses, eq(promos.businessId, businesses.id))
      .where(eq(claimedPromos.qrCode, qrCode))
      .limit(1);

    // Check shared promos if not found in claimed
    if (!result[0]) {
      const sender = alias(customers, "sender");

      result = await db
        .select({
          promoId: promos.id,
          promoTitle: promos.title,
          description: promos.description,
          promoType: promos.promoType,
          imageUrl: promos.imageUrl,
          validUntil: promos.endDate,
          businessName: businesses.businessName,
          businessId: businesses.id,
          remainingClaims: promos.remainingClaims,
          claimId: sharedPromos.id,
          isRedeemed: sharedPromos.isRedeemed,
          redeemedAt: sharedPromos.redeemedAt,
          qrExpiresAt: sharedPromos.qrExpiresAt,
          customerId: customers.id,
          customerName: sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
          customerEmail: customers.email,
          customerCode: customers.customerCode,
          fromCustomerId: sharedPromos.fromCustomerId,
          fromCustomerName: sql`CONCAT(${sender.firstName}, ' ', ${sender.lastName})`,
          claimType: sql`'shared'`.as("claimType"),
        })
        .from(sharedPromos)
        .innerJoin(promos, eq(sharedPromos.promoId, promos.id))
        .innerJoin(customers, eq(sharedPromos.toCustomerId, customers.id))
        .innerJoin(sender, eq(sharedPromos.fromCustomerId, sender.id))
        .innerJoin(businesses, eq(promos.businessId, businesses.id))
        .where(eq(sharedPromos.qrCode, qrCode))
        .limit(1);
    }

    // QR code doesn't exist at all
    if (!result[0]) {
      return { found: false };
    }

    const promo = result[0];

    // Check if already redeemed - return ONLY error info
    if (promo.isRedeemed) {
      return {
        found: true,
        isRedeemed: true,
        redeemedAt: promo.redeemedAt,
      };
    }

    // Check if QR expired - return ONLY error info
    if (promo.qrExpiresAt && new Date(promo.qrExpiresAt) < now) {
      return {
        found: true,
        qrExpired: true,
        qrExpiresAt: promo.qrExpiresAt,
      };
    }

    // Check if promo period expired - return ONLY error info
    if (new Date(promo.validUntil) < now) {
      return {
        found: true,
        promoExpired: true,
        validUntil: promo.validUntil,
      };
    }

    // CHECK REMAINING CLAIMS - ONLY for claimed promos, NOT for shared
    // Shared promos were already counted when first redeemed/shared
    if (promo.claimType === "claimed" && promo.remainingClaims <= 0) {
      return {
        found: true,
        noRemainingClaims: true,
        remainingClaims: promo.remainingClaims,
      };
    }

    // If businessId is provided, verify it matches - return ONLY error info
    if (businessId && promo.businessId !== businessId) {
      return {
        found: true,
        businessMismatch: true,
      };
    }

    // All validations passed - return full promo data
    return {
      found: true,
      promoId: promo.promoId,
      promoTitle: promo.promoTitle,
      description: promo.description,
      promoType: promo.promoType,
      imageUrl: promo.imageUrl,
      validUntil: promo.validUntil,
      businessName: promo.businessName,
      businessId: promo.businessId,
      remainingClaims: promo.remainingClaims,
      claimId: promo.claimId,
      isRedeemed: promo.isRedeemed,
      redeemedAt: promo.redeemedAt,
      qrExpiresAt: promo.qrExpiresAt,
      customerId: promo.customerId,
      customerName: promo.customerName,
      customerEmail: promo.customerEmail,
      customerCode: promo.customerCode,
      claimType: promo.claimType,
      fromCustomerId: promo.fromCustomerId,
      fromCustomerName: promo.fromCustomerName,
    };
  },

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

  //inventory ng recieved promos
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
        theme: sharedPromos.shareTheme,
        message: sharedPromos.shareMessage,
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
          eq(sharedPromos.isRedeemed, false)
        )
      );

    // Return empty array if no results, ensure all results are properly formatted
    return result || [];
  },

  //inventory ng claimed promos
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
          eq(claimedPromos.isRedeemed, true),
          eq(claimedPromos.isShared, false)
        )
      );

    return result;
  },

  async sharePromo(fromCustomerId, claimId, toCustomerPhone, theme, message) {
    // 1. Find recipient by phone
    const [recipient] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phone, toCustomerPhone))
      .limit(1);

    if (!recipient) {
      throw new Error("Recipient not found with this phone number");
    }

    if (parseInt(recipient.id) === parseInt(fromCustomerId)) {
      throw new Error("You cannot share a promo with yourself");
    }

    // 2. Validate claimed promo
    const [claim] = await db
      .select({
        promoId: claimedPromos.promoId,
        isRedeemed: claimedPromos.isRedeemed,
        isShared: claimedPromos.isShared,
      })
      .from(claimedPromos)
      .where(eq(claimedPromos.id, claimId))
      .limit(1);

    if (!claim) throw new Error("Claimed promo not found");
    if (!claim.isRedeemed)
      throw new Error("You must redeem this promo before sharing");
    if (claim.isShared) throw new Error("You have already shared this promo");

    // 3. Prevent duplicate sharing
    const [existingShare] = await db
      .select()
      .from(sharedPromos)
      .where(
        and(
          eq(sharedPromos.claimedPromoId, claimId),
          eq(sharedPromos.toCustomerId, recipient.id)
        )
      )
      .limit(1);

    if (existingShare) {
      throw new Error("You have already shared this promo with this person");
    }

    // 4. Fetch promo expiry
    const [promo] = await db
      .select({ endDate: promos.endDate })
      .from(promos)
      .where(eq(promos.id, claim.promoId))
      .limit(1);

    if (!promo) throw new Error("Promo not found");

    // 5. Generate QR
    const qrCode = uuidv4();
    const qrExpiresAt = promo.endDate;

    // 6. Update claim
    await db
      .update(claimedPromos)
      .set({
        isShared: true,
        sharedAt: new Date(),
      })
      .where(eq(claimedPromos.id, claimId));

    // 7. Insert share record
    const [shared] = await db
      .insert(sharedPromos)
      .values({
        promoId: claim.promoId,
        claimedPromoId: claimId,
        fromCustomerId,
        toCustomerId: recipient.id,
        qrCode,
        qrExpiresAt,
        shareTheme: theme || null,
        shareMessage: message || null,
        isRedeemed: false,
      })
      .returning();

    return {
      qrCode: shared.qrCode,
      qrExpiresAt: shared.qrExpiresAt,
      toCustomerId: recipient.id,
      shareTheme: shared.theme,
      shareMessage: shared.message,
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

  async getScannerBusinessId(scannerId, scannerRole) {
    if (scannerRole === "employee") {
      const [employee] = await db
        .select({ businessId: employees.businessId })
        .from(employees)
        .where(eq(employees.id, scannerId))
        .limit(1);

      if (!employee) {
        throw new Error("Employee not found");
      }
      return employee.businessId;
    }

    if (scannerRole === "merchant") {
      // For merchants with multiple businesses, you need to pass businessId
      // This will be handled in the controller
      return null; // Will be provided by controller
    }

    throw new Error("Invalid scanner role");
  },

  async getRedeemedCount(promoId) {
    return await db
      .select({ count: count() })
      .from(claimedPromos)
      .where(
        and(
          eq(claimedPromos.promoId, promoId),
          eq(claimedPromos.isRedeemed, true)
        )
      );
  },

  async getUserRedeemedCount(promoId, customerId) {
    return await db
      .select({ count: count() })
      .from(claimedPromos)
      .where(
        and(
          eq(claimedPromos.promoId, promoId),
          eq(claimedPromos.customerId, customerId),
          eq(claimedPromos.isRedeemed, true)
        )
      );
  },
};

export default promoModel;
