import { Command } from "@argetim/arg-parser/command_runner";
import type { CreateTaskRequest } from "../../../tasks/domain/models/CreateTaskRequest";
import { validateCreateTask } from "../../../tasks/domain/validation/validateCreateTask";
import type { ParsedCommand } from "../types/ParsedCommand";
import { requireArgResults } from "../utils/requireArgResults";
import { requireValidTaskInput } from "../utils/requireValidTaskInput";

export class CreateTaskCommand extends Command<ParsedCommand> {
  readonly name = "create";
  readonly description = "Create a task in the default list.";

  constructor() {
    super();
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
    if (args.rest.length > 0) {
      this.usageException("Unexpected positional argument.");
    }

    const request: CreateTaskRequest = {
      task: { title: args.option("title") ?? "" },
    };
    for (const key of ["notes", "due"] as const) {
      const value = args.option(key);
      if (value !== null) {
        request.task[key] = value;
      }
    }

    for (const key of ["parent", "previous"] as const) {
      const value = args.option(key);
      if (value !== null) {
        request[key] = value;
      }
    }

    return {
      kind: "tasks.create",
      request: requireValidTaskInput(this, validateCreateTask(request)),
    };
  }
}
