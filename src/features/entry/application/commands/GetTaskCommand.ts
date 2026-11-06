import { Command } from "@argetim/arg-parser/command_runner";
import type { ParsedCommand } from "../types/ParsedCommand";
import { readTaskId } from "../utils/readTaskId";

export class GetTaskCommand extends Command<ParsedCommand> {
  readonly name = "get";
  readonly description = "Get a task by ID.";

  constructor() {
    super();
    this.argParser.addOption("id", {
      help: "Task ID (or supply one positional ID)",
      valueHelp: "id",
    });
  }

  override run(): ParsedCommand {
    const request = readTaskId(this);

    return { kind: "tasks.get", request };
  }
}
