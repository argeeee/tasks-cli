import { failure, success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { Task } from "../../domain/entities/Task";
import type { TaskFailure } from "../../domain/failures/TaskFailure";
import type { GoogleTasksSource } from "../models/GoogleTasksSource";
import { DEFAULT_TASK_LIST } from "../models/GoogleTaskList";
import { fromGoogleTask } from "../mappers/fromGoogleTask";
import { createGoogleTaskError } from "../mappers/googleTaskErrorMapper";
import type { TaskIdRequest } from "../../domain/models/TaskIdRequest";
import type { DeleteTaskQuery } from "../../domain/repoQueries/DeleteTaskQuery";

export class DeleteTaskQueryImpl implements DeleteTaskQuery {
  constructor(private readonly tasksClient: GoogleTasksSource) {}

  async query(request: TaskIdRequest): Promise<Result<Task, TaskFailure>> {
    const client = await this.tasksClient.get();
    if (!client.hasValue) {
      return client;
    }

    try {
      const response = await client.value.tasks.get({
        tasklist: DEFAULT_TASK_LIST,
        task: request.id,
      });
      const task = fromGoogleTask(response.data);
      if (!task) {
        return failure({ type: "NOT_FOUND", message: "The requested task was not found." });
      }

      await client.value.tasks.delete({ tasklist: DEFAULT_TASK_LIST, task: request.id });
      return success(task);
    } catch (error) {
      return failure(createGoogleTaskError(error));
    }
  }
}
