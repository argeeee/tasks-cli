import assert from "node:assert/strict";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { OAuth2Client } from "google-auth-library";
import { DefaultBrowserOpener } from "../src/features/shared/application/services/DefaultBrowserOpener";
import { GoogleOAuthAuthorizer } from "../src/features/shared/application/googleAuthorization/GoogleOAuthAuthorizer";
import type { GoogleOAuthCallback } from "../src/features/shared/application/models/GoogleOAuthCallback";

const LAUNCHER_COMMAND = process.platform === "darwin" ? "open" : "xdg-open";
const TEST_URL = "https://example.invalid/consent";

test("browser launcher waits for successful exit and rejects launch failures", {
  skip: process.platform === "win32",
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), "tasks-launcher-"));
  const launcher = join(directory, LAUNCHER_COMMAND);
  const originalPath = process.env.PATH;
  const opener = new DefaultBrowserOpener();

  try {
    process.env.PATH = directory;

    await writeFile(launcher, "#!/bin/sh\nexit 0\n");
    await chmod(launcher, 0o700);
    await opener.open(TEST_URL);

    await writeFile(launcher, "#!/bin/sh\nexit 1\n");
    await assert.rejects(opener.open(TEST_URL), /could not open your browser/);

    await rm(launcher);
    await assert.rejects(opener.open(TEST_URL), /could not open your browser/);
  } finally {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }

    await rm(directory, { recursive: true, force: true });
  }
});

test("failed actual browser launcher closes OAuth callback before waiting for code", {
  skip: process.platform === "win32",
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), "tasks-launcher-oauth-"));
  const launcher = join(directory, LAUNCHER_COMMAND);
  const originalPath = process.env.PATH;
  let closed = false;
  const callback: GoogleOAuthCallback = {
    start: async () => "http://127.0.0.1:12345/oauth2callback",
    waitForCode: async () => assert.fail("must not wait after launch failure"),
    close: async () => {
      closed = true;
    },
  };

  try {
    await writeFile(launcher, "#!/bin/sh\nexit 1\n");
    await chmod(launcher, 0o700);
    process.env.PATH = directory;
    const authorizer = new GoogleOAuthAuthorizer(
      new DefaultBrowserOpener(),
      { callbackFactory: () => callback },
    );

    await assert.rejects(
      authorizer.authorize(new OAuth2Client("test-id", "test-secret")),
      /could not open your browser/,
    );
    assert.equal(closed, true);
  } finally {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }

    await rm(directory, { recursive: true, force: true });
  }
});
