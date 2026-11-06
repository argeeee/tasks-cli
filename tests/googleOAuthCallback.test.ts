import assert from "node:assert/strict";
import test from "node:test";
import { GoogleOAuthCallbackServer } from "../src/features/shared/application/googleAuthorization/GoogleOAuthCallbackServer";

test("callback verifies state, returns code, and closes its listening socket", async () => {
  const server = new GoogleOAuthCallbackServer();
  const redirectUri = await server.start("expected-state");

  try {
    const code = server.waitForCode();
    const response = await fetch(`${redirectUri}?state=expected-state&code=test-code`);
    assert.equal(response.status, 200);
    await response.text();
    assert.equal(await code, "test-code");
  } finally {
    await server.close();
  }

  await assert.rejects(fetch(redirectUri));
});

test("callback rejects invalid state and consent cancellation", async () => {
  const queries = [
    "state=wrong&code=test-code",
    "state=expected-state&error=access_denied",
  ];

  for (const query of queries) {
    const server = new GoogleOAuthCallbackServer();
    const redirectUri = await server.start("expected-state");

    try {
      const rejected = assert.rejects(server.waitForCode(), /authorization/);
      const response = await fetch(`${redirectUri}?${query}`);
      assert.equal(response.status, 400);
      await response.text();
      await rejected;
    } finally {
      await server.close();
    }
  }
});
