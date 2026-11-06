import type { CreateTaskRequest } from "../../../tasks/domain/models/CreateTaskRequest";

export type CreateTaskCommandInput = {
  kind: "tasks.create";
  request: CreateTaskRequest;
};
