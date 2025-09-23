import userController from "../controllers/userController.js";
import businessController from "../controllers/businessController.js";
import creditController from "../controllers/creditController.js";
import permissionController from "../controllers/permissionController.js";
import promoController from "../controllers/promoController.js";
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

  fastify.post("/register", userController.merchantRegister); //fix the name next week

  fastify.post("/employee-register", userController.employeeRegister);

  fastify.post("/customer-login", userController.customerLogin);

  fastify.post("/customer-register", userController.customerRegister);

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

  fastify.get(

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

  //=============================PROMOS=============================
  fastify.post("/business/create-promo", {
    preHandler: authenticateToken,
    handler: promoController.createPromo,
  });

  fastify.get("/customer/promos", promoController.getPromos);

  fastify.post("/customer/claim-promo/:id", {
    handler: promoController.claimPromo,
  });

  fastify.get("/customer/promo/:id", {
    handler: promoController.getPromoById,
  });
}

export default userRoutes;
