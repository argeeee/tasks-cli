import type { tasks_v1 } from "googleapis";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../../domain/failures/TaskFailure";

export interface GoogleTasksSource {
  get(): Promise<Result<tasks_v1.Tasks, TaskFailure>>;
}
