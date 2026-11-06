import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskIdRequest } from "../models/TaskIdRequest";
import type { GetTaskQuery } from "../repoQueries/GetTaskQuery";
import { validateTaskId } from "../validation/validateTaskId";

export class GetTask implements UseCase<TaskIdRequest, Task, TaskFailure> {
  constructor(private readonly query: GetTaskQuery) {}

  async execute(request: TaskIdRequest): Promise<Result<Task, TaskFailure>> {
    const validated = validateTaskId(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query(validated.value);
  }
}
