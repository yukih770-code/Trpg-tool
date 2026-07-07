/**
 * Current viewer account projection (P5.10I) — frontend-only.
 *
 * AI-LANDMARK: CURRENT_VIEWER_ACCOUNT_PROJECTION_V1
 *
 * ONE normalized account-surface projection so every frontend account surface
 * (top-nav avatar/label, account dropdown header, settings readiness) shows the
 * SAME current-viewer identity. It derives entirely from the P5.1/P5.4 local
 * anonymous user helpers — it is NOT a second identity system.
 *
 * Hard boundaries (P5.10I):
 * - No Postgres, no `/api/dev/users` call, no network, and no server database
 *   env vars of any kind. This is a pure local projection.
 * - The device-local anonymous user remains THE current viewer for now.
 * - Login/logout are reserved (no auth exists) — the projection reports them as
 *   disabled so the UI renders them as reserved, not functional.
 * - The legacy sample author ('author-sample') is a SEED-content author alias
 *   only; it is never surfaced here as the current account (see localViewerIdentity).
 *
 * Future Auth substitution: when a real user exists, replace the body of
 * `getCurrentViewerAccount` with the authenticated projection (setting
 * `isAuthenticated`, `accountSource`, `canLogin/Logout`) — the UI stays the same.
 */

import { getCurrentLocalProfileUserId, getCurrentLocalUserProfile } from './localViewerIdentity';

export type CurrentViewerAccountSource = 'localAnonymous' | 'legacySampleAlias' | 'placeholder';

export interface CurrentViewerAccountProjection {
  userId: string;
  displayName: string;
  handle: string;
  /** Short avatar glyph (first grapheme of the display name). */
  avatarLabel: string;
  /** Profile id to open for "我的主页" (same as the current user today). */
  profileUserId: string;
  isLocalAnonymous: boolean;
  isAuthenticated: boolean;
  /** Human-facing auth state, e.g. "本地身份 · 未登录". */
  authStateLabel: string;
  accountSource: CurrentViewerAccountSource;
  canOpenProfile: boolean;
  canOpenLibrary: boolean;
  canLogin: boolean;
  canLogout: boolean;
}

export type ViewerAccountLocale = 'zh' | 'en';

function firstGrapheme(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  return Array.from(trimmed)[0] ?? '';
}

/**
 * Build the current viewer account projection from the local anonymous user.
 * Read-only, synchronous, no network. Safe to call per render.
 */
export function getCurrentViewerAccount(locale: ViewerAccountLocale = 'zh'): CurrentViewerAccountProjection {
  const profileUserId = getCurrentLocalProfileUserId();
  const profile = getCurrentLocalUserProfile();

  const displayName = profile.displayName?.trim() || (locale === 'en' ? 'Local Player' : '本地玩家');
  const handle = profile.handle?.trim() || `local-${profileUserId.slice(-6)}`;
  const avatarLabel = firstGrapheme(displayName) || (locale === 'en' ? 'U' : '我');

  return {
    userId: profileUserId,
    displayName,
    handle,
    avatarLabel,
    profileUserId,
    isLocalAnonymous: true,
    isAuthenticated: false,
    authStateLabel: locale === 'en' ? 'Local identity · not signed in' : '本地身份 · 未登录',
    accountSource: 'localAnonymous',
    canOpenProfile: true,
    canOpenLibrary: true,
    // Reserved until real Auth exists (no login/logout behavior in this slice).
    canLogin: false,
    canLogout: false,
  };
}
