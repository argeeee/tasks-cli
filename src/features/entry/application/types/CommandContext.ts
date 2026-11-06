import type { ArgResults } from "@argetim/arg-parser";

export type CommandContext = {
  readonly name: string;
  readonly argResults: ArgResults | undefined;
  usageException(message: string): never;
};
