# One-command Local Development

This Windows-friendly runner is for local testing only. It does not deploy the
application, alter `.env`, or expose configuration values. When `.env` uses the
project `localhost:55432` database, it starts the bundled Docker PostgreSQL
service and applies pending local migrations before opening the app.

## Start

Create `.env` from `.env.example`, configure the local database connection, then
run:

```powershell
npm run dev:local
```

The command loads `.env` into the backend terminal process, builds and starts the
project PostgreSQL container when configured, applies pending migrations, starts
the backend on `http://localhost:8787`, waits for HTTP and World Server database
health, starts Vite on
`http://localhost:3000`, and opens the browser. Backend and frontend stay in
separate PowerShell windows so their logs remain visible.

## Cloud-like Local Sign-in

Normal `dev:local` uses a development identity and intentionally skips the login
screen. To verify the same Private Alpha login gate used by the cloud deployment,
set local-only `PRIVATE_ALPHA_INVITE_CODE` and `PRIVATE_ALPHA_SESSION_SECRET`
values in `.env`, then run:

```powershell
npm run dev:local:auth
```

The login form asks for a display name and the configured access code. These
local values must never be reused as cloud secrets. Diagnose this mode with
`npm run dev:local:auth:doctor`.

## Diagnose

```powershell
npm run dev:local:doctor
```

Doctor reports the presence of required local settings without showing their
values, checks ports `8787` and `3000`, and runs the read-only PostgreSQL
readiness check when a database connection is configured. When the app is
already running, it also verifies the authentication mode actually reported by
both services:

- the backend `/health` response must report `localDev` or `privateAlpha` as
  requested by the Doctor command;
- the Vite-only `/__trpg_dev_runtime` diagnostic must report the same compiled
  frontend mode;
- a stale/legacy listener, a half-started frontend/backend pair, or a mismatch
  between `dev:local:doctor` and `dev:local:auth:doctor` makes Doctor fail even
  when the backend still returns HTTP 200.

The frontend diagnostic exists only in the Vite development server and reports
no access code, session secret, database URL, or user identity. A production
build does not expose it.

If Doctor reports a mismatch, close the stale local terminals (or use
`npm run dev:local:stop` when their process signatures are recognized), then
start one consistent mode with `npm run dev:local` or `npm run dev:local:auth`.

## LAN Alpha

```powershell
npm run lan:doctor
npm run dev:lan
```

`lan:doctor` adds safe LAN candidate, endpoint, CORS, firewall, and VPN guidance
to the normal local checks. `dev:lan` starts the same local processes with LAN
Alpha enabled for that run and opens the host browser. It does not modify `.env`
or expose the application to the public internet. Use the LAN join link shown in
the server workspace for player devices; do not share a `localhost` URL. See
`LAN_ALPHA_RUNTIME.md` for host, player, authentication, and troubleshooting
details.

## Stop

```powershell
npm run dev:local:stop
```

The stop command only terminates listeners that match the known local Node backend
or Vite signatures. If another process owns either port, it leaves it untouched
and tells you which process is blocking startup.

## Required Local Configuration

The runner checks for a loopback backend database connection and the frontend API
URL. Development-identity mode additionally requires the local viewer identity;
Private Alpha mode requires local access-code and session-secret values. The
server runtime mode may be omitted because it defaults to local development. It
never prints configuration values. Use `.env.example` as the authoritative local
shape.
