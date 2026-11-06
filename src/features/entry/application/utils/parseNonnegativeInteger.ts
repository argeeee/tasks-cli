export function parseNonnegativeInteger(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined;
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    return undefined;
  }

  return number;
}
