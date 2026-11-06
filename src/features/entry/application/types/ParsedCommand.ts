import type { ListTasksCommandInput } from "./ListTasksCommandInput";
import type { GetTaskCommandInput } from "./GetTaskCommandInput";
import type { CreateTaskCommandInput } from "./CreateTaskCommandInput";
import type { UpdateTaskCommandInput } from "./UpdateTaskCommandInput";
import type { CompleteTaskCommandInput } from "./CompleteTaskCommandInput";
import type { ReopenTaskCommandInput } from "./ReopenTaskCommandInput";
import type { MoveTaskCommandInput } from "./MoveTaskCommandInput";
import type { DeleteTaskCommandInput } from "./DeleteTaskCommandInput";

export type ParsedCommand =
  | ListTasksCommandInput
  | GetTaskCommandInput
  | CreateTaskCommandInput
  | UpdateTaskCommandInput
  | CompleteTaskCommandInput
  | ReopenTaskCommandInput
  | MoveTaskCommandInput
  | DeleteTaskCommandInput;
