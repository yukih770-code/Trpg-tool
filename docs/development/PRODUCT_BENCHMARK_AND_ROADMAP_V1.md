# D&D product assessment and development roadmap V1

Date: 2026-09-16 (Asia/Tokyo). Repository: `D:/Download/dnd`. Reviewed HEAD: `1073dbd`, with the completed, uncommitted Actor Size → Token Footprint work present.

Status: **assessment and proposed roadmap only**. This document does not authorize implementation, staging, committing, pushing, deployment, migrations, visibility changes, or expansion of T13/T14.

Progress update, 2026-09-16: the user subsequently authorized committing the former work and following this plan. Size materialization is committed as `75686c9`; [First-Session Action Clarity V1](../implementation/DND_FIRST_SESSION_ACTION_CLARITY_V1.md) is implemented and verified. The [human pilot protocol](FIRST_SESSION_PILOT_V1.md) is prepared; actual sessions are pending. The assessment below remains dated evidence, including its then-current HEAD. Build identity reporting and operational restore remain follow-ups.

## 1. Recommendation

Concentrate the next development cycle on a complete, repeatable D&D session for one GM and three to five players. The project has substantial authoritative gameplay and persistence foundations. Its next product milestone should demonstrate that a group can prepare, join, play, recover, and return without developer intervention.

Proposed positioning: a Chinese-first D&D tabletop with clear character ownership, understandable actions, explicit GM adjudication, and dependable session continuity. This is a product hypothesis based on the current UI and architecture, not validated market demand. Initially assume private groups and desktop/tablet play; validate a narrow mobile player workflow before promising mobile GM parity.

Avoid measuring progress mainly by weapons added, geometry contracts completed, or test counts. Track whether those changes remove obstacles during actual sessions. Keep architecture milestones small and attach each one to a playable scenario.

## 2. Current condition and evidence

### Fresh checks in this assessment

- HEAD remains `1073dbd`; the size-materialization implementation and unrelated pre-existing files remain uncommitted. The staging area is empty.
- `http://localhost:8787/health` reports ready, database access OK, all 11 required schema groups ready, live-room durability ready, and successful startup recovery. It reports six recovered rooms, one admission, 17 RuntimeLog events, and 56 map events.
- TCP connections to ports 3000, 8787, and the configured database port 55453 succeed. The earlier isolated-test database port 55459 is not reachable. This supersedes the old handoff's environment observation that 55453 was unavailable; it does not rewrite the historical test record.
- The running service reports `localDev` authentication. This is local readiness evidence, not proof of a public or private-alpha deployment. Its health response does not identify the source revision or database port, so it cannot establish that the running binary exactly matches the worktree or which database it uses.
- Reviewed the saved size-materialization verification results: 23 commands, all exit code zero. The separate saved typecheck, backend build, and frontend build results pass. These are **previous execution records**, not freshly rerun tests. The recorded frontend output is approximately 3.14 MB uncompressed / 775 KB gzip; it is not a measured load-time result.
- No application code, service configuration, running data, or visibility policy was changed for this assessment. Competitors were researched through official product documentation; no comparative hands-on timing or performance experiment was conducted.

### Capability assessment

| Area | Current supported capability | Practical limit / evidence gap |
| --- | --- | --- |
| Character and campaign workflow | Canonical Creator, saved-character admission, host approval, source review, campaign overrides, shared NPC/custom-Monster editor | The distinct source/accepted/runtime states still require understandable navigation and status; unassisted usability is not established |
| Live multiplayer | GM/player/spectator flows, chat/dice, map assets, tokens, initiative, turns and history | Earlier real PostgreSQL/browser walkthroughs pass; sustained sessions with independent human participants remain unproven by the reviewed evidence |
| Combat | Server-resolved attacks, HP/temp HP, explicit event projection, concurrency-safe intent handling and replay | Canonical automatic weapon coverage is four of 38 definitions; authored actions are a separate supported path |
| Spell/resource/condition play | Existing conditions, resources, spell-slot spending, saving throws and host save requests | State tracking does not imply automatic condition effects, spell effects, rests, death saves, or complete action-economy enforcement |
| Spatial play | Authoritative Scene geometry, Token bounds, narrow melee legality, creation-time typed-size materialization | Tiny/off-grid exact legality, ranged/thrown/reach enforcement and collision/pathfinding are outside current support |
| Size coverage | Six typed categories; seven fixed-size species; canonical NPC/Monster size selection | Variable-size species and legacy catalog text need separate sourced work; no automatic historical resize |
| Durability | Persisted map/log paths and recorded reconnect/restart acceptance | Backup-and-restore into a fresh environment and unattended operational recovery are not established by the reviewed acceptance records |
| Deployment | Healthy local service; documented private-alpha cookie/session gate exists | Local health does not validate that gate in deployment; public registration is not provided by the documented alpha gate |
| Product breadth | D&D is the active public system in the session-ready report; other saved system records are preserved | Marketplace, broad multi-system expansion, plugins and AI expansion should not precede repeatable D&D play |

Conditions/resources already exist in the later Session-Ready implementation. Do not misread the older T12 stop boundary as evidence that they are absent, or use this roadmap to extend them automatically.

Historical report reconciliation matters: the weapon-mode report's missing Scene scale was addressed by later spatial work; the spatial report's missing typed Actor size was addressed by the latest milestone; the Session-Ready report's manual-only PC attack preparation was subsequently improved for the four supported canonical weapons. None of these improvements establishes complete D&D automation.

### Concrete next-step findings

1. `RuntimeDndActionPanel.tsx` retains the preceding `attackResult` when a later request fails, while rendering the new error alongside it. Label previous results clearly and distinguish them from the current request; preserve durable history and retry semantics.
2. The same panel's empty-action message still directs users to add authored attacks. It should explain the existing supported equipment/source-approval route when applicable, with authored actions as the appropriate alternative. Diagnose from existing authoritative information; do not infer server acceptance from browser inventory.
3. The size report explicitly documents off-grid placement after generic dragging, especially for even-sized bounds. Exact legality then becomes unavailable. This deserves a bounded follow-up because ordinary movement can remove the benefit of the new spatial contracts.
4. Existing source-review UI correctly distinguishes accepted snapshots and campaign overrides. Improve access to that UI before introducing any new character editor or automatic source acceptance.

Actor/target confusion, duplicate-looking character choices, mobile panel density, and long source-update journeys are high-value playtest hypotheses. Reproduce and measure them before treating every instance as a confirmed production defect.

## 3. Comparison with established products

Official pages checked on 2026-09-16. These are documented capabilities, not independent quality scores. Pricing, licensing tiers, user-count claims and relative reliability are deliberately not compared.

| Product | Relevant documented capability | Lesson for our next cycle | What this does not justify |
| --- | --- | --- | --- |
| D&D Beyond | Character building, browser/mobile sheets, Maps synchronization, HP/spell/inventory tracking and shared rolls | Make character creation → accepted character → usable action feel continuous; keep the source-review boundary visible but easy to navigate | Copying its content or silently synchronizing campaign authority |
| Foundry VTT's D&D system | Organized sheets, favorites, requested rolls, party tools and vision modes | Put frequent actions, actor/target identity and contextual rule help within reach of the table | Building a module ecosystem, full vision engine or all rules automation next |
| Roll20 | Browser play, invitations, integrated sheets/dice, campaign pages/assets, fog and lighting | Make opening a campaign, inviting the group and resuming play predictable; prepare reusable encounter material | Competing immediately on content catalog, matchmaking or system count |
| Owlbear Rodeo | Browser/mobile battle maps, tokens, drawing/fog, starter scenes and link-based joining | Reduce time to a shared map and first meaningful action; keep GM preparation focused | Removing necessary admission/authorization or adding an extension architecture |

Sources: [D&D Beyond player tools](https://www.dndbeyond.com/en/players), [Foundry official D&D system](https://foundryvtt.com/packages/dnd5e), [Roll20 product overview](https://roll20.net/), [Owlbear getting started](https://docs.owlbear.rodeo/docs/getting-started/).

Our credible opportunity is a coherent Chinese-language D&D workflow over the authority/recovery foundation already built. Evidence does not support claiming better reliability, simpler onboarding, richer automation, or superior mobile support than these products yet. Their feature lists also do not establish demand for every feature in our own audience.

## 4. Ordered development plan

Effort sizes are relative: S = one bounded change, M = several linked changes, L = a milestone requiring multiple slices. They are not delivery-date promises. Keep one implementation slice active at a time.

| Order | Milestone and scope | Dependency | Exit gate | Effort |
| --- | --- | --- | --- | --- |
| 0 | Reproducible checkpoint: review the existing file manifest; record source/build identity, startup procedure and environment assumptions; separate unrelated work | Existing completed milestone | Another clean checkout plus documented configuration can build/start; a health check identifies the tested build; checkpoint commit only when requested | S–M |
| 1 | First-session clarity: actor/action/target summary, unambiguous pending/success/failure feedback, contextual empty-action/source-review guidance; fix reproduced selection problems | 0 | Host and player can identify who acts on whom; a successful attack followed by a rejected one is unmistakable; lost-response retry resolves the same intent; no duplicate editor or authorization change | M |
| 2 | One reproducible session scenario and pilot: one GM, three players, optional spectator; level-one melee and caster roles; prepare → join → play → reconnect → resume | 1 | Complete two 60–90-minute sessions; record interventions and failures; no lost acknowledged events or duplicate application; classify every unsupported action honestly | M, plus participant time |
| 3 | Spatial usability follow-up: footprint-aware snapping for supported square bounds and understandable automation availability | Existing spatial contracts; prioritize using pilot evidence | A placed 2×2 token can be dragged between valid positions without losing alignment; boundaries, zoom and reload preserve authority; incompatible/Tiny/theater-of-mind cases retain existing fallback | M |
| 4 | Targeted play coverage: choose the most frequent blocked action from pilot evidence; first candidate is one sourced thrown/ranged vertical slice, rather than another arbitrary weapon-count target | 2; spatial-dependent modes also need 3 and their approved rules contract | One named mode works from accepted equipped character through server resolution, projected result and restart; required properties, range bands and exceptions are sourced or explicitly block availability | M–L per slice |
| 5 | Repeatable private alpha: durable database + asset storage, restore drill, deployed session/auth gate, startup diagnostics, usable error reporting, player-device verification | 0–2; begin backup work early, deploy only through its own approved task | Fresh-environment restore recovers assets and session state; separate real accounts can join/reconnect; local-dev identity is disabled in alpha; operator can diagnose and recover without source edits | L, split into operational slices |

Order is a default, not a requirement to delay basic backup work or a severe defect until its row. Promote any observed state-loss, unauthorized action, unusable supported action, or session-blocking defect immediately. Do not expand range mechanics merely because the geometry now permits measuring distance.

If the pilot instead shows spell/resource/rest or handout handling as the dominant blocker, replace milestone 4 with that single sourced workflow. Do not run both expansion tracks by default. Invitation, source-update and action-feedback fixes take precedence over speculative breadth.

## 5. First implementation task to request

**D&D First-Session Action Clarity V1**

Start from the current completed checkpoint without reopening the architecture audit. Inspect the action panel and its existing caller to reproduce the success-then-rejection display, actor/target selection, and empty-action guidance. Implement the smallest changes that make those states understandable.

Deliver:

- A visible actor → action → target summary using only already-projected names; selection changes cannot misleadingly describe a pending frozen intent.
- Explicit current-request feedback; prior success remains identifiable as prior history after rejection or actor/target changes.
- An actionable empty state that routes to existing equipment, source review, refresh or authored-action surfaces as supported by current data and role.
- Keyboard-accessible controls and a narrow-screen check for the player action flow.
- Focused behavioral tests for success → rejection, lost response → same-intent retry, changed selection during pending intent, and host/player/spectator permissions; a real host/player browser walkthrough.

Preserve server resolution, immutable pending intent identity, fingerprint mismatch behavior, history fallback, existing visibility, and canonical editing surfaces. No new gameplay rule, weapon cohort, auto-approval, movement rewrite, migration, resolver registry, or T13/T14 expansion belongs in this task. Reproduce self-target selection before deciding whether any warning is warranted; do not introduce a blanket rule that all self-targeting is illegal.

## 6. Pilot protocol and proposed success targets

These are proposed targets; current baselines are **unknown**. Capture timestamps and participant interventions in a simple session worksheet before adding an analytics platform.

| Measure | Proposed target / observation |
| --- | --- |
| Returning player enters with an existing character | Within two minutes, including the recorded host approval wait; record active-user time separately |
| GM prepares the supplied small encounter | Within ten minutes using existing assets and actors; new content authoring excluded |
| Player performs first supported action after entering combat | Within one minute without developer guidance |
| Correct actor/target comprehension | Every participant can identify both before submitting; record any accidental action |
| Browser reload / network reconnect | Same accepted actor, map, HP/resources/conditions and history restored; record recovery duration |
| Backend restart / retry | No lost acknowledged events and no duplicate application; compare recorded event identities and state |
| Operator recovery | Restore database and asset bytes together into an isolated environment; demonstrate playable recovery |
| Completion | Two sessions completed; second session needs no developer intervention for previously fixed core-path problems |

Scenario: GM opens prepared campaign, invites players, approves saved characters, places PCs and a Large NPC, starts combat, runs supported melee, a save request, a spell-slot spend, a condition and manual adjudication, checks history, reloads a player, then resumes the same campaign after a controlled restart. Include supported in-range/out-of-range cases and an explicitly unavailable spatial case. Do not use local-dev identities as evidence of deployed authentication.

Record browser/device, build revision, setup time, failed steps, workarounds and missing rules separately. Test a mobile player's join/sheet/action/history path if that audience matters; do not extrapolate desktop screenshots into mobile acceptance. Measure load and interaction timing on the target device before deciding to change the single-file build or introduce code splitting.

## 7. Rules and principles to preserve

1. **One authority per concern.** CharacterData, CampaignActorInstance and RuntimeActor remain distinct; Actor, Token and Combatant remain distinct. Reuse canonical editors and stores.
2. **Server resolves intent.** Authorization, accepted inputs, RNG and rules stay server-side. Replay consumes recorded facts, never fresh RNG or rules. Preserve idempotency under concurrency and response loss.
3. **Sources precede executable rules.** Use the approved owner-source policy and explicit provenance. Competitor documentation informs product design, never executable D&D data. Display text, inferred names and model memory do not confer rule authority.
4. **Platform geometry stays generic.** D&D interprets scale, occupied spaces and attack rules. Rendered pixels and browser coordinates do not become authoritative distance.
5. **Materialize size once.** Accepted size can initialize a new supported Token; explicit bounds and clears win. No silent backfill, resize or live inheritance.
6. **Keep existing visibility.** Attack events cannot expose more than the authoritative combatant projection; shared text stays conservative. Current publicShared exact HP/temp HP/AC behavior remains. Fog, hidden combat information or spectator changes need a separate product/security contract across projections, assets and logs before implementation.
7. **Show the automation boundary.** Distinguish recorded state, automated resolution and GM adjudication. Unavailable exact spatial legality must retain the existing fallback; avoid implying unsupported actions are fully checked.
8. **Prove a playable outcome.** Focused regressions plus an actual user journey are the completion gate. Document what was simulated, what used a real database, what was tested by humans, and what was not tested.
9. **Preserve worktree ownership.** Use task manifests; never stage unrelated dirt or blanket-add the worktree. Checkpoints and deployments require their own authorization.
10. **Close one slice before starting another.** Maintain a short current-state index that supersedes outdated limitations without rewriting historical evidence. Escalate a newly discovered material architecture contradiction; do not reopen settled decisions merely for convenience.

## 8. Deferred until evidence warrants them

Full dynamic lighting/LOS, fog policy changes, pathfinding/collision, all weapon properties and mastery, full spell/condition automation, broad multi-system support, marketplace/Workshop, Mod scripting, a new resolver registry, equipment redesign, AI expansion, social discovery and public signup are outside this cycle. Preserve existing implementations in those adjacent areas; absence from the roadmap is not authorization to delete them.

Variable-species size choices and typed Monster catalog size are useful bounded follow-ups when the selected pilot characters/monsters require them. Neither should automatically displace a session blocker, nor justify treating legacy text as trusted metadata.

## 9. Repository evidence map

- [Current task boundary](../ai/ACTIVE_TASK.md) and [handoff](../ai/NEXT_CHAT_HANDOFF.md).
- [Size materialization report](../implementation/DND_ACTOR_SIZE_FOOTPRINT_MATERIALIZATION_V1.md), [saved regression results](../implementation/size-materialization-evidence/verification-results.json), [saved builds](../implementation/size-materialization-evidence/build-results.json).
- [Session-Ready report](../implementation/DND_SESSION_READY_V1.md): earlier real host/player/spectator session, assets, conditions/resources/saves and recovery.
- [User journey report](../implementation/USER_JOURNEY_IA_REPORT_V1.md): canonical surfaces and primary-path decisions already made.
- [Weapon profiles](../implementation/DND_WEAPON_GAMEPLAY_PROFILES_V1.md), [mode/range contract](../implementation/DND_WEAPON_MODE_RANGE_CONTRACT_V1.md), [spatial legality](../implementation/DND_SPATIAL_ATTACK_LEGALITY_V1.md): read in chronological order with the newer size report.
- [Private-alpha authentication boundary](../deployment/PRIVATE_ALPHA_AUTH_PLAN.md).
- [Approved D&D rule-source policy](../rule-sources/DND_SOURCES.md).
- [Action feedback implementation](../../src/components/platform/RuntimeDndActionPanel.tsx) and [existing source-review UI](../../src/components/platform/DndLiteActorSheetPanel.tsx).

The next development decision is whether to accept the proposed first-session milestone. This assessment itself makes no implementation or release claim.
