import promoModel from "../models/promoModel.js";

const promoController = {
async createPromo(request, reply) {
  try {
    const {
      businessId,
      title,
      description,
      discountType,
      discountValue,
      conditions,
      startDate,
      endDate,
      validDays,
      maxRedemptions,
      maxRedemptionsPerUser,
      cooldownHours,
      eligibleMemberships,
    } = request.body;

    // Basic validation
    if (
      !businessId ||
      !title ||
      !description ||
      !discountType ||
      discountValue == null ||
      !startDate ||
      !endDate
    ) {
      return reply.status(400).send({
        success: false,
        message: "Missing required fields",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return reply.status(400).send({
        success: false,
        message: "Start date must be before end date",
      });
    }

    const newPromo = await promoModel.createPromo({
      businessId,
      title,
      description,
      discountType,
      discountValue,
      conditions,
      startDate,
      endDate,
      validDays,
      maxRedemptions,
      maxRedemptionsPerUser,
      cooldownHours,
      eligibleMemberships,
    });

    // Emit event to all clients
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

async claimPromo(request, reply) {
  try {
    const promoId = parseInt(request.params.id, 10);
    const customerId = 1; // temporary until auth is implemented

    if (!promoId) {
      return reply.status(400).send({
        success: false,
        message: "Missing promoId",
      });
    }

    const result = await promoModel.claimPromo({
      promoId,
      customerId,
      membershipLevel: null,
    });

    // Emit event to all clients
    request.server.io.emit("promo-claimed", {
      promoId,
      customerId,
      claimedAt: new Date(),
    });

    return reply.status(201).send({
      success: true,
      data: result,
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

      // fetch from DB (you'll need a model function for this)
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
