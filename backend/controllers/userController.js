import db from "../db/config.js"; // Add this line
import { customers } from "../db/schema.js";
import businessModel from "../models/businessModel.js";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import util from "util";
import crypto from "crypto";
import { pipeline } from "stream";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";

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

  async combinedLogin(request, reply) {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply
          .status(400)
          .send({ error: "Please enter both username/phone and password" });
      }

      const loginResult = await userModel.combinedLogin(username, password);

      if (!loginResult) {
        return reply.status(401).send({ error: "User Not Found" });
      }

      const { user, type } = loginResult;

      const tokenPayload = {
        id: user.id,
        role: user.role || type,
      };

      if (type === "employee" && user.businessId) {
        tokenPayload.businessId = user.businessId;
      }

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Prepare response based on user type
      let response = {
        message: "Login successful",
        token,
        userType: type,
      };

      if (type === "employee") {
        response.user = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          username: user.username,
          role: user.role,
          businessId: user.businessId,
        };

        // Fetch business data if businessId exists
        if (user.businessId) {
          try {
            const businessResult = await db
              .select()
              .from(businesses) // Assuming you have a businesses table
              .where(eq(businesses.id, user.businessId));

            if (businessResult[0]) {
              response.business = businessResult[0];
            }
          } catch (businessError) {
            console.error("Failed to fetch business data:", businessError);
            // Continue without business data
          }
        }
      } else if (type === "merchant") {
        response.user = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        };

        // For merchants, you might want to fetch their business data differently
        // Add business fetching logic here if needed
      }

      return reply.send(response);
    } catch (err) {
      console.error("Error in combined login:", err);
      reply
        .status(500)
        .send({ error: "Failed to login", details: err.message });
    }
  },

 async customerLogin(request, reply) {
  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: "Missing fields" });
    }

    const customer = await userModel.customerLogin(username, password);

    if (!customer) {
      return reply.status(401).send({ error: "User Not Found" });
    }

    const token = jwt.sign(
      { 
        id: customer.id, 
        role: customer.role,

        businessId: customer.businessId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } 
    );

    console.log("LOGIN DEBUG - Generated token with 24h expiry");
    console.log("LOGIN DEBUG - Customer ID:", customer.id);


    return reply.send({
      message: "Login successful",
      customer: { 
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        role: customer.role,
  
      },
      token,
      memberships: [] 
    });
  } catch (err) {
    console.error("Error in customer login:", err);
    reply
      .status(500)
      .send({ error: "Failed to login", details: err.message });
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
          businessId: employee.businessId,
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

      const token = jwt.sign(
        {
          id: user.id,
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

      const plainPassword = generateRandomPassword(5);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const employee = await userModel.addEmployee(
        firstName,
        lastName,
        username,
        hashedPassword,
        businessId
      );

      return reply.status(201).send({
        message: "Employee registered",
        employee: { ...employee, password: plainPassword },
      });
    } catch (err) {
      console.error("Error in registerEmployee:", err);
      return reply.status(500).send({ error: "Failed to register employee" });
    }
  },

  async customerRegister(request, reply) {
    try {
      const input = Object.fromEntries(
        Object.entries(request.body).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ])
      );

      const {
        profile,
        firstName,
        lastName,
        email,
        phone,
        birthday,
        password,
        region,
        province,
        city,
        barangay,
        postalCode,
        addressDetails,
      } = input;

      const requiredFields = [
        "profile",
        "firstName",
        "lastName",
        "email",
        "phone",
        "birthday",
        "password",
        "region",
        "province",
        "city",
        "barangay",
        "postalCode",
        "addressDetails",
      ];

      for (const field of requiredFields) {
        if (
          !input[field] ||
          (typeof input[field] === "string" && input[field].trim() === "")
        ) {
          return reply.status(400).send({
            success: false,
            error: `Field '${field}' is required and cannot be empty`,
          });
        }
      }

      // Phone validation
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length !== 11) {
        return reply.status(400).send({
          success: false,
          error: "Phone number must be exactly 11 digits",
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          success: false,
          error: "Invalid email format",
        });
      }

      // Postal code validation
      if (!/^\d{4,6}$/.test(postalCode)) {
        return reply.status(400).send({
          success: false,
          error: "Postal code must be 4-6 digits",
        });
      }

      // Password strength validation (optional but recommended)
      if (password.length < 8) {
        return reply.status(400).send({
          success: false,
          error: "Password must be at least 8 characters long",
        });
      }

      // Check for existing email
      const existingEmail = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email.toLowerCase()));

      if (existingEmail.length > 0) {
        return reply.status(400).send({
          success: false,
          error: "Email already registered",
        });
      }

      // Check for existing phone number
      const existingPhone = await db
        .select()
        .from(customers)
        .where(eq(customers.phone, normalizedPhone));

      if (existingPhone.length > 0) {
        return reply.status(400).send({
          success: false,
          error: "Phone number already registered",
        });
      }

      // Create customer
      const customer = await userModel.customerRegister({
        profile,
        firstName,
        lastName,
        email: email.toLowerCase(), // Store email in lowercase
        phone: normalizedPhone,
        birthday,
        password,
        region,
        province,
        city,
        barangay,
        postalCode,
        addressDetails,
      });

      // Remove sensitive data from response
      const { password: _, ...customerResponse } = customer;

      return reply.status(201).send({
        success: true,
        message: "Customer registered successfully!",
        customer: customerResponse,
      });
    } catch (err) {
      console.error("Error in customer register:", err);

      // Handle specific database errors
      if (err.code === "23505") {
        // PostgreSQL unique violation
        return reply.status(400).send({
          success: false,
          error: "Email or phone number already exists",
        });
      }

      return reply.status(500).send({
        success: false,
        error: "Failed to register customer",
        details:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
      });
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
