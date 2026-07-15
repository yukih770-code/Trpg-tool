/**
 * Guarded API handler contract (P5.31) — server-only, dependency-free.
 *
 * AI-LANDMARK: GUARDED_API_HANDLER_V1
 *
 * A tiny wrapper future business handlers can use: run the handler ONLY when the API
 * guard decision allows it, otherwise return a safe HTTP error envelope (no internal
 * reason, no content). No Express dependency, no DB, no route changes.
 */

import type { ApiGuardDecision } from './apiPermissionGuard.js';

export interface GuardedApiHandlerInput<TRequest, TResult> {
  request: TRequest;
  guard: ApiGuardDecision;
  handle: () => Promise<TResult> | TResult;
}

export async function runGuardedApiHandler<TRequest, TResult>(
  input: GuardedApiHandlerInput<TRequest, TResult>,
): Promise<{ ok: true; result: TResult } | { ok: false; status: number; errorCode: string; message: string }> {
  if (!input.guard.allowed) {
    return {
      ok: false,
      status: input.guard.httpStatus,
      errorCode: input.guard.errorCode ?? 'forbidden',
      message: input.guard.publicMessage ?? 'You do not have access to this resource.',
    };
  }
  const result = await input.handle();
  return { ok: true, result };
}
