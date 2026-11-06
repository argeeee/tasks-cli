import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ENTRY_PATH = fileURLToPath(new URL("../src/index.ts", import.meta.url));

test("root help succeeds without Google credentials", () => {
  const environment = { ...process.env };
  delete environment.GOOGLE_CLIENT_ID;
  delete environment.GOOGLE_CLIENT_SECRET;

  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", ENTRY_PATH, "--help"],
    { env: environment, encoding: "utf8" },
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Manage Google Tasks/);
  assert.equal(result.stderr, "");
});
