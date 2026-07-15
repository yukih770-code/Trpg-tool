/**
 * Current Viewer Context (P5.29) — server-only, DB-free, no frontend import.
 *
 * AI-LANDMARK: CURRENT_VIEWER_CONTEXT_V1
 *
 * Maps an auth session (P5.28) into the shape the P5.20 permission resolver consumes.
 * dev_header viewers are authenticated but flagged dev-only; service_internal is NOT a
 * user and must never gain user permissions (its actor context is anonymous).
 */

import type { ApiAuthSession, ApiAuthTrustLevel } from './requestAuthSession.js';
import type { PermissionActorContext } from '../policy/effectivePermissionResolver.js';

export interface CurrentViewerContext {
  viewerUserId: string | null;
  isAuthenticated: boolean;
  authTrustLevel: ApiAuthTrustLevel;
  isDevOnly: boolean;
  isServiceInternal: boolean;
  notes: string[];
}

export function createCurrentViewerContextFromAuthSession(session: ApiAuthSession): CurrentViewerContext {
  return {
    viewerUserId: session.viewerUserId,
    isAuthenticated: session.isAuthenticated,
    authTrustLevel: session.trustLevel,
    isDevOnly: session.trustLevel === 'dev_header',
    isServiceInternal: session.trustLevel === 'service_internal',
    notes: session.notes,
  };
}

/**
 * Convert to the P5.20 actor context. Service-internal callers are treated as
 * anonymous for user-permission purposes (they never automatically own/manage user
 * content); a future service-authorization layer would handle service capabilities.
 */
export function toPermissionActorContext(viewer: CurrentViewerContext): PermissionActorContext {
  if (viewer.isServiceInternal) {
    return { viewerUserId: null, isAuthenticated: false };
  }
  return { viewerUserId: viewer.viewerUserId, isAuthenticated: viewer.isAuthenticated };
}
