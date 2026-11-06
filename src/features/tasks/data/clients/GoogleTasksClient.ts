import { google } from "googleapis";
import type { tasks_v1 } from "googleapis";
import { success } from "../../../../core/Result";
import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../../domain/failures/TaskFailure";
import type { GoogleAuthorizationProvider } from "../models/GoogleAuthorizationProvider";
import type { GoogleTasksSource } from "../models/GoogleTasksSource";

export class GoogleTasksClient implements GoogleTasksSource {
  constructor(private readonly authorization: GoogleAuthorizationProvider) {}

  async get(): Promise<Result<tasks_v1.Tasks, TaskFailure>> {
    const authorized = await this.authorization.getAuthorizedClient();
    if (!authorized.hasValue) {
      return authorized;
    }

    return success(google.tasks({ version: "v1", auth: authorized.value }));
  }
}
