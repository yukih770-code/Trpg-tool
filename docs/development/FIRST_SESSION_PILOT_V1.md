# First-session pilot V1

Status: **prepared; human sessions not run**. Prerequisite: [Action Clarity V1](../implementation/DND_FIRST_SESSION_ACTION_CLARITY_V1.md).

## Participants and setup

One GM and three players; two 60–90-minute sessions. Include at least one person unfamiliar with the interface and, if available, a spectator. The user/group supplies participants and scheduling; automated agents cannot substitute for human observations.

Use the intended private-group deployment or controlled local/LAN setup. Record actual auth/network mode. Do not publish localDev test fixtures. Use project-authored or appropriately available maps and legal level-one characters, including a supported melee weapon and a caster. The acceptance harness's empty Vault payload/authored training attacks are software fixtures, not legal ready-to-play characters.

Before each session:

- Record revision plus uncommitted patch, browser/device, host location and familiarity.
- Check database/schema health, assets, account/member roles and recovery procedure.
- Prepare a small encounter with PCs and a Large NPC. Confirm supported geometry/mode and explain GM-adjudicated mechanics.
- Use a disposable campaign for deliberate interruption tests. Record every operator intervention.

## Session 1: complete the ordinary path

1. GM opens campaign, prepares actors/map and invites players.
2. Players choose/create saved characters, submit, receive approval and become ready. Record waiting separately from active task time.
3. Enter the table. Ask players to identify actor, action and target before their first attack.
4. Exercise supported in-range/out-of-range melee plus an explicitly GM-adjudicated case.
5. Request/respond to a save, spend a spell slot, record/remove a condition and consult history. Do not imply automated spell/condition effects.
6. Reload one player and compare actor, map, HP/resources/conditions and history.
7. End through the existing workflow and ask participants how they would return.

## Session 2: return and recover

Resume the campaign without coaching. Update one character through existing source-review/acceptance. In the disposable campaign, rehearse network interruption and controlled backend restart; compare acknowledged event identities/state. Observe the mobile player's join/sheet/action/history path if that audience matters.

A successful process restart is not a backup restore. Database-plus-assets restoration into a fresh environment is a separate operations exercise. Never interrupt someone else's live campaign for this test.

## Observation worksheet

| Session / participant | Task | Start / finish | Approval wait | Help needed | Failure/confusion | Workaround | Build/device |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pending | | | | | | | |

Proposed targets, not measured baselines: returning player entry within two minutes; prepared encounter setup within ten minutes; first supported action within one minute after combat entry; no lost acknowledged events, duplicate application or unauthorized actions; session2 needs no developer intervention for previously fixed core-path issues.

## Choose the next slice

Count occurrences and minutes lost. Rank data loss/authorization failures first, then session blockers, repeated confusion and frequently needed unsupported actions. Select one bounded improvement with a concrete acceptance scenario.

Footprint-aware dragging and one sourced ranged/thrown workflow are candidates. If source updates, casting/resources or handouts cause more disruption, prioritize that observed workflow instead.

After both sessions, report participants/devices, timings, interventions, reproducible defects, unsupported rules, top three problems and the single next task. Leave unknowns blank. Software tests alone do not pass this gate.
