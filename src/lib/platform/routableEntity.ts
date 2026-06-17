/**
 * Routable Entity Navigation contract.
 *
 * AI-LANDMARK: ROUTABLE_ENTITY_CONTRACT_V1
 *
 * Every object detail should open as a DETAIL STATE inside its owner's
 * UserProfileSpace (or a future SystemProfileSpace for ownerless official
 * content), never as an isolated popup / in-place expansion.
 *
 * Click rules (the direction this contract establishes):
 *   - author avatar / name  → UserProfileSpace(profileUserId, 'overview')
 *   - object card main click → UserProfileSpace(profileUserId, section, entityId)
 *
 * Pure types + pure mapping helpers. The owner-resolving helper that needs the
 * data layer (`resolveEntityProfileTarget`) lives on PlatformDataService.
 */
import type { EntityType } from '../architecture/entityGraph';
import type { UserProfileSection } from './userProfile';

export type RoutableEntityDetailMode =
  | 'showcase'
  | 'reader'
  | 'package'
  | 'work'
  | 'media'
  | 'campaign'
  | 'unknown';

export type RoutableEntityTarget = {
  profileUserId: string;
  entityId: string;
  entityType: EntityType;
  section: UserProfileSection;
  detailMode: RoutableEntityDetailMode;
};

/** Which profile section an entity type lives under. */
export function sectionForEntityType(type: EntityType): UserProfileSection {
  switch (type) {
    case 'actor':
    case 'npc':
      return 'characters';
    case 'campaign':
    case 'world':
      return 'campaigns';
    case 'blockDocument':
    case 'handout':
    case 'sessionLog':
      return 'documents';
    case 'fanWork':
      return 'fanWorks';
    case 'workshopPackage':
      return 'workshopPackages';
    case 'map':
    case 'mediaAsset':
      return 'media';
    default:
      return 'overview';
  }
}

/** Which detail render mode an entity type opens in. */
export function detailModeForEntityType(type: EntityType): RoutableEntityDetailMode {
  switch (type) {
    case 'actor':
    case 'npc':
      return 'showcase';
    case 'blockDocument':
    case 'handout':
    case 'sessionLog':
      return 'reader';
    case 'workshopPackage':
      return 'package';
    case 'fanWork':
      return 'work';
    case 'map':
    case 'mediaAsset':
      return 'media';
    case 'campaign':
    case 'world':
      return 'campaign';
    default:
      return 'unknown';
  }
}
