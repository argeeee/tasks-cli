import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { GoogleOAuthCallback } from "../models/GoogleOAuthCallback";

const GOOGLE_CALLBACK_PATH = "/oauth2callback";
const CALLBACK_ORIGIN = "http://127.0.0.1";

export class GoogleOAuthCallbackServer implements GoogleOAuthCallback {
  private readonly server: Server;
  private expectedState = "";
  private resolveCode: (code: string) => void = () => {};
  private rejectCode: (error: Error) => void = () => {};
  private readonly code = new Promise<string>((resolve, reject) => {
    this.resolveCode = resolve;
    this.rejectCode = reject;
  });

  constructor() {
    this.server = createServer((request, response) => {
      this.handleRequest(request, response);
    });

    // Browser startup can fail before the authorizer begins awaiting this promise.
    void this.code.catch(() => {});
  }

  async start(state: string): Promise<string> {
    this.expectedState = state;

    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, "127.0.0.1", resolve);
    });
    this.server.on("error", (error) => {
      this.rejectCode(error);
    });

    const address = this.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not start the Google authorization callback server.");
    }

    return `${CALLBACK_ORIGIN}:${address.port}${GOOGLE_CALLBACK_PATH}`;
  }

  waitForCode(): Promise<string> {
    return this.code;
  }

  async close(): Promise<void> {
    if (!this.server.listening) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): void {
    let url: URL;
    try {
      url = new URL(request.url ?? "/", CALLBACK_ORIGIN);
    } catch {
      this.rejectCallback(response);
      return;
    }

    const state = url.searchParams.get("state");
    if (url.pathname !== GOOGLE_CALLBACK_PATH || state !== this.expectedState) {
      this.rejectCallback(response);
      return;
    }

    const authorizationError = url.searchParams.get("error");
    if (authorizationError) {
      response.writeHead(400, { "Content-Type": "text/plain" });
      response.end("Google authorization was cancelled.");
      this.rejectCode(
        new Error("Google authorization was cancelled."),
      );
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      this.rejectCallback(response);
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(
      "<p>Google Tasks authorization complete. You can close this " +
        "tab.</p>",
    );
    this.resolveCode(code);
  }

  private rejectCallback(response: ServerResponse): void {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end(
      "Authorization was not completed. Return to the terminal and try " +
        "again.",
    );
    this.rejectCode(
      new Error(
        "Google authorization was cancelled or the callback could not be " +
          "verified.",
      ),
    );
  }
}
