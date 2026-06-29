import { useState } from 'react';

import type { RoomSnapshot } from '../../lib/platform/roomTypes';
import type { RoomRuntimeEntryContext } from '../../lib/platform/roomRuntimeEntryTypes';
import { RoomLobbyShell } from './RoomLobbyShell';
import { RoomRuntimeEntryBridge } from './RoomRuntimeEntryBridge';

/**
 * HostedRoomLaunchPanel (v0) — Room Lobby + Runtime Entry Preview for a room that
 * was just hosted from a campaign.
 *
 * AI-LANDMARK: HOSTED_ROOM_LAUNCH_PANEL_V0
 *
 * Thin wrapper that owns the lobby ↔ entry-preview switch for a host who launched
 * a room from "我的战役" (mirrors JoinCampaignPanel's lobby/bridge branches so the
 * three workspace shells don't duplicate it). NOT formal Runtime: no
 * CampaignRuntimeShell, no RuntimeLog / map / token / action intent, no
 * RuntimeActor. campaignRef shown by the lobby/bridge is read-only, not a
 * permission. System-agnostic (the created room carries its own systemId).
 */

export interface HostedRoomLaunchPanelProps {
  baseUrl: string;
  room: RoomSnapshot;
  hostMemberId: string;
  serverLabel?: string;
  onClose?: () => void;
  panelClassName?: string;
}

export function HostedRoomLaunchPanel({
  baseUrl,
  room,
  hostMemberId,
  serverLabel,
  onClose,
  panelClassName,
}: HostedRoomLaunchPanelProps) {
  const [runtimeEntry, setRuntimeEntry] = useState<{ context: RoomRuntimeEntryContext; room: RoomSnapshot } | null>(null);

  if (runtimeEntry) {
    return (
      <RoomRuntimeEntryBridge
        context={runtimeEntry.context}
        room={runtimeEntry.room}
        serverLabel={serverLabel}
        onBackToLobby={() => setRuntimeEntry(null)}
      />
    );
  }

  return (
    <div className={panelClassName}>
      <RoomLobbyShell
        baseUrl={baseUrl}
        roomId={room.identity.roomId}
        currentMemberId={hostMemberId}
        currentRole="host"
        initialRoom={room}
        serverLabel={serverLabel}
        onLeaveLobby={onClose}
        onEnterRuntime={(payload) => setRuntimeEntry(payload)}
      />
    </div>
  );
}
