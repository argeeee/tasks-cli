import type { RepoQuery } from "../../../../core/RepoQuery";
import type { Result } from "../../../../core/Result";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskIdRequest } from "../models/TaskIdRequest";

export interface GetTaskQuery
  extends RepoQuery<TaskIdRequest, Result<Task, TaskFailure>> {}
