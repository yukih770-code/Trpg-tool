/**
 * User Profile Space — profile metadata types.
 *
 * AI-LANDMARK: USER_PROFILE_SPACE_V1
 *
 * The UserProfileSpace is a VISITOR SHOWCASE view of a user's public content.
 * A UserProfile stores ONLY profile metadata, section config, pin order, display
 * prefs, and privacy — never object data. The objects themselves (Actor /
 * Campaign / BlockDocument / FanWork / WorkshopPackage / MediaAsset) remain
 * authoritative in their own repositories; the profile is an aggregate view.
 *
 * Distinction:
 *   PersonalContentHub  = owner MANAGEMENT mode  (ownerProjection)
 *   UserProfileSpace    = visitor SHOWCASE mode  (public/unlisted/owner-preview)
 *   SystemWorkspace     = play/tool USE mode      (campaign/player/gm projection)
 */
import type { EntityType, EntityVisibility } from '../architecture/entityGraph';

export type UserProfileId = string;

export type UserProfileSection =
  | 'overview'
  | 'characters'
  | 'campaigns'
  | 'documents'
  | 'fanWorks'
  | 'workshopPackages'
  | 'media'
  | 'collections';

export const USER_PROFILE_SECTIONS: UserProfileSection[] = [
  'overview', 'characters', 'campaigns', 'documents', 'fanWorks', 'workshopPackages', 'media', 'collections',
];

/** Whole-profile visibility (reuse the canonical enum). */
export type UserProfileVisibility = EntityVisibility;

/** Per-section visibility within a profile. */
export type ProfileSectionVisibility = 'public' | 'unlisted' | 'private';

/** A pinned showcase item (reference only — resolved via repos at display). */
export type ProfileShowcaseSlot = {
  entityId: string;
  entityType: EntityType;
  label?: string;
};

export type ProfileCollectionSummary = {
  id: string;
  title: string;
  itemCount: number;
};

export type UserProfile = {
  userId: UserProfileId;
  handle: string;
  displayName: string;
  bio?: string;
  avatarMediaAssetId?: string;
  bannerMediaAssetId?: string;
  tags: string[];
  visibility: UserProfileVisibility;
  pinned: ProfileShowcaseSlot[];
  sectionVisibility: Partial<Record<UserProfileSection, ProfileSectionVisibility>>;
};

export type UserProfileSummary = {
  userId: UserProfileId;
  handle: string;
  displayName: string;
  avatarMediaAssetId?: string;
  tags: string[];
};

/** Detail = the full profile metadata (object lists are fetched per section). */
export type UserProfileDetail = UserProfile;
