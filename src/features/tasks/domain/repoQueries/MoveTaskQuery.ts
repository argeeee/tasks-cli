import type { RepoQuery } from "../../../../core/RepoQuery";
import type { Result } from "../../../../core/Result";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { MoveTaskRequest } from "../models/MoveTaskRequest";

export interface MoveTaskQuery
  extends RepoQuery<MoveTaskRequest, Result<Task, TaskFailure>> {}
