import assert from "node:assert/strict";
import { test } from "node:test";
import { google } from "googleapis";
import { failure, success } from "../src/core/Result";
import { GetTaskQueryImpl } from "../src/features/tasks/data/repoQueries/GetTaskQueryImpl";
import { CreateTaskQueryImpl } from "../src/features/tasks/data/repoQueries/CreateTaskQueryImpl";
import { UpdateTaskQueryImpl } from "../src/features/tasks/data/repoQueries/UpdateTaskQueryImpl";
import { SetTaskStatusQueryImpl } from "../src/features/tasks/data/repoQueries/SetTaskStatusQueryImpl";
import { MoveTaskQueryImpl } from "../src/features/tasks/data/repoQueries/MoveTaskQueryImpl";
import { DeleteTaskQueryImpl } from "../src/features/tasks/data/repoQueries/DeleteTaskQueryImpl";
import { ListTasksQueryImpl } from "../src/features/tasks/data/repoQueries/ListTasksQueryImpl";
import { CompleteTask } from "../src/features/tasks/domain/useCases/CompleteTask";
import { ReopenTask } from "../src/features/tasks/domain/useCases/ReopenTask";
import type { GoogleTasksSource } from "../src/features/tasks/data/models/GoogleTasksSource";
import type { TaskListRequest } from "../src/features/tasks/domain/models/TaskListRequest";
import type { TaskFailure } from "../src/features/tasks/domain/failures/TaskFailure";

type ApiCall = {
  path: string;
  parameters: URLSearchParams;
  method: string;
  body: unknown;
};

type ApiResponse = {
  body?: unknown;
  status?: number;
};

type ApiHandler = (call: ApiCall) => ApiResponse;

const TASK = { id: "task-1", title: "Task", status: "needsAction" };
const LIST: TaskListRequest = {
  limit: 50,
  offset: 0,
  showCompleted: false,
  showHidden: false,
  showDeleted: false,
  showAssigned: false,
};
const COLLECTION_PATH = "/tasks/v1/lists/@default/tasks";

function createClient(handler: ApiHandler): GoogleTasksSource {
  const tasks = google.tasks({
    version: "v1",
    retry: false,
    fetchImplementation: async (url, options) => {
      const parsed = new URL(String(url));
      const response = handler({
        path: decodeURIComponent(parsed.pathname),
        parameters: parsed.searchParams,
        method: options?.method ?? "GET",
        body: options?.body === undefined ? undefined : JSON.parse(String(options.body)),
      });
      return new Response(
        response.status === 204 ? null : JSON.stringify(response.body ?? {}),
        {
          status: response.status ?? 200,
          headers: { "content-type": "application/json" },
        },
      );
    },
  });
  return { get: async () => success(tasks) };
}

test("get uses the default task list and maps provider date output", async () => {
  const client = createClient((call) => {
    assert.equal(call.method, "GET");
    assert.equal(call.path, `${COLLECTION_PATH}/${TASK.id}`);
    return { body: { ...TASK, due: "2026-11-06T00:00:00Z" } };
  });
  assert.deepEqual(await new GetTaskQueryImpl(client).query({ id: TASK.id }), success({
    ...TASK, due: "2026-11-06",
  }));
});

test("create sends relation parameters separately from editable fields", async () => {
  const client = createClient((call) => {
    assert.equal(call.method, "POST");
    assert.equal(call.path, COLLECTION_PATH);
    assert.equal(call.parameters.get("parent"), "parent");
    assert.equal(call.parameters.get("previous"), "previous");
    assert.deepEqual(call.body, { title: "Task", notes: "Notes", due: "2026-11-06T00:00:00.000Z" });
    return { body: TASK };
  });
  assert.equal((await new CreateTaskQueryImpl(client).query({
    task: { title: "Task", notes: "Notes", due: "2026-11-06" },
    parent: "parent",
    previous: "previous",
  })).hasValue, true);
});

test("updates patch only supplied fields and clear due with null", async () => {
  let calls = 0;
  const client = createClient((call) => {
    calls += 1;
    assert.equal(call.method, "PATCH");
    assert.equal(call.path, `${COLLECTION_PATH}/${TASK.id}`);
    assert.deepEqual(call.body, { notes: "", due: null });
    return { body: TASK };
  });
  assert.equal((await new UpdateTaskQueryImpl(client).query({
    id: TASK.id, patch: { notes: "", due: "" },
  })).hasValue, true);
  assert.equal(calls, 1);
});

test("complete and reopen send status-only patches without preliminary GET", async () => {
  const bodies: unknown[] = [];
  const client = createClient((call) => {
    assert.equal(call.method, "PATCH");
    bodies.push(call.body);
    return { body: TASK };
  });
  const query = new SetTaskStatusQueryImpl(client);
  assert.equal((await new CompleteTask(query).execute({ id: TASK.id })).hasValue, true);
  assert.equal((await new ReopenTask(query).execute({ id: TASK.id })).hasValue, true);
  assert.deepEqual(bodies, [{ status: "completed" }, { status: "needsAction" }]);
});

test("move sends relation IDs, with empty values omitted for top-level moves", async () => {
  let calls = 0;
  const client = createClient((call) => {
    assert.equal(call.method, "POST");
    assert.equal(call.path, `${COLLECTION_PATH}/${TASK.id}/move`);
    assert.equal(call.parameters.get("parent"), calls === 0 ? "parent" : null);
    assert.equal(call.parameters.get("previous"), calls === 0 ? "previous" : null);
    calls += 1;
    return { body: TASK };
  });
  const query = new MoveTaskQueryImpl(client);
  assert.equal((await query.query({
    id: TASK.id, parent: "parent", previous: "previous",
  })).hasValue, true);
  assert.equal((await query.query({ id: TASK.id, parent: "", previous: "" })).hasValue, true);
  assert.equal(calls, 2);
});

test("delete reads a snapshot before deleting and stops on failed or incomplete reads", async () => {
  const methods: string[] = [];
  const client = createClient((call) => {
    methods.push(call.method);
    assert.equal(call.path, `${COLLECTION_PATH}/${TASK.id}`);
    return call.method === "DELETE" ? { status: 204 } : { body: TASK };
  });
  assert.deepEqual(await new DeleteTaskQueryImpl(client).query({ id: TASK.id }), success(TASK));
  assert.deepEqual(methods, ["GET", "DELETE"]);

  for (const response of [{ status: 403 }, { body: { id: TASK.id } }]) {
    let reads = 0;
    const unavailable = createClient((call) => {
      reads += 1;
      assert.equal(call.method, "GET");
      return response;
    });
    assert.equal((await new DeleteTaskQueryImpl(unavailable).query({ id: TASK.id })).hasValue, false);
    assert.equal(reads, 1);
  }
});

test("list follows empty pages, skips incomplete records before offset and stops at limit", async () => {
  let calls = 0;
  const client = createClient((call) => {
    assert.equal(call.method, "GET");
    assert.equal(call.path, COLLECTION_PATH);
    assert.equal(call.parameters.get("maxResults"), "100");
    assert.equal(call.parameters.get("showCompleted"), "true");
    assert.equal(call.parameters.get("showHidden"), "true");
    assert.equal(call.parameters.get("showDeleted"), "true");
    assert.equal(call.parameters.get("showAssigned"), "true");
    assert.equal(call.parameters.get("dueMin"), "2026-11-06T00:00:00.000Z");
    assert.equal(call.parameters.get("dueMax"), "2026-11-07T00:00:00.000Z");
    assert.equal(call.parameters.get("completedMin"), "2026-11-06T08:00:00.000Z");
    assert.equal(call.parameters.get("completedMax"), "2026-11-07T08:00:00.000Z");
    assert.equal(call.parameters.get("updatedMin"), "2026-11-06T00:00:00.000Z");
    calls += 1;
    if (calls === 1) {
      assert.equal(call.parameters.get("pageToken"), null);
      return { body: { items: [{ id: "bad" }, TASK], nextPageToken: "empty" } };
    }

    if (calls === 2) {
      assert.equal(call.parameters.get("pageToken"), "empty");
      return { body: { nextPageToken: "last" } };
    }

    assert.equal(call.parameters.get("pageToken"), "last");
    return { body: { items: [{ ...TASK, id: "selected" }, TASK], nextPageToken: "unneeded" } };
  });
  assert.deepEqual(await new ListTasksQueryImpl(client).query({
    ...LIST,
    limit: 1,
    offset: 1,
    showCompleted: true,
    showHidden: true,
    showDeleted: true,
    showAssigned: true,
    dueFrom: "2026-11-06",
    dueTo: "2026-11-07",
    completedFrom: "2026-11-06T08:00:00.000Z",
    completedTo: "2026-11-07T08:00:00.000Z",
    updatedSince: "2026-11-06T00:00:00.000Z",
  }), success({ tasks: [{ ...TASK, id: "selected" }], limit: 1, offset: 1 }));
  assert.equal(calls, 3);
});

test("zero-limit list never authorizes and repeated provider tokens fail safely", async () => {
  const noAuth: GoogleTasksSource = {
    get: async () => {
      assert.fail("Zero limit must not authorize.");
    },
  };
  assert.deepEqual(await new ListTasksQueryImpl(noAuth).query({ ...LIST, limit: 0 }), success({
    tasks: [], limit: 0, offset: 0,
  }));

  let calls = 0;
  const repeated = createClient(() => {
    calls += 1;
    return { body: { nextPageToken: "same" } };
  });
  const result = await new ListTasksQueryImpl(repeated).query(LIST);
  assert.equal(result.hasValue, false);
  assert.equal(calls, 2);
});

test("all queries short-circuit authorization failures", async () => {
  const denied: TaskFailure = { type: "AUTHORIZATION", message: "Not authorized" };
  const client: GoogleTasksSource = { get: async () => failure(denied) };
  const results = await Promise.all([
    new GetTaskQueryImpl(client).query({ id: TASK.id }),
    new CreateTaskQueryImpl(client).query({ task: { title: "Task" } }),
    new UpdateTaskQueryImpl(client).query({ id: TASK.id, patch: { notes: "Changed" } }),
    new SetTaskStatusQueryImpl(client).query({ id: TASK.id, status: "completed" }),
    new MoveTaskQueryImpl(client).query({ id: TASK.id, parent: "" }),
    new DeleteTaskQueryImpl(client).query({ id: TASK.id }),
    new ListTasksQueryImpl(client).query(LIST),
  ]);
  for (const result of results) {
    assert.deepEqual(result, failure(denied));
  }
});

test("SDK HTTP failures map safely and incomplete mutation/get responses fail", async () => {
  const cases: [number, TaskFailure["type"]][] = [
    [401, "AUTHORIZATION"], [403, "PERMISSION"], [404, "NOT_FOUND"],
    [400, "VALIDATION"], [500, "UNEXPECTED"],
  ];
  for (const [status, type] of cases) {
    const client = createClient(() => ({ status, body: { error: { message: "private upstream" } } }));
    const result = await new GetTaskQueryImpl(client).query({ id: TASK.id });
    assert.equal(result.hasValue, false);
    if (!result.hasValue) {
      assert.equal(result.error.type, type);
      assert.equal(result.error.message.includes("private upstream"), false);
    }
  }

  const incomplete = createClient(() => ({ body: { id: TASK.id } }));
  const get = await new GetTaskQueryImpl(incomplete).query({ id: TASK.id });
  const create = await new CreateTaskQueryImpl(incomplete).query({ task: { title: "Task" } });
  assert.equal(get.hasValue, false);
  assert.equal(create.hasValue, false);
  if (!get.hasValue && !create.hasValue) {
    assert.equal(get.error.type, "NOT_FOUND");
    assert.equal(create.error.type, "UNEXPECTED");
  }
});
