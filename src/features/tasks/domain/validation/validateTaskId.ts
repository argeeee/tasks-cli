import { success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskIdRequest } from "../models/TaskIdRequest";
import { taskValidationFailure } from "./taskValidationFailure";

export function validateTaskId(
  request: TaskIdRequest,
): Result<TaskIdRequest, TaskFailure> {
  const id = request.id.trim();
  if (!id) {
    return taskValidationFailure("A task ID is required.");
  }

  return success({ id });
}
