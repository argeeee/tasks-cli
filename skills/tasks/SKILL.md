---
name: tasks
description: Manage Google Tasks with the bundled tasks CLI.
---

# Tasks CLI

Run commands from this skill directory so `tasks.js`, `.env`, and `.tasks/` state are resolved from the correct location:

```bash
node tasks.js tasks <action> [options]
```

The CLI manages tasks in the default Google Tasks list and requires Google Tasks API credentials. It loads credentials from a `.env` file in this directory. Keep credentials and token files out of commands, output, and version control.

## Preferences

- Use English for task titles and notes.
- End task titles with a fitting emoji.
- Interpret relative dates such as today and tomorrow in `Europe/Rome`.
- When a day is requested, use a date-only due date; do not invent a time or duration.
- Tasks do not support calendar colors.

## Commands

```bash
node tasks.js tasks list [--limit=<n>] [--offset=<n>] [--due-from=<date>] [--due-to=<date>]
node tasks.js tasks get <task-id>
node tasks.js tasks create --title=<text> [--notes=<text>] [--due=<YYYY-MM-DD>]
node tasks.js tasks update <task-id> [--title=<text>] [--notes=<text>] [--due=<YYYY-MM-DD>]
node tasks.js tasks complete <task-id>
node tasks.js tasks reopen <task-id>
node tasks.js tasks move <task-id> [--parent=<task-id>] [--previous=<task-id>]
node tasks.js tasks delete <task-id> --yes
```

Use `node tasks.js tasks <action> --help` for all options. For a specific due day, use that date for both `--due-from` and `--due-to` when listing. An empty `--due` clears a due date on update. Deletion requires `--yes` and is irreversible; get explicit confirmation naming the task before deleting.
