import { Command } from "@argetim/arg-parser/command_runner";
import type { ParsedCommand } from "../types/ParsedCommand";
import { readTaskId } from "../utils/readTaskId";
import { requireArgResults } from "../utils/requireArgResults";

export class DeleteTaskCommand extends Command<ParsedCommand> {
  readonly name = "delete";
  readonly description = "Delete a task by ID.";

  constructor() {
    super();
    this.argParser.addOption("id", {
      help: "Task ID (or supply one positional ID)",
      valueHelp: "id",
    });
    this.argParser.addFlag("yes", {
      help: "Confirm deletion without prompting",
      negatable: false,
    });
  }

  override run(): ParsedCommand {
    const request = readTaskId(this);
    if (!requireArgResults(this).flag("yes")) {
      this.usageException("Deletion requires --yes.");
    }


    return { kind: "tasks.delete", request, yes: true };
  }
}
