import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { UpdateTaskRequest } from "../models/UpdateTaskRequest";
import type { UpdateTaskQuery } from "../repoQueries/UpdateTaskQuery";
import { validateUpdateTask } from "../validation/validateUpdateTask";

export class UpdateTask implements UseCase<UpdateTaskRequest, Task, TaskFailure> {
  constructor(private readonly query: UpdateTaskQuery) {}

  async execute(request: UpdateTaskRequest): Promise<Result<Task, TaskFailure>> {
    const validated = validateUpdateTask(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query(validated.value);
  }
}
