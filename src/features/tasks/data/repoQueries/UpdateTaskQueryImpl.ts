import { failure, success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { Task } from "../../domain/entities/Task";
import type { TaskFailure } from "../../domain/failures/TaskFailure";
import type { GoogleTasksSource } from "../models/GoogleTasksSource";
import { DEFAULT_TASK_LIST } from "../models/GoogleTaskList";
import { fromGoogleTask } from "../mappers/fromGoogleTask";
import { createGoogleTaskError } from "../mappers/googleTaskErrorMapper";
import type { UpdateTaskRequest } from "../../domain/models/UpdateTaskRequest";
import type { UpdateTaskQuery } from "../../domain/repoQueries/UpdateTaskQuery";
import { toGoogleTask } from "../mappers/toGoogleTask";

export class UpdateTaskQueryImpl implements UpdateTaskQuery {
  constructor(private readonly tasksClient: GoogleTasksSource) {}

  async query(request: UpdateTaskRequest): Promise<Result<Task, TaskFailure>> {
    const client = await this.tasksClient.get();
    if (!client.hasValue) {
      return client;
    }

    try {
      const response = await client.value.tasks.patch({
        tasklist: DEFAULT_TASK_LIST,
        task: request.id,
        requestBody: toGoogleTask(request.patch),
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
