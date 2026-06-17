# Navigation & Exit Contract v1

<!-- AI-LANDMARK: NAVIGATION_AND_EXIT_CONTRACT_V1 -->

Last updated: 2026-06-17
Status: **Binding** — every UI task must comply.

A hard platform-wide rule for back / close / global navigation. It exists so no
screen re-derives its own exit affordance and no screen ships duplicate or
conflicting return buttons.

## 0. The core rule (by container type)

> 页面用 `←` · 浮层用 `×` · 首页只在全局导航里出现。
> Full pages use a back arrow; overlays use a close cross; Home lives only in the
> global nav. A screen never owns global navigation.

The exit affordance is decided by **what kind of container** the surface is:

| Container type | Exit affordance |
|---|---|
| Full-page screen (normal page) | global nav / **`← 返回来源`** (no in-page Home) |
| Full-page detail | a single **`← 返回来源`** |
| Full-page Settings center | **`← 返回`** (back one level) — **NOT `×`** |
| Settings second-level page (mobile) | **`← 设置`** (back to the category list) |
| Modal / popover | **`× 关闭`** |
| Drawer / bottom sheet | **`× 关闭`** / click-outside |
| Account menu (avatar dropdown) | click-outside / `×` (it is an overlay) |

There is never a "返回首页 / Back to Home" button inside any page, detail, menu,
or settings screen. Home is reached only through the persistent global nav.

## 1. Rules (the binding constraints)

1. The top/bottom global nav already contains "首页". Therefore **no page,
   detail, menu, or settings screen may add a "返回首页" button**.
2. A **full-page** screen uses `← 返回上一层 / 返回来源`. An **overlay** (modal /
   popover / drawer / sheet) uses `× 关闭`. Do not mix the two for one surface.
3. A **detail page** allows exactly **one** primary back action: `← 返回来源`
   (e.g. 返回创意工坊 / 返回我的内容 / 返回作者主页 / 返回已加入). The source comes
   from the navigation origin / stack.
4. The **Settings center, if it is a full page, uses `← 返回`** — **not `×`** and
   not "返回首页".
5. A **mobile second-level settings page** uses `← 设置`, returning to the
   settings category list only (never home).
6. If there is **no source context**, show **no** back button — rely on the
   global nav and the breadcrumb.
7. **No screen may contain more than one back button** (no "返回来源" + "返回首页"
   together; no top-and-bottom duplicate back on a detail).
8. **Breadcrumb = "where I am now"; back arrow = "where I came from". Never mix.**
9. The **account menu is triggered by the avatar** (an overlay), not by a
   "··· 更多" entry as the primary visual.
10. **Language switching appears only under 设置 > 语言**, never directly in the
    account menu.

## 2. Per-scene table

| Scene | Container | Show | Never show |
|---|---|---|---|
| Workshop detail | full page | `← 返回创意工坊` | 返回首页 · 多重返回 |
| FanWork detail | full page | `← 返回同人广场` / 返回作者主页 | 返回首页 · 多重返回 |
| User Profile (from menu/card) | full page | `← 返回` (来源/上一层) | 返回首页 |
| Personal Content Hub | full page (nav space) | global nav only | 返回首页 · `←` |
| Workshop / Fan Plaza (nav spaces) | full page (nav space) | global nav only | 返回首页 · `←` |
| Settings center (full page) | full page | `← 返回` | `×` · 返回首页 |
| Mobile second-level settings | full page | `← 设置` | 返回首页 |
| Placeholder / coming-soon | full page | `← 返回` | 返回首页 · 额外 CTA |
| Account menu | overlay (drawer/dropdown) | `×` / click-outside | 返回首页 |
| Modal / drawer | overlay | `×` close | 返回首页 |

## 3. Platform mapping (current implementation)

- **Primary-nav spaces** (home / systemLibrary / personalHub / workshop /
  fanPlaza) render the persistent global nav (desktop top bar, mobile bottom
  bar). They carry **no in-page back/home button** at all.
- **Account-menu full-page screens** (User Profile, Documents) carry a single
  `← 返回` driven by the navigation stack (`goBack`), with a global-nav fallback
  when the stack is empty.
- **Settings (full page)** carries a single top `← 返回` (`goBack`) — categorized
  layout, no `×`, no "返回首页".
- **Placeholder / coming-soon (full page)** carries a single top `← 返回`
  (`goBack`); no "返回首页", no extra CTA.
- **Detail views** (Workshop item / FanWork / BlockDocument reader) carry exactly
  one top `← 返回来源`; no bottom duplicate.
- **Account menu** is an avatar-triggered overlay: `×` + click-outside backdrop.

## 4. Model (origin / stack)

The app has a lightweight UI navigation stack
(`PLATFORM_NAVIGATION_HISTORY_STACK` in `App.tsx`): each entry is a
`NavigationState` snapshot (UI location only — never object/character data).
`goBack` pops it (fallback → parent / home). Future explicit modeling:

```ts
type NavigationOrigin =
  | { kind: 'space'; space: string }            // a primary-nav space
  | { kind: 'detail'; entityId: string }        // an object detail
  | { kind: 'profileSection'; userId; section } // a profile section
  | { kind: 'settings' }                        // settings (back → caller)
  | { kind: 'none' };                           // no source → no back button

type NavigationStackEntry = {
  origin: NavigationOrigin;
  // UI location only; no payload/character data.
};
```

A detail's `← 返回来源` label is derived from `origin` (返回创意工坊 / 返回作者主页 /
…); when `origin.kind === 'none'`, no back button is rendered (rule 6).

## 5. Device differences

- **Mobile**: bottom nav = global (首页/系统库/我的内容/创意工坊/同人广场); avatar
  opens the account-menu overlay (`×`); second-level settings use `← 设置`;
  full-page details/spaces use top `←`.
- **PC / Pad**: top horizontal nav = global; account menu is an avatar dropdown
  overlay (`×`); Settings is a full-page (or future two-pane) center with a top
  `← 返回`; details use top `←`.
- The affordance kind follows **container type**, identical across devices; only
  the layout differs.
