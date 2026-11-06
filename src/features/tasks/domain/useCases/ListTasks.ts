import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { TaskListResult } from "../models/TaskListResult";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskListRequest } from "../models/TaskListRequest";
import type { ListTasksQuery } from "../repoQueries/ListTasksQuery";
import { validateTaskList } from "../validation/validateTaskList";

export class ListTasks implements UseCase<TaskListRequest, TaskListResult, TaskFailure> {
  constructor(private readonly query: ListTasksQuery) {}

  async execute(request: TaskListRequest): Promise<Result<TaskListResult, TaskFailure>> {
    const validated = validateTaskList(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query(validated.value);
  }
}
