import { Command } from "@argetim/arg-parser/command_runner";
import type { UpdateTaskRequest } from "../../../tasks/domain/models/UpdateTaskRequest";
import { validateUpdateTask } from "../../../tasks/domain/validation/validateUpdateTask";
import type { ParsedCommand } from "../types/ParsedCommand";
import { requireArgResults } from "../utils/requireArgResults";
import { requireValidTaskInput } from "../utils/requireValidTaskInput";
import { readTaskId } from "../utils/readTaskId";

export class UpdateTaskCommand extends Command<ParsedCommand> {
  readonly name = "update";
  readonly description = "Update a task in the default list.";

  constructor() {
    super();
    this.argParser.addOption("id", {
      help: "Task ID (or supply one positional ID)",
      valueHelp: "id",
    });
    this.argParser.addOption("title", {
      abbr: "t",
      help: "Task title",
      valueHelp: "text",
    });
    this.argParser.addOption("notes", {
      help: "Task notes (empty clears on update)",
      valueHelp: "text",
    });
    this.argParser.addOption("due", {
      help: "Due YYYY-MM-DD (empty clears on update)",
      valueHelp: "date",
    });
  }

  override run(): ParsedCommand {
    const args = requireArgResults(this);
    const request: UpdateTaskRequest = { ...readTaskId(this), patch: {} };
    for (const key of ["title", "notes", "due"] as const) {
      const value = args.option(key);
      if (value !== null) {
        request.patch[key] = value;
      }
    }

    return {
      kind: "tasks.update",
      request: requireValidTaskInput(this, validateUpdateTask(request)),
    };
  }
}
