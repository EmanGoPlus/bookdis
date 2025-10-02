import db from "../db/config.js";
import { eq, and, or, ne } from "drizzle-orm";
import { customers, friends } from "../db/schema.js";

const friendModel = {
  async sendFriendRequest(customerId, friendId) {
    const result = await db
      .insert(friends)
      .values({
        customerId,
        friendId,
        status: "pending",
      })
      .returning();

    return result[0];
  },

  async checkExistingRequests(customerId, friendId) {
    const existing = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.customerId, customerId), eq(friends.friendId, friendId)),
          and(eq(friends.customerId, friendId), eq(friends.friendId, customerId))
        )
      );

    return existing;
  },

async getFriends(customerId) {
  const result = await db
    .select({
      id: friends.id,
      status: friends.status,
      friendId: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      profilePic: customers.profilePic,
      // Add these for debugging
      originalCustomerId: friends.customerId,
      originalFriendId: friends.friendId,
    })
    .from(friends)
    .innerJoin(
      customers,
      or(
        and(eq(friends.customerId, customerId), eq(customers.id, friends.friendId)),
        and(eq(friends.friendId, customerId), eq(customers.id, friends.customerId))
      )
    )
    .where(
      and(
        or(eq(friends.customerId, customerId), eq(friends.friendId, customerId)),
        eq(friends.status, "accepted")
      )
    );

  console.log('=== FRIENDS QUERY DEBUG ===');
  console.log('Logged in customerId:', customerId);
  console.log('Results:', JSON.stringify(result, null, 2));
  
  // Filter out the logged-in user in code
  const filtered = result.filter(friend => friend.friendId !== customerId);
  console.log('Filtered results:', filtered.length);
  
  return filtered;
},

  async acceptFriendRequest(requestId) {
    const result = await db
      .update(friends)
      .set({ status: "accepted" })
      .where(eq(friends.id, requestId))
      .returning();

    return result[0];
  },

  async rejectFriendRequest(requestId) {
    const result = await db
      .delete(friends)
      .where(eq(friends.id, requestId))
      .returning();

    return result[0];
  },

  async getPendingRequests(customerId) {
    const result = await db
      .select({
        id: friends.id,
        fromCustomer: friends.customerId,
        toCustomer: friends.friendId,
        status: friends.status,
        firstName: customers.firstName,
        lastName: customers.lastName,
        profilePic: customers.profilePic,
      })
      .from(friends)
      .innerJoin(
        customers,
        // join with the sender of the request
        eq(customers.id, friends.customerId)
      )
      .where(
        and(eq(friends.friendId, customerId), eq(friends.status, "pending"))
      );

    return result;
  },
};

export default friendModel;
