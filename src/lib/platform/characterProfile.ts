/**
 * Character Profile / Avatar / Appearance foundation (view-model only).
 *
 * AI-LANDMARK: CHARACTER_PROFILE_FOUNDATION_V1
 *
 * Cross-system, minimal profile model for character sheets. This is a
 * presentation/view-model layer only:
 * - It does NOT store image blobs. Avatars reference a MediaAsset id or an
 *   image URL placeholder, consistent with ACTOR_PORTRAIT_MEDIA_BINDING_CONTRACT_V1
 *   (image payloads stay in the MediaAsset layer).
 * - It does NOT add store fields or schema. Sheets map their existing fields
 *   into a CharacterProfileDraft via an adapter; missing fields are reported as
 *   unsupported (pending later store support).
 * - It performs no RuntimeLog writes and no gameplay behavior.
 */

export type CharacterProfileSystemId = 'dnd5e-2024' | 'coc7e' | 'cp-red';

export interface CharacterAvatarBinding {
  /** Reference into the MediaAsset layer (preferred). */
  mediaAssetId?: string;
  /** Placeholder/external image URL until MediaAsset upload exists. No blobs. */
  imageUrl?: string;
  altText?: string;
  source: 'local-upload' | 'media-asset' | 'external-url' | 'placeholder';
}

export interface CharacterProfileDraft {
  systemId: CharacterProfileSystemId;
  actorId: string;
  displayName: string;
  avatar?: CharacterAvatarBinding;
  appearanceDescription?: string;
  biography?: string;
  notes?: string;
}

/**
 * Which profile fields the current system store can actually persist. Sheets set
 * these from their real fields; the UI shows editable controls only where true,
 * and a "needs store support" hint where false.
 */
export interface CharacterProfileFieldSupport {
  appearance: boolean;
  biography: boolean;
  notes: boolean;
  /** True only when a real MediaAsset/avatar persistence path exists. */
  avatarPersistence: boolean;
}

export function makePlaceholderAvatar(altText?: string): CharacterAvatarBinding {
  return { source: 'placeholder', altText };
}

/** Build a profile draft from already-resolved fields (no store coupling). */
export function makeCharacterProfileDraft(input: {
  systemId: CharacterProfileSystemId;
  actorId: string;
  displayName: string;
  avatar?: CharacterAvatarBinding;
  appearanceDescription?: string;
  biography?: string;
  notes?: string;
}): CharacterProfileDraft {
  return {
    systemId: input.systemId,
    actorId: input.actorId,
    displayName: input.displayName,
    avatar: input.avatar ?? makePlaceholderAvatar(input.displayName),
    appearanceDescription: input.appearanceDescription,
    biography: input.biography,
    notes: input.notes,
  };
}

/** Resolve the best displayable image URL for an avatar binding, if any. */
export function resolveAvatarImageUrl(avatar?: CharacterAvatarBinding): string | undefined {
  if (!avatar) return undefined;
  return avatar.imageUrl;
}
