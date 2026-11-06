import type { RepoQuery } from "../../../../core/RepoQuery";
import type { Result } from "../../../../core/Result";
import type { TaskListResult } from "../models/TaskListResult";
import type { TaskFailure } from "../failures/TaskFailure";
import type { TaskListRequest } from "../models/TaskListRequest";

export interface ListTasksQuery
  extends RepoQuery<TaskListRequest, Result<TaskListResult, TaskFailure>> {}
