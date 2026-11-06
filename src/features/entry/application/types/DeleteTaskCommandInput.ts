import type { TaskIdRequest } from "../../../tasks/domain/models/TaskIdRequest";

export type DeleteTaskCommandInput = {
  kind: "tasks.delete";
  request: TaskIdRequest;
  yes: true;
};
