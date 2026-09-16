import { createRequire } from 'node:module';
import { verifyActionClarity } from './browser.mjs';
import { verifyLiveActionClarity } from './live-browser.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
try {
  const output = 'docs/implementation/action-clarity-evidence';
  console.log(JSON.stringify(process.argv.includes('--live')
    ? await verifyLiveActionClarity(browser, output)
    : await verifyActionClarity(browser, process.env.ACTION_CLARITY_ORIGIN || 'http://localhost:3000', output), null, 2));
} finally { await browser.close(); }
