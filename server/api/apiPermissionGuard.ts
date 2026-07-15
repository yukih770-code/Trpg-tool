/**
 * API Permission Guard foundation (P5.31) — server-only, DB-free.
 *
 * AI-LANDMARK: API_PERMISSION_GUARD_V1
 *
 * Turns a viewer + request scope + resource metadata into a safe HTTP allow/deny using
 * the P5.20 permission resolver as the source of truth. Fails closed. NEVER leaks the
 * internal permission reason into the public message, and hides private-resource
 * existence (404) when asked. No DB, no route mutation, no frontend import. This slice
 * PREPARES enforcement; it does not retrofit existing routes.
 */

import {
  resolveEffectivePermission,
  type PermissionAction,
  type PermissionContentContext,
  type PermissionWorldServerContext,
  type PermissionDecision,
  type ResolveEffectivePermissionInput,
} from '../policy/effectivePermissionResolver.js';
import { toPermissionActorContext, type CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { ApiRequestScopeResult } from './apiRequestContext.js';

export type ApiGuardAction = PermissionAction;

export type ApiGuardErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found_or_forbidden'
  | 'bad_request'
  | 'conflict'
  | 'guard_not_configured'
  | 'denied_by_default';

export interface ApiGuardDecision {
  allowed: boolean;
  httpStatus: 200 | 400 | 401 | 403 | 404;
  errorCode?: ApiGuardErrorCode;
  publicMessage?: string;
  internalReason: string;
  notes: string[];
}

export interface ResolveApiGuardInput {
  action: ApiGuardAction;
  viewer: CurrentViewerContext;
  requestScope?: ApiRequestScopeResult | null;
  content?: PermissionContentContext | null;
  worldServer?: PermissionWorldServerContext | null;
  targetSurface?: ResolveEffectivePermissionInput['targetSurface'];
  resourceExistenceKnown?: boolean;
  hideResourceExistence?: boolean;
}

const PUBLIC_MESSAGES: Record<ApiGuardErrorCode, string> = {
  unauthenticated: 'Authentication required.',
  forbidden: 'You do not have access to this resource.',
  not_found_or_forbidden: 'Resource not found or access denied.',
  bad_request: 'Invalid request scope.',
  conflict: 'Invalid request scope.',
  guard_not_configured: 'Resource not found or access denied.',
  denied_by_default: 'You do not have access to this resource.',
};

// Actions that address a specific content resource (require content metadata).
const CONTENT_ACTIONS = new Set<ApiGuardAction>(['view', 'edit', 'delete', 'publish', 'submitForReview', 'useInAiContext']);

export function createApiGuardDeniedDecision(input: {
  httpStatus: 400 | 401 | 403 | 404;
  errorCode: ApiGuardErrorCode;
  internalReason: string;
  publicMessage?: string;
  notes?: string[];
}): ApiGuardDecision {
  return {
    allowed: false,
    httpStatus: input.httpStatus,
    errorCode: input.errorCode,
    publicMessage: input.publicMessage ?? PUBLIC_MESSAGES[input.errorCode],
    internalReason: input.internalReason,
    notes: input.notes ?? [],
  };
}

export function mapPermissionDecisionToApiGuardDecision(input: {
  permission: PermissionDecision;
  hideResourceExistence?: boolean;
  resourceExistenceKnown?: boolean;
}): ApiGuardDecision {
  const { permission } = input;
  if (permission.allowed) {
    return { allowed: true, httpStatus: 200, internalReason: permission.reason, notes: ['Allowed by permission resolver.'] };
  }
  if (permission.reason === 'denied_unauthenticated') {
    return createApiGuardDeniedDecision({ httpStatus: 401, errorCode: 'unauthenticated', internalReason: permission.reason });
  }
  // Forbidden: hide resource existence (404) when requested; otherwise 403.
  if (input.hideResourceExistence) {
    return createApiGuardDeniedDecision({ httpStatus: 404, errorCode: 'not_found_or_forbidden', internalReason: permission.reason });
  }
  return createApiGuardDeniedDecision({ httpStatus: 403, errorCode: 'forbidden', internalReason: permission.reason });
}

export function resolveApiPermissionGuard(input: ResolveApiGuardInput): ApiGuardDecision {
  // 1) Request-scope conflicts are a bad request (do not evaluate permission on ambiguous scope).
  if (input.requestScope && input.requestScope.safe === false) {
    return createApiGuardDeniedDecision({
      httpStatus: 400,
      errorCode: 'bad_request',
      internalReason: `request_scope_conflict:${input.requestScope.conflicts.join(',')}`,
    });
  }

  // 2) Content actions require content metadata; missing it is a guard misconfiguration (fail closed, hide existence).
  if (CONTENT_ACTIONS.has(input.action) && !input.content) {
    return createApiGuardDeniedDecision({
      httpStatus: 404,
      errorCode: 'guard_not_configured',
      internalReason: 'guard_not_configured:missing_content_context',
    });
  }

  // 3) Delegate to the P5.20 permission resolver (source of truth).
  const permissionInput: ResolveEffectivePermissionInput = {
    action: input.action,
    actor: toPermissionActorContext(input.viewer),
    content: input.content ?? undefined,
    worldServer: input.worldServer ?? undefined,
    targetSurface: input.targetSurface,
  };
  const permission = resolveEffectivePermission(permissionInput);
  return mapPermissionDecisionToApiGuardDecision({
    permission,
    hideResourceExistence: input.hideResourceExistence,
    resourceExistenceKnown: input.resourceExistenceKnown,
  });
}
