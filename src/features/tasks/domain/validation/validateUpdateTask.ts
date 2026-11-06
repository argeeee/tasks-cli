import { success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../failures/TaskFailure";
import type { UpdateTaskRequest } from "../models/UpdateTaskRequest";
import { normalizeTaskDate } from "./normalizeTaskDate";
import { taskValidationFailure } from "./taskValidationFailure";
import { validateTaskId } from "./validateTaskId";

export function validateUpdateTask(
  request: UpdateTaskRequest,
): Result<UpdateTaskRequest, TaskFailure> {
  const identity = validateTaskId(request);
  if (!identity.hasValue) {
    return identity;
  }

  const patch = { ...request.patch };
  if (patch.title === undefined && patch.notes === undefined && patch.due === undefined) {
    return taskValidationFailure("Supply at least one task field to update.");
  }

  if (patch.title !== undefined) {
    patch.title = patch.title.trim();
    if (!patch.title) {
      return taskValidationFailure("A nonblank task title is required.");
    }
  }

  if (patch.due !== undefined && patch.due !== "" && !normalizeTaskDate(patch.due)) {
    return taskValidationFailure("Task due must be a real YYYY-MM-DD date or empty to clear.");
  }

  return success({ id: identity.value.id, patch });
}
