import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskIdRequest } from "../models/TaskIdRequest";
import type { DeleteTaskQuery } from "../repoQueries/DeleteTaskQuery";
import { validateTaskId } from "../validation/validateTaskId";

export class DeleteTask implements UseCase<TaskIdRequest, Task, TaskFailure> {
  constructor(private readonly query: DeleteTaskQuery) {}

  async execute(request: TaskIdRequest): Promise<Result<Task, TaskFailure>> {
    const validated = validateTaskId(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query(validated.value);
  }
}
