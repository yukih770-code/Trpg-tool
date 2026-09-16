# Online pilot preparation checks

Run `npm run pilot:verify:readiness` for 19 configuration/preflight/HTTP/WebSocket/cookie-serialization cases and four browser-endpoint assertions. Uses loopback ephemeral ports and fixture auth handlers; no database, existing service, real account or `.env` mutation. The preflight child tests use an existing temporary directory only to check access, not as proof of volume durability.

Run `npm run build:pilot -- --origin https://pilot.example.test`, then `npm run server:build`, then `node tests/online-pilot/release-artifacts.mjs https://pilot.example.test` to verify the actual bundle and twelve copied SQL files. The artifact check inspects local env values in memory without printing them; its secret coverage is limited to the inspected configuration values of at least twelve characters, not a complete secret scanner.

The `.test` origin is a non-deployed fixture. Rebuild for the actual host. Real hosted TLS, browser cookies, personal-invite accounts, PostgreSQL/restart/backup and multi-device tests are specified in [the runbook](../../docs/implementation/DND_ONLINE_PILOT_READINESS_V1.md). Prior real gameplay evidence is in the Action Clarity report, not these fixture tests.
