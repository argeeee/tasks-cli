import { readFile, stat } from "node:fs/promises";
import type { Credentials } from "google-auth-library";
import type { GoogleTokenSource } from "../models/GoogleTokenSource";

export class GoogleTokenReader implements GoogleTokenSource {
  constructor(private readonly tokenPath: string) {}

  async read(): Promise<Credentials | undefined> {
    try {
      const details = await stat(this.tokenPath);
      if ((details.mode & 0o077) !== 0) {
        throw new Error(
          `Token file permissions are unsafe. Set ${this.tokenPath} ` +
            "to owner-only access.",
        );
      }

      return JSON.parse(await readFile(this.tokenPath, "utf8")) as Credentials;
    } catch (error) {
      if (
        typeof error === "object" && error !== null && "code" in error &&
        error.code === "ENOENT"
      ) {
        return undefined;
      }

      throw error;
    }
  }
}
