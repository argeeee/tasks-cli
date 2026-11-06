import type { Credentials } from "google-auth-library";

export interface GoogleTokenSource {
  read(): Promise<Credentials | undefined>;
}
