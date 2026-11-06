import { failure } from "../../../../core/Result";
import type { ResultError } from "../../../../core/Result";
import type { TaskFailure } from "../failures/TaskFailure";

export function taskValidationFailure(message: string): ResultError<TaskFailure> {
  return failure({ type: "VALIDATION", message });
}
