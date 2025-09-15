import db from "../db/config.js";
import { employeePermissions, elements } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const permissionModel = {

  async toggleEmployeeElementVisibility(employeeId, elementKey, isVisible) {
    try {
      // First find the element by key
      const element = await db
        .select({ id: elements.id })
        .from(elements)
        .where(eq(elements.key, elementKey));

      if (element.length === 0) {
        throw new Error(`Element with key "${elementKey}" not found`);
      }

      const elementId = element[0].id;

      // Check if permission already exists
      const existingPermission = await db
        .select()
        .from(employeePermissions)
        .where(
          and(
            eq(employeePermissions.employeeId, employeeId),
            eq(employeePermissions.elementId, elementId)
          )
        );

      if (existingPermission.length > 0) {
        // Update existing permission
        await db
          .update(employeePermissions)
          .set({
            isVisible: isVisible,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(employeePermissions.employeeId, employeeId),
              eq(employeePermissions.elementId, elementId)
            )
          );
      } else {
        // Create new permission record
        await db.insert(employeePermissions).values({
          employeeId: employeeId,
          elementId: elementId,
          isVisible: isVisible,
        });
      }

      return {
        success: true,
        message: `Element "${elementKey}" ${
          isVisible ? "shown" : "hidden"
        } for employee`,
        data: { employeeId, elementKey, isVisible },
      };
    } catch (error) {
      throw new Error(`Error toggling element visibility: ${error.message}`);
    }
  },

  async canEmployeeSeeElement(employeeId, elementKey) {
    try {
      const permission = await db
        .select({
          isVisible: employeePermissions.isVisible,
        })
        .from(employeePermissions)
        .leftJoin(elements, eq(employeePermissions.elementId, elements.id))
        .where(
          and(
            eq(employeePermissions.employeeId, employeeId),
            eq(elements.key, elementKey)
          )
        );

      // If no permission found, default to visible (true)
      const canSee = permission.length > 0 ? permission[0].isVisible : true;

      return {
        success: true,
        canSee: canSee,
        data: { employeeId, elementKey, isVisible: canSee },
      };
    } catch (error) {
      throw new Error(`Error checking element visibility: ${error.message}`);
    }
  },
};

export default permissionModel;
