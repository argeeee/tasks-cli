import { spawn } from "node:child_process";
import type { BrowserOpener } from "../../domain/services/BrowserOpener";

const MACOS_COMMAND = "open";
const WINDOWS_COMMAND = "cmd";
const LINUX_COMMAND = "xdg-open";

export class DefaultBrowserOpener implements BrowserOpener {
  async open(url: string): Promise<void> {
    let command = LINUX_COMMAND;
    let args = [url];

    if (process.platform === "darwin") {
      command = MACOS_COMMAND;
    } else if (process.platform === "win32") {
      command = WINDOWS_COMMAND;
      args = ["/c", "start", "", url];
    }

    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { detached: true, stdio: "ignore" });

      child.once("error", () => {
        reject(new Error("Google authorization could not open your browser."));
      });

      child.once("spawn", () => {
        child.unref();
        resolve();
      });
    });
  }
}
