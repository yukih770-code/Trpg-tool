/**
 * Current viewer account projection smoke (P5.10I) — frontend-only, no test dep.
 *
 * AI-LANDMARK: CURRENT_VIEWER_ACCOUNT_SMOKE_V1
 *
 * A tiny, dependency-free self-check for `getCurrentViewerAccount`. It asserts the
 * projection is well-formed and consistent with the local viewer id. Not wired
 * into the app; call it from a scratch script or a devtools console if desired.
 * No network, no Postgres, no server database env vars.
 */

import { getCurrentViewerAccount } from './currentViewerAccount';
import { getCurrentLocalProfileUserId } from './localViewerIdentity';

export interface ViewerAccountSmokeCase {
  name: string;
  pass: boolean;
}

export interface ViewerAccountSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: ViewerAccountSmokeCase[];
}

export function runCurrentViewerAccountSmoke(): ViewerAccountSmokeReport {
  const account = getCurrentViewerAccount('zh');
  const localProfileUserId = getCurrentLocalProfileUserId();

  const cases: ViewerAccountSmokeCase[] = [
    { name: 'userId.nonEmpty', pass: account.userId.trim() !== '' },
    { name: 'displayName.nonEmpty', pass: account.displayName.trim() !== '' },
    { name: 'handle.nonEmpty', pass: account.handle.trim() !== '' },
    { name: 'avatarLabel.nonEmpty', pass: account.avatarLabel.trim() !== '' },
    { name: 'profileUserId.matchesLocal', pass: account.profileUserId === localProfileUserId },
    { name: 'isAuthenticated.false', pass: account.isAuthenticated === false },
    { name: 'isLocalAnonymous.true', pass: account.isLocalAnonymous === true },
    { name: 'accountSource.localAnonymous', pass: account.accountSource === 'localAnonymous' },
    { name: 'login.reserved', pass: account.canLogin === false && account.canLogout === false },
    { name: 'handle.notLegacyAuthor', pass: account.handle !== 'graycastle_author' && account.userId !== 'author-sample' },
  ];

  const passed = cases.filter((c) => c.pass).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
