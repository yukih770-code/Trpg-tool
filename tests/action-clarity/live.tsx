/// <reference types="vite/client" />
/** Development-only real HTTP/WebSocket acceptance entry. No mocked transport. */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { setDevViewerUserId } from '../../src/lib/api/apiClient';
import { RoomLobbyShell } from '../../src/components/platform/RoomLobbyShell';
import { RoomRuntimeEntryBridge } from '../../src/components/platform/RoomRuntimeEntryBridge';
import type { RoomRuntimeEntryContext } from '../../src/lib/platform/roomRuntimeEntryTypes';
import type { RoomSnapshot } from '../../src/lib/platform/roomTypes';
if (!import.meta.env.DEV) throw new Error('Development acceptance entry only');
const params = new URLSearchParams(location.search);
const viewer = params.get('user') || 'dev-user-001';
setDevViewerUserId(viewer);
// The normal Vite instance pins its configured dev user. Supply separate test
// identities only to the disposable localDev backend, without mocking replies.
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== 'http://localhost:8798') return originalFetch(input, init);
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.set('x-dev-user-id', viewer);
  return originalFetch(input, { ...init, headers });
};
const OriginalSocket = window.WebSocket;
window.WebSocket = class extends OriginalSocket {
  constructor(input: string | URL, protocols?: string | string[]) {
    const url = new URL(input);
    if (url.origin === 'ws://localhost:8798') url.searchParams.set('devViewerUserId', viewer);
    super(url, protocols);
  }
};
function Acceptance() {
  const [runtime, setRuntime] = useState<{ context: RoomRuntimeEntryContext; room: RoomSnapshot }>();
  return runtime ? <RoomRuntimeEntryBridge {...runtime} onBackToLobby={() => setRuntime(undefined)} />
    : <RoomLobbyShell baseUrl="http://localhost:8798" roomId={params.get('room') || ''} currentMemberId={params.get('member') || ''} currentRole={viewer === 'dev-user-001' ? 'host' : params.get('role') === 'spectator' ? 'spectator' : 'player'} onEnterRuntime={setRuntime} />;
}
createRoot(document.getElementById('root')!).render(<Acceptance />);
