import assert from 'node:assert/strict';
import { resolveRoomServerHttpUrl, resolveRoomServerWsUrl } from '../../src/lib/platform/roomServerEndpoint';

const origin = 'https://pilot.example.test';
Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin, hostname: 'pilot.example.test', search: '?apiBase=http://localhost:8787' } } });
try {
  assert.equal(resolveRoomServerHttpUrl({ PROD: true }), origin);
  assert.equal(resolveRoomServerWsUrl({ PROD: true }), 'wss://pilot.example.test');
  assert.equal(resolveRoomServerHttpUrl({ DEV: true }), 'http://localhost:8787');
  assert.equal(resolveRoomServerHttpUrl({ PROD: true, VITE_ROOM_SERVER_HTTP_URL: 'https://explicit.example.test' }), 'https://explicit.example.test');
  console.log(JSON.stringify({ passed: 4, scope: 'production HTTP/WSS fallback, dev defaults, explicit override; cloud ignores LAN query override' }));
} finally { Reflect.deleteProperty(globalThis, 'window'); }
