import { CommandRunner } from "@argetim/arg-parser/command_runner";

const PROGRAM_NAME = "tasks";
const PROGRAM_DESCRIPTION = "Manage Google Tasks.";

export function createParser(): CommandRunner<never> {
  return new CommandRunner<never>(PROGRAM_NAME, PROGRAM_DESCRIPTION);
}
