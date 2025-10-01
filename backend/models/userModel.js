import { GelBigInt64 } from "drizzle-orm/gel-core";
import db from "../db/config.js";
import { merchants, employees, customers } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

async function generateCustomerCode() {
  let code;
  let exists = true;

  while (exists) {
    code = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.customerCode, code));

    exists = existing.length > 0;
  }

  return code;
}

const userModel = {
  async getUserByPhone(phone) {
    const result = await db
      .select()
      .from(merchants)
      .where(eq(merchants.phone, phone));

    return result[0] || null;
  },

  async combinedLogin(identifier, password) {
    try {
      const employeeResult = await db
        .select()
        .from(employees)
        .where(eq(employees.username, identifier));

      const employee = employeeResult[0];

      if (employee) {
        const isValidPassword = await bcrypt.compare(
          password,
          employee.password
        );
        if (isValidPassword) {
          return { user: employee, type: "employee" };
        }
      }
    } catch (error) {
      console.error("Employee login attempt failed:", error);
    }

    try {
      const merchantResult = await db
        .select()
        .from(merchants)
        .where(eq(merchants.phone, identifier));

      const merchant = merchantResult[0];

      if (merchant) {
        const isValidPassword = await bcrypt.compare(
          password,
          merchant.password
        );
        if (isValidPassword) {
          return { user: merchant, type: "merchant" };
        }
      }
    } catch (error) {
      console.error("Merchant login attempt failed:", error);
    }

    return null;
  },

  async employeeLogin(username, password) {
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

  async customerLogin(phone, password) {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone));

    const customer = result[0];
    if (!customer) return null;

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return null;

    return customer;
  },

  async customerRegister(customerData) {
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
    } = customerData;

    const customerCode = await generateCustomerCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db
      .insert(customers)
      .values({
        customerCode,
        profilePic: profile, // This matches the table column name
        firstName,
        lastName,
        email,
        phone,
        birthday,
        password: hashedPassword,
        region,
        province,
        city,
        barangay,
        postalCode,
        addressDetails,
      })
      .returning({
        id: customers.id,
        customerCode: customers.customerCode,
        profilePic: customers.profilePic,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        birthday: customers.birthday,
        region: customers.region,
        province: customers.province,
        city: customers.city,
        barangay: customers.barangay,
        postalCode: customers.postalCode,
        addressDetails: customers.addressDetails,
      });

    if (!result || result.length === 0) {
      throw new Error("Failed to insert customer - no data returned");
    }

    return result[0];
  },

  async merchantRegister(
    firstName,
    lastName,
    password,
    email,
    phone,
    role = "merchant"
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db
      .insert(merchants)
      .values({
        firstName,
        lastName,
        password: hashedPassword, // store hashed
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

    return result[0];
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
