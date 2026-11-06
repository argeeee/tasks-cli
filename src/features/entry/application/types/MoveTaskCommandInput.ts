import type { MoveTaskRequest } from "../../../tasks/domain/models/MoveTaskRequest";

export type MoveTaskCommandInput = {
  kind: "tasks.move";
  request: MoveTaskRequest;
};
