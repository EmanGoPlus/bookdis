import friendModel from "../models/friendModel.js";

const friendController = {
  async addFriend(request, reply) {
    try {
      const { customerId, friendId } = request.body;

      if (!customerId || !friendId) {
        return reply.status(400).send({
          success: false,
          message: "Missing customerId or friendId.",
        });
      }

      if (customerId === friendId) {
        return reply.status(400).send({
          success: false,
          message: "You cannot add yourself as a friend.",
        });
      }

      // Check if already bookmarked
      const existing = await friendModel.checkExistingFriendship(
        customerId,
        friendId
      );

      if (existing.length > 0) {
        return reply.status(409).send({
          success: false,
          message: "You have already added this friend.",
        });
      }

      const result = await friendModel.addFriend(customerId, friendId);

      return reply.status(201).send({
        success: true,
        message: "Friend added successfully.",
        data: result,
      });
    } catch (err) {
      console.error("Error adding friend:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },

  async getFriends(request, reply) {
    try {
      const { customerId } = request.params;

      if (!customerId) {
        return reply.status(400).send({
          success: false,
          message: "Missing customerId.",
        });
      }

      const friends = await friendModel.getFriends(customerId);

      return reply.send({
        success: true,
        data: friends,
      });
    } catch (err) {
      console.error("Error fetching friends:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },

  async removeFriend(request, reply) {
    try {
      const { customerId, friendId } = request.params;

      if (!customerId || !friendId) {
        return reply.status(400).send({
          success: false,
          message: "Missing customerId or friendId.",
        });
      }

      const result = await friendModel.removeFriend(customerId, friendId);

      if (!result) {
        return reply.status(404).send({
          success: false,
          message: "Friend not found.",
        });
      }

      return reply.send({
        success: true,
        message: "Friend removed successfully.",
      });
    } catch (err) {
      console.error("Error removing friend:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },

  async searchByCustomerCode(request, reply) {
    try {
      const { customerCode } = request.params;

      if (!customerCode) {
        return reply.status(400).send({
          success: false,
          message: "Customer code is required.",
        });
      }

      const customer = await friendModel.findByCustomerCode(customerCode);

      if (!customer) {
        return reply.status(404).send({
          success: false,
          message: "Customer not found.",
        });
      }

      return reply.send({
        success: true,
        data: customer,
      });
    } catch (err) {
      console.error("Error searching customer:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },

  async searchByPhone(request, reply) {
  try {
    const { phone } = request.params;

    if (!phone) {
      return reply.status(400).send({
        success: false,
        message: "Phone number is required.",
      });
    }

    const customer = await friendModel.findByPhone(phone);

    if (!customer) {
      return reply.status(404).send({
        success: false,
        message: "Customer not found.",
      });
    }

    return reply.send({
      success: true,
      data: customer,
    });
  } catch (err) {
    console.error("Error searching customer:", err);
    return reply.status(500).send({
      success: false,
      error: err.message,
    });
  }
}
};

export default friendController;