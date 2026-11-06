export function assertNever(value: never): never {
  throw new Error(`Unsupported command: ${JSON.stringify(value)}`);
}
