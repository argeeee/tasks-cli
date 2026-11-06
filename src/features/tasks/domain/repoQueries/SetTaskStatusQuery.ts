import type { RepoQuery } from "../../../../core/RepoQuery";
import type { Result } from "../../../../core/Result";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { SetTaskStatusRequest } from "../models/SetTaskStatusRequest";

export interface SetTaskStatusQuery
  extends RepoQuery<SetTaskStatusRequest, Result<Task, TaskFailure>> {}
