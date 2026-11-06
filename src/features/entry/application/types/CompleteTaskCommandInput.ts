import type { TaskIdRequest } from "../../../tasks/domain/models/TaskIdRequest";

export type CompleteTaskCommandInput = {
  kind: "tasks.complete";
  request: TaskIdRequest;
};
