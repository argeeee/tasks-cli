import type { RepoQuery } from "../../../../core/RepoQuery";
import type { Result } from "../../../../core/Result";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { UpdateTaskRequest } from "../models/UpdateTaskRequest";

export interface UpdateTaskQuery
  extends RepoQuery<UpdateTaskRequest, Result<Task, TaskFailure>> {}
