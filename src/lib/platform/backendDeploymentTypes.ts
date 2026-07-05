/**
 * Backend deployment model contracts (v0, types only).
 *
 * AI-LANDMARK: BACKEND_DEPLOYMENT_CONTRACTS_V0
 *
 * These are platform-level backend deployment contracts. They describe local
 * dev/test, official hosted, and third-party/self-hosted boundary shapes. They
 * do not implement networking, storage, rooms, WebSocket, HTTP, authentication,
 * Workshop publishing, or Runtime synchronization.
 *
 * Core principle: local Room Server remains useful for development, LAN tests,
 * and offline experiments. The formal long-term hosted backend is cloud API
 * Server + Room Server + database/object-storage adapters. The differences
 * between targets are deployment location, network reachability, storage
 * adapter, and publishing capability, never a separate codebase. This module
 * imports nothing and stays platform-neutral (no DND/COC/CP RED concepts).
 */

export type BackendDeploymentEnvironment =
  | 'localDev'
  | 'cloudDev'
  | 'staging'
  | 'production';

export type BackendRuntimeMode =
  | 'local'
  | 'cloud';

/**
 * Endpoint contract for frontend/backend wiring.
 *
 * This is configuration shape only. It must not perform environment reads,
 * network detection, auth, deployment, or protocol negotiation.
 */
export interface BackendEndpointConfig {
  profile: BackendDeploymentEnvironment;
  runtimeMode: BackendRuntimeMode;
  apiBaseUrl: string;
  roomHttpUrl: string;
  roomWsUrl: string;
}

export const LOCAL_DEV_BACKEND_ENDPOINT_CONFIG: BackendEndpointConfig = {
  profile: 'localDev',
  runtimeMode: 'local',
  apiBaseUrl: 'http://localhost:8787',
  roomHttpUrl: 'http://localhost:8787',
  roomWsUrl: 'ws://localhost:8787',
};

export type BackendDeploymentTarget =
  | 'lanHostComputer'
  | 'officialHosted'
  | 'thirdPartySelfHosted';

export type BackendNetworkReachability =
  | 'sameLan'
  | 'publicInternet'
  | 'privateNetwork'
  | 'tunnelOrVpn'
  | 'manualAddress'
  | 'unknown';

export type BackendServerAddressKind =
  | 'lanIpPort'
  | 'mdnsName'
  | 'publicUrl'
  | 'domainName'
  | 'customAddress'
  | 'unknown';

export interface BackendServerAddress {
  kind: BackendServerAddressKind;
  value: string;
  displayLabel?: string;
  note?: string;
}

/** Identity of a Room Server application instance (same app, different target). */
export interface RoomServerApplicationIdentity {
  serverId: string;
  deploymentTarget: BackendDeploymentTarget;
  serverAddress?: BackendServerAddress;
  version?: string;
  protocolVersion?: string;
  displayName?: string;
  operatorLabel?: string;
}

/** Package runtime loading vs official Workshop publishing — kept distinct. */
export interface BackendWorkshopCapability {
  canLoadLocalPackages: boolean;
  canLoadDownloadedWorkshopPackages: boolean;
  canImportModules: boolean;
  canUseLocalRewrites: boolean;
  canPublishToOfficialWorkshop: boolean;
  canSyncPackagesToRoomMembers?: boolean;
  note?: string;
}

export type BackendStorageAdapterKind =
  | 'memory'
  | 'localJson'
  | 'sqlite'
  | 'postgres'
  | 'cloudDatabase'
  | 'custom';

export type BackendAssetStorageKind =
  | 'localFileSystem'
  | 'objectStorage'
  | 'externalUrl'
  | 'custom'
  | 'none';

/** Describes storage capability only — never binds to a specific database. */
export interface BackendStorageCapability {
  adapterKind: BackendStorageAdapterKind;
  assetStorageKind: BackendAssetStorageKind;
  supportsPersistentRooms: boolean;
  supportsRuntimeSnapshots: boolean;
  supportsRuntimeLogPersistence: boolean;
  supportsAssetPersistence: boolean;
  note?: string;
}

export interface BackendDeploymentCapabilityFlags {
  supportsLanDiscovery: boolean;
  supportsManualAddressJoin: boolean;
  supportsRemoteJoin: boolean;
  supportsInviteCodeDirectory: boolean;
  supportsOfficialAccounts: boolean;
  supportsThirdPartyHosting: boolean;
  /** Server-side Host/Player/Spectator projection (DM-only filtered server-side). */
  supportsServerSideProjection: boolean;
  /** Server owns authoritative runtime state; clients submit intents. */
  supportsServerAuthoritativeRuntime: boolean;
}

export interface BackendDeploymentProfile {
  id: string;
  identity: RoomServerApplicationIdentity;
  networkReachability: BackendNetworkReachability;
  storage: BackendStorageCapability;
  workshop: BackendWorkshopCapability;
  capabilityFlags: BackendDeploymentCapabilityFlags;
  notes?: string[];
}

// ── Invite resolution (type-only; no resolution implemented) ────────────────

export type BackendInviteResolutionMode =
  | 'embeddedServerAddress'
  | 'officialDirectory'
  | 'manualServerAddress'
  | 'lanDiscoveryPlaceholder'
  | 'thirdPartyDirectoryPlaceholder';

export interface BackendInviteResolutionCapability {
  mode: BackendInviteResolutionMode;
  requiresKnownServerAddress: boolean;
  requiresDirectoryLookup: boolean;
  requiresLanDiscovery: boolean;
  note?: string;
}

export type BackendDeploymentPreset = 'lanHost' | 'officialHosted' | 'thirdPartySelfHosted';

// ── Default preset profiles (pure constants; no env / no detection / no IO) ──

export const LAN_HOST_DEPLOYMENT_PROFILE: BackendDeploymentProfile = {
  id: 'deployment.lanHost',
  identity: {
    serverId: 'lan-host',
    deploymentTarget: 'lanHostComputer',
    displayName: 'LAN Host (this computer)',
  },
  networkReachability: 'sameLan',
  storage: {
    adapterKind: 'localJson',
    assetStorageKind: 'localFileSystem',
    supportsPersistentRooms: true,
    supportsRuntimeSnapshots: true,
    supportsRuntimeLogPersistence: true,
    supportsAssetPersistence: true,
  },
  workshop: {
    canLoadLocalPackages: true,
    canLoadDownloadedWorkshopPackages: true,
    canImportModules: true,
    canUseLocalRewrites: true,
    canPublishToOfficialWorkshop: false,
    canSyncPackagesToRoomMembers: true,
  },
  capabilityFlags: {
    supportsLanDiscovery: true,
    supportsManualAddressJoin: true,
    supportsRemoteJoin: false,
    supportsInviteCodeDirectory: false,
    supportsOfficialAccounts: false,
    supportsThirdPartyHosting: false,
    supportsServerSideProjection: true,
    supportsServerAuthoritativeRuntime: true,
  },
  notes: ['LAN host runs the same Room Server. Can load/import packages, but cannot publish to the official Workshop.'],
};

export const OFFICIAL_HOSTED_DEPLOYMENT_PROFILE: BackendDeploymentProfile = {
  id: 'deployment.officialHosted',
  identity: {
    serverId: 'official',
    deploymentTarget: 'officialHosted',
    displayName: 'Official Hosted Server',
  },
  networkReachability: 'publicInternet',
  storage: {
    adapterKind: 'cloudDatabase',
    assetStorageKind: 'objectStorage',
    supportsPersistentRooms: true,
    supportsRuntimeSnapshots: true,
    supportsRuntimeLogPersistence: true,
    supportsAssetPersistence: true,
  },
  workshop: {
    canLoadLocalPackages: true,
    canLoadDownloadedWorkshopPackages: true,
    canImportModules: true,
    canUseLocalRewrites: true,
    canPublishToOfficialWorkshop: true,
    canSyncPackagesToRoomMembers: true,
  },
  capabilityFlags: {
    supportsLanDiscovery: false,
    supportsManualAddressJoin: false,
    supportsRemoteJoin: true,
    supportsInviteCodeDirectory: true,
    supportsOfficialAccounts: true,
    supportsThirdPartyHosting: false,
    supportsServerSideProjection: true,
    supportsServerAuthoritativeRuntime: true,
  },
  notes: ['Only the official deployment can publish to the official Workshop.'],
};

export const THIRD_PARTY_SELF_HOSTED_DEPLOYMENT_PROFILE: BackendDeploymentProfile = {
  id: 'deployment.thirdPartySelfHosted',
  identity: {
    serverId: 'third-party',
    deploymentTarget: 'thirdPartySelfHosted',
    displayName: 'Third-party Self-hosted Server',
  },
  networkReachability: 'manualAddress',
  storage: {
    adapterKind: 'sqlite',
    assetStorageKind: 'localFileSystem',
    supportsPersistentRooms: true,
    supportsRuntimeSnapshots: true,
    supportsRuntimeLogPersistence: true,
    supportsAssetPersistence: true,
  },
  workshop: {
    canLoadLocalPackages: true,
    canLoadDownloadedWorkshopPackages: true,
    canImportModules: true,
    canUseLocalRewrites: true,
    canPublishToOfficialWorkshop: false,
    canSyncPackagesToRoomMembers: true,
  },
  capabilityFlags: {
    supportsLanDiscovery: false,
    supportsManualAddressJoin: true,
    supportsRemoteJoin: true,
    supportsInviteCodeDirectory: false,
    supportsOfficialAccounts: false,
    supportsThirdPartyHosting: true,
    supportsServerSideProjection: true,
    supportsServerAuthoritativeRuntime: true,
  },
  notes: ['Self-hosted Room Server. Loads/imports packages and may distribute to members, but cannot publish to the official Workshop.'],
};

/** Look up a default deployment profile by preset (pure; no IO). */
export function getBackendDeploymentProfile(preset: BackendDeploymentPreset): BackendDeploymentProfile {
  switch (preset) {
    case 'lanHost':
      return LAN_HOST_DEPLOYMENT_PROFILE;
    case 'officialHosted':
      return OFFICIAL_HOSTED_DEPLOYMENT_PROFILE;
    case 'thirdPartySelfHosted':
      return THIRD_PARTY_SELF_HOSTED_DEPLOYMENT_PROFILE;
  }
}
