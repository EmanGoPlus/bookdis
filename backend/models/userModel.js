// src/models/userModel.js
import { GelBigInt64 } from "drizzle-orm/gel-core";
import db from "../db/config.js";
import { merchants } from "../db/schema.js";
import { businesses } from "../db/schema.js";
import { businessDocuments } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const userModel = {
  async getUserByPhone(phone) {
    const result = await db
      .select()
      .from(merchants)
      .where(eq(merchants.phone, phone));

    return result[0] || null;
  },

  async merchantLogin(phone, password) {
    const result = await db
      .select()
      .from(merchants)
      .where(and(eq(merchants.phone, phone), eq(merchants.password, password)));

    return result[0] || null; //returns the 1st row kahit naka unique naman lol crazy
  },

  async merchantRegister(
    firstName,
    lastName,
    password,
    email,
    phone,
    role = "merchant"
  ) {
    try {
      const result = await db
        .insert(merchants)
        .values({
          firstName, // This maps to first_name column
          lastName, // This maps to last_name column
          password, // Remember to hash this before saving!
          email,
          phone,
          role,
        })
        .returning({
          id: merchants.id,
          firstName: merchants.firstName,
          lastName: merchants.lastName,
          email: merchants.email,
          phone: merchants.phone,
          role: merchants.role,
        });

      // Check if insert was successful
      if (!result || result.length === 0) {
        throw new Error("Failed to insert merchant - no data returned");
      }

      return result[0];
    } catch (error) {
      console.error("Database error in merchantRegister:", error);
      throw error;
    }
  },

  
};

export default userModel;
