import type { Result } from "../../../../core/Result";
import type { TaskFailure } from "../../../tasks/domain/failures/TaskFailure";

export function presentResult<T>(result: Result<T, TaskFailure>): void {
  if (result.hasValue) {
    console.log(JSON.stringify(result.value, null, 2));
    return;
  }

  console.error(result.error.message);
  process.exitCode = 1;
}
