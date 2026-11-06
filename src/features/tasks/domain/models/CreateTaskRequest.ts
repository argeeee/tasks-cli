import type { TaskInput } from "./TaskInput";

export type CreateTaskRequest = {
  task: TaskInput;
  parent?: string;
  previous?: string;
};
