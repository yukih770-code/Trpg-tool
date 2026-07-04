/**
 * Room Server protocol re-exports (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_PROTOCOL_V0
 *
 * Central, server-safe re-export of the platform room/deployment/storage TYPES
 * the Room Server uses. No new protocol logic, no browser imports. Server code
 * imports these instead of reaching into src/lib/platform directly.
 */

export type {
  RoomIdentity,
  RoomSnapshot,
  RoomJoinRequest,
  RoomJoinResult,
  RoomJoinDecision,
  RoomMemberIdentity,
  RoomMemberRole,
  RoomMemberStatus,
  RoomInviteDescriptor,
  RoomJoinApprovalMode,
  RoomLifecycleStatus,
  RoomSystemId,
  RoomCampaignRef,
  RoomCampaignRefSource,
  RoomActorRefSummary,
  RoomActorBindingClearanceSummary,
  RoomActorBindingClearanceStatus,
} from '../../src/lib/platform/roomTypes.js';

export type {
  ActorSnapshot,
  ActorSnapshotHash,
  ActorAdmissionRecord,
  ActorAdmissionStatus,
  InspectionResult,
} from '../../src/lib/platform/characterClearanceTypes.js';

export type {
  SharedDiceTermResult,
  SharedDiceRollResult,
  SharedDiceRollRequest,
  SharedDiceRollResponse,
} from '../../src/lib/platform/sharedDiceTypes.js';

export type {
  RoomRuntimeLogEvent,
  RoomRuntimeLogEventKind,
  RoomRuntimeLogVisibility,
  AppendRoomRuntimeLogEventInput,
  RoomRuntimeLogListResult,
} from '../../src/lib/platform/roomRuntimeLogTypes.js';

export type { BackendDeploymentProfile } from '../../src/lib/platform/backendDeploymentTypes.js';

export type { StorageAdapterCapabilitySummary } from '../../src/lib/platform/storageAdapterBoundaryTypes.js';
