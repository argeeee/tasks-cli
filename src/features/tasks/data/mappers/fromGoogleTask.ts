import type { tasks_v1 } from "googleapis";
import type { Task } from "../../domain/entities/Task";
import { normalizeTaskDate } from "../../domain/validation/normalizeTaskDate";

export function fromGoogleTask(record: tasks_v1.Schema$Task): Task | undefined {
  if (
    !record.id?.trim() || record.title === null || record.title === undefined ||
    (record.status !== "needsAction" && record.status !== "completed")
  ) {
    return undefined;
  }

  const task: Task = {
    id: record.id,
    title: record.title,
    status: record.status,
  };
  for (const key of ["notes", "completed", "parent", "position"] as const) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      task[key] = value;
    }
  }

  for (const key of ["hidden", "deleted"] as const) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      task[key] = value;
    }
  }

  if (record.due) {
    const due = normalizeTaskDate(record.due.slice(0, 10));
    if (due) {
      task.due = due;
    }
  }

  return task;
}
