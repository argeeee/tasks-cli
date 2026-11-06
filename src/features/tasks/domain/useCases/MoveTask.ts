import type { Result } from "../../../../core/Result";
import type { UseCase } from "../../../../core/UseCase";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { MoveTaskRequest } from "../models/MoveTaskRequest";
import type { MoveTaskQuery } from "../repoQueries/MoveTaskQuery";
import { validateMoveTask } from "../validation/validateMoveTask";

export class MoveTask implements UseCase<MoveTaskRequest, Task, TaskFailure> {
  constructor(private readonly query: MoveTaskQuery) {}

  async execute(request: MoveTaskRequest): Promise<Result<Task, TaskFailure>> {
    const validated = validateMoveTask(request);
    if (!validated.hasValue) {
      return validated;
    }

    return this.query.query(validated.value);
  }
}
