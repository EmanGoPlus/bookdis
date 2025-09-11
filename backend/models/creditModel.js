import db from "../db/config.js";
import { eq, desc, and } from "drizzle-orm";

import { merchants, businesses, creditTransactions } from "../db/schema.js";

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

  // Check if business exists and user has access (merchant owner OR employee)
  async checkBusinessAccess(businessId, userId, userRole) {
    console.log("🔍 checkBusinessAccess called with:", { businessId, userId, userRole });
    
    if (userRole === 'merchant') {
      // For merchants, check ownership
      const [business] = await db
        .select({ 
          id: businesses.id, 
          userId: businesses.userId,
          businessName: businesses.businessName
        })
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      
      console.log("🔍 Merchant business check result:", business);
      return business && business.userId === userId ? business : null;
      
    } else if (userRole === 'employee') {
      // For employees, check if they belong to this business
      console.log("🔍 Checking employee access...");
      
      const [employee] = await db
        .select({ 
          id: merchants.id,
          businessId: merchants.businessId,
          role: merchants.role
        })
        .from(merchants)
        .where(and(
          eq(merchants.id, userId),
          eq(merchants.businessId, businessId),
          eq(merchants.role, 'employee')
        ))
        .limit(1);

      console.log("🔍 Employee check result:", employee);

      if (employee) {
        // Get business details
        const [business] = await db
          .select({ 
            id: businesses.id, 
            businessName: businesses.businessName
          })
          .from(businesses)
          .where(eq(businesses.id, businessId))
          .limit(1);
        
        console.log("🔍 Business details for employee:", business);
        return business || null;
      }
      
      return null;
    }
    
    console.log("🔍 Unknown role or no role provided");
    return null;
  }
};

export default creditModel;