import { Command } from "@argetim/arg-parser/command_runner";
import type { ParsedCommand } from "../types/ParsedCommand";

export class TasksCommand extends Command<ParsedCommand> {
  readonly name = "tasks";
  readonly description = "Manage tasks in the default Google Tasks list.";
}
