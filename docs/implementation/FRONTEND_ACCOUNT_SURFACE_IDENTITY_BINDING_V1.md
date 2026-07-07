# Frontend Account Surface Identity Binding v1 (P5.10I-J)

Unifies every frontend account surface around ONE current-viewer account
projection. No real login, no auth/session/JWT/cookies, no Postgres/User-API call
from the frontend, and no server database env vars in frontend source.

## 1. Account surface inventory

| Surface | Location | Current data source (before) | Desired source (after) | Legacy sample author? | Local anon user? | Placeholder/reserved? |
| --- | --- | --- | --- | --- | --- | --- |
| Top-nav avatar + label (desktop) | `App.tsx` header | hardcoded `示` / `示例作者` | `getCurrentViewerAccount()` (avatarLabel/displayName) | **was** shown as current user (fixed) | now yes | no |
| Account dropdown header (avatar/name/handle) | `App.tsx` account menu | hardcoded `示例作者` / `@graycastle_author` | `getCurrentViewerAccount()` + `authStateLabel` | **was** shown as current user (fixed) | now yes | no |
| "我的主页" (My Profile) target | `App.tsx` → `UserProfileSpace` | `profileUserId` = `getCurrentLocalProfileUserId()` (P5.4) | unchanged | no | yes | no |
| "我的资料库" (My Library) | `App.tsx` → `PersonalContentHub` | `getCurrentLocalViewerContext()` (P5.4) | unchanged | no (seed alias only) | yes | no |
| Owner/visitor profile view | `UserProfileSpace` | `profileUserId` prop vs viewer | unchanged | seed alias only | yes | no |
| Data & Backup | account menu → settings | reserved menu entry | readiness label (local / cloud reserved) | no | n/a | reserved |
| Settings | account menu → settings | placeholder | unchanged this slice | no | n/a | reserved |
| Login / Logout | account menu | `disabled` + "预留" badge | `canLogin/Logout=false` (reserved) | no | n/a | reserved |

## 2. Before / after identity source

- **Before:** the account menu displayed the legacy seed author `示例作者
  @graycastle_author` as if it were the current logged-in user, while "我的主页"
  and "我的资料库" already used the real device-local anonymous user (P5.4). This
  was a visible identity mismatch.
- **After:** all account surfaces derive from a single
  `getCurrentViewerAccount()` projection, which delegates to the P5.1/P5.4 local
  identity helpers. The current account now shows the local anonymous user
  everywhere (e.g. `本地玩家 @local-xxxxxx`), and reports `本地身份 · 未登录`.

## 3. The projection (frontend-only)

`src/lib/platform/currentViewerAccount.ts` →
`getCurrentViewerAccount(locale): CurrentViewerAccountProjection`
(`userId`, `displayName`, `handle`, `avatarLabel`, `profileUserId`,
`isLocalAnonymous`, `isAuthenticated`, `authStateLabel`, `accountSource`,
`canOpenProfile/Library/Login/Logout`). It reads only
`getCurrentLocalProfileUserId()` + `getCurrentLocalUserProfile()`. **No network,
no Postgres, no `/api/dev/users`, no server DB env.** A dependency-free self-check
lives in `currentViewerAccountSmoke.ts`.

## 4. Legacy sample author boundary (unchanged)

`author-sample` remains a **seed-content author alias only** (see
`localViewerIdentity.ts`): at read time it resolves to the current local user so
seed content stays owned/visible, but it is **never** surfaced as the current
account. Seed data is not rewritten; sample content may still show `示例作者` as a
content author where appropriate.

## 5. Why the frontend still does not call the backend User API

The Postgres UserRepository + User API (P5.10A–H) are **server-only / dev-only**
and have **no authentication**. Calling them from the browser would require
exposing an unauthenticated data API to clients. Until real Auth exists, the
frontend's current identity stays the local anonymous user; the backend User API
is exercised only by server smoke (`api:verify:user`) and the env-gated dev routes.

## 6. Future Auth substitution

When real Auth arrives, replace the body of `getCurrentViewerAccount()` with the
authenticated projection (set `isAuthenticated`, `accountSource`,
`canLogin/Logout`, real `displayName/handle/avatar`). **Every account surface then
updates with no UI change** — that is the point of the single projection. The
existing account dropdown, "我的主页", "我的资料库", settings, and the reserved
login/logout entries are the intended reuse targets for backend identity work.

## 7. Explicit non-use note

This slice does **not** use the Postgres User API from the frontend, does not
implement login/logout/session, and does not touch Campaign / Actor / RuntimeEvent
databases or cloud sync. Existing server DB/API verify scripts (`db:verify:user`,
`db:verify:user:write`, `api:verify:user`) are unchanged.
