import { Command } from "@argetim/arg-parser/command_runner";
import type { TaskListRequest } from "../../../tasks/domain/models/TaskListRequest";
import { validateTaskList } from "../../../tasks/domain/validation/validateTaskList";
import type { ParsedCommand } from "../types/ParsedCommand";
import { parseNonnegativeInteger } from "../utils/parseNonnegativeInteger";
import { requireArgResults } from "../utils/requireArgResults";
import { requireValidTaskInput } from "../utils/requireValidTaskInput";

export class ListTasksCommand extends Command<ParsedCommand> {
  readonly name = "list";
  readonly description = "List tasks with pagination and optional filters.";

  constructor() {
    super();
    this.argParser.addOption("limit", {
      help: "Maximum results (default: 50)",
      valueHelp: "n",
      defaultsTo: "50",
    });
    this.argParser.addOption("offset", {
      help: "Valid results to skip (default: 0)",
      valueHelp: "n",
      defaultsTo: "0",
    });
    for (const name of ["show-completed", "show-hidden", "show-deleted", "show-assigned"]) {
      this.argParser.addFlag(name, {
        help: `Include ${name.slice(5)} tasks (default: false)`,
        defaultsTo: false,
        negatable: false,
      });
    }

    for (const name of ["due-from", "due-to"]) {
      this.argParser.addOption(name, {
        help: "Due bound at start of UTC date (YYYY-MM-DD)",
        valueHelp: "date",
      });
    }

    for (const name of ["completed-from", "completed-to", "updated-since"]) {
      this.argParser.addOption(name, {
        help: "ISO date-time with seconds and timezone",
        valueHelp: "timestamp",
      });
    }
  }

  override run(): ParsedCommand {
    const args = requireArgResults(this);
    if (args.rest.length > 0) {
      this.usageException("Unexpected positional argument.");
    }

    const limit = parseNonnegativeInteger(args.option("limit"));
    const offset = parseNonnegativeInteger(args.option("offset"));
    if (limit === undefined || offset === undefined) {
      this.usageException("--limit and --offset must be safe nonnegative integers.");
    }

    const request: TaskListRequest = {
      limit,
      offset,
      showCompleted: args.flag("show-completed"),
      showHidden: args.flag("show-hidden"),
      showDeleted: args.flag("show-deleted"),
      showAssigned: args.flag("show-assigned"),
    };
    const filters = [
      ["dueFrom", "due-from"],
      ["dueTo", "due-to"],
      ["completedFrom", "completed-from"],
      ["completedTo", "completed-to"],
      ["updatedSince", "updated-since"],
    ] as const;
    for (const [key, option] of filters) {
      const value = args.option(option);
      if (value !== null) {
        request[key] = value;
      }
    }

    return {
      kind: "tasks.list",
      request: requireValidTaskInput(this, validateTaskList(request)),
    };
  }
}
