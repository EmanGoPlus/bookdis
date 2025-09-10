import businessModel from "../models/businessModel.js";
import jwt from 'jsonwebtoken';
import fs from "fs";
import path from "path";
import util from "util";
import { pipeline } from "stream";

const pump = util.promisify(pipeline);

const businessController = {

async createBusiness(request, reply) {
    try {
      const userId = request.user?.id || request.body.userId;
      if (!userId) return reply.status(400).send({ error: "User ID is required" });

      const parts = request.parts(); // handle multipart form
      let businessFields = {};
      let logoPath = null;

      for await (const part of parts) {
        if (part.file) {
          const uploadDir = path.join(process.cwd(), "uploads", "logo");
          fs.mkdirSync(uploadDir, { recursive: true });

          const filename = `${Date.now()}_${part.filename}`;
          const filepath = path.join(uploadDir, filename);

          await pump(part.file, fs.createWriteStream(filepath));
          logoPath = `uploads/logo/${filename}`;
        } else {
          businessFields[part.fieldname] = part.value;
        }
      }

      // Call the model — controller no longer touches db
      const newBusiness = await businessModel.createBusiness(userId, {
        ...businessFields,
        logo: logoPath,
      });

      return reply.status(201).send({
        message: "Business created successfully",
        business: newBusiness,
      });
    } catch (err) {
      console.error("Error creating business:", err);
      return reply.status(500).send({ error: "Failed to create business" });
    }
  },

async getMyBusinesses(request, reply) {
  try {
    const userId = request.user.id; // comes from JWT
    const businesses = await businessModel.getBusinessesByUser(userId);

    return reply.send({ success: true, data: businesses });
  } catch (err) {
    console.error("❌ Controller error:", err);
    return reply.status(500).send({
      success: false,
      error: "Failed to fetch businesses",
    });
  }
},


async uploadDocuments(request, reply) {
  try {
    // Process multipart data similar to createBusiness
    const parts = request.parts();
    let businessId = null;
    let uploadedFiles = {};

    console.log("🔍 Processing multipart data...");

    // Process each part of the multipart form
    for await (const part of parts) {
      console.log(`📝 Processing part: ${part.fieldname}, isFile: ${!!part.file}`);
      
      if (part.file) {
        // Handle file upload
        const uploadDir = path.join(process.cwd(), "uploads", "documents");
        fs.mkdirSync(uploadDir, { recursive: true });

        const filename = `${Date.now()}_${part.filename}`;
        const filepath = path.join(uploadDir, filename);

        console.log(`📁 Saving file: ${part.fieldname} -> ${filepath}`);
        await pump(part.file, fs.createWriteStream(filepath));
        
        // Store the relative path for database
        uploadedFiles[part.fieldname] = `uploads/documents/${filename}`;
      } else {
        // Handle form fields
        console.log(`📋 Form field: ${part.fieldname} = ${part.value}`);
        if (part.fieldname === 'businessId') {
          businessId = part.value;
        }
      }
    }

    console.log(`🏢 Final businessId: ${businessId}`);
    console.log(`📂 Uploaded files:`, uploadedFiles);

    const userId = request.user.id;

    if (!businessId) {
      console.log("❌ Business ID is missing");
      return reply.status(400).send({ error: "Business ID is required" });
    }
    
    const business = await businessModel.getBusinessById(businessId);
    if (!business) {
      return reply.status(404).send({ error: "Business not found" });
    }
    if (business.userId !== userId) {
      return reply.status(403).send({ error: "Unauthorized access" });
    }

    const docs = {
      governmentID: uploadedFiles.governmentID || null,
      businessPermit: uploadedFiles.businessPermit || null,
      DTI: uploadedFiles.DTI || null,
      taxID: uploadedFiles.taxID || null,
    };

    console.log("📁 Uploaded documents:", docs); // Debug log

    const documentRecord = await businessModel.uploadDocuments(businessId, docs);

    return reply.status(200).send({
      message: "Documents uploaded successfully",
      data: documentRecord,
    });
  } catch (error) {
    console.error("Error uploading documents:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
},


  // Get documents for a business
  async getDocuments(req, res) {
    try {
      const { businessId } = req.params;
      const documents = await businessModel.getByBusiness(businessId);
      return res.status(200).json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // Admin: approve or reject a document
  async verifyDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { isVerified, rejectedReason } = req.body;

      const updated = await businessModel.setStatus(documentId, isVerified, rejectedReason);
      return res.status(200).json({ message: "Document status updated", data: updated });
    } catch (error) {
      console.error("Error verifying document:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

async getBusinessById(request, reply) {
  try {
    const { businessId } = request.params;

    if (!businessId) {
      return reply.status(400).send({ error: "Business ID is required" });
    }

    const business = await businessModel.getBusinessById(Number(businessId));

    if (!business) {
      return reply.status(404).send({ error: "Business not found" });
    }

    // Debug: Log the raw business data
    console.log("🏢 Raw business data:", business);
    console.log("🏢 Available keys:", Object.keys(business));
    console.log("🏢 Logo field:", business.logo); // This should contain the logo path

    // The business.logo already contains the logo_url value from the database
    // No need to map logo_url to logo since Drizzle already does this
    const responseBusiness = {
      ...business,
      // logo is already available from the schema mapping
    };

    console.log("🏢 Response business data:", responseBusiness);

    return reply.status(200).send({ data: responseBusiness });
  } catch (err) {
    console.error("❌ Error fetching business:", err);
    return reply.status(500).send({ error: "Internal server error" });
  }
}

  
}

export default businessController;