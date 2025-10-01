import promoModel from "../models/promoModel.js";
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

import  db  from "../db/config.js"; 
import { promos, businesses } from "../db/schema.js";
import { and, eq, lte, gte } from "drizzle-orm";

const pump = promisify(pipeline);

const promoController = {

  async createPromo(request, reply) {
    try {
      const parts = request.parts();
      let promoFields = {};
      let imagePath = null;

      for await (const part of parts) {
        if (part.file) {
          const uploadDir = path.join(process.cwd(), "uploads", "promo");
          fs.mkdirSync(uploadDir, { recursive: true });

          const filename = `${Date.now()}_${part.filename}`;
          const filepath = path.join(uploadDir, filename);

          await pump(part.file, fs.createWriteStream(filepath));
          imagePath = `uploads/promo/${filename}`;
        } else {
          promoFields[part.fieldname] = part.value;
        }
      }

      if (
        !promoFields.businessId ||
        !promoFields.title ||
        !promoFields.description ||
        !promoFields.promoType ||
        !promoFields.startDate ||
        !promoFields.endDate
      ) {
        return reply.status(400).send({
          success: false,
          message: "Missing required fields",
        });
      }

      if (new Date(promoFields.startDate) >= new Date(promoFields.endDate)) {
        return reply.status(400).send({
          success: false,
          message: "Start date must be before end date",
        });
      }


      const promoData = {
        businessId: parseInt(promoFields.businessId),
        title: promoFields.title,
        description: promoFields.description,
        promoType: promoFields.promoType,
        startDate: promoFields.startDate,
        endDate: promoFields.endDate,
        imageUrl: imagePath, 
      };

      if (promoFields.maxClaims) {
        promoData.maxClaims = parseInt(promoFields.maxClaims);
      }

      if (promoFields.maxClaimsPerUser) {
        promoData.maxClaimsPerUser = parseInt(promoFields.maxClaimsPerUser);
      }

      if (promoFields.eligibleMemberships) {
        promoData.eligibleMemberships = promoFields.eligibleMemberships;
      }

      const newPromo = await promoModel.createPromo(promoData);

      request.server.io.emit("promo-created", newPromo);

      return reply.status(201).send({
        success: true,
        data: newPromo,
      });
    } catch (error) {
      console.error("Create promo error:", error);
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  async getPromos(request, reply) {//not used anymore
    try {
      const promos = await promoModel.getPromos();
      return reply.send({
        success: true,
        data: promos,
      });
    } catch (error) {
      console.error("List promos error:", error);
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  async getAvailablePromos(request, reply) {
    try {
      const now = new Date();

      const result = await db
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

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        success: false,
        message: "Failed to fetch promos",
        details: err.details || err.message || "Unexpected error"
      });
    }
  },

async claimPromo(request, reply) {
  try {
    const promoId = parseInt(request.params.id, 10);
    const customerId = request.user.id; // Use the actual logged-in customer ID from JWT
    const now = new Date();

    if (!promoId) {
      return reply.status(400).send({
        success: false,
        message: "Missing promoId",
      });
    }

    // 1. Get promo - FIXED: No db parameter needed
    const promo = await promoModel.getPromoById(promoId);
    if (!promo || !promo.isActive) {
      return reply.status(404).send({
        success: false,
        message: "Promo not found or inactive",
      });
    }

    // 2. Check promo date validity
    if (promo.startDate > now || promo.endDate < now) {
      return reply.status(400).send({
        success: false,
        message: "Promo is not currently active",
      });
    }

    // 3. Check membership - FIXED: No db parameter needed
    const membership = await promoModel.getMembership(customerId, promo.businessId);
    if (!membership) {
      return reply.status(403).send({
        success: false,
        message: "You are not a member of this business",
      });
    }

    // 4. Check overall claim limit - FIXED: No db parameter needed
    if (promo.maxClaims > 0) {
      const claimedCount = await promoModel.getClaimCount(promoId);
      if (claimedCount[0].count >= promo.maxClaims) {
        return reply.status(400).send({
          success: false,
          message: "Promo has been fully claimed",
        });
      }
    }

    // 5. Check per-user claim limit - FIXED: No db parameter needed
    if (promo.maxClaimsPerUser > 0) {
      const userClaims = await promoModel.getUserClaimCount(promoId, customerId);
      if (userClaims[0].count >= promo.maxClaimsPerUser) {
        return reply.status(400).send({
          success: false,
          message: "You already reached your claim limit",
        });
      }
    }

    // 6. Generate QR + insert claim - FIXED: No db parameter needed
    const qrCode = crypto.randomUUID();
    const qrExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [claim] = await promoModel.insertClaim({
      promoId,
      customerId,
      qrCode,
      qrExpiresAt,
    });

    // 7. Notify sockets
    request.server.io.emit("promo-claimed", {
      promoId,
      customerId,
      claimedAt: now,
    });

    return reply.status(201).send({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error("Claim promo error:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to claim promo",
      error: error.message,
    });
  }
},


  async getPromoById(request, reply) {
    try {
      const promoId = parseInt(request.params.id, 10);
      if (!promoId) {
        return reply.status(400).send({
          success: false,
          message: "Missing promoId",
        });
      }

      const promo = await promoModel.getPromoById(promoId);

      if (!promo) {
        return reply.status(404).send({
          success: false,
          message: "Promo not found",
        });
      }

      return reply.send({
        success: true,
        data: promo,
      });
    } catch (err) {
      console.error("Get promo error:", err);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch promo",
      });
    }
  },
};

export default promoController;