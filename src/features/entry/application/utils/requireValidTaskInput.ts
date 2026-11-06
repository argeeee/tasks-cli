import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../../../tasks/domain/failures/TaskFailure";
import type { CommandContext } from "../types/CommandContext";

export function requireValidTaskInput<T>(
  command: CommandContext,
  result: Result<T, TaskFailure>,
): T {
  if (!result.hasValue) {
    command.usageException(result.error.message);
  }

  return result.value;
}
