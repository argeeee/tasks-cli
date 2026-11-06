import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { runWithArgs } from "./features/entry/application/runWithArgs";

const ENV_PATH = ".env";

if (existsSync(ENV_PATH)) {
  loadEnvFile(ENV_PATH);
}

await runWithArgs(process.argv.slice(2));
