import creditModel from "../models/creditModel.js";

const creditsController = {
  // Get credits balance and transaction history
  async getCredits(request, reply) {
    try {
      const userId = request.user.id;
      const businessId = parseInt(request.params.id, 10);

      if (isNaN(businessId)) {
        return reply.status(400).send({ error: "Invalid business ID" });
      }

      // Check if business exists and belongs to the user
      const business = await creditModel.checkBusinessOwnership(businessId, userId);
      if (!business) {
        return reply.status(404).send({ error: "Business not found or access denied" });
      }

      const balance = await creditModel.getCredits(businessId);
      const history = await creditModel.getHistory(businessId);

      return { 
        businessId: business.id,
        businessName: business.businessName,
        balance, 
        history,
        totalTransactions: history.length
      };
    } catch (err) {
      console.error("Error getting credits:", err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  },

  // Get only transaction history
  async getHistory(request, reply) {
    try {
      const userId = request.user.id;
      const businessId = parseInt(request.params.id, 10);

      if (isNaN(businessId)) {
        return reply.status(400).send({ error: "Invalid business ID" });
      }

      // Check if business exists and belongs to the user
      const business = await creditModel.checkBusinessOwnership(businessId, userId);
      if (!business) {
        return reply.status(404).send({ error: "Business not found or access denied" });
      }

      const history = await creditModel.getHistory(businessId);
      
      return { 
        businessId: business.id,
        businessName: business.businessName,
        history,
        totalTransactions: history.length
      };
    } catch (err) {
      console.error("Error getting credit history:", err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
};

export default creditsController;