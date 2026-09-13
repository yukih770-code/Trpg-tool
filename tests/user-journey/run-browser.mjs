import { createRequire } from 'node:module';
import { verifyJourneys } from './browser.mjs';
import { verifyProductIa } from '../product-ia/browser.mjs';
import { verifyLivePlay } from '../live-play/browser.mjs';
import { mkdir } from 'node:fs/promises';

// Reuse an installed Playwright package; this task adds no production dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  const origin = process.env.LIVE_PLAY_ORIGIN || 'http://127.0.0.1:3107';
  const output = 'docs/implementation/user-journey-ia';
  await mkdir(output + '/reuse-regression', { recursive: true });
  await mkdir(output + '/live-regression', { recursive: true });
  const result = {
    journeys: await verifyJourneys(browser, origin, output),
    reuse: await verifyProductIa(browser, origin, output + '/reuse-regression'),
    live: await verifyLivePlay(browser, origin, output + '/live-regression'),
  };
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
