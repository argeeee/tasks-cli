import assert from "node:assert/strict";
import { test } from "node:test";
import { success } from "../src/core/Result";
import { CompleteTask } from "../src/features/tasks/domain/useCases/CompleteTask";
import { ReopenTask } from "../src/features/tasks/domain/useCases/ReopenTask";
import { CreateTask } from "../src/features/tasks/domain/useCases/CreateTask";
import { DeleteTask } from "../src/features/tasks/domain/useCases/DeleteTask";
import { GetTask } from "../src/features/tasks/domain/useCases/GetTask";
import { UpdateTask } from "../src/features/tasks/domain/useCases/UpdateTask";
import { MoveTask } from "../src/features/tasks/domain/useCases/MoveTask";
import { ListTasks } from "../src/features/tasks/domain/useCases/ListTasks";
import { normalizeTaskTimestamp } from "../src/features/tasks/domain/validation/normalizeTaskTimestamp";
import type { Task } from "../src/features/tasks/domain/entities/Task";
import type { TaskListRequest } from "../src/features/tasks/domain/models/TaskListRequest";
import type { SetTaskStatusRequest } from "../src/features/tasks/domain/models/SetTaskStatusRequest";

const TASK: Task = { id: "task-1", title: "Task", status: "needsAction" };
const LIST: TaskListRequest = {
  limit: 50,
  offset: 0,
  showCompleted: false,
  showHidden: false,
  showDeleted: false,
  showAssigned: false,
};
const NO_QUERY = {
  query: async () => {
    assert.fail("Invalid input must not reach the repository or authorization.");
  },
};

test("invalid domain mutations and IDs stop before repository access", async () => {
  for (const UseCase of [GetTask, DeleteTask, CompleteTask, ReopenTask]) {
    assert.equal((await new UseCase(NO_QUERY).execute({ id: "  " })).hasValue, false);
  }

  const create = new CreateTask(NO_QUERY);
  for (const task of [
    { title: " " },
    { title: "Task", due: "2026-02-29" },
    { title: "Task", due: "" },
  ]) {
    assert.equal((await create.execute({ task })).hasValue, false);
  }

  const update = new UpdateTask(NO_QUERY);
  for (const patch of [{}, { title: " " }, { due: "2026-04-31" }]) {
    assert.equal((await update.execute({ id: TASK.id, patch })).hasValue, false);
  }

  const move = new MoveTask(NO_QUERY);
  assert.equal((await move.execute({ id: TASK.id })).hasValue, false);
  assert.equal((await move.execute({ id: TASK.id, parent: " " })).hasValue, false);
});

test("domain mutations normalize identities and preserve explicit clearing", async () => {
  const update = new UpdateTask({
    query: async (request) => {
      assert.deepEqual(request, { id: TASK.id, patch: { notes: "", due: "" } });
      return success(TASK);
    },
  });
  assert.equal((await update.execute({
    id: ` ${TASK.id} `,
    patch: { notes: "", due: "" },
  })).hasValue, true);

  const create = new CreateTask({
    query: async (request) => {
      assert.deepEqual(request, {
        task: { title: "Task", notes: "  preserve notes  ", due: "2028-02-29" },
        parent: "parent",
      });
      return success(TASK);
    },
  });
  assert.equal((await create.execute({
    task: { title: " Task ", notes: "  preserve notes  ", due: "2028-02-29" },
    parent: " parent ",
  })).hasValue, true);

  const move = new MoveTask({
    query: async (request) => {
      assert.deepEqual(request, { id: TASK.id, parent: "", previous: "previous" });
      return success(TASK);
    },
  });
  assert.equal((await move.execute({
    id: TASK.id, parent: "", previous: " previous ",
  })).hasValue, true);
});

test("complete and reopen share a status query without unrelated fields", async () => {
  const requests: SetTaskStatusRequest[] = [];
  const query = {
    query: async (request: SetTaskStatusRequest) => {
      requests.push(request);
      return success(TASK);
    },
  };
  await new CompleteTask(query).execute({ id: ` ${TASK.id} ` });
  await new ReopenTask(query).execute({ id: TASK.id });
  assert.deepEqual(requests, [
    { id: TASK.id, status: "completed" },
    { id: TASK.id, status: "needsAction" },
  ]);
});

test("list rejects invalid pagination, impossible timestamps and reversed bounds", async () => {
  const list = new ListTasks(NO_QUERY);
  for (const changes of [
    { limit: -1 },
    { offset: 0.5 },
    { limit: Number.MAX_SAFE_INTEGER + 1 },
    { dueFrom: "2026-02-29" },
    { dueFrom: "2026-11-07", dueTo: "2026-11-06" },
    { completedFrom: "2026-11-06" },
    { updatedSince: "2026-02-30T00:00:00Z" },
    { updatedSince: "2026-11-06T24:00:00Z" },
    { completedFrom: "2026-11-07T00:00:00Z", completedTo: "2026-11-06T00:00:00Z" },
  ]) {
    assert.equal((await list.execute({ ...LIST, ...changes })).hasValue, false);
  }
});

test("list normalizes timezone offsets before comparing ranges and querying", async () => {
  const request: TaskListRequest = {
    ...LIST,
    completedFrom: "2026-11-06T10:00:00+02:00",
    completedTo: "2026-11-06T09:00:00Z",
    updatedSince: "2026-11-05T23:00:00-01:00",
  };
  const list = new ListTasks({
    query: async (normalized) => {
      assert.equal(normalized.completedFrom, "2026-11-06T08:00:00.000Z");
      assert.equal(normalized.updatedSince, "2026-11-06T00:00:00.000Z");
      return success({ tasks: [], limit: normalized.limit, offset: normalized.offset });
    },
  });
  assert.equal((await list.execute(request)).hasValue, true);
  assert.equal(normalizeTaskTimestamp("2026-11-06T12:00:00+24:00"), undefined);
  assert.equal(normalizeTaskTimestamp("Nov 6 2026 12:00 UTC"), undefined);
});
