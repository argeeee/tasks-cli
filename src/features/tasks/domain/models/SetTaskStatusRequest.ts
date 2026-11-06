import type { TaskStatus } from "./TaskStatus";

export type SetTaskStatusRequest = {
  id: string;
  status: TaskStatus;
};
