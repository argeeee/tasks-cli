# Tasks CLI

Manage the **default Google Tasks list** (`@default`) from a TypeScript CLI.
The project follows the domain, data, entry, and injection guidance in
`docs/references/`. It supports list, get, create, update, complete, reopen, move,
and delete. Selecting other task lists and managing task lists are not supported.

Requires Node.js 22.16 or newer.

```sh
npm install
npm run build
node dist/index.js --help
node dist/index.js tasks --help
```

The executable is named `tasks`; its feature group is also `tasks`, following the
reference project's command grouping. With the built file, use
`node dist/index.js tasks <action>`. During development use
`npm run dev -- tasks <action>`.

## Export

```sh
npm run export
cd skills/tasks
node tasks.js --help
```

Export builds the CLI and copies the bundle to `skills/tasks/tasks.js`, creating
the directory when needed. If a root `.env` exists, it is also copied to
`skills/tasks/.env`. Run from that directory to load the copied environment file.
The generated bundle, environment file, and local tokens are ignored by Git.

## Google authorization

Enable the Google Tasks API in your Google Cloud project, configure its OAuth
consent screen, and create a **Desktop app** OAuth client. Add your account as a
test user if the consent screen is in testing mode. Supply client credentials
through your environment:

```sh
export GOOGLE_CLIENT_ID='your-client-id'
export GOOGLE_CLIENT_SECRET='your-client-secret'
```

An optional `.env` in the current working directory is loaded at startup. Keep it
local and never commit real credentials. Authorization requests only the Google
Tasks scope (`https://www.googleapis.com/auth/tasks`). The first authenticated
request opens your browser and uses a state-verified loopback callback. Subsequent
requests reuse stored credentials and refresh the access token when needed.
Rejected credentials request consent again; network failures return an error.
Help and a zero-limit list require no credentials and never authorize.

Credentials are stored relative to the current working directory in
`.tasks/google-oauth-token.json`. The directory and file have owner-only access
(0700 and 0600). Overly permissive token files are rejected. The task-owned
`.tasks/.gitignore` excludes runtime credentials; keep that protection if moving
the CLI to another directory. Delete the local token file to request fresh consent.

## Commands

Supply a task ID either as one positional argument or with `--id`, never both.
IDs and titles must be nonblank and are trimmed. Notes retain their text.

```sh
node dist/index.js tasks list
node dist/index.js tasks get TASK_ID
node dist/index.js tasks create --title 'Buy milk' --notes 'Two bottles' --due 2026-11-10
node dist/index.js tasks update TASK_ID --title 'Buy oat milk'
node dist/index.js tasks complete TASK_ID
node dist/index.js tasks reopen --id TASK_ID
node dist/index.js tasks move TASK_ID --parent PARENT_ID --previous SIBLING_ID
node dist/index.js tasks delete TASK_ID --yes
```

`create` accepts `--title` / `-t` (required), `--notes`, `--due`, `--parent`, and
`--previous`. Parent and previous specify placement as task IDs.

`update` requires at least one of `--title` / `-t`, `--notes`, or `--due`. Empty
notes or due values explicitly clear that field; other omitted fields are left
unchanged. Complete and reopen change only status.

```sh
node dist/index.js tasks update TASK_ID --notes '' --due ''
node dist/index.js tasks move TASK_ID --parent ''
node dist/index.js tasks move TASK_ID --previous ''
```

`move` requires `--parent` or `--previous`. An empty parent places the task at the
top level; an empty previous places it first. Omitted placement parameters use
Google Tasks' defaults, so include the parent when preserving placement under it.

`delete` always requires `--yes` and never prompts. It first reads the task, then
deletes it and returns the pre-deletion snapshot. A failed read prevents deletion.
Run `node dist/index.js tasks <action> --help` for action options.

## Listing and dates

List defaults are `--limit 50`, `--offset 0`, and all visibility flags false.
Limit and offset must be safe nonnegative integers written as digits. Offset
counts valid mapped tasks across provider pages. A limit of zero returns
`{"tasks":[],"limit":0,"offset":0}` without authorization.

```sh
node dist/index.js tasks list --limit 20 --offset 20
node dist/index.js tasks list --show-completed --show-hidden
node dist/index.js tasks list --show-deleted --show-assigned
node dist/index.js tasks list --due-from 2026-11-01 --due-to 2026-12-01
node dist/index.js tasks list --completed-from 2026-11-01T00:00:00Z --completed-to 2026-12-01T00:00:00Z
node dist/index.js tasks list --updated-since 2026-11-01T00:00:00+01:00
```

Use both `--show-completed` and `--show-hidden` to include tasks completed in
first-party Google clients. `--show-deleted` and `--show-assigned` request those
provider categories. Incomplete provider records, including tombstones without
an ID, title, or recognized status, are omitted rather than fabricated.

Task due values and `--due-from` / `--due-to` must be real `YYYY-MM-DD` dates.
Output due values remain date-only. Provider due payloads and list bounds use
midnight UTC on the supplied date: `--due-to 2026-12-01` is a bound at the **start**
of December 1, not the end of that day. Google Tasks applies its bound semantics;
the CLI does not shift either date.

`--completed-from`, `--completed-to`, and `--updated-since` require ISO date-times
with seconds and a timezone: `YYYY-MM-DDTHH:mm:ss[.fraction]Z` or
`YYYY-MM-DDTHH:mm:ss[.fraction]±HH:mm` (fraction: 1–9 digits). They normalize to UTC with millisecond precision.
Impossible dates, missing timezones, reversed due bounds, and reversed completion
bounds are rejected before authorization.

## Output and exits

Successful commands write pretty-printed JSON to stdout. Task objects have
`id`, `title`, and `status` (`needsAction` or `completed`), with optional
`notes`, `due`, `completed`, `parent`, `position`, `hidden`, and `deleted`.
List returns `{tasks, limit, offset}` without an exact total.

Exit codes are 0 for success/help, 2 for invalid usage, and 1 for runtime failures.
Usage failures include usage text on stderr. Expected runtime failures write only
a safe message to stderr; stack traces and raw provider errors are not printed.

## Development checks

```sh
npm run typecheck
npm run typecheck:tests
npm test
npm run build
```

Tests cover domain validation, the actual Google SDK through mocked transport,
argument parsing, dispatch, subprocess exits, and authorization with injected
collaborators. OAuth callback tests bind a temporary loopback socket and require
permission to listen locally. Tests do not contact a real Google account or launch
a real browser. Live OAuth/account behavior has not been verified. Build output,
installed dependencies, local environment files, and tokens should stay out of commits.
