import userModel from "../models/userModel.js";
import businessModel from "../models/businessModel.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import util from "util";
import crypto from "crypto";
import { pipeline } from "stream";
import bcrypt from "bcrypt";
import { employees } from "../db/schema.js";

const pump = util.promisify(pipeline);

function generateRandomPassword(length = 5) {
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

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

  async merchantLogin(request, reply) {
    try {
      const { phone, password } = request.body;

      if (!phone || !password) {
        return reply.status(400).send({ error: "Missing fields" });
      }

      const merchant = await userModel.merchantLogin(phone, password);

      if (!merchant) {
        return reply.status(401).send({ error: "Merchant not found" });
      }

      const token = jwt.sign(
        {
          id: merchant.id,
          role: merchant.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return reply.send({
        message: "Login successful",
        user: {
          id: merchant.id,
          firstName: merchant.firstName,
          lastName: merchant.lastName,
          phone: merchant.phone,
          role: merchant.role,
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

  async employeeLogin(request, reply) {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.status(400).send({ error: "Missing fieldsss" });
      }

      const employee = await userModel.employeeLogin(username, password);

      if (!employee) {
        return reply.status(401).send({ error: "employee not found" });
      }

      const token = jwt.sign(
        {
          id: employee.id,
          role: employee.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return reply.send({
        message: "Login successful",
        user: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          username: employee.username,
          role: employee.role,
          businessId: employee.businessId, // Change this line from business_id to businessId
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
          id: user.id, // CHANGED: from 'userId' to 'id'
          role: user.role,
          businessId: user.businessId,
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

  async employeeRegister(request, reply) {
    try {
      const { firstName, lastName, businessId } = request.body;

      // remove "password" from required fields
      if (!firstName || !lastName || !businessId) {
        return reply.status(400).send({ error: "Missing required fields" });
      }

      const business = await businessModel.getBusinessById(businessId);
      if (!business) {
        return reply.status(404).send({ error: "Business not found" });
      }

      const username =
        `${business.businessCode}-` +
        `${firstName[0].toUpperCase()}` +
        `${firstName.slice(-1).toUpperCase()}` +
        `${lastName[0].toUpperCase()}` +
        `${lastName.slice(-1).toUpperCase()}`;

      // 🔑 Auto-generate password here
      const plainPassword = generateRandomPassword(5);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const employee = await userModel.addEmployee(
        firstName,
        lastName,
        username,
        hashedPassword,
        businessId
      );

      // Return plain password only once
      return reply.status(201).send({
        message: "Employee registered",
        employee: { ...employee, password: plainPassword },
      });
    } catch (err) {
      console.error("Error in registerEmployee:", err);
      return reply.status(500).send({ error: "Failed to register employee" });
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
