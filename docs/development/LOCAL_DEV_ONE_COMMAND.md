# One-command Local Development

This Windows-friendly runner is for local testing only. It does not deploy the
application, alter `.env`, apply migrations, or expose configuration values.

## Start

Create `.env` from `.env.example`, configure the local database connection, then
run:

```powershell
npm run dev:local
```

The command loads `.env` into the backend terminal process, builds and starts the
backend on `http://localhost:8787`, waits for `/health`, starts Vite on
`http://localhost:3000`, and opens the browser. Backend and frontend stay in
separate PowerShell windows so their logs remain visible.

## Diagnose

```powershell
npm run dev:local:doctor
```

Doctor reports the presence of required local settings without showing their
values, checks ports `8787` and `3000`, checks backend health when it is already
running, and runs the read-only PostgreSQL readiness check when a database
connection is configured.

## Stop

```powershell
npm run dev:local:stop
```

The stop command only terminates listeners that match the known local Node backend
or Vite signatures. If another process owns either port, it leaves it untouched
and tells you which process is blocking startup.

## Required Local Configuration

The runner checks for a backend database connection, the frontend API URL, the
local development viewer identity, and the dev-auth flag. The server runtime mode
may be omitted because it defaults to local development. It never prints values.
Use `.env.example` as the authoritative local shape.
