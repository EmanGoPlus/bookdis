import promoModel from "../models/promoModel.js";
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import db from "../db/config.js";
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

      // in createPromo
      request.server.io.emit("promoUpdate", {
        promoId: newPromo.id,
        promo: newPromo,
      });

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

  async getPromos(request, reply) {
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
        details: err.details || err.message || "Unexpected error",
      });
    }
  },

  async claimPromo(request, reply) {
    try {
      const promoId = parseInt(request.params.id, 10);
      const customerId = request.user.id;
      const now = new Date();

      if (!promoId) {
        return reply.status(400).send({
          success: false,
          message: "Missing promoId",
        });
      }

      const promo = await promoModel.getPromoById(promoId);
      if (!promo || !promo.isActive) {
        return reply.status(404).send({
          success: false,
          message: "Promo not found or inactive",
        });
      }

      if (promo.startDate > now || promo.endDate < now) {
        return reply.status(400).send({
          success: false,
          message: "Promo is not currently active",
        });
      }

      const membership = await promoModel.getMembership(
        customerId,
        promo.businessId
      );
      if (!membership) {
        return reply.status(403).send({
          success: false,
          message: "You are not a member of this business",
        });
      }

      if (promo.maxClaims > 0) {
        const claimedCount = await promoModel.getClaimCount(promoId);
        if (claimedCount[0].count >= promo.maxClaims) {
          return reply.status(400).send({
            success: false,
            message: "Promo has been fully claimed",
          });
        }
      }

      if (promo.maxClaimsPerUser > 0) {
        const userClaims = await promoModel.getUserClaimCount(
          promoId,
          customerId
        );
        if (userClaims[0].count >= promo.maxClaimsPerUser) {
          return reply.status(400).send({
            success: false,
            message: "You already reached your claim limit",
          });
        }
      }

      const qrCode = crypto.randomUUID();
      const qrExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const [claim] = await promoModel.insertClaim({
        promoId,
        customerId,
        qrCode,
        qrExpiresAt,
      });

      request.server.io.emit("promoUpdate", { promoId });

      request.server.io.to(`customer-${customerId}`).emit("promoClaimed", {
        claim,
        promoId,
      });

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

  async getClaimedPromos(request, reply) {
    try {
      const customerId = request.user.id;
      const claims = await promoModel.getClaimsByCustomer(customerId);

      return reply.status(200).send({
        success: true,
        data: claims,
      });
    } catch (error) {
      console.error("Error fetching claimed promos:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch claimed promos",
        error: error.message,
      });
    }
  },

  async getClaimForPromo(request, reply) {
    try {
      const promoId = parseInt(request.params.id, 10);
      const customerId = request.user.id;

      const claim = await promoModel.getClaimByPromoAndCustomer(
        promoId,
        customerId
      );

      if (!claim) {
        return reply.status(404).send({
          success: false,
          message: "No claim found for this promo",
        });
      }

      return reply.status(200).send({
        success: true,
        data: claim,
      });
    } catch (error) {
      console.error("Error fetching claim:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to fetch claim",
        error: error.message,
      });
    }
  },

  async redeemPromo(request, reply) {
    try {
      const { qrCode } = request.body;
      const employeeOrMerchant = request.user;
      const now = new Date();

      if (!qrCode) {
        return reply.status(400).send({
          success: false,
          message: "QR code is required",
        });
      }

      // 1. Find the claim by QR code
      const claim = await promoModel.getClaimByQrCode(qrCode);
      console.log("=== CLAIM FOUND ===", claim);

      if (!claim) {
        return reply.status(404).send({
          success: false,
          message: "Invalid QR code - claim not found",
        });
      }

      // 2. Check if already redeemed
      if (claim.isRedeemed) {
        return reply.status(400).send({
          success: false,
          message: "This promo has already been redeemed",
          redeemedAt: claim.redeemedAt,
        });
      }

      // 3. Check if QR code has expired
      if (claim.qrExpiresAt < now) {
        return reply.status(400).send({
          success: false,
          message: "QR code has expired",
          expiredAt: claim.qrExpiresAt,
        });
      }

      // 4. Verify the employee/merchant belongs to the same business as the promo
      const business = await promoModel.getBusinessByPromo(claim.promoId);

      if (!business) {
        return reply.status(404).send({
          success: false,
          message: "Business not found for this promo",
        });
      }

      if (employeeOrMerchant.role === "employee") {
        if (employeeOrMerchant.businessId !== business.businessId) {
          return reply.status(403).send({
            success: false,
            message:
              "You are not authorized to redeem promos for this business",
          });
        }
      }

      if (employeeOrMerchant.role === "merchant") {
        const merchantBusiness = await promoModel.getBusinessByMerchant(
          employeeOrMerchant.id
        );

        if (
          !merchantBusiness ||
          merchantBusiness.businessId !== business.businessId
        ) {
          return reply.status(403).send({
            success: false,
            message:
              "You are not authorized to redeem promos for this business",
          });
        }
      }

      // 5. Mark as redeemed
      const redeemedClaim = await promoModel.redeemClaim(claim.claimId);
      console.log("=== REDEEMED CLAIM ===", redeemedClaim);

      // 6. IMPORTANT: Emit socket event to the specific customer with ALL necessary data
      const socketData = {
        claimId: claim.claimId,
        promoId: claim.promoId,
        customerId: claim.customerId,
        redeemedAt: redeemedClaim.redeemedAt || now,
        promoTitle: claim.promoTitle,
      };

      const customerRoom = `customer-${claim.customerId}`;

      console.log("=== EMITTING TO ROOM ===", customerRoom);
      console.log("=== SOCKET DATA ===", JSON.stringify(socketData, null, 2));

      // Emit to the specific customer's room
      request.server.io.to(customerRoom).emit("promoRedeemed", socketData);

      // Also emit to check connected sockets in the room (for debugging)
      const socketsInRoom = await request.server.io
        .in(customerRoom)
        .fetchSockets();
      console.log(
        `=== SOCKETS IN ROOM ${customerRoom} ===`,
        socketsInRoom.length
      );

      // 7. Emit general update for promo list refresh (to all users)
      request.server.io.emit("promoUpdate", { promoId: claim.promoId });

      return reply.status(200).send({
        success: true,
        message: "Promo redeemed successfully",
        data: {
          claimId: redeemedClaim.id,
          promoTitle: claim.promoTitle,
          customerName: `${claim.customerFirstName} ${claim.customerLastName}`,
          redeemedAt: redeemedClaim.redeemedAt,
        },
      });
    } catch (error) {
      console.error("Redeem promo error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to redeem promo",
        error: error.message,
      });
    }
  },
};

export default promoController;
