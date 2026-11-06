import { CommandRunner } from "@argetim/arg-parser/command_runner";
import { TasksCommand } from "../commands/TasksCommand";
import { ListTasksCommand } from "../commands/ListTasksCommand";
import { GetTaskCommand } from "../commands/GetTaskCommand";
import { CreateTaskCommand } from "../commands/CreateTaskCommand";
import { UpdateTaskCommand } from "../commands/UpdateTaskCommand";
import { CompleteTaskCommand } from "../commands/CompleteTaskCommand";
import { ReopenTaskCommand } from "../commands/ReopenTaskCommand";
import { MoveTaskCommand } from "../commands/MoveTaskCommand";
import { DeleteTaskCommand } from "../commands/DeleteTaskCommand";
import type { ParsedCommand } from "../types/ParsedCommand";

const PROGRAM_NAME = "tasks";
const PROGRAM_DESCRIPTION = "Manage Google Tasks.";

export function createParser(): CommandRunner<ParsedCommand> {
  const runner = new CommandRunner<ParsedCommand>(PROGRAM_NAME, PROGRAM_DESCRIPTION);
  const tasks = new TasksCommand();
  tasks.addSubcommand(new ListTasksCommand());
  tasks.addSubcommand(new GetTaskCommand());
  tasks.addSubcommand(new CreateTaskCommand());
  tasks.addSubcommand(new UpdateTaskCommand());
  tasks.addSubcommand(new CompleteTaskCommand());
  tasks.addSubcommand(new ReopenTaskCommand());
  tasks.addSubcommand(new MoveTaskCommand());
  tasks.addSubcommand(new DeleteTaskCommand());
  runner.addCommand(tasks);

  return runner;
}

export async function parseArgs(
  tokens: Iterable<string>,
): Promise<ParsedCommand | null> {
  return createParser().run(tokens);
}
