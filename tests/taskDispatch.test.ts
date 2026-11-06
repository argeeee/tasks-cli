import assert from "node:assert/strict";
import test from "node:test";
import type { TestContext } from "node:test";
import { failure, success } from "../src/core/Result";
import type { UseCase } from "../src/core/UseCase";
import { dispatchCommand } from "../src/features/entry/application/dispatchCommand";
import { parseArgs } from "../src/features/entry/application/parser/createParser";
import { runWithArgs } from "../src/features/entry/application/runWithArgs";
import type { TaskFailure } from "../src/features/tasks/domain/failures/TaskFailure";
import type { Task } from "../src/features/tasks/domain/entities/Task";
import {
  getListTasks,
  getGetTask,
  getCreateTask,
  getUpdateTask,
  getCompleteTask,
  getReopenTask,
  getMoveTask,
  getDeleteTask,
} from "../src/features/tasks/injections";

const TASK: Task = { id: "id", title: "Title", status: "needsAction" };

type CapturedCall = {
  action: string;
  input: unknown;
};

function captureExecute<Input, Output>(
  context: TestContext,
  useCase: UseCase<Input, Output, TaskFailure>,
  action: string,
  output: Output,
  calls: CapturedCall[],
): void {
  context.mock.method(useCase, "execute", async (input: Input) => {
    calls.push({ action, input });
    return success(output);
  });
}

test("dispatch routes all actions and presents pretty JSON", async (context) => {
  const calls: CapturedCall[] = [];
  const list = { tasks: [TASK], limit: 2, offset: 1 };
  const output: string[] = [];
  context.mock.method(console, "log", (text: string) => {
    output.push(text);
  });
  context.mock.method(console, "error", () => {
    assert.fail("Successful dispatch must not write stderr.");
  });
  captureExecute(context, getListTasks(), "list", list, calls);
  captureExecute(context, getGetTask(), "get", TASK, calls);
  captureExecute(context, getCreateTask(), "create", TASK, calls);
  captureExecute(context, getUpdateTask(), "update", TASK, calls);
  captureExecute(context, getCompleteTask(), "complete", TASK, calls);
  captureExecute(context, getReopenTask(), "reopen", TASK, calls);
  captureExecute(context, getMoveTask(), "move", TASK, calls);
  captureExecute(context, getDeleteTask(), "delete", TASK, calls);

  const commands = [
    ["list", "--limit", "2", "--offset", "1", "--show-completed"],
    ["get", "id"],
    ["create", "--title", "Title", "--parent", "parent"],
    ["update", "id", "--notes", "", "--due", ""],
    ["complete", "id"],
    ["reopen", "id"],
    ["move", "id", "--parent", ""],
    ["delete", "id", "--yes"],
  ];
  for (const args of commands) {
    const command = await parseArgs(["tasks", ...args]);
    assert.ok(command);
    await dispatchCommand(command);
  }

  assert.deepEqual(calls, [
    {
      action: "list",
      input: {
        limit: 2,
        offset: 1,
        showCompleted: true,
        showHidden: false,
        showDeleted: false,
        showAssigned: false,
      },
    },
    { action: "get", input: { id: "id" } },
    { action: "create", input: { task: { title: "Title" }, parent: "parent" } },
    { action: "update", input: { id: "id", patch: { notes: "", due: "" } } },
    { action: "complete", input: { id: "id" } },
    { action: "reopen", input: { id: "id" } },
    { action: "move", input: { id: "id", parent: "" } },
    { action: "delete", input: { id: "id" } },
  ]);
  assert.equal(output[0], JSON.stringify(list, null, 2));
  assert.equal(output.length, 8);
  for (const text of output.slice(1)) {
    assert.equal(text, JSON.stringify(TASK, null, 2));
  }
});

test("runtime failures are message-only stderr with exit one", async (context) => {
  const exitCode = process.exitCode;
  const errors: string[] = [];
  context.mock.method(console, "log", () => {
    assert.fail("Failed dispatch must not write stdout.");
  });
  context.mock.method(console, "error", (text: string) => {
    errors.push(text);
  });
  context.mock.method(getGetTask(), "execute", async () => {
    return failure<TaskFailure>({ type: "NOT_FOUND", message: "Task not found." });
  });

  try {
    await dispatchCommand({ kind: "tasks.get", request: { id: "id" } });
    assert.equal(process.exitCode, 1);
    assert.deepEqual(errors, ["Task not found."]);
  } finally {
    process.exitCode = exitCode;
  }
});

test("entry boundary hides unexpected failures and prints usage without stacks", async (context) => {
  const exitCode = process.exitCode;
  const errors: string[] = [];
  context.mock.method(console, "error", (text: string) => {
    errors.push(text);
  });
  context.mock.method(getGetTask(), "execute", async () => {
    throw new Error("private unexpected failure");
  });

  try {
    await runWithArgs(["tasks", "get", "id"]);
    assert.equal(process.exitCode, 1);
    assert.deepEqual(errors, ["An unexpected command error occurred."]);

    errors.length = 0;
    await runWithArgs(["tasks", "delete", "id"]);
    assert.equal(process.exitCode, 2);
    assert.match(errors[0] ?? "", /Deletion requires --yes/);
    assert.match(errors[0] ?? "", /Usage:/);
    assert.doesNotMatch(errors[0] ?? "", /\n\s+at /);
  } finally {
    process.exitCode = exitCode;
  }
});
