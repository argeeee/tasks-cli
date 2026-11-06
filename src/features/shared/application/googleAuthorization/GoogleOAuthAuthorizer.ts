import { randomBytes } from "node:crypto";
import type { Credentials, OAuth2Client } from "google-auth-library";
import type { BrowserOpener } from "../../domain/services/BrowserOpener";
import { GoogleOAuthCallbackServer } from "./GoogleOAuthCallbackServer";
import type { GoogleOAuthAuthorizerOptions } from "../models/GoogleOAuthAuthorizerOptions";
import type { GoogleOAuthCallback } from "../models/GoogleOAuthCallback";
import type { GoogleAuthorizer } from "../models/GoogleAuthorizer";

const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/tasks"];

export class GoogleOAuthAuthorizer implements GoogleAuthorizer {
  private readonly callbackFactory: () => GoogleOAuthCallback;

  constructor(
    private readonly browserOpener: BrowserOpener,
    options: GoogleOAuthAuthorizerOptions = {},
  ) {
    this.callbackFactory = options.callbackFactory ??
      (() => new GoogleOAuthCallbackServer());
  }

  async authorize(client: OAuth2Client): Promise<Credentials> {
    const state = randomBytes(32).toString("hex");
    const callbackServer = this.callbackFactory();

    try {
      const redirectUri = await callbackServer.start(state);
      await this.browserOpener.open(
        client.generateAuthUrl({
          access_type: "offline",
          prompt: "consent",
          scope: GOOGLE_SCOPES,
          redirect_uri: redirectUri,
          state,
        }),
      );

      const response = await client.getToken({
        code: await callbackServer.waitForCode(),
        redirect_uri: redirectUri,
      });

      return response.tokens;
    } finally {
      await callbackServer.close();
    }
  }
}
