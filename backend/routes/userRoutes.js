import userController from "../controllers/userController.js";
import businessController from "../controllers/businessController.js";
import creditController from "../controllers/creditController.js";
import permissionController from "../controllers/permissionController.js";

import authenticateToken from "../middlewares/auth.js";
import fastifyMultipart from "@fastify/multipart";

async function userRoutes(fastify, options) {
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 6 * 1024 * 1024,
    },
  });

  //=============================USERS=============================

  fastify.post("/merchant-login", userController.merchantLogin);

  fastify.post("/employee-login", userController.employeeLogin);

  fastify.post("/login", userController.combinedLogin);

  fastify.post("/register", userController.merchantRegister); //fix next week

  fastify.post("/employee-register", userController.employeeRegister);

  //=============================BUSINESS=============================

  fastify.post("/create-business", {
    preHandler: authenticateToken,
    handler: businessController.createBusiness,
  });

  fastify.get(
    "/merchant/my-businesses",
    { preHandler: authenticateToken },
    businessController.getMyBusinesses
  );

  fastify.post(
    "/upload-documents",
    { preHandler: authenticateToken },
    businessController.uploadDocuments
  );

  fastify.get("/documents/:businessId", {
    preHandler: authenticateToken,
    handler: businessController.getDocuments,
  });

  fastify.get( //used by employee and merchant
    "/business/:businessId",
    { preHandler: authenticateToken },
    businessController.getBusinessById
  );

  //=============================Permissions=============================

  fastify.post(
    "/permissions/toggle",
    permissionController.toggleElementVisibility
  );

  fastify.get(
    "/permissions/check/:employeeId/:elementKey",
    permissionController.checkElementVisibility
  );

  //=============================CREDITS=============================
  fastify.get("/business/:id/credits", {
    preHandler: authenticateToken,
    handler: creditController.getCredits,
  });

  fastify.get("/business/:id/credits-history", {
    preHandler: authenticateToken,
    handler: creditController.getHistory,
  });
}

export default userRoutes;
