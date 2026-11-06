import { failure, success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { Task } from "../../domain/entities/Task";
import type { TaskFailure } from "../../domain/failures/TaskFailure";
import type { GoogleTasksSource } from "../models/GoogleTasksSource";
import { DEFAULT_TASK_LIST } from "../models/GoogleTaskList";
import { fromGoogleTask } from "../mappers/fromGoogleTask";
import { createGoogleTaskError } from "../mappers/googleTaskErrorMapper";
import type { SetTaskStatusRequest } from "../../domain/models/SetTaskStatusRequest";
import type { SetTaskStatusQuery } from "../../domain/repoQueries/SetTaskStatusQuery";

export class SetTaskStatusQueryImpl implements SetTaskStatusQuery {
  constructor(private readonly tasksClient: GoogleTasksSource) {}

  async query(request: SetTaskStatusRequest): Promise<Result<Task, TaskFailure>> {
    const client = await this.tasksClient.get();
    if (!client.hasValue) {
      return client;
    }

    try {
      const response = await client.value.tasks.patch({
        tasklist: DEFAULT_TASK_LIST,
        task: request.id,
        requestBody: { status: request.status },
      });
      const task = fromGoogleTask(response.data);
      if (!task) {
        return failure({
          type: "UNEXPECTED",
          message: "Google Tasks returned an incomplete task.",
        });
      }

      return success(task);
    } catch (error) {
      return failure(createGoogleTaskError(error));
    }
  }
}
