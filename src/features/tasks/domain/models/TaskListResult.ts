import type { Task } from "../entities/Task";

export type TaskListResult = {
  tasks: Task[];
  limit: number;
  offset: number;
};
