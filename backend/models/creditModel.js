import db from "../db/config.js";
import { eq, desc } from "drizzle-orm";
import { businesses, creditTransactions } from "../db/schema.js";

const creditModel = {
  // Get credit balance for a business
  async getCredits(businessId) {
    const [business] = await db
      .select({
        balance: businesses.creditsBalance,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    return business?.balance || 0;
  },

  // Get credit transaction history for a business
  async getHistory(businessId) {
    const history = await db
      .select({
        id: creditTransactions.id,
        type: creditTransactions.type,
        amount: creditTransactions.amount,
        description: creditTransactions.description,
        referenceNo: creditTransactions.referenceNo,
        createdAt: creditTransactions.createdAt
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.businessId, businessId))
      .orderBy(desc(creditTransactions.createdAt));

    return history;
  },

  // Check if business exists and belongs to user
  async checkBusinessOwnership(businessId, userId) {
    const [business] = await db
      .select({ 
        id: businesses.id, 
        userId: businesses.userId,
        businessName: businesses.businessName
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    
    return business && business.userId === userId ? business : null;
  }
};

export default creditModel;