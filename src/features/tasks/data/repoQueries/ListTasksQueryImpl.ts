import type { tasks_v1 } from "googleapis";
import { failure, success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { Task } from "../../domain/entities/Task";
import type { TaskFailure } from "../../domain/failures/TaskFailure";
import type { TaskListRequest } from "../../domain/models/TaskListRequest";
import type { TaskListResult } from "../../domain/models/TaskListResult";
import type { ListTasksQuery } from "../../domain/repoQueries/ListTasksQuery";
import type { GoogleTasksSource } from "../models/GoogleTasksSource";
import { DEFAULT_TASK_LIST } from "../models/GoogleTaskList";
import { fromGoogleTask } from "../mappers/fromGoogleTask";
import { createGoogleTaskError } from "../mappers/googleTaskErrorMapper";

export class ListTasksQueryImpl implements ListTasksQuery {
  constructor(private readonly tasksClient: GoogleTasksSource) {}

  async query(request: TaskListRequest): Promise<Result<TaskListResult, TaskFailure>> {
    const tasks: Task[] = [];
    const result: TaskListResult = { tasks, limit: request.limit, offset: request.offset };
    if (request.limit === 0) {
      return success(result);
    }

    const client = await this.tasksClient.get();
    if (!client.hasValue) {
      return client;
    }

    const parameters: tasks_v1.Params$Resource$Tasks$List = {
      tasklist: DEFAULT_TASK_LIST,
      maxResults: 100,
      showCompleted: request.showCompleted,
      showHidden: request.showHidden,
      showDeleted: request.showDeleted,
      showAssigned: request.showAssigned,
    };
    if (request.dueFrom !== undefined) {
      parameters.dueMin = `${request.dueFrom}T00:00:00.000Z`;
    }

    if (request.dueTo !== undefined) {
      parameters.dueMax = `${request.dueTo}T00:00:00.000Z`;
    }

    if (request.completedFrom !== undefined) {
      parameters.completedMin = request.completedFrom;
    }

    if (request.completedTo !== undefined) {
      parameters.completedMax = request.completedTo;
    }

    if (request.updatedSince !== undefined) {
      parameters.updatedMin = request.updatedSince;
    }

    let skipped = 0;
    const pageTokens = new Set<string>();
    try {
      do {
        const response = await client.value.tasks.list(parameters);
        for (const record of response.data.items ?? []) {
          const task = fromGoogleTask(record);
          if (!task) {
            continue;
          }

          if (skipped < request.offset) {
            skipped += 1;
            continue;
          }

          tasks.push(task);
          if (tasks.length === request.limit) {
            return success(result);
          }
        }

        const nextPageToken = response.data.nextPageToken;
        if (!nextPageToken) {
          return success(result);
        }

        if (pageTokens.has(nextPageToken)) {
          return failure({
            type: "UNEXPECTED",
            message: "Google Tasks returned a repeated page token.",
          });
        }

        pageTokens.add(nextPageToken);
        parameters.pageToken = nextPageToken;
      } while (true);
    } catch (error) {
      return failure(createGoogleTaskError(error));
    }
  }
}
