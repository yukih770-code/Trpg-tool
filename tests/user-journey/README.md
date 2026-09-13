# User journey browser validation

Run from D:/Download/dnd with the existing dependencies installed.

1. Start the normal Vite development server on 3107: `npm run dev -- --port 3107 --host 127.0.0.1`.
2. Set PLAYWRIGHT_MODULE to an installed Playwright package when it is not locally resolvable. Set BROWSER_EXECUTABLE to an installed browser when necessary.
3. Run `node tests/user-journey/run-browser.mjs`. LIVE_PLAY_ORIGIN can override the default http://127.0.0.1:3107.
4. Run `node tests/user-journey/verify.mjs` for the 55 selected existing regression commands.
5. Run `node node_modules/tsx/dist/cli.mjs tests/live-play/presentationSmoke.tsx`, `npm run lint`, `npm run build`, and `npm run server:build`.

The combined browser runner executes the journey, previous reuse, and previous live suites into docs/implementation/user-journey-ia. The existing prior test assertions are preserved; only presentation selectors and the intentional task entry steps changed.

These are browser integration tests of real production React components with deterministic API/socket fixtures, not a deployed account/database E2E test. Only /tests/live-play development entry imports fixtures. The production bundle does not import the test entry. There are no real room/account writes.

The new-character test enters the actual Creator, verifies cancellation/draft preservation, fills a legal ready draft through the existing store fixture, and clicks the actual Complete button. Completion runs the production finalizer and store commit. This does not claim to test every class/species/background interaction. The existing DND level-one character smoke covers finalization rules.

Approval is delivered through the fixture snapshot, then the real lobby readiness and runtime entry UI are exercised. Canonical cloud identity versus local identity is asserted in the submitted request. Temporary submission is checked for absence of Vault creation and actorId. Catalog and campaign APIs return deterministic records and track the real component's write shape.

Final browser run: 42 journey assertions, 39 reuse assertions, 47 live assertions; no page exceptions. Browser: installed Chromium-based Microsoft Edge through Playwright, headless. New screenshots at 1440×900 and 1024×768; retained live suite also covers 1920×1080 and 390×844. Fixed dimensions are regression probes, not comprehensive device certification.
