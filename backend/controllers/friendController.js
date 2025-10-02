import friendModel from "../models/friendModel.js";

const friendController = {
  async sendFriendRequest(request, reply) {
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
          message: "You cannot send a request to yourself.",
        });
      }

      // check if there’s already a relation
      const existing = await friendModel.checkExistingRequests(customerId, friendId);

      if (existing.length > 0) {
        const relation = existing[0];

        if (relation.status === "pending") {
          return reply.status(409).send({
            success: false,
            message: "Friend request already pending.",
          });
        }

        if (relation.status === "accepted") {
          return reply.status(409).send({
            success: false,
            message: "You are already friends.",
          });
        }

        if (relation.status === "blocked") {
          return reply.status(403).send({
            success: false,
            message: "You cannot send a request. One of you has blocked the other.",
          });
        }
      }

      const result = await friendModel.sendFriendRequest(customerId, friendId);

      return reply.status(201).send({
        success: true,
        message: "Friend request sent successfully.",
        data: result,
      });
    } catch (err) {
      console.error("Error sending friend request:", err);
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

  async acceptFriendRequest(request, reply) {
    try {
      const { requestId } = request.params;

      if (!requestId) {
        return reply.status(400).send({
          success: false,
          message: "Missing requestId.",
        });
      }

      const result = await friendModel.acceptFriendRequest(requestId);

      if (!result) {
        return reply.status(404).send({
          success: false,
          message: "Friend request not found.",
        });
      }

      return reply.send({
        success: true,
        message: "Friend request accepted.",
        data: result,
      });
    } catch (err) {
      console.error("Error accepting friend request:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },

  async rejectFriendRequest(request, reply) {
    try {
      const { requestId } = request.params;

      if (!requestId) {
        return reply.status(400).send({
          success: false,
          message: "Missing requestId.",
        });
      }

      const result = await friendModel.rejectFriendRequest(requestId);

      if (!result) {
        return reply.status(404).send({
          success: false,
          message: "Friend request not found.",
        });
      }

      return reply.send({
        success: true,
        message: "Friend request rejected.",
      });
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },

  async getPendingRequests(request, reply) {
    try {
      const { customerId } = request.params;

      if (!customerId) {
        return reply.status(400).send({
          success: false,
          message: "Missing customerId.",
        });
      }

      const requests = await friendModel.getPendingRequests(customerId);

      return reply.send({
        success: true,
        data: requests,
      });
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  },
};

export default friendController;
