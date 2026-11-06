import assert from "node:assert/strict";
import { test } from "node:test";
import { OAuth2Client } from "google-auth-library";
import { failure, success } from "../src/core/Result";
import { GoogleTasksClient } from "../src/features/tasks/data/clients/GoogleTasksClient";
import { fromGoogleTask } from "../src/features/tasks/data/mappers/fromGoogleTask";
import { toGoogleTask } from "../src/features/tasks/data/mappers/toGoogleTask";
import { createGoogleTaskError } from "../src/features/tasks/data/mappers/googleTaskErrorMapper";
import type { GoogleFailure } from "../src/features/shared/application/failures/GoogleFailure";
import type { TaskFailure } from "../src/features/tasks/domain/failures/TaskFailure";

const RECORD = { id: "task", title: "Task", status: "needsAction" };

test("Google task mapping preserves optional values and omits incomplete entities", () => {
  assert.deepEqual(fromGoogleTask({
    ...RECORD,
    notes: "",
    due: "2026-11-06T00:00:00.000Z",
    completed: "2026-11-06T10:00:00Z",
    parent: "parent",
    position: "0001",
    hidden: false,
    deleted: true,
  }), {
    ...RECORD,
    notes: "",
    due: "2026-11-06",
    completed: "2026-11-06T10:00:00Z",
    parent: "parent",
    position: "0001",
    hidden: false,
    deleted: true,
  });
  assert.equal(fromGoogleTask({ id: "task", deleted: true }), undefined);
  assert.equal(fromGoogleTask({ ...RECORD, id: " " }), undefined);
  assert.equal(fromGoogleTask({ ...RECORD, status: "unknown" }), undefined);
  assert.deepEqual(fromGoogleTask({ ...RECORD, title: "", notes: null }), {
    ...RECORD, title: "",
  });
});

test("task payload mapping sends only supplied fields with explicit clears", () => {
  assert.deepEqual(toGoogleTask({ notes: "", due: "" }), { notes: "", due: null });
  assert.deepEqual(toGoogleTask({ title: "New", due: "2026-11-06" }), {
    title: "New", due: "2026-11-06T00:00:00.000Z",
  });
  assert.deepEqual(toGoogleTask({ notes: "Only notes" }), { notes: "Only notes" });
});

test("provider failures map safely without leaking upstream text", () => {
  const cases: [unknown, TaskFailure["type"]][] = [
    [{ code: 401 }, "AUTHORIZATION"],
    [{ code: "403" }, "PERMISSION"],
    [{ response: { status: 404 } }, "NOT_FOUND"],
    [{ code: 400 }, "VALIDATION"],
    [{ code: 500 }, "UNEXPECTED"],
    [new Error("ENOTFOUND private-service-token"), "NETWORK"],
    [new Error("private-service-token"), "UNEXPECTED"],
  ];
  for (const [error, type] of cases) {
    const mapped = createGoogleTaskError(error);
    assert.equal(mapped.type, type);
    assert.equal(mapped.message.includes("private-service-token"), false);
  }
});

test("Google Tasks client forwards authorization failures and builds the Tasks SDK", async () => {
  const denied: GoogleFailure = { type: "CONFIGURATION", message: "Missing setup" };
  const unavailable = new GoogleTasksClient({
    getAuthorizedClient: async () => failure(denied),
  });
  assert.deepEqual(await unavailable.get(), failure(denied));

  const client = new GoogleTasksClient({
    getAuthorizedClient: async () => success(new OAuth2Client()),
  });
  const result = await client.get();
  assert.equal(result.hasValue, true);
  if (result.hasValue) {
    assert.equal(typeof result.value.tasks.list, "function");
    assert.equal(typeof result.value.tasks.move, "function");
  }
});
