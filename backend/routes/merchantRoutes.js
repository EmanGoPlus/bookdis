import userController from "../controllers/userController.js";
import businessController from "../controllers/businessController.js";
import authenticateToken from "../middlewares/auth.js";
import fastifyMultipart from "@fastify/multipart";

async function userRoutes(fastify, options) {

  fastify.register(fastifyMultipart, {
    // ✅ Removed attachFieldsToBody to allow manual processing
    limits: {
      fileSize: 6 * 1024 * 1024, // 6 MB max per file
    },
  });

  fastify.post("/login", userController.merchantLogin);

  fastify.post("/register", userController.merchantRegister);

  fastify.post("/create-business", {
    preHandler: authenticateToken, // JWT middleware / requires login
    handler: businessController.createBusiness, // your controller
  });

  fastify.get(
    "/my-businesses",
    { preHandler: authenticateToken },
    businessController.getMyBusinesses
  );

  fastify.post(
    "/upload-documents",
    { preHandler: authenticateToken },
    businessController.uploadDocuments
  );

  // Get documents for a business
  fastify.get("/documents/:businessId", {
    preHandler: authenticateToken,
    handler: businessController.getDocuments,
  });

  // Admin: verify a document
  // fastify.put("/verify-document/:documentId", {
  //   preHandler: authenticateToken, // you can add admin role check inside controller
  //   handler: businessController.verifyDocument,
  // });
}

export default userRoutes;