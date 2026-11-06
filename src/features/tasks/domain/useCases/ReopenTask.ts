import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskIdRequest } from "../models/TaskIdRequest";
import type { SetTaskStatusQuery } from "../repoQueries/SetTaskStatusQuery";
import { validateTaskId } from "../validation/validateTaskId";

export class ReopenTask implements UseCase<TaskIdRequest, Task, TaskFailure> {
  constructor(private readonly query: SetTaskStatusQuery) {}

  async execute(request: TaskIdRequest): Promise<Result<Task, TaskFailure>> {
    const validated = validateTaskId(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query({ id: validated.value.id, status: "needsAction" });
  }
}
