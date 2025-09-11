import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import util from "util";
import { pipeline } from "stream";

const pump = util.promisify(pipeline);

const userController = {
  async getAllUsers(request, reply) {
    try {
      const users = await userModel.getAllUsers();
      reply.send(users);
    } catch (err) {
      console.error("Error in getAllUsers:", err);
      reply
        .status(500)
        .send({ error: "Failed to fetch users", details: err.message });
    }
  },

async login(request, reply) {
  try {
    const { phone, password } = request.body;

    if (!phone || !password) {
      return reply.status(400).send({ error: "Missing fields" });
    }

    const user =
      (await userModel.employeeLogin(phone, password)) ||
      (await userModel.merchantLogin(phone, password));

    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    // 🪪 Generate token - CHANGED: Use 'id' instead of 'userId' to match middleware
    const token = jwt.sign(
      { 
        id: user.id,           // CHANGED: from 'userId' to 'id'
        role: user.role, 
        businessId: user.businessId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return reply.send({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        businessId: user.businessId,
      },
      token,
    });
  } catch (err) {
    console.error("Error in login:", err);
    reply
      .status(500)
      .send({ error: "Failed to login", details: err.message });
  }
},

  async merchantRegister(request, reply) {
    try {
      const { firstName, lastName, password, email, phone, role } =
        request.body;

      if (!firstName || !lastName || !password || !email || !phone) {
        return reply.status(400).send({ error: "Missing fields" });
      }

      const existingUser = await userModel.getUserByPhone(phone);
      if (existingUser) {
        return reply.status(409).send({ error: "User already exists" });
      }

      // Insert new merchant
      const newMerchant = await userModel.merchantRegister(
        firstName,
        lastName,
        password,
        email,
        phone,
        role || "merchant"
      );

      return reply
        .status(201)
        .send({ message: "Merchant registered", user: newMerchant });
    } catch (err) {
      console.error("Error in registering the merchant:", err);
      return reply
        .status(500)
        .send({ error: "Failed to register merchant", details: err.message });
    }
  },

  async createUser(req, reply) {
    try {
      const newUser = req.body;

      if (!newUser.username) {
        return reply.status(400).send({ error: "Username is required" });
      }

      if (!newUser.password) {
        return reply.status(400).send({ error: "Password is required" });
      }

      // Check if user already exists
      const existingUser = await userModel.getUserByUsername(newUser.username);
      if (existingUser) {
        return reply.status(409).send({ error: "User already exists" });
      }

      const user = await userModel.createUser(newUser);
      reply.code(201).send(user);
    } catch (err) {
      console.error("Error in createUser:", err);

      // Handle specific database errors
      if (err.code === "23505") {
        // Unique constraint violation
        reply
          .status(409)
          .send({ error: "User with this username or email already exists" });
      } else {
        reply
          .status(500)
          .send({ error: "Failed to create user", details: err.message });
      }
    }
  },

  async getUserByUsername(req, reply) {
    try {
      const { username } = req.params;

      if (!username) {
        return reply
          .status(400)
          .send({ error: "Username parameter is required" });
      }

      const user = await userModel.getUserByUsername(username);
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      reply.send(userWithoutPassword);
    } catch (err) {
      console.error("Error in getUserByUsername:", err);
      reply
        .status(500)
        .send({ error: "Failed to fetch user", details: err.message });
    }
  },

  async deleteUser(req, reply) {
    try {
      const { username } = req.params;

      if (!username) {
        return reply
          .status(400)
          .send({ error: "Username parameter is required" });
      }

      // Check if user exists first
      const existingUser = await userModel.getUserByUsername(username);
      if (!existingUser) {
        return reply.code(404).send({ error: "User not found" });
      }

      await userModel.deleteUser(username);
      reply.send({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error in deleteUser:", err);
      reply
        .status(500)
        .send({ error: "Failed to delete user", details: err.message });
    }
  },
};

export default userController;
