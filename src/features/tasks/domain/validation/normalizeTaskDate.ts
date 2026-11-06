const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeTaskDate(value: string): string | undefined {
  if (!DATE_PATTERN.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return undefined;
  }

  return value;
}
