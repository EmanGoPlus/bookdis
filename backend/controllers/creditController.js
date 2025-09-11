import creditModel from "../models/creditModel.js";

const creditsController = {

 async getCredits(request, reply) {
  try {
    const businessId = parseInt(request.params.id, 10);
    const balance = await creditModel.getCredits(businessId);
    const history = await creditModel.getHistory(businessId);

    return { balance, history };
  } catch (err) {
    console.error("❌ Error in getCredits:", err); 
    return reply.status(500).send({ error: err.message });
  }
},


  async getHistory(request, reply) {
    try {
      const userId = request.user.id;
      const userRole = request.user.role;
      const businessId = parseInt(request.params.id, 10);

      if (isNaN(businessId)) {
        return reply.status(400).send({ error: "Invalid business ID" });
      }

      // UPDATED: Use the new access check method
      const business = await creditModel.checkBusinessAccess(businessId, userId, userRole);
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