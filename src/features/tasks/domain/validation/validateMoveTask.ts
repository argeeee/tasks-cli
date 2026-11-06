import { success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../failures/TaskFailure";
import type { MoveTaskRequest } from "../models/MoveTaskRequest";
import { taskValidationFailure } from "./taskValidationFailure";
import { validateTaskId } from "./validateTaskId";

export function validateMoveTask(
  request: MoveTaskRequest,
): Result<MoveTaskRequest, TaskFailure> {
  const identity = validateTaskId(request);
  if (!identity.hasValue) {
    return identity;
  }

  if (request.parent === undefined && request.previous === undefined) {
    return taskValidationFailure("Supply parent or previous for a task move.");
  }

  const normalized: MoveTaskRequest = { id: identity.value.id };
  for (const key of ["parent", "previous"] as const) {
    const value = request[key];
    if (value !== undefined) {
      if (value !== "" && !value.trim()) {
        return taskValidationFailure(`${key} must be a task ID or empty to clear.`);
      }

      normalized[key] = value.trim();
    }
  }

  return success(normalized);
}
