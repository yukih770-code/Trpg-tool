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
export const LOCAL_DEV_BACKEND_ENDPOINT_CONFIG = {
    profile: 'localDev',
    runtimeMode: 'local',
    apiBaseUrl: 'http://localhost:8787',
    roomHttpUrl: 'http://localhost:8787',
    roomWsUrl: 'ws://localhost:8787',
};
// ── Default preset profiles (pure constants; no env / no detection / no IO) ──
export const LAN_HOST_DEPLOYMENT_PROFILE = {
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
export const OFFICIAL_HOSTED_DEPLOYMENT_PROFILE = {
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
export const THIRD_PARTY_SELF_HOSTED_DEPLOYMENT_PROFILE = {
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
export function getBackendDeploymentProfile(preset) {
    switch (preset) {
        case 'lanHost':
            return LAN_HOST_DEPLOYMENT_PROFILE;
        case 'officialHosted':
            return OFFICIAL_HOSTED_DEPLOYMENT_PROFILE;
        case 'thirdPartySelfHosted':
            return THIRD_PARTY_SELF_HOSTED_DEPLOYMENT_PROFILE;
    }
}
