export type TaskListRequest = {
  limit: number;
  offset: number;
  showCompleted: boolean;
  showHidden: boolean;
  showDeleted: boolean;
  showAssigned: boolean;
  dueFrom?: string;
  dueTo?: string;
  completedFrom?: string;
  completedTo?: string;
  updatedSince?: string;
};
