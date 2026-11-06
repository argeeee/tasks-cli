import { normalizeTaskDate } from "./normalizeTaskDate";

const TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

export function normalizeTaskTimestamp(value: string): string | undefined {
  const match = TIMESTAMP_PATTERN.exec(value);
  if (!match || !normalizeTaskDate(match[1] ?? "")) {
    return undefined;
  }

  if (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) {
    return undefined;
  }

  const zone = match[5] ?? "";
  if (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59)) {
    return undefined;
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
