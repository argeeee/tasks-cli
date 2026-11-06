import type { Credentials, OAuth2Client } from "google-auth-library";

export interface GoogleAuthorizer {
  authorize(client: OAuth2Client): Promise<Credentials>;
}
