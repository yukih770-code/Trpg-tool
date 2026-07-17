import type { Request } from 'express';

import type { CurrentViewerContext } from './currentViewerContext.js';
import type { PrivateAlphaViewer, SafePrivateAlphaUser } from './privateAlphaAuth.js';

export type RequestWithVerifiedViewer = Request & {
  privateAlphaViewer?: PrivateAlphaViewer;
};

export function setPrivateAlphaViewer(request: Request, value: PrivateAlphaViewer | null): void {
  const typed = request as RequestWithVerifiedViewer;
  if (value) typed.privateAlphaViewer = value;
  else delete typed.privateAlphaViewer;
}

export function getVerifiedViewer(request: Request): CurrentViewerContext | undefined {
  return (request as RequestWithVerifiedViewer).privateAlphaViewer?.viewer;
}

export function getVerifiedSessionId(request: Request): string | undefined {
  return (request as RequestWithVerifiedViewer).privateAlphaViewer?.sessionId;
}

export function getVerifiedViewerUser(request: Request): SafePrivateAlphaUser | undefined {
  return (request as RequestWithVerifiedViewer).privateAlphaViewer?.user;
}
