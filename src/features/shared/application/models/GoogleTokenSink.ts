import type { Credentials } from "google-auth-library";

export interface GoogleTokenSink {
  write(token: Credentials): Promise<void>;
}
