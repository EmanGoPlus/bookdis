import { GelBigInt64 } from "drizzle-orm/gel-core";
import db from "../db/config.js";
import { merchants, employees } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

const userModel = {
  async getUserByPhone(phone) {
    const result = await db
      .select()
      .from(merchants)
      .where(eq(merchants.phone, phone));

    return result[0] || null;
  },

  async employeeLogin(username, password) {
    // First find the employee by username only
    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.username, username));

    const employee = result[0];

    if (!employee) {
      return null;
    }

    // Compare the provided password with the hashed password
    const isValidPassword = await bcrypt.compare(password, employee.password);

    if (!isValidPassword) {
      return null;
    }

    return employee;
  },

  async merchantLogin(phone, password) {
    const result = await db
      .select()
      .from(merchants)
      .where(and(eq(merchants.phone, phone), eq(merchants.password, password)));

    return result[0] || null;
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
          firstName,
          lastName,
          password,
          email,
          phone,
          role,
        })
        .returning({
          //auto fetch, idk how is it useful though kapag neeed mo agad yung data after insert
          id: merchants.id,
          firstName: merchants.firstName,
          lastName: merchants.lastName,
          email: merchants.email,
          phone: merchants.phone,
          role: merchants.role,
        });

      if (!result || result.length === 0) {
        throw new Error("Failed to insert merchant - no data returned");
      }

      return result[0];
    } catch (error) {
      console.error("Database error in merchantRegister:", error);
      throw error;
    }
  },

  async addEmployee(
    firstName,
    lastName,
    username,
    password,
    businessId,
    role = "employee"
  ) {
    const result = await db
      .insert(employees)
      .values({
        firstName,
        lastName,
        username,
        password, // already hashed
        businessId,
        role,
      })
      .returning({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        username: employees.username,
        role: employees.role,
      });

    return result[0]; // return the new employee
  },
};

export default userModel;
