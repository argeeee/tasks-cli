import type { TaskIdRequest } from "../../../tasks/domain/models/TaskIdRequest";

export type GetTaskCommandInput = {
  kind: "tasks.get";
  request: TaskIdRequest;
};
