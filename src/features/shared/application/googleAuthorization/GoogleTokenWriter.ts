import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Credentials } from "google-auth-library";
import type { GoogleTokenSink } from "../models/GoogleTokenSink";

export class GoogleTokenWriter implements GoogleTokenSink {
  constructor(private readonly tokenPath: string) {}

  async write(token: Credentials): Promise<void> {
    await mkdir(dirname(this.tokenPath), { recursive: true, mode: 0o700 });
    await chmod(dirname(this.tokenPath), 0o700);
    await writeFile(this.tokenPath, JSON.stringify(token, null, 2), {
      mode: 0o600,
    });
    await chmod(this.tokenPath, 0o600);
  }
}
