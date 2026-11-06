import { success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskListRequest } from "../models/TaskListRequest";
import { normalizeTaskDate } from "./normalizeTaskDate";
import { normalizeTaskTimestamp } from "./normalizeTaskTimestamp";
import { taskValidationFailure } from "./taskValidationFailure";

export function validateTaskList(
  request: TaskListRequest,
): Result<TaskListRequest, TaskFailure> {
  if (
    !Number.isSafeInteger(request.limit) || request.limit < 0 ||
    !Number.isSafeInteger(request.offset) || request.offset < 0
  ) {
    return taskValidationFailure("limit and offset must be safe nonnegative integers.");
  }

  const normalized = { ...request };
  for (const key of ["dueFrom", "dueTo"] as const) {
    const value = request[key];
    if (value !== undefined && !normalizeTaskDate(value)) {
      return taskValidationFailure(`${key} must be a real YYYY-MM-DD date.`);
    }
  }

  for (const key of ["completedFrom", "completedTo", "updatedSince"] as const) {
    const value = request[key];
    if (value !== undefined) {
      const timestamp = normalizeTaskTimestamp(value);
      if (!timestamp) {
        return taskValidationFailure(`${key} must be an ISO date-time with a timezone.`);
      }

      normalized[key] = timestamp;
    }
  }

  if (request.dueFrom && request.dueTo && request.dueFrom > request.dueTo) {
    return taskValidationFailure("dueFrom must not be after dueTo.");
  }

  if (
    normalized.completedFrom && normalized.completedTo &&
    normalized.completedFrom > normalized.completedTo
  ) {
    return taskValidationFailure("completedFrom must not be after completedTo.");
  }

  return success(normalized);
}
