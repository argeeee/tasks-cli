import assert from "node:assert/strict";
import { chmod, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { OAuth2Client } from "google-auth-library";
import type { Credentials } from "google-auth-library";
import { GoogleAuthorizationService } from "../src/features/shared/application/googleAuthorization/GoogleAuthorizationService";
import { GoogleAuthorizationState } from "../src/features/shared/application/models/GoogleAuthorizationState";
import { GoogleTokenReader } from "../src/features/shared/application/googleAuthorization/GoogleTokenReader";
import { GoogleTokenWriter } from "../src/features/shared/application/googleAuthorization/GoogleTokenWriter";
import { GoogleOAuthAuthorizer } from "../src/features/shared/application/googleAuthorization/GoogleOAuthAuthorizer";
import type { GoogleOAuthCallback } from "../src/features/shared/application/models/GoogleOAuthCallback";

const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
const ENVIRONMENT = {
  GOOGLE_CLIENT_ID: "test-client-id",
  GOOGLE_CLIENT_SECRET: "test-client-secret",
};

test("missing configuration fails before reading tokens or requesting consent", async () => {
  const unexpected = async (): Promise<never> => {
    throw new Error("must not be called");
  };
  const service = new GoogleAuthorizationService(
    new GoogleAuthorizationState(),
    { read: unexpected },
    { write: unexpected },
    { authorize: unexpected },
    { environment: {} },
  );

  const result = await service.getAuthorizedClient();

  assert.equal(result.hasValue, false);
  if (!result.hasValue) {
    assert.equal(result.error.type, "CONFIGURATION");
    assert.match(result.error.message, /GOOGLE_CLIENT_ID/);
  }
});

test("stored Tasks credentials are restored and refreshed without consent", async (context) => {
  const state = new GoogleAuthorizationState();
  state.client = new OAuth2Client();
  const accessToken = context.mock.method(state.client, "getAccessToken", async () => {
    return { token: "refreshed-access-token" };
  });
  const stored = { refresh_token: "test-refresh", scope: TASKS_SCOPE };
  const service = new GoogleAuthorizationService(
    state,
    { read: async () => stored },
    { write: async () => assert.fail("must not write unchanged credentials") },
    { authorize: async () => assert.fail("must not request consent") },
    { environment: ENVIRONMENT },
  );

  const result = await service.getAuthorizedClient();

  assert.equal(result.hasValue, true);
  assert.deepEqual(state.client.credentials, stored);
  assert.equal(accessToken.mock.callCount(), 1);
});

test("missing Tasks scope or an unusable access token triggers consent and storage", async (context) => {
  for (const scope of ["unrelated-scope", TASKS_SCOPE]) {
    const state = new GoogleAuthorizationState();
    state.client = new OAuth2Client();
    context.mock.method(state.client, "getAccessToken", async () => {
      throw new Error("revoked credentials");
    });
    const granted = { access_token: "new-token", scope: TASKS_SCOPE };
    const stored: Credentials[] = [];
    let consentCalls = 0;
    const service = new GoogleAuthorizationService(
      state,
      { read: async () => ({ scope }) },
      {
        write: async (token) => {
          stored.push(token);
        },
      },
      {
        authorize: async () => {
          consentCalls += 1;
          return granted;
        },
      },
      { environment: ENVIRONMENT },
    );

    const result = await service.getAuthorizedClient();

    assert.equal(result.hasValue, true);
    assert.equal(consentCalls, 1);
    assert.deepEqual(stored, [granted]);
    assert.deepEqual(state.client.credentials, granted);
  }
});

test("authorization failures are safe and do not expose collaborator error details", async () => {
  const messages = [
    "authorization secret-token",
    "network secret-token",
    "secret-token",
  ];

  for (const message of messages) {
    const service = new GoogleAuthorizationService(
      new GoogleAuthorizationState(),
      {
        read: async () => {
          throw new Error(message);
        },
      },
      { write: async () => assert.fail("must not write") },
      { authorize: async () => assert.fail("must not authorize") },
      { environment: ENVIRONMENT },
    );

    const result = await service.getAuthorizedClient();

    assert.equal(result.hasValue, false);
    if (!result.hasValue) {
      assert.doesNotMatch(result.error.message, /secret-token/);
      let expectedType = "UNEXPECTED";
      if (message.startsWith("authorization")) {
        expectedType = "AUTHORIZATION";
      } else if (message.startsWith("network")) {
        expectedType = "NETWORK";
      }
      assert.equal(result.error.type, expectedType);
    }
  }
});

test("token storage enforces private modes including an existing directory and file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tasks-auth-"));
  const tokenPath = join(directory, "token.json");
  const token = { refresh_token: "test-refresh", scope: TASKS_SCOPE };

  try {
    const reader = new GoogleTokenReader(tokenPath);
    const writer = new GoogleTokenWriter(tokenPath);
    assert.equal(await reader.read(), undefined);
    await chmod(directory, 0o755);
    await writer.write(token);
    assert.equal((await stat(directory)).mode & 0o777, 0o700);
    assert.equal((await stat(tokenPath)).mode & 0o777, 0o600);
    assert.deepEqual(await reader.read(), token);

    await chmod(tokenPath, 0o644);
    await assert.rejects(reader.read(), /permissions are unsafe/);
    await writer.write(token);
    assert.equal((await stat(tokenPath)).mode & 0o777, 0o600);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("OAuth consent requests only Tasks scope and closes callback after token exchange", async (context) => {
  const client = new OAuth2Client("test-id", "test-secret");
  const granted = { scope: TASKS_SCOPE, access_token: "test-token" };
  let expectedState = "";
  let openedUrl = "";
  let closed = false;
  const redirectUri = "http://127.0.0.1:12345/oauth2callback";
  const callback: GoogleOAuthCallback = {
    start: async (state) => {
      expectedState = state;
      return redirectUri;
    },
    waitForCode: async () => "test-code",
    close: async () => {
      closed = true;
    },
  };
  const exchange = context.mock.method(client, "getToken", async () => {
    return { tokens: granted };
  });
  const authorizer = new GoogleOAuthAuthorizer(
    {
      open: async (url) => {
        openedUrl = url;
      },
    },
    { callbackFactory: () => callback },
  );

  assert.deepEqual(await authorizer.authorize(client), granted);
  const url = new URL(openedUrl);
  assert.equal(url.searchParams.get("scope"), TASKS_SCOPE);
  assert.equal(url.searchParams.get("state"), expectedState);
  assert.equal(expectedState.length, 64);
  assert.equal(url.searchParams.get("redirect_uri"), redirectUri);
  assert.deepEqual(exchange.mock.calls[0]?.arguments[0], {
    code: "test-code",
    redirect_uri: redirectUri,
  });
  assert.equal(closed, true);
});

test("OAuth closes callback when browser startup or callback fails", async () => {
  for (const failAtBrowser of [true, false]) {
    let closed = false;
    const callback: GoogleOAuthCallback = {
      start: async () => "http://127.0.0.1:12345/oauth2callback",
      waitForCode: async () => {
        throw new Error("callback failed");
      },
      close: async () => {
      closed = true;
    },
    };
    const authorizer = new GoogleOAuthAuthorizer(
      {
        open: async () => {
          if (failAtBrowser) {
            throw new Error("browser failed");
          }
        },
      },
      { callbackFactory: () => callback },
    );

    await assert.rejects(authorizer.authorize(new OAuth2Client()), /failed/);
    assert.equal(closed, true);
  }
});
