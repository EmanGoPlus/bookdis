import membershipModel from "../models/membershipModel.js";

const membershipController = {

  async createMembership(request, reply) {
    try {
      const { customerId, businessId, membershipLevel, isActive } = request.body;

      if (!customerId || !businessId) {
        return reply.status(400).send({
          success: false,
          message: "customerId and businessId are required",
        });
      }

      const newMembership = await membershipModel.createMembership({
        customerId,
        businessId,
        membershipLevel: membershipLevel || "regular",
        isActive: isActive ?? true,
      });

      return reply.status(201).send({
        success: true,
        data: newMembership[0],
      });
    } catch (err) {
      console.error("Create membership error:", err);
      return reply.status(500).send({
        success: false,
        message: err.message,
      });
    }
  },

  async getMembership(request, reply) {
    try {
      const { customerId, businessId } = request.query;

      if (!customerId || !businessId) {
        return reply.status(400).send({
          success: false,
          message: "customerId and businessId are required",
        });
      }

      const membership = await membershipModel.getMembershipByCustomerAndBusiness(
        parseInt(customerId),
        parseInt(businessId)
      );

      if (!membership) {
        return reply.status(404).send({
          success: false,
          message: "Membership not found",
        });
      }

      return reply.status(200).send({
        success: true,
        data: membership,
      });
    } catch (err) {
      console.error("Get membership error:", err);
      return reply.status(500).send({
        success: false,
        message: err.message,
      });
    }
  },

  async deactivateMembership(request, reply) {
    try {
      const { customerId, businessId } = request.body;

      if (!customerId || !businessId) {
        return reply.status(400).send({
          success: false,
          message: "customerId and businessId are required",
        });
      }

      const updated = await membershipModel.deactivateMembership(
        parseInt(customerId),
        parseInt(businessId)
      );

      return reply.status(200).send({
        success: true,
        data: updated,
      });
    } catch (err) {
      console.error("Deactivate membership error:", err);
      return reply.status(500).send({
        success: false,
        message: err.message,
      });
    }
  },

};

export default membershipController;
