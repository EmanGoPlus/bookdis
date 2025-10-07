import db from "../db/config.js";
import { eq, and, or } from "drizzle-orm";
import { customers, friends } from "../db/schema.js";

const friendModel = {
  
  async addFriend(customerId, friendId) {
    // Directly add as friend with 'accepted' status (instant bookmark)
    const result = await db
      .insert(friends)
      .values({
        customerId,
        friendId,
        status: "accepted", // Changed from "pending" to "accepted"
      })
      .returning();

    return result[0];
  },

  async checkExistingFriendship(customerId, friendId) {
    // Only check if THIS user has already bookmarked that friend
    const existing = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.customerId, customerId),
          eq(friends.friendId, friendId)
        )
      );

    return existing;
  },

  async getFriends(customerId) {
    // Get all users that THIS customer has bookmarked
    const result = await db
      .select({
        id: friends.id,
        friendId: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        profilePic: customers.profilePic,
        createdAt: friends.createdAt,
      })
      .from(friends)
      .innerJoin(
        customers,
        eq(customers.id, friends.friendId)
      )
      .where(
        and(
          eq(friends.customerId, customerId),
          eq(friends.status, "accepted")
        )
      );

    return result;
  },

  async removeFriend(customerId, friendId) {
    // Remove the bookmark
    const result = await db
      .delete(friends)
      .where(
        and(
          eq(friends.customerId, customerId),
          eq(friends.friendId, friendId)
        )
      )
      .returning();

    return result[0];
  },

  async findByCustomerCode(customerCode) {
    const result = await db
      .select({
        id: customers.id,
        customerCode: customers.customerCode,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        profilePic: customers.profilePic,
      })
      .from(customers)
      .where(eq(customers.customerCode, customerCode))
      .limit(1);

    return result[0] || null;
  },

  async findByPhone(phone) {
  const result = await db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      profilePic: customers.profilePic,
    })
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  return result[0] || null;
}
};

export default friendModel;