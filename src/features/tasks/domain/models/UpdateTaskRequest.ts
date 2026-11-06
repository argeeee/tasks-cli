import type { TaskPatch } from "./TaskPatch";

export type UpdateTaskRequest = {
  id: string;
  patch: TaskPatch;
};
