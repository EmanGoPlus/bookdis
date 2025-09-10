import userController from "../controllers/userController.js";
import businessController from "../controllers/businessController.js";
import creditController from "../controllers/creditController.js";
import authenticateToken from "../middlewares/auth.js";
import fastifyMultipart from "@fastify/multipart";

async function userRoutes(fastify, options) {
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 6 * 1024 * 1024, // 6 MB max per file
    },
  });

    //=============================USERS=============================

  fastify.post("/login", userController.merchantLogin);

  fastify.post("/register", userController.merchantRegister);

    //=============================BUSINESS=============================

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

  fastify.get(
    "/business/:businessId",
    { preHandler: authenticateToken },
    businessController.getBusinessById
  );


  //=============================CREDITS=============================

  // Get credits balance and history for a business
  fastify.get("/business/:id/credits", {
    preHandler: authenticateToken,
    handler: creditController.getCredits
  });

  // Get only credit transaction history for a business
  fastify.get("/business/:id/credits-history", {
    preHandler: authenticateToken,
    handler: creditController.getHistory
  });
}


export default userRoutes;
