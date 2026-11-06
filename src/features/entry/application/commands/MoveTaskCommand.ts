import { Command } from "@argetim/arg-parser/command_runner";
import type { MoveTaskRequest } from "../../../tasks/domain/models/MoveTaskRequest";
import { validateMoveTask } from "../../../tasks/domain/validation/validateMoveTask";
import type { ParsedCommand } from "../types/ParsedCommand";
import { requireArgResults } from "../utils/requireArgResults";
import { requireValidTaskInput } from "../utils/requireValidTaskInput";
import { readTaskId } from "../utils/readTaskId";

export class MoveTaskCommand extends Command<ParsedCommand> {
  readonly name = "move";
  readonly description = "Move a task in the default list.";

  constructor() {
    super();
    this.argParser.addOption("id", {
      help: "Task ID (or supply one positional ID)",
      valueHelp: "id",
    });
    this.argParser.addOption("parent", {
      help: "Parent task ID (empty moves to top level)",
      valueHelp: "id",
    });
    this.argParser.addOption("previous", {
      help: "Previous sibling ID (empty moves to first position)",
      valueHelp: "id",
    });
  }

  override run(): ParsedCommand {
    const args = requireArgResults(this);
    const request: MoveTaskRequest = readTaskId(this);
    for (const key of ["parent", "previous"] as const) {
      const value = args.option(key);
      if (value !== null) {
        request[key] = value;
      }
    }

    return {
      kind: "tasks.move",
      request: requireValidTaskInput(this, validateMoveTask(request)),
    };
  }
}
