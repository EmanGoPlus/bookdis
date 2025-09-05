// src/routes/userRoutes.js
import userController from "../controllers/userController.js";

async function userRoutes(fastify, options) {
  fastify.get("/users", userController.getAllUsers);
  fastify.get("/users/:username", userController.getUserByUsername);
  // fastify.post("/users", userController.createUser);
  fastify.delete("/users/:username", userController.deleteUser);
  fastify.post("/merchant-login", userController.merchantLogin);
  fastify.post("/merchant-register", userController.merchantRegister);
}

export default userRoutes;