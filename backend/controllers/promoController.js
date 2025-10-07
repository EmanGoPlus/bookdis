import promoModel from "../models/promoModel.js";
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import db from "../db/config.js";
import { promos, businesses, sharedPromos } from "../db/schema.js";
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

      // Get promo
      const promo = await promoModel.getPromoById(promoId);
      if (!promo || !promo.isActive) {
        return reply.status(404).send({
          success: false,
          message: "Promo not found or inactive",
        });
      }

      // Check promo active period
      if (promo.startDate > now || promo.endDate < now) {
        return reply.status(400).send({
          success: false,
          message: "Promo is not currently active",
        });
      }

      // Check if customer is member of business
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

      // Check promo claim limits
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

      // Create or get existing claim
      const claim = await promoModel.getOrCreateClaimByPromoAndCustomer(
        promoId,
        customerId
      );

      // Emit socket events
      request.server.io.emit("promoUpdate", { promoId });
      request.server.io.to(`customer-${customerId}`).emit("promoClaimed", {
        claim,
        promoId,
      });

      return reply.status(200).send({
        success: true,
        data: claim,
      });
    } catch (error) {
      console.error("Error in claimPromo:", error);
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

      const claim = await promoModel.getOrCreateClaimByPromoAndCustomer(
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

      console.log("🔍 === REDEEM PROMO REQUEST ===");
      console.log("QR Code:", qrCode);
      console.log("User:", employeeOrMerchant.id, employeeOrMerchant.role);

      if (!qrCode) {
        return reply.status(400).send({
          success: false,
          message: "QR code is required",
        });
      }

      // ✅ Use the transaction-based method from promoModel
      try {
        const result = await promoModel.redeemPromoByQr(qrCode);

        console.log("✅ === REDEMPTION SUCCESSFUL ===");
        console.log("Result:", JSON.stringify(result, null, 2));

        // ✅ Emit socket event with ALL necessary data
        const socketData = {
          claimId: result.claimId,
          promoId: result.promoId || result.claimId, // Add promoId if available
          customerId: result.customerId,
          redeemedAt: result.redeemedAt,
          promoTitle: result.promoTitle,
        };

        const customerRoom = `customer-${result.customerId}`;

        console.log("📡 Emitting to room:", customerRoom);
        console.log("📡 Socket data:", JSON.stringify(socketData, null, 2));

        // Emit to the specific customer's room
        request.server.io.to(customerRoom).emit("promoRedeemed", socketData);

        // Emit general update for promo list refresh
        if (result.promoId) {
          request.server.io.emit("promoUpdate", { promoId: result.promoId });
        }

        return reply.status(200).send({
          success: true,
          message: "Promo redeemed successfully",
          data: result,
        });
      } catch (error) {
        console.error("❌ Redemption error:", error.message);

        // Handle specific error messages from the transaction
        if (error.message.includes("invalid")) {
          return reply.status(404).send({
            success: false,
            message: "Invalid QR code",
          });
        }

        if (error.message.includes("already been redeemed")) {
          return reply.status(400).send({
            success: false,
            message: "This promo has already been redeemed",
          });
        }

        if (error.message.includes("expired")) {
          return reply.status(400).send({
            success: false,
            message: "QR code has expired",
          });
        }

        throw error; // Re-throw if not handled
      }
    } catch (error) {
      console.error("❌ Redeem promo error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to redeem promo",
        error: error.message,
      });
    }
  },

  async claimedPromosInventory(request, reply) {
    try {
      const customerId = request.user.id;
      if (!customerId) {
        return reply.status(401).send({
          success: false,
          message: "Unauthorized access.",
        });
      }

      const promos = await promoModel.claimedPromosInventory(customerId);

      return reply.status(200).send({
        success: true,
        data: promos,
      });
    } catch (error) {
      console.error("Error fetching inventory:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to load claimed promos.",
      });
    }
  },

  async sharedPromosInventory(request, reply) {
    try {
      const customerId = request.user?.id;
      if (!customerId) {
        return reply.status(401).send({
          success: false,
          message: "Unauthorized access.",
        });
      }

      const promos = await promoModel.sharedPromosInventory(customerId);

      return reply.status(200).send({
        success: true,
        data: promos,
      });
    } catch (error) {
      console.error(
        `Error fetching shared promos for user ${request.user?.id}:`,
        error
      );

      return reply.status(500).send({
        success: false,
        message: "Failed to load shared promos.",
      });
    }
  },

async sharePromo(request, reply) {
  try {
    const customerId = request.user.id;
    const { claimId, toCustomerPhone } = request.body;

    console.log("📤 Share promo request:", {
      fromCustomerId: customerId,
      claimId,
      toCustomerPhone,
    });

    if (!claimId || !toCustomerPhone) {
      return reply.status(400).send({
        success: false,
        message: "Missing required fields: claimId and toCustomerPhone",
      });
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(toCustomerPhone)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid phone number format. Must be 11 digits starting with 09",
      });
    }

    // ✅ Call the MODEL method (all logic is in the model)
    const result = await promoModel.sharePromo(
      customerId,
      claimId,
      toCustomerPhone
    );

    console.log("✅ Promo shared successfully:", result);

    const recipientRoom = `customer-${result.toCustomerId}`;
    request.server.io.to(recipientRoom).emit("promoShared", {
      message: "You received a new promo!",
      fromCustomerId: customerId,
    });

    return reply.status(200).send({
      success: true,
      message: "Promo shared successfully",
      data: {
        qrCode: result.qrCode,
        qrExpiresAt: result.qrExpiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Error sharing promo:", error);
    return reply.status(500).send({
      success: false,
      message: error.message || "Failed to share promo",
    });
  }
},

// In promoController.js
async verifyRecipient(request, reply) {
  try {
    const { phone } = request.body;

    console.log("🔍 Verifying recipient:", phone);

    if (!phone) {
      return reply.status(400).send({
        success: false,
        message: "Phone number is required",
      });
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Use the model method to find customer
    const customer = await promoModel.findCustomerByPhone(phone);

    if (!customer) {
      return reply.status(404).send({
        success: false,
        message: "No user found with this phone number",
      });
    }

    // Check if trying to share with self
    if (customer.id === request.user.id) {
      return reply.status(400).send({
        success: false,
        message: "You cannot share a promo with yourself",
      });
    }

    console.log("✅ Recipient verified:", customer.firstName);

    return reply.status(200).send({
      success: true,
      message: "Recipient found",
      data: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying recipient:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to verify recipient",
    });
  }
},
};

export default promoController;
