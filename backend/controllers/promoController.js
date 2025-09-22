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

      // basic validation
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

      if (conditions && typeof conditions !== "object") {
        return reply.status(400).send({
          success: false,
          message: "Conditions must be an object",
        });
      }

      if (eligibleMemberships && !Array.isArray(eligibleMemberships)) {
        return reply.status(400).send({
          success: false,
          message: "Eligible memberships must be an array",
        });
      }

      console.log("Request data:", {
        businessId,
        title: title.length,
        description: description.length,
        discountType,
        discountValue,
        validDays,
        eligibleMemberships
      });

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

      return reply.status(201).send({
        success: true,
        data: newPromo,
      });
    } catch (error) {
      // Log the full error details
      console.error("Full error:", error);
      console.error("Error code:", error.code);
      console.error("Error detail:", error.detail);
      
      return reply.status(500).send({
        success: false,
        message: error.message,
        // Add more error details in development
        errorCode: error.code,
        errorDetail: error.detail
      });
    }
  },
};

export default promoController