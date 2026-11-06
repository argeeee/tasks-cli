import {
  getListTasks,
  getGetTask,
  getCreateTask,
  getUpdateTask,
  getCompleteTask,
  getReopenTask,
  getMoveTask,
  getDeleteTask,
} from "../../tasks/injections";
import type { ParsedCommand } from "./types/ParsedCommand";
import { assertNever } from "./utils/assertNever";
import { presentResult } from "./utils/presentResult";

export async function dispatchCommand(command: ParsedCommand): Promise<void> {
  switch (command.kind) {
    case "tasks.list":
      presentResult(await getListTasks().execute(command.request));
      return;
    case "tasks.get":
      presentResult(await getGetTask().execute(command.request));
      return;
    case "tasks.create":
      presentResult(await getCreateTask().execute(command.request));
      return;
    case "tasks.update":
      presentResult(await getUpdateTask().execute(command.request));
      return;
    case "tasks.complete":
      presentResult(await getCompleteTask().execute(command.request));
      return;
    case "tasks.reopen":
      presentResult(await getReopenTask().execute(command.request));
      return;
    case "tasks.move":
      presentResult(await getMoveTask().execute(command.request));
      return;
    case "tasks.delete":
      presentResult(await getDeleteTask().execute(command.request));
      return;
    default:
      return assertNever(command);
  }
}
