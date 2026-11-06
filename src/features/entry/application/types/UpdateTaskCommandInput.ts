import type { UpdateTaskRequest } from "../../../tasks/domain/models/UpdateTaskRequest";

export type UpdateTaskCommandInput = {
  kind: "tasks.update";
  request: UpdateTaskRequest;
};
