import permissionModel from "../models/permissionModel.js";

const permissionController = {
  async toggleElementVisibility(request, reply) {
    try {
      const { employeeId, elementKey, isVisible } = request.body;

      // Validation
      if (!employeeId || !elementKey || typeof isVisible !== "boolean") {
        return reply.status(400).send({
          success: false,
          message:
            "employeeId, elementKey, and isVisible (boolean) are required",
        });
      }

      const result = await permissionModel.toggleEmployeeElementVisibility(
        employeeId,
        elementKey,
        isVisible
      );

      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/permissions/check/:employeeId/:elementKey
  async checkElementVisibility(request, reply) {
    try {
      const { employeeId, elementKey } = request.params;

      // Validation
      if (!employeeId || !elementKey) {
        return reply.status(400).send({
          success: false,
          message: "employeeId and elementKey are required",
        });
      }

      const result = await permissionModel.canEmployeeSeeElement(
        parseInt(employeeId),
        elementKey
      );

      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
};

export default permissionController;
