import { runCampaignRoomApiHandlerSmoke } from './campaignRoomApiHandlersSmoke.js';

const strict = process.argv.includes('--strict');
const result = await runCampaignRoomApiHandlerSmoke();
console.log(JSON.stringify({ ...result, strict }, null, 2));
if (strict && result.failed > 0) process.exitCode = 1;

