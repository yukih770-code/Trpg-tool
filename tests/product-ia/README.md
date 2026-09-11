# Product IA regression workflows

Run the existing Vite development server locally (the task used port 3107).
The browser harness mounts existing production components with deterministic
transport/API fixtures. It never writes campaign data to a real backend.

Use an already installed Playwright package and browser. No production dependency
was added. In PowerShell, set PLAYWRIGHT_MODULE to the absolute installed package
path and BROWSER_EXECUTABLE to the installed Chromium/Edge executable if needed.
Set LIVE_PLAY_ORIGIN if your development server differs from http://127.0.0.1:3107.
Then run:

~~~powershell
node tests/product-ia/run-browser.mjs
node tests/product-ia/verify.mjs
node node_modules/tsx/dist/cli.mjs tests/live-play/presentationSmoke.tsx
~~~

The first command saves 39 browser checks and six screenshots to
docs/implementation/product-ia-reuse/. The second runs 12 additional existing
domain regression commands and saves raw output there. The prior live-play
verify.mjs covers 42 additional existing regression commands. The original
verifyLivePlay browser export covers 47 live workflows; this audit saved its
results/screenshots in product-ia-reuse/live-regression/.

Fixtures cover save, clear, server refresh, a delayed stale read, rejected save,
shared campaign/token/combat/runtime editor access, live actor creation and
placement, permissions, contextual focus, own admitted sheet, document reader
convergence, and tablet bounds. They supplement server service tests; they are
not a real authenticated two-account or database/restart E2E test.
