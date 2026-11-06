import assert from "node:assert/strict";
import test from "node:test";
import { UsageException } from "@argetim/arg-parser/command_runner";
import { parseArgs } from "../src/features/entry/application/parser/createParser";

const DEFAULT_LIST = {
  limit: 50,
  offset: 0,
  showCompleted: false,
  showHidden: false,
  showDeleted: false,
  showAssigned: false,
};

test("list defaults and every filter map to normalized domain input", async () => {
  assert.deepEqual(await parseArgs(["tasks", "list"]), {
    kind: "tasks.list",
    request: DEFAULT_LIST,
  });
  assert.deepEqual(await parseArgs([
    "tasks", "list", "--limit", "3", "--offset", "2",
    "--show-completed", "--show-hidden", "--show-deleted", "--show-assigned",
    "--due-from", "2026-11-01", "--due-to", "2026-12-01",
    "--completed-from", "2026-11-01T02:00:00+02:00",
    "--completed-to", "2026-11-02T00:00:00Z",
    "--updated-since", "2026-10-01T00:00:00Z",
  ]), {
    kind: "tasks.list",
    request: {
      limit: 3,
      offset: 2,
      showCompleted: true,
      showHidden: true,
      showDeleted: true,
      showAssigned: true,
      dueFrom: "2026-11-01",
      dueTo: "2026-12-01",
      completedFrom: "2026-11-01T00:00:00.000Z",
      completedTo: "2026-11-02T00:00:00.000Z",
      updatedSince: "2026-10-01T00:00:00.000Z",
    },
  });
});

test("ID actions support one normalized positional or option ID", async () => {
  for (const action of ["get", "complete", "reopen"]) {
    for (const idArgs of [[" task-id "], ["--id", " task-id "]]) {
      assert.deepEqual(await parseArgs(["tasks", action, ...idArgs]), {
        kind: `tasks.${action}`,
        request: { id: "task-id" },
      });
    }
  }

  assert.deepEqual(await parseArgs(["tasks", "delete", "task-id", "--yes"]), {
    kind: "tasks.delete",
    request: { id: "task-id" },
    yes: true,
  });
});

test("create omits absent fields and preserves notes and relations", async () => {
  assert.deepEqual(await parseArgs(["tasks", "create", "-t", " Title "]), {
    kind: "tasks.create",
    request: { task: { title: "Title" } },
  });
  assert.deepEqual(await parseArgs([
    "tasks", "create", "--title", "Title", "--notes", " note ",
    "--due", "2026-11-10", "--parent", " parent ", "--previous", "previous",
  ]), {
    kind: "tasks.create",
    request: {
      task: { title: "Title", notes: " note ", due: "2026-11-10" },
      parent: "parent",
      previous: "previous",
    },
  });
});

test("update and move preserve explicit clearing and omit absent fields", async () => {
  assert.deepEqual(await parseArgs([
    "tasks", "update", "id", "--notes", "", "--due", "",
  ]), {
    kind: "tasks.update",
    request: { id: "id", patch: { notes: "", due: "" } },
  });
  assert.deepEqual(await parseArgs(["tasks", "update", "--id", "id", "-t", " New "]), {
    kind: "tasks.update",
    request: { id: "id", patch: { title: "New" } },
  });
  assert.deepEqual(await parseArgs(["tasks", "move", "id", "--parent", ""]), {
    kind: "tasks.move",
    request: { id: "id", parent: "" },
  });
  assert.deepEqual(await parseArgs(["tasks", "move", "id", "--previous", " sibling "]), {
    kind: "tasks.move",
    request: { id: "id", previous: "sibling" },
  });
});

test("invalid identity, extra arguments and unconfirmed deletion are usage failures", async () => {
  for (const action of ["get", "complete", "reopen", "delete", "update", "move"]) {
    for (const idArgs of [[], ["--id", ""], ["--id", "   "], ["one", "two"], ["one", "--id", "two"]]) {
      await assert.rejects(parseArgs(["tasks", action, ...idArgs]), UsageException);
    }
  }

  for (const args of [
    ["tasks", "list", "extra"],
    ["tasks", "create", "--title", "Title", "extra"],
    ["tasks", "delete", "id"],
    ["tasks", "delete", "id", "--no-yes"],
    ["tasks", "update", "id"],
    ["tasks", "move", "id"],
    ["tasks", "get", "id", "--unknown"],
  ]) {
    await assert.rejects(parseArgs(args), UsageException);
  }
});

test("parser rejects unsafe numeric spellings and business-invalid dates or patches", async () => {
  for (const value of ["-1", "1.5", "1e2", "9007199254740992", "", " 1"]) {
    for (const option of ["--limit", "--offset"]) {
      await assert.rejects(parseArgs(["tasks", "list", option, value]), UsageException);
    }
  }

  for (const args of [
    ["create"],
    ["create", "--title", "   "],
    ["create", "--title", "Title", "--due", "2026-02-30"],
    ["create", "--title", "Title", "--parent", ""],
    ["update", "id", "--title", ""],
    ["update", "id", "--due", "2026-11-01T00:00:00Z"],
    ["move", "id", "--parent", "   "],
    ["list", "--due-from", "2026-02-30"],
    ["list", "--due-from", "2026-11-02", "--due-to", "2026-11-01"],
    ["list", "--completed-from", "2026-11-01"],
    ["list", "--updated-since", "2026-11-01T00:00:00"],
    ["list", "--completed-from", "2026-11-02T00:00:00Z", "--completed-to", "2026-11-01T00:00:00Z"],
  ]) {
    await assert.rejects(parseArgs(["tasks", ...args]), UsageException);
  }
});
