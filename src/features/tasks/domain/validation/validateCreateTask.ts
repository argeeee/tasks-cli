import { success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../failures/TaskFailure";
import type { CreateTaskRequest } from "../models/CreateTaskRequest";
import { normalizeTaskDate } from "./normalizeTaskDate";
import { taskValidationFailure } from "./taskValidationFailure";

export function validateCreateTask(
  request: CreateTaskRequest,
): Result<CreateTaskRequest, TaskFailure> {
  const title = request.task.title.trim();
  if (!title) {
    return taskValidationFailure("A nonblank task title is required.");
  }

  if (request.task.due !== undefined && !normalizeTaskDate(request.task.due)) {
    return taskValidationFailure("Task due must be a real YYYY-MM-DD date.");
  }

  const normalized: CreateTaskRequest = {
    task: { ...request.task, title },
  };
  for (const key of ["parent", "previous"] as const) {
    const value = request[key];
    if (value !== undefined) {
      if (!value.trim()) {
        return taskValidationFailure(`${key} must be a nonblank task ID.`);
      }

      normalized[key] = value.trim();
    }
  }

  return success(normalized);
}
