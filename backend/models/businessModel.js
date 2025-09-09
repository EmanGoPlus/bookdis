import db from "../db/config.js";
import { businesses } from "../db/schema.js";
import { businessDocuments } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const businessModel = {

  //: Fetch a single business by its unique
  async getBusinessById(businessId) {
    try {
      const result = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Database error in getById:", error);
      throw error;
    }
  },

  //Fetch all businesses that belong to a given user.
  async getBusinessesByUser(userId) {
  try {
    const result = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, userId));

    return result;
  } catch (error) {
    console.error("❌ Error in businessModel.getBusinessesByUser:", error);
    throw error;
  }
},


    
  async createBusiness(userId, businessData) {
    try {
      const {
        businessName,
        mainCategory,
        subCategory,
        logo,
        region,
        province,
        city,
        barangay,
        postalCode,
        addressDetails,
        openTime,
        closeTime,
      } = businessData;

      const result = await db
        .insert(businesses)
        .values({
          userId,
          businessName,
          mainCategory,
          subCategory,
          logo,
          region,
          province,
          city,
          barangay,
          postalCode,
          addressDetails,
          openTime,
          closeTime,
        })
        .returning({
          id: businesses.id,
          businessName: businesses.businessName,
          mainCategory: businesses.mainCategory,
          subCategory: businesses.subCategory,
          logo: businesses.logo,
          region: businesses.region,
          province: businesses.province,
          city: businesses.city,
          barangay: businesses.barangay,
          postalCode: businesses.postalCode,
          addressDetails: businesses.addressDetails,
          openTime: businesses.openTime,
          closeTime: businesses.closeTime,
          verificationStatus: businesses.verificationStatus,
        });

      if (!result || result.length === 0) {
        throw new Error("Failed to insert business - no data returned");
      }

      return result[0];
    } catch (error) {
      console.error("Database error in createBusiness:", error);
      throw error;
    }
  },

  // Create a new document record
async uploadDocuments(businessId, docs) {
    try {
      const { governmentID, businessPermit, DTI, taxID } = docs;

      const result = await db
        .insert(businessDocuments)
        .values({
          businessId,
          governmentID,
          businessPermit,
          DTI,
          taxID,
          isVerified: false,
          rejectedReason: null,
        })
        .returning({
          id: businessDocuments.id,
          businessId: businessDocuments.businessId,
          governmentID: businessDocuments.governmentID,
          businessPermit: businessDocuments.businessPermit,
          DTI: businessDocuments.DTI,
          taxID: businessDocuments.taxID,
          isVerified: businessDocuments.isVerified,
          rejectedReason: businessDocuments.rejectedReason,
          createdAt: businessDocuments.createdAt,
          updatedAt: businessDocuments.updatedAt,
        });

      if (!result || result.length === 0) {
        throw new Error("Failed to insert business documents - no data returned");
      }

      return result[0];
    } catch (error) {
      console.error("Database error in uploadDocuments:", error);
      throw error;
    }
  },

  // Get documents by business
  async getByBusiness(businessId) {
    try {
      const result = await db
        .select()
        .from(businessDocuments)
        .where(eq(businessDocuments.businessId, businessId)); // ✅ Fixed: Use eq() function consistently
      return result;
    } catch (error) {
      console.error("Database error in getByBusiness:", error);
      throw error;
    }
  },

  // Update documents (overwrite files, reset verification)
  async updateByBusiness(businessId, docs) {
    try {
      const result = await db
        .update(businessDocuments)
        .set({
          ...docs,
          isVerified: false,
          rejectedReason: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(businessDocuments.businessId, businessId)) // ✅ Fixed: Use eq() function consistently
        .returning();

      if (!result || result.length === 0) {
        throw new Error(
          "Failed to update business documents - no data returned"
        );
      }

      return result[0];
    } catch (error) {
      console.error("Database error in updateByBusiness:", error);
      throw error;
    }
  },

  // Admin: mark as verified or rejected
  async setStatus(documentId, verified, reason) {
    try {
      const result = await db
        .update(businessDocuments)
        .set({
          isVerified: verified,
          rejectedReason: verified ? null : reason || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(businessDocuments.id, documentId)) // ✅ Fixed: Use eq() function consistently
        .returning();

      if (!result || result.length === 0) {
        throw new Error("Failed to update document status - no data returned");
      }

      return result[0];
    } catch (error) {
      console.error("Database error in setStatus:", error);
      throw error;
    }
  },
};

export default businessModel;