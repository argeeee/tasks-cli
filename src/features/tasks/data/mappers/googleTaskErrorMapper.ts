import type { TaskFailure } from "../../domain/failures/TaskFailure";

export function createGoogleTaskError(error: unknown): TaskFailure {
  let status: number | undefined;
  if (typeof error === "object" && error !== null) {
    if ("code" in error && Number.isInteger(Number(error.code))) {
      status = Number(error.code);
    }

    if ("response" in error && typeof error.response === "object" && error.response !== null) {
      if ("status" in error.response && typeof error.response.status === "number") {
        status = error.response.status;
      }
    }
  }

  if (status === 401) {
    return { type: "AUTHORIZATION", message: "Google Tasks authorization failed. Try consent again." };
  }

  if (status === 403) {
    return { type: "PERMISSION", message: "Google Tasks denied permission for this request." };
  }

  if (status === 404) {
    return { type: "NOT_FOUND", message: "The requested task was not found." };
  }

  if (status !== undefined && status >= 400 && status < 500) {
    return { type: "VALIDATION", message: "Google Tasks rejected the request. Check the task fields." };
  }

  if (
    error instanceof Error &&
    /network|fetch|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN/i.test(error.message)
  ) {
    return { type: "NETWORK", message: "Could not reach Google Tasks. Check your network connection." };
  }

  return { type: "UNEXPECTED", message: "Google Tasks could not complete the request." };
}
