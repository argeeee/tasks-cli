import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ENTRY_PATH = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const LOADER_PATH = import.meta.resolve("tsx");

test("CLI help, zero-limit, usage and configuration exits work without credentials", () => {
  const directory = mkdtempSync(join(tmpdir(), "tasks-cli-smoke-"));
  const environment = { ...process.env };
  delete environment.GOOGLE_CLIENT_ID;
  delete environment.GOOGLE_CLIENT_SECRET;

  try {
    for (const args of [["--help"], ["tasks", "--help"], ["tasks", "create", "--help"]]) {
      const result = spawnSync(
        process.execPath,
        ["--import", LOADER_PATH, ENTRY_PATH, ...args],
        { cwd: directory, env: environment, encoding: "utf8", timeout: 20_000 },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Usage:/);
      assert.equal(result.stderr, "");
    }

    const empty = spawnSync(
      process.execPath,
      ["--import", LOADER_PATH, ENTRY_PATH, "tasks", "list", "--limit", "0"],
      { cwd: directory, env: environment, encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(empty.status, 0, empty.stderr);
    assert.deepEqual(JSON.parse(empty.stdout), { tasks: [], limit: 0, offset: 0 });
    assert.equal(empty.stderr, "");

    const usage = spawnSync(
      process.execPath,
      ["--import", LOADER_PATH, ENTRY_PATH, "tasks", "delete", "id"],
      { cwd: directory, env: environment, encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(usage.status, 2);
    assert.equal(usage.stdout, "");
    assert.match(usage.stderr, /Deletion requires --yes/);
    assert.doesNotMatch(usage.stderr, /\n\s+at /);

    const missingConfiguration = spawnSync(
      process.execPath,
      ["--import", LOADER_PATH, ENTRY_PATH, "tasks", "get", "id"],
      { cwd: directory, env: environment, encoding: "utf8", timeout: 20_000 },
    );
    assert.equal(missingConfiguration.status, 1);
    assert.equal(missingConfiguration.stdout, "");
    assert.match(missingConfiguration.stderr, /GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET/);
    assert.doesNotMatch(missingConfiguration.stderr, /\n\s+at /);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
