import type { TaskStatus } from "../models/TaskStatus";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  notes?: string;
  due?: string;
  completed?: string;
  parent?: string;
  position?: string;
  hidden?: boolean;
  deleted?: boolean;
};
