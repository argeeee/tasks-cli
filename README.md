# Tasks CLI

A Google Tasks command-line client using TypeScript, injected domain use cases,
and separate Google API adapters. Project guidance is in `docs/references/`.

Requires Node.js 22.16 or newer.

```sh
npm install
npm run dev -- --help
npm run build
node dist/index.js --help
```

## Google authorization

Enable the Google Tasks API in your Google Cloud project, configure its OAuth
consent screen, and create a **Desktop app** OAuth client. Add your account as a
test user if the consent screen is in testing mode. Supply the client credentials
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

Credentials are stored relative to the current working directory in
`.tasks/google-oauth-token.json`. The directory and file have owner-only access
(0700 and 0600). Overly permissive token files are rejected. The task-owned
`.tasks/.gitignore` excludes runtime credentials; keep that protection if moving
the CLI to another directory. Delete the local token file to request fresh consent.

Task actions are added in the next implementation phase. Root help requires no
Google credentials and does not open a browser.

## Development checks

```sh
npm run typecheck
npm run typecheck:tests
npm test
npm run build
```

Tests use fake credentials and injected collaborators. OAuth callback tests bind a
temporary loopback socket; they require permission to listen locally. No test
contacts a real Google account. Live OAuth/account behavior has not been verified.
Build output and installed dependencies are generated artifacts and should stay
out of commits.
