/**
 * Actor portrait / avatar / cover media binding contract.
 *
 * AI-LANDMARK: ACTOR_PORTRAIT_MEDIA_BINDING_CONTRACT_V1
 *
 * Contract-only types and pure helpers. This module does not upload, crop,
 * store, fetch, or project images. Actors reference MediaAsset ids; image
 * payloads and variants remain owned by the MediaAsset layer.
 */
import type { MediaAssetId, MediaAssetVariant } from '../architecture/mediaAsset';

export type ActorImageSlot =
  | 'portrait'
  | 'avatar'
  | 'cover'
  | 'token'
  | 'thumbnail';

export type ActorImagePurpose =
  | 'characterSheet'
  | 'actorVault'
  | 'userProfile'
  | 'campaignMemberList'
  | 'campaignRuntime'
  | 'fanWorkMention'
  | 'workshopPreview';

export type ActorMediaVisibility = 'private' | 'campaign' | 'public';

export interface ActorMediaBinding {
  actorId: string;
  slot: ActorImageSlot;
  mediaAssetId: MediaAssetId;
  purpose?: ActorImagePurpose;
  visibility?: ActorMediaVisibility;
  updatedAt?: string;
}

export type ActorMediaBindingInput = Omit<ActorMediaBinding, 'updatedAt'> & {
  updatedAt?: string;
};

const ACTOR_IMAGE_SLOTS = new Set<ActorImageSlot>([
  'portrait',
  'avatar',
  'cover',
  'token',
  'thumbnail',
]);

/**
 * Default read variant for actor image purposes.
 *
 * List/card surfaces use thumbnail. Detail/profile/campaign runtime surfaces use
 * preview. Original is intentionally never returned as a default variant.
 */
export function actorMediaVariantForPurpose(purpose: ActorImagePurpose): MediaAssetVariant {
  switch (purpose) {
    case 'actorVault':
    case 'campaignMemberList':
    case 'fanWorkMention':
    case 'workshopPreview':
      return 'thumbnail';
    case 'characterSheet':
    case 'userProfile':
    case 'campaignRuntime':
      return 'preview';
    default:
      return 'thumbnail';
  }
}

export function isActorImageSlot(value: string): value is ActorImageSlot {
  return ACTOR_IMAGE_SLOTS.has(value as ActorImageSlot);
}

export function bindingMatchesSlot(binding: ActorMediaBinding, slot: ActorImageSlot): boolean {
  return binding.slot === slot;
}

export function selectActorMediaBinding(
  bindings: ActorMediaBinding[],
  slot: ActorImageSlot,
  purpose?: ActorImagePurpose,
): ActorMediaBinding | undefined {
  const exactPurpose = purpose
    ? bindings.find((binding) => binding.slot === slot && binding.purpose === purpose)
    : undefined;

  return exactPurpose ?? bindings.find((binding) => binding.slot === slot && binding.purpose === undefined);
}

export function createActorMediaBinding(input: ActorMediaBindingInput): ActorMediaBinding {
  return {
    ...input,
    updatedAt: input.updatedAt,
  };
}
