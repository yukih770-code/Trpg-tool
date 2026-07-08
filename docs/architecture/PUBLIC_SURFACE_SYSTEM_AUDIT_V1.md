# Public Surface System Audit V1

## 1. Purpose

This document audits the current repository for future Global Public Surface design. It is a classification and boundary inventory only.

The Global Public Surface is not a normal server. It is the platform-level public entry: discovery, public profile projection, Workshop/community feeds, public templates, and tool entrances. World or child servers are concrete communities/worlds with their own members, rooms, campaigns, content policy, and moderation boundaries.

Public entry does not mean public data. Every content object needs an explicit visibility scope before it can appear on the Global Public Surface, a world server, a campaign, a user profile, Workshop, or a community feed.

Classification labels used in this audit:

- A Global Public Surface - Core
- B Global Public Entry + Private Data
- C Public Feed / Workshop Eligible
- D Server-Scoped by Default
- E Campaign-Scoped by Default
- F User-Private by Default
- G Internal / Admin / Infrastructure
- H Needs Split

## 2. Current Repository Map

Audit evidence was gathered from the application shell, platform components, platform libraries, architecture/domain contracts, server room services, repository adapters, DB migrations, and current navigation files.

Primary public/platform entry files:

- `src/App.tsx`
- `src/main.tsx`
- `src/pages/Home.tsx`
- `src/pages/SystemLibrary.tsx`
- `src/pages/Workshop.tsx`
- `src/pages/FanPlaza.tsx`
- `src/components/platform/WorkshopShell.tsx`
- `src/components/platform/FanPlazaShell.tsx`
- `src/components/platform/PersonalContentHub.tsx`
- `src/components/platform/UserProfileSpace.tsx`

Primary private or scoped object areas:

- `src/components/platform/ActorVaultLibraryShell.tsx`
- `src/components/platform/CampaignLibraryShell.tsx`
- `src/components/platform/JoinCampaignPanel.tsx`
- `src/components/platform/RoomLobbyShell.tsx`
- `src/components/platform/RoomRuntimeEntryBridge.tsx`
- `src/components/platform/CampaignRuntimeShell.tsx`
- `src/components/platform/Runtime*`
- `src/pages/*Creator.tsx`
- `src/pages/*Sheet.tsx`
- `src/pages/*Gameplay.tsx`
- `src/pages/*Workspace/*`

Primary boundary and projection files:

- `src/lib/architecture/projection.ts`
- `src/lib/architecture/entityGraph.ts`
- `src/lib/architecture/repositories.ts`
- `src/lib/architecture/repositoryServices.ts`
- `src/lib/architecture/mediaAsset.ts`
- `src/lib/architecture/blockDocument.ts`
- `src/lib/architecture/workshopPackage.ts`
- `src/lib/platform/currentViewerAccount.ts`
- `src/lib/platform/localUserIdentity.ts`
- `src/lib/platform/platformObjectIdentity.ts`
- `src/lib/platform/*Ownership*`

Primary server and infrastructure files:

- `server/room-server.ts`
- `server/services/**`
- `server/protocol/**`
- `server/transport/**`
- `server/api/**`
- `server/adapters/**`
- `server/db/**`
- `server/config/**`

Audit note: the worktree had unrelated uncommitted files during this pass. They were treated as current local evidence but were not modified by this audit.

## 3. Classification Matrix

| System / Module | Representative Files | Classification | Default Scope | Public Surface Recommendation |
| --- | --- | --- | --- | --- |
| Home / Platform Launchpad | `src/pages/Home.tsx`, `src/App.tsx` | A, H | globalPublic + userPrivate summaries | Public entry is appropriate, but local dashboard widgets must stay viewer-scoped. |
| Top Navigation / Account Menu | `src/App.tsx`, `currentViewerAccount.ts` | B, H | globalPublic entry + userPrivate account | Keep public navigation separate from private account menu and library. |
| System Library | `src/pages/SystemLibrary.tsx` | A | globalPublic | Safe as a public catalog of supported systems and system entrances. |
| Workshop | `WorkshopShell.tsx`, `workshopTypes.ts`, `workshopPackage.ts` | C, H | userPrivate until published | Eligible for public feed after rights, review, visibility, dependency, and import policy gates. |
| Fan Plaza / Community | `FanPlazaShell.tsx`, `communityTypes.ts`, `communityMockData.ts` | C, H | public/unlisted/private per work | Eligible as a public community feed, but drafts and private works must stay private. |
| Public Profile Space | `UserProfileSpace.tsx`, `userProfile.ts`, `projection.ts` | C, H | public/unlisted/private projection | Public showcase is appropriate only through projection-safe fields. |
| Personal Content Hub | `PersonalContentHub.tsx`, `personalContent.ts` | F, B | userPrivate | Public entry may exist, but content management data is private by default. |
| Document Library / BlockDocument | `DocumentLibraryShell.tsx`, `blockDocument.ts` | H | userPrivate/campaign/server/public per document | Needs split by document kind and visibility. |
| MediaAsset / Asset Metadata | `mediaAsset.ts`, `postgresAssetRepository.ts`, `0004_asset_metadata.sql` | H, C, F, E | private/campaign by default | Public thumbnails/previews can be eligible; originals and storage refs must stay protected. |
| DND/COC/CP Character Tools | `Creator.tsx`, `Sheet.tsx`, `Coc*`, `Cp*` | B, F, C | userPrivate | Tool entry can be public; created characters are private unless explicitly published as projections/templates. |
| Actor Vault | `ActorVaultLibraryShell.tsx`, `actorVaultRepositoryBridge.ts`, `actorVaultOwnership.ts` | F, B | userPrivate | Keep vault private. Public character showcase/templates need separate projection. |
| Campaign Library | `CampaignLibraryShell.tsx`, `campaignLocalStore.ts`, `campaignLibraryRepository.ts` | E, H, B | campaign/userPrivate | Campaign management is not public. Public recruitment/listing must be a separate projection. |
| Campaign Entry Draft | `campaignEntryDraftStore.ts` | F, G | userPrivate transient | Never treat as membership, campaign actor, or public data. |
| Join Campaign / Room Discovery | `JoinCampaignPanel.tsx`, `roomDiscovery*`, `roomServerHttpClient.ts` | D, H | server/room | Public-style entry is fine, but room data belongs to a server/world/room context. |
| Room Lobby | `RoomLobbyShell.tsx`, `roomTypes.ts` | D, E | server room/campaign | Lobby state is not Global Public Surface. It is room-scoped operational state. |
| Runtime Entry / Runtime Shell | `RoomRuntimeEntryBridge.tsx`, `CampaignRuntimeShell.tsx`, `RuntimeFullscreenShell.tsx` | E | campaign/runtime | Runtime table data is campaign-scoped by default. |
| RuntimeLog / RuntimeEvent DB | `RoomRuntimeLogPreviewPanel.tsx`, `runtimeLogLocalStore.ts`, `roomRuntimeLogTypes.ts`, `postgresRuntimeEventRepository.ts` | E, G, H | campaign/runtime | Public recap/feed requires explicit redaction and publish flow. |
| Scene / Map / Static Map | `RuntimeMapStage.tsx`, `RuntimeSceneFocusPanel.tsx`, `RuntimeStaticMapPanel.tsx`, `mediaAsset.ts` | E, H, C | campaign by default | Map packs/templates can be public; in-campaign scenes remain campaign-scoped. |
| Inventory / Equipment / Items | `CharacterInventoryPanel.tsx`, `characterInventory*`, DND equipment data | F, E, C | userPrivate/campaign | Character inventory is private/campaign. Item templates may be public compendium/workshop data. |
| Rules / Compendium Data | `src/data/**`, `spellIndex.ts`, `SystemRuleSourcesShell.tsx` | H, C, G | public samples or private source packs | Must split public SRD/open samples from private owner-source/imported rule data. |
| Workshop Package Manifest | `workshopPackage.ts`, `packageLibrary.ts` | C, H | private draft until published | Public package metadata needs rights/review/dependency gates. |
| AI Draft / Recap Surfaces | `RoomRuntimeLogPreviewPanel.tsx`, `blockDocument.ts` | H, E, F | scoped to source object | AI output must inherit source scope and remain advisory/draft until confirmed. |
| Cloud Repository Contracts | `cloudRepositoryContracts.ts`, `cloudBackendAdapters.ts`, `backendDeploymentTypes.ts` | G | infrastructure | Architecture boundary only; not public product surface. |
| DB / API / Health / Smoke | `server/db/**`, `server/api/**`, `server/config/**` | G | internal/admin | Keep out of Global Public Surface. Health can expose minimal operational status only. |
| Import / Export Backups | `campaignExportSnapshot.ts`, `actorVaultExport*`, import preview helpers | F, G, H | userPrivate | Backup tools are private. Public sharing requires separate publish/package flow. |

## 4. Global Public Surface Candidates

### 4.1 Public Core

The safest Global Public Surface core candidates are:

- Platform landing / home entry
- System Library
- Public Workshop browse shell
- Public Fan Plaza browse shell
- Public profile projection
- Public documentation/help/update surfaces

These surfaces can be globally visible because they can be rendered without exposing campaign runtime state, private character data, room membership, local imports, DB internals, or account secrets.

### 4.2 Public Tool Entrances

These can be linked from the Global Public Surface as tools, but the created or loaded data remains private by default:

- Character builder and sheet entrances for DND/COC/CP RED
- Actor Vault entrance
- Campaign hosting entrance
- Join room / join lobby entrance
- Import/export tool entrances
- Document authoring entrance

The public surface should say "start a tool" or "open your library", not imply that the underlying data is public.

### 4.3 Public Content Feeds

Candidate public feed areas:

- Workshop packages
- Fan Plaza works
- Public profile showcases
- Public templates and samples
- Public media previews
- Public document excerpts where rights allow

These require explicit publish state, review status, rights policy, source trust, projection filtering, and moderation fields before they become production public feeds.

### 4.4 Templates / Samples

Good template/sample candidates:

- Public character templates
- Public campaign templates
- Public map/scene templates
- Public item/equipment templates
- Public open-rule examples
- Public Workshop sample packages

Templates must be separated from user-owned committed objects. A public template is not the same object as a user's private character, campaign, or runtime state.

## 5. Server-Scoped Systems

Server-scoped systems are owned by a world/child server or room service boundary, not the Global Public Surface:

- Room discovery and room list
- Room Lobby
- Room member approval/rejection state
- Room actor binding and ready state
- Room WebSocket transport
- Server runtime config
- World/server-level package enablement
- Future server member roles and moderation

Current code still uses a portable/local Room Server. The classification should already treat it as server/world scoped so it can evolve into LAN, self-hosted, official cloud, or community servers without flattening all room state into global public data.

## 6. Campaign-Scoped Systems

Campaign-scoped systems include:

- Campaign records and lifecycle state
- Campaign runtime shell
- Room runtime entry context
- RuntimeLog / RuntimeEvent data
- Scene focus, map stage, public info, handouts, manual state logs
- Runtime actor roster and read-only character projections
- Session recap drafts
- Campaign maps, media, notes, documents, and enabled packages

Campaign data should not appear on the Global Public Surface unless there is a deliberate public projection such as a recruitment post, public recap, shared handout, published template, or showcase excerpt.

## 7. User-Private Systems

User-private systems include:

- Actor Vault
- Character sheets and private character data
- Personal Content Hub
- Local imports and export snapshots
- Draft documents and AI drafts
- Private media assets
- Private Workshop package drafts
- Campaign Entry Draft
- Local viewer/account state
- Ownership registries

These systems may have public entry points, but the data itself should remain user-private until a publish/share action creates a separate projection with explicit visibility.

## 8. Systems That Need Split Treatment

The following systems should be split before being treated as public:

- Home: split public platform landing from viewer dashboard widgets.
- User Profile: split public profile projection from owner management.
- Workshop: split public package browse from private package authoring/import state.
- Fan Plaza: split public feed from user drafts/moderation/admin.
- Document Library: split public documents, campaign documents, private drafts, and AI drafts.
- MediaAsset: split public previews, campaign assets, private originals, storage refs, and admin processing metadata.
- Rules/Compendium: split public/open rules, private owner-source imports, server-enabled packs, and user custom rules.
- Character data: split public showcase/template from private ActorVaultActor and future CampaignActorInstance.
- Campaign data: split campaign management from public recruitment/recap/template projections.
- RuntimeLog: split live campaign authority from public recap/export/published timeline.
- Room discovery: split global/public recruitment listings from server-scoped room state.
- AI outputs: split advisory draft output from committed public content.

## 9. Suggested Visibility Model

Recommended visibility scopes:

- `globalPublic`: visible on the Global Public Surface.
- `server`: visible within a world/child server boundary.
- `campaign`: visible within a campaign or room runtime boundary.
- `userPrivate`: visible only to the owner or local viewer.
- `unlisted`: reachable by direct link/code but not public search/feed.

Recommended fields for future persisted objects:

- `visibility_scope`
- `owner_user_id`
- `server_id`
- `campaign_id`
- `public_search_allowed`
- `public_profile_allowed`
- `workshop_publish_allowed`
- `community_feed_allowed`
- `ai_scope`
- `rights_policy_id`
- `review_status`

Recommended semantics:

- `visibility_scope` controls the primary audience.
- `public_search_allowed` controls discoverability, not access authority.
- `public_profile_allowed` controls whether the object can appear in a profile projection.
- `workshop_publish_allowed` controls whether the object can become a package or template.
- `community_feed_allowed` controls whether the object can appear in Fan Plaza/community feeds.
- `ai_scope` controls what AI tools can read or summarize.
- `rights_policy_id` and `review_status` are required before public publishing.
- `roomCode`, `publicCode`, invite code, or share code are not permission systems.

## 10. Navigation / IA Recommendations

Global Public Surface:

- Home / platform landing
- System Library
- Workshop
- Fan Plaza / Community
- Public templates
- Public profiles
- Join / create server entry
- Sign in / account entry
- My Library / private workspace entry

World / Child Server:

- Server home
- Server members
- Server rooms
- Server campaigns
- Server compendium / enabled packages
- Server assets and maps
- Server community posts
- Server settings and moderation

Campaign:

- Campaign overview
- Actors / roster
- Maps / scenes
- Handouts / documents
- Runtime room
- RuntimeLog / recap
- Campaign settings
- Campaign import/export

User Private:

- My Characters
- My Campaigns
- My Documents
- My Media
- My Workshop Drafts
- My Imports / Backups
- My Profile management

## 11. Risks

- Public entry can be mistaken for public data if object-level visibility is not explicit.
- Room codes and public codes can be mistaken for authorization if not kept separate from permission.
- Campaign runtime logs can leak private table content if reused directly for public recaps.
- Workshop and Fan Plaza can leak private imported or owner-source rule text without rights/review gates.
- Media assets can leak original files or storage references if public previews are not separated.
- User profiles can overexpose private ActorVault, Campaign, or Document objects without projection enforcement.
- AI recap/draft tools can accidentally read across visibility boundaries if `ai_scope` is not explicit.
- Server/world data can be flattened into global public feeds if server scope is not modeled early.
- "Public search" and "unlisted link" are different; conflating them will create privacy bugs.
- Current local-first helpers are useful, but future cloud storage needs the same repository and projection boundaries.

## 12. Recommended Next Work

Recommended follow-up patches:

1. Public Surface Visibility Contract
   - Define `visibility_scope`, publish flags, review fields, and rights policy in one architecture contract.
2. Public Projection Matrix
   - For each object type, list fields allowed in global public, server, campaign, user-private, and AI contexts.
3. Workshop/Fan Plaza Publish Boundary
   - Separate private drafts, public package/work feed, moderation state, and rights checks.
4. Public Profile Projection Hardening
   - Ensure public profile never directly exposes private vault/campaign/document objects.
5. Room vs Global Discovery Split
   - Define global recruitment/listing objects separately from live room state.
6. RuntimeLog Public Recap Boundary
   - Define explicit redaction/publish flow for any public table recap.
7. Media Public Preview Boundary
   - Separate public preview metadata from private originals and storage refs.

## 13. Non-Implemented

This audit does not implement:

- New runtime behavior
- New server endpoints
- New database schema
- New permission system
- New auth/account flow
- New Workshop publish flow
- New Fan Plaza moderation flow
- New AI gateway
- New import/export behavior
- New UI navigation
- New public feed
- New server/world model
- New campaign membership model
- New CampaignActorInstance or RuntimeActor persistence

