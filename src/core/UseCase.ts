import type { Result } from "./Result";

export interface UseCase<Input, Output, Error = unknown> {
  execute(input: Input): Promise<Result<Output, Error>>;
}
