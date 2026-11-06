import type { ArgResults } from "@argetim/arg-parser";
import type { CommandContext } from "../types/CommandContext";

export function requireArgResults(command: CommandContext): ArgResults {
  if (!command.argResults) {
    throw new Error(`Arguments for "${command.name}" were not parsed.`);
  }

  return command.argResults;
}
