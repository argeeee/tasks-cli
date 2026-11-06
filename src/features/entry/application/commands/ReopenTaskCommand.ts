import { Command } from "@argetim/arg-parser/command_runner";
import type { ParsedCommand } from "../types/ParsedCommand";
import { readTaskId } from "../utils/readTaskId";

export class ReopenTaskCommand extends Command<ParsedCommand> {
  readonly name = "reopen";
  readonly description = "Reopen a task by ID.";

  constructor() {
    super();
    this.argParser.addOption("id", {
      help: "Task ID (or supply one positional ID)",
      valueHelp: "id",
    });
  }

  override run(): ParsedCommand {
    const request = readTaskId(this);

    return { kind: "tasks.reopen", request };
  }
}
