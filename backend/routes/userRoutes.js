import userController from "../controllers/userController.js";
import businessController from "../controllers/businessController.js";
import creditController from "../controllers/creditController.js";
import permissionController from "../controllers/permissionController.js";
import promoController from "../controllers/promoController.js";
import membershipController from "../controllers/membershipController.js";
import friendController from "../controllers/friendController.js";
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

  fastify.post("/register", userController.merchantRegister); //fix the name next week // hahahha hindi pa rin naayos tagal na nyan ah!

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

  fastify.get("/business/available-promos", {
    preHandler: authenticateToken,
    handler: promoController.getAvailablePromos,
  });

  fastify.get("/customer/claim-promo/:id", {
    preHandler: authenticateToken,
    handler: promoController.claimPromo,
  });

  fastify.get("/customer/promos", {
    preHandler: authenticateToken,
    handler: promoController.getPromos,
  });

  fastify.post("/customer/claim-promo/:id", {
    preHandler: authenticateToken,
    handler: promoController.claimPromo,
  });

  fastify.get("/customer/promo/:id", {
    handler: promoController.getPromoById,
  });

  fastify.get("/customer/claimed-promos", {
    preHandler: authenticateToken,
    handler: promoController.getClaimedPromos,
  });

  fastify.get("/customer/promos/:id/qr", {
    preHandler: authenticateToken,
    handler: promoController.getClaimForPromo,
  });

   fastify.post("/business/get-promo-details", {
     preHandler: authenticateToken,
    handler: promoController.getPromoDetailsByQRCode,
   });

     fastify.post("/business/redeem-promo", {
    preHandler: authenticateToken,
    handler: promoController.redeemPromo,
  });

  // For employees
  fastify.post("/employee/redeem-promo", {
    preHandler: authenticateToken,
    handler: promoController.redeemPromo,
  });

  // For merchants
  fastify.post("/merchant/redeem-promo", {
    preHandler: authenticateToken,
    handler: promoController.redeemPromo,
  });

  fastify.get("/customer/my-promos", {
    preHandler: authenticateToken,
    handler: promoController.claimedPromosInventory,
  });

  fastify.get("/customer/recieved-promos", {
    preHandler: authenticateToken,
    handler: promoController.sharedPromosInventory,
  });

  fastify.post("/customer/share-promo", {
    preHandler: authenticateToken,
    handler: promoController.sharePromo,
  });

fastify.post("/customer/verify-recipient", {
  preHandler: authenticateToken,
  handler: promoController.verifyRecipient,
});

  //=============================MEMBERSHIP=============================
  fastify.post("/customer/membership", {
    preHandler: authenticateToken,
    handler: membershipController.createMembership,
  });

  fastify.put(
    "/api/membership/deactivate",
    membershipController.deactivateMembership
  );

  //=============================FRIENDS=============================

  fastify.post("/customer/friends/add", {
    preHandler: authenticateToken,
    handler: friendController.addFriend,
  });

  fastify.get("/customer/friends/:customerId", {
    preHandler: authenticateToken,
    handler: friendController.getFriends,
  });

  fastify.delete("/customer/friends/remove/:customerId/:friendId", {
    preHandler: authenticateToken,
    handler: friendController.removeFriend,
  });

  // fastify.get("/customer/search/:customerCode", {
  //   preHandler: authenticateToken,
  //   handler: friendController.searchByCustomerCode,
  // });

  fastify.get("/customer/search/:phone", {
    preHandler: authenticateToken,
    handler: friendController.searchByPhone,
  });
}

export default userRoutes;
