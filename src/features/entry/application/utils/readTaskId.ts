import type { TaskIdRequest } from "../../../tasks/domain/models/TaskIdRequest";
import { validateTaskId } from "../../../tasks/domain/validation/validateTaskId";
import type { CommandContext } from "../types/CommandContext";
import { requireArgResults } from "./requireArgResults";
import { requireValidTaskInput } from "./requireValidTaskInput";

export function readTaskId(command: CommandContext): TaskIdRequest {
  const args = requireArgResults(command);
  const optionId = args.option("id");
  const [positionalId, ...unexpected] = args.rest;

  if (optionId !== null && positionalId !== undefined) {
    command.usageException("Specify the task ID with --id or as a positional argument, once.");
  }

  if (unexpected.length > 0) {
    command.usageException("Unexpected positional argument.");
  }

  const id = optionId ?? positionalId ?? "";
  return requireValidTaskInput(command, validateTaskId({ id }));
}
