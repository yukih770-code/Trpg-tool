import { createRequire } from 'node:module';
import { verifyLivePlay } from './browser.mjs';

// Reuse an installed Playwright package; this task adds no production dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  const result = await verifyLivePlay(browser, process.env.LIVE_PLAY_ORIGIN || 'http://127.0.0.1:3107', 'docs/implementation/live-play-ux');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
