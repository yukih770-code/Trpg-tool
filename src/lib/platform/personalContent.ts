/**
 * Personal Content Hub — light view types.
 *
 * AI-LANDMARK: PERSONAL_CONTENT_HUB_V1
 *
 * Minimal types for "我的内容 / Personal Content Hub". A read-only management
 * surface over the user's own documents, fan works, drafts, collections, owned
 * packages, and imported packages. No publish, no real collection write, no
 * backend. Resolved exclusively through PlatformDataService / repositories.
 */

export type PersonalContentKind = 'document' | 'fanWork' | 'package' | 'entity';

/** A unified, display-ready summary of one personal content item. */
export type PersonalContentSummary = {
  kind: PersonalContentKind;
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  visibility?: string;
  updatedAt?: string;
};

/** A draft = a personal item whose status is 'draft'. */
export type DraftItem = PersonalContentSummary;

/** Simple package health badge (detailed diagnostics deferred to a future report). */
export type PackageHealthStatus =
  | 'available'             // ✅ 可用
  | 'needsAttention'        // ⚠️ 需要处理
  | 'hasPrivateContent'     // 🔒 含私有内容
  | 'hasUnpublishedChanges'; // ⬆️ 有未发布修改

export type OwnedPackageItem = PersonalContentSummary & {
  health: PackageHealthStatus;
};

/** A user's saved pointer to another object (resolved via repos at display time). */
export type CollectionItem = {
  id: string;
  itemKind: PersonalContentKind;
  targetId: string;
  collectedAtLabel: string;
};

/** A package the user imported (envelope/manifest summary; no real import yet). */
export type ImportedPackageItem = {
  id: string;
  title: string;
  sourceTrust: string;
  health: PackageHealthStatus;
  importedAtLabel: string;
};
