import { UsageException } from "@argetim/arg-parser/command_runner";
import { dispatchCommand } from "./dispatchCommand";
import { parseArgs } from "./parser/createParser";

const UNEXPECTED_ERROR = "An unexpected command error occurred.";

export async function runWithArgs(tokens: Iterable<string>): Promise<void> {
  try {
    const command = await parseArgs(tokens);
    if (command !== null) {
      await dispatchCommand(command);
    }
  } catch (error) {
    if (error instanceof UsageException) {
      console.error(error.toString());
      process.exitCode = 2;
      return;
    }

    console.error(UNEXPECTED_ERROR);
    process.exitCode = 1;
  }
}
