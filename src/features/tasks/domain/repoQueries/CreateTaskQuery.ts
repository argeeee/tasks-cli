import type { RepoQuery } from "../../../../core/RepoQuery";
import type { Result } from "../../../../core/Result";
import type { Task } from "../entities/Task";
import type { TaskFailure } from "../failures/TaskFailure";
import type { CreateTaskRequest } from "../models/CreateTaskRequest";

export interface CreateTaskQuery
  extends RepoQuery<CreateTaskRequest, Result<Task, TaskFailure>> {}
