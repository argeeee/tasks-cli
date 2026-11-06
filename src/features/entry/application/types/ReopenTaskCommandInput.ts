import type { TaskIdRequest } from "../../../tasks/domain/models/TaskIdRequest";

export type ReopenTaskCommandInput = {
  kind: "tasks.reopen";
  request: TaskIdRequest;
};
