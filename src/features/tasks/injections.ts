import { lazy } from "../../core/lazy";
import { getGoogleAuthorizationService } from "../shared/injections";
import { GoogleTasksClient } from "./data/clients/GoogleTasksClient";
import { ListTasksQueryImpl } from "./data/repoQueries/ListTasksQueryImpl";
import { GetTaskQueryImpl } from "./data/repoQueries/GetTaskQueryImpl";
import { CreateTaskQueryImpl } from "./data/repoQueries/CreateTaskQueryImpl";
import { UpdateTaskQueryImpl } from "./data/repoQueries/UpdateTaskQueryImpl";
import { MoveTaskQueryImpl } from "./data/repoQueries/MoveTaskQueryImpl";
import { DeleteTaskQueryImpl } from "./data/repoQueries/DeleteTaskQueryImpl";
import { SetTaskStatusQueryImpl } from "./data/repoQueries/SetTaskStatusQueryImpl";
import { ListTasks } from "./domain/useCases/ListTasks";
import { GetTask } from "./domain/useCases/GetTask";
import { CreateTask } from "./domain/useCases/CreateTask";
import { UpdateTask } from "./domain/useCases/UpdateTask";
import { MoveTask } from "./domain/useCases/MoveTask";
import { DeleteTask } from "./domain/useCases/DeleteTask";
import { CompleteTask } from "./domain/useCases/CompleteTask";
import { ReopenTask } from "./domain/useCases/ReopenTask";

const getGoogleTasksClient = lazy(
  () => new GoogleTasksClient(getGoogleAuthorizationService()),
);
const getSetTaskStatusQuery = lazy(
  () => new SetTaskStatusQueryImpl(getGoogleTasksClient()),
);

export const getListTasks = lazy(
  () => new ListTasks(new ListTasksQueryImpl(getGoogleTasksClient())),
);

export const getGetTask = lazy(
  () => new GetTask(new GetTaskQueryImpl(getGoogleTasksClient())),
);

export const getCreateTask = lazy(
  () => new CreateTask(new CreateTaskQueryImpl(getGoogleTasksClient())),
);

export const getUpdateTask = lazy(
  () => new UpdateTask(new UpdateTaskQueryImpl(getGoogleTasksClient())),
);

export const getMoveTask = lazy(
  () => new MoveTask(new MoveTaskQueryImpl(getGoogleTasksClient())),
);

export const getDeleteTask = lazy(
  () => new DeleteTask(new DeleteTaskQueryImpl(getGoogleTasksClient())),
);

export const getCompleteTask = lazy(
  () => new CompleteTask(getSetTaskStatusQuery()),
);

export const getReopenTask = lazy(
  () => new ReopenTask(getSetTaskStatusQuery()),
);
