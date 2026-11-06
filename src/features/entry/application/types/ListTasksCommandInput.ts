import type { TaskListRequest } from "../../../tasks/domain/models/TaskListRequest";

export type ListTasksCommandInput = {
  kind: "tasks.list";
  request: TaskListRequest;
};
