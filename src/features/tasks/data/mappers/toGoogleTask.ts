import type { tasks_v1 } from "googleapis";
import type { TaskPatch } from "../../domain/models/TaskPatch";

export function toGoogleTask(patch: TaskPatch): tasks_v1.Schema$Task {
  const record: tasks_v1.Schema$Task = {};
  if (patch.title !== undefined) {
    record.title = patch.title;
  }

  if (patch.notes !== undefined) {
    record.notes = patch.notes;
  }

  if (patch.due !== undefined) {
    record.due = patch.due === "" ? null : `${patch.due}T00:00:00.000Z`;
  }

  return record;
}
