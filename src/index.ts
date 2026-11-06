import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createParser } from "./features/entry/application/parser/createParser";

const ENV_PATH = ".env";

if (existsSync(ENV_PATH)) {
  loadEnvFile(ENV_PATH);
}

await createParser().run(process.argv.slice(2));
