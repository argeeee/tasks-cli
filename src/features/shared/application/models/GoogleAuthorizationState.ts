import type { OAuth2Client } from "google-auth-library";

export class GoogleAuthorizationState {
  public client: OAuth2Client | undefined;
}
