export interface GoogleOAuthCallback {
  start(state: string): Promise<string>;
  waitForCode(): Promise<string>;
  close(): Promise<void>;
}
