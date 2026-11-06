import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { CreateTaskRequest } from "../models/CreateTaskRequest";
import type { CreateTaskQuery } from "../repoQueries/CreateTaskQuery";
import { validateCreateTask } from "../validation/validateCreateTask";

export class CreateTask implements UseCase<CreateTaskRequest, Task, TaskFailure> {
  constructor(private readonly query: CreateTaskQuery) {}

  async execute(request: CreateTaskRequest): Promise<Result<Task, TaskFailure>> {
    const validated = validateCreateTask(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query(validated.value);
  }
}
