# 中文 TRPG 运行平台 — 长期产品架构与技术路线规划

Last updated: 2026-06-11

## Final Target

This project targets a hardcore multi-system TRPG platform, not a lightweight character-sheet tool.

It should eventually support complete multi-ruleset character management, runtime rules, action resolution, actors/targets, conditions, inventory/equipment, scenes/encounters, maps/tokens, GM/Keeper/Host tools, multiplayer synchronization, module/homebrew content, and AI Host / ProposedCommand workflows.

Low barrier to entry is a UX delivery principle, not a feature ceiling.

## Current Strategy

The project uses staged hard-core architecture.

Hard-core capabilities must be built in dependency order:

```text
rules runtime -> actor/action/resource/equipment layers -> scene/encounter -> map/multiplayer -> AI Host/module ecosystem
```

Current phase: P1 Rules Runtime Closure inside a staged hard-core platform roadmap.

Do not implement hard-core outer layers before their dependencies are ready. Do not use future platform needs as an excuse for uncontrolled rewrites.

## Dependency Order

```text
RuntimeLogEntry / RollConsole / schema discipline
-> system-local rules runtime
-> runtime resources / action registry / inventory-equipment
-> condition-effect / actor-target
-> opposed roll / damage pipeline / NPC-lite
-> scene / encounter
-> map / token
-> campaign log persistence
-> multiplayer / permissions
-> GM/Keeper/Host console
-> module / plugin / AI Host
```

Dependency constraints:

- Map / token depends on Actor + Scene.
- Multiplayer depends on structured runtime state + permissions.
- AI Host depends on Action Registry + ProposedCommand + permission model.
- DND Wild Shape / Active Form depends on Actor + Condition + overlay.
- Module import depends on stable data schema.

## Platform Layer Classification

### Can Stay System-Local First

- DND spell runtime
- CP damage pipeline
- COC sanity / madness details
- CP netrunning
- DND Active Form implementation

### Must Be Cross-System From The Start

- RuntimeLogEntry / RollConsole
- Actor / Target
- Condition / Status Effect
- Thin Runtime Resource interface
- Visibility / future permission semantics

### Interface / Concept Only For Now

- Actor schema with `baseStats + activeOverlay?`
- Campaign Log persistence
- ProposedCommand
- Module / ruleset extension
- Permission model

These are architecture directions, not current implementation tasks.

## Open-Source Community Content Ecosystem

The platform is intended to support an open-source community content ecosystem as a long-term hard-core platform goal.

Users should eventually be able to create, share, import, remix, and maintain original modules, scenarios, NPCs, bosses, minions, monsters, weapons, items, classes, subclasses, occupations, roles, scenes, maps, handouts, clues, and homebrew rules through validated content packages.

This ecosystem must be built on stable schemas, versioning, license metadata, author/source metadata, safe import boundaries, and a clear separation between public redistributable content and private user-imported content.

Community content support is not a P1 implementation target. It depends on stable Actor / Item / Action / Effect / Scene schemas, content package validation, import safety, and copyright-aware public/private boundaries.

## P0-P5 Hard-Core Roadmap

| Phase | Goal | Deliverables | Dependencies | Exit Criteria |
|---|---|---|---|---|
| P0 Engineering governance / documentation / foundation | Stabilize collaboration, owner docs, test discipline, and cross-system boundaries. | Documentation governance, rule coverage docs, task context, RollConsole baseline. | Existing app foundation. | AI/coding tasks can navigate current truth without stale root docs. |
| P1 Rules Runtime Closure | Finish system-local player runtime loops for DND / COC / CP RED. | Checks, resources, common rule workflows, local RuntimeLogEntry results. | P0 governance and per-system stores. | Core player-facing runtime flows work without Sheet roll regressions. |
| P2 Cross-System Gameplay Middle Layer | Extract proven shared concepts without rewriting systems. | Thin Resource / RollResult / Item probes, Actor/Target interface design; Actor / Item / Condition / Action schema prepares future content packages. | P1 rules runtime in at least two systems. | Shared interfaces are justified by working system-local implementations. |
| P3 Scene / Encounter / Map | Add scene and encounter substrate before map complexity. | Scene model, NPC-lite, encounter notes, Compendium / Scene / Encounter / Module Package Schema v0, map/token v1. | Actor/Target and condition/effect direction. | Map/token and module packages can reference stable actors, items, scenes, and encounter state. |
| P4 Multiplayer / Shared State / Permissions | Add synchronized state, visibility semantics, and content boundaries. | Permission model, shared runtime state, campaign log persistence, Private Library, public/private content boundary, Host content management. | Structured runtime state, visibility, Host Console boundary, content package schema. | Public/gmOnly/playerOnly/revealed data and public/private content can be protected. |
| P5 AI Host / Module / Plugin Ecosystem | Add extensibility, open-source community content ecosystem, and AI-assisted/AI-hosted workflows. | ProposedCommand runtime, module registry, homebrew editor, plugin/extension layer, AI-assisted content creation, AI Host tools. | Permissions, Action Registry, stable schema, campaign logs, validated content packages. | High-risk AI/module actions are validated and reviewable; public content is original or redistributable. |

## 1. 产品定位

本项目长期定位为：

> 面向中文跑团玩家的硬核多规则 TRPG 运行平台。以多规则角色卡、规则自动化和统一日志中心为内核，网页即用、无需自托管，分阶段扩展到 Actor/Target、条件/效果、场景/遭遇、地图、多人同步、GM/Keeper/Host 工具、模组生态与 AI Host。

当前项目是硬核平台路线的 P1 Rules Runtime Closure 阶段。它还没有完成外层地图、多人、Host Console 或 AI Host，但这些是最终平台能力，而不是可有可无的玩具功能。低门槛是 UX 交付原则，不是能力上限。

平台化仍不是无序重构的理由。后续所有平台能力都应从已经稳定的 DND / COC / Cyberpunk RED 实现中逐步抽象，而不是为了“做平台”提前推翻现有结构。

当前已具备的平台种子能力：

- DND / COC / Cyberpunk RED 三系统 Gameplay 已组件化。
- 三系统都围绕本地 `RuntimeLogEntry[]` 与 RollConsole 展示结果。
- Sheet 与 Gameplay 职责已经分离。
- `RuntimeLogEntry` 是当前第一个成功的跨系统共享抽象。
- Player Gameplay 不承载 Host Tools；Host / Keeper / GM Console 未来单独规划。

## 2. 核心架构原则

### 2.1 不为平台化而大重构

不要为了“未来平台”直接重写当前 DND / COC / CP RED 页面、store 或 schema。任何共享层都必须来自已经被多个系统证明过的相似形状。

### 2.2 n ≥ 2 后再抽象

后续抽象遵循：

```text
一个系统先跑通 → 第二个系统验证形状 → 第三个系统确认边界 → 再提取共享层
```

当前已经满足该条件的共享抽象只有：

- `RuntimeLogEntry`
- RollConsole / Latest Result / History Log 的基本展示模式
- Creator / Sheet / Player Gameplay / RollConsole 的职责边界

尚未满足统一抽象条件的内容包括：

- d20 / d100 / exploding d10 检定数学
- DND class resources / COC SAN-Luck / CP RED Humanity-SP
- DND Action Registry / COC skill workflow / CP RED role and combat workflows
- Actor / Token / Scene / Map

### 2.3 当前停止线

当前不做：

- 系统性 UI polish
- 地图
- 多人同步
- AI Host
- 插件生态
- Host / Keeper / GM Console
- 大规模 Actor / Token / Scene 抽象
- 全系统规则模型统一

这些能力必须等 P0/P1 的三系统规则闭环更稳定后再进入路线。

## 3. 分层架构

### 3.1 Rule Core / 规则核心

负责：

- 系统规则计算
- 检定数学
- 资源恢复
- 成功等级 / DC / DV 判断
- 系统特有纯函数

当前已有：

- DND progression / resource utils / Action Registry v0
- COC d100 success level、SAN loss、HP delta 等纯函数
- CP RED exploding d10、DV check、HP / Humanity runtime utils

未来演进：

- 继续保持系统内规则函数独立。
- 不强行统一 d20 / d100 / exploding d10。
- 只抽象共同 envelope，不抽象具体数学。

当前是否要做：否。只在单系统任务中补足缺口。

### 3.2 Character & Inventory / 角色与物品

负责：

- 角色静态数据
- 创建期分配
- 角色卡展示
- 库存 / 装备 / 资产
- migration 与 schemaVersion

当前已有：

- 三系统 Creator / Sheet
- COC Creator 技能点约束
- COC / CP Sheet responsibility cleanup
- CP RED Equipment / Market Inventory Flow v1

未来演进：

- CP RED 需要 stable item instance id。
- DND 需要结构化装备 / 背包。
- COC 资产 / 装备可继续轻量维护。

当前是否要做：只做单系统补强，不做跨系统统一 Item 大模型。

### 3.3 Runtime Operation / 运行时操作

负责：

- Gameplay 中的 HP / SAN / Luck / Humanity / class resources 等当前值变化
- 检定按钮
- 动作使用
- 资源消耗
- runtime flags

当前已有：

- DND Gameplay resources / checks / actions / rests
- COC Gameplay runtime state、skill checks、SAN Check、Luck Spending
- CP RED Gameplay runtime state、checks、role ability、damage / death save / injuries

未来演进：

- 各系统继续补 P1 规则闭环。
- Runtime operation 只通过明确 store action 或本地 state helper 改变状态。

当前是否要做：是，但每轮只做一个系统、一个窄功能。

### 3.4 RollConsole / Log Center / 日志中心

负责：

- Latest Result 大号结果
- 计算过程
- outcome / tags
- 历史日志
- 玩家可见结果中心

当前已有：

- 三系统本地 `RuntimeLogEntry[]`
- 三系统 RollConsole / Latest Result
- visibility 字段预留，但不做过滤

未来演进：

- `RuntimeLogEntry` 可成为持久化 / 同步 / Host Console 的基础 envelope。
- 可探测 `RollResult` 抽象，但不能过早替代现有日志。

当前是否要做：维护现有模式，不做持久化日志系统。

### 3.5 Action Registry / 行动注册表

负责：

- 可执行动作定义
- cost preview
- resource cost
- action type
- 未来与 Effect / Target / Actor 连接

当前已有：

- DND Action Registry v0 / v0.1
- 只支持 `classResource` / `pactMagic`
- 不支持完整 action economy / target / damage / spellSlot costs

未来演进：

- DND Action Registry v1 前需要先固定 spellcasting / equipment / damage 边界。
- COC / CP RED 不应直接套用 DND registry。

当前是否要做：暂缓扩张。

### 3.6 Scene / Map / Token

负责：

- 场景
- 简易地图
- token
- 距离 / 区域 / 位置提示

当前已有：

- 无正式实现。

未来演进：

- P3 做轻地图 v1。
- 只做轻量位置表达，不做 VTT 级复杂地图。

当前是否要做：否。

### 3.7 GM / Keeper Console

负责：

- Host-only state
- gmOnly 日志
- reveal 控制
- NPC / enemy
- random tables
- scene / clue management

当前已有：

- 文档边界。
- Player Gameplay 不显示 Host Tools。
- visibility 原则已记录。

未来演进：

- 先做本地 Host Console，后做多人。
- gmOnly / revealed / playerOnly 需要结合权限和同步。

当前是否要做：否。

### 3.8 AI Assistant Layer

负责：

- 规则解释
- 日志总结
- NPC / 场景 / 线索草稿
- Co-Host 建议
- 未来 AI Host 模式

当前已有：

- Current source of truth: this section.
- AI Assistant / Co-Host / Host 角色边界
- ProposedCommand 未来管线
- Historical reference: `docs/archive/2026-06-11-AI-HOST-ARCHITECTURE.md`; archive files are not current source of truth.

未来演进：

- AI-1 只读 Assistant
- AI-2 Draft Generator
- AI-3 Co-Host Suggestions
- AI Host 必须走 ProposedCommand / validation / confirmation

当前是否要做：否。

### 3.9 Module / Rule Pack Layer

负责：

- 规则扩展
- homebrew
- 内容包
- 模组 / 剧本导入

当前已有：

- DND mod-utils / 基础规则数据
- 文档层面的扩展规划需求

未来演进：

- 先写 Ruleset Extension Architecture。
- 不在当前阶段实现插件生态。

当前是否要做：否。

### 3.10 Multiplayer / Sync Layer

负责：

- 多人会话
- 权限
- playerOnly / gmOnly 可见性过滤
- server-authoritative state
- 冲突处理

当前已有：

- 无。
- visibility 字段只是 envelope 预留。

未来演进：

- 必须在 Host Console、RuntimeLogEntry 持久化、权限模型成熟后再做。

当前是否要做：否。

### 3.11 Asset / Content Library

负责：

- 中文素材
- 模组片段
- NPC 草稿
- 道具 / 地点 / 线索库
- 可复用内容包

当前已有：

- 无正式素材库。

未来演进：

- 先服务中文跑团场景和轻量模组导入。
- 注意版权和授权。

当前是否要做：否。

## 4. P0–P6 阶段路线图

### P0：三系统架构收口

目标：

- 三系统 Gameplay 组件化。
- 三系统 RollConsole / RuntimeLogEntry 对齐。
- Sheet / Gameplay 职责清楚。
- 规则覆盖文档与测试清单同步。

完成标准：

- DND / COC / CP RED Player Gameplay 都有清晰 panel 结构。
- Sheet 不承担 gameplay roll。
- 结果统一进入 RollConsole。
- Readiness docs 不再和实现冲突。

不要做：

- 地图
- 多人同步
- AI Host
- 大规模 UI polish
- 插件系统

### P1：三系统规则闭环

目标：

- 补齐每个系统最常用的玩家运行时流程。
- DND：施法路径、Action Registry v1、结构化装备。
- COC：Pushed Roll、Growth Check、SAN / Luck 流程继续收口。
- CP RED：stable item instance id、日志 envelope 纯化、装备流转补强。

完成标准：

- 玩家可在 Gameplay 完成核心检定 / 资源 / 常用动作。
- 关键结果都进入 RuntimeLogEntry。
- 未实现内容在 coverage docs 中明确 deferred。

不要做：

- 完整战斗自动化
- 完整 Keeper / GM Console
- 多人权限
- 全系统统一 Actor

### P2：统一数据模型，增量，不大重构

目标：

- 从已有三系统实现中逐步提取共享模型。
- 先 RollResult，再 Resource，再 Item。

完成标准：

- 每个抽象都至少有 n ≥ 2 系统证明形状一致。
- 每个模型都有 migration 方案。
- 不破坏现有角色存档。

不要做：

- 一次性统一所有模型。
- P2 前大规模抽象 Actor / Token / Scene。
- 重写所有 store。

### P3：轻地图 v1

目标：

- 提供轻量位置 / 区域 / token 标记。
- 服务文字和语音跑团，不追求完整 VTT。

完成标准：

- 可创建 scene。
- 可放置 token。
- 可附带简短状态 / 距离提示。
- 不影响现有 Gameplay。

不要做：

- 复杂光照
- 复杂碰撞
- 完整地图编辑器
- 自动战斗网格规则

### P4：Scene Mode / 剧情演绎

目标：

- 支持场景文本、NPC 台词、线索、分支结果。
- 将 RollConsole 与叙事日志连接起来。

完成标准：

- 可保存场景片段。
- 可关联公开叙述与 Host-only notes。
- 可把检定结果用于剧情分支提示。

不要做：

- AI 自动全权推进剧情
- 多人同步
- 完整模组出版系统

### P5：多人同步

目标：

- 支持玩家与主持人的多人状态同步。
- 支持 public / gmOnly / playerOnly / revealed 过滤。

完成标准：

- server-authoritative state。
- 基础权限模型。
- RuntimeLogEntry 可同步且可过滤。
- Host Console 可控制 reveal。

不要做：

- 在无权限模型时同步 gmOnly。
- 客户端任意改状态。
- 跳过 ProposedCommand / validation 的高风险操作。

### P6：生态 / 插件 / AI Host / 素材库

目标：

- 开放内容包、规则包、AI Host、素材库等平台能力。

完成标准：

- 插件 / 内容包有安全边界。
- AI Host 走 ProposedCommand。
- 人类可审核高风险操作。
- 中文素材和模组导入具备基本授权策略。

不要做：

- 未审计插件执行
- AI 全自动高风险状态修改
- 未授权规则 / 文本搬运
- 自动 push / merge

## 5. 当前项目下一步优先级

以下是路线，不在本轮执行：

1. DND 施法路径 v1
2. DND Action Registry v1
3. DND 结构化装备 / 背包 v1
4. DND Active Form / Wild Shape architecture spike
5. CP RED armor / ammo / damage pipeline planning
6. CP RED Netrunning architecture doc / audit
7. COC bonus / penalty dice v1
8. COC opposed roll / Keeper clue flow planning
9. 共享 RollResult 抽象探测
10. visibility filter v1，本地

优先级解释：

- CP RED stable item instance id、CP RED log envelope consolidation、COC Pushed Roll、COC Growth Check 已完成，不再作为 next task。
- DND 的 spellcasting / equipment / Action Registry 是下一轮系统闭环关键。
- CP RED damage / armor / ammo 与 Netrunning 都是硬核目标，但需要先规划依赖层。
- COC 的下一步应补 bonus/penalty dice、opposed roll 和 Keeper clue flow，而不是重复已完成的 Pushed/Growth。
- visibility filter 必须先做本地、非权限版本，不能直接跳到多人。

## 6. 核心数据模型演进顺序

推荐演进顺序：

```text
RuntimeLogEntry → RollResult → Resource → Item → Action → Effect → Actor
```

说明：

- `RuntimeLogEntry` 已经跨三系统验证。
- `RollResult` 可以从 DND d20、COC d100、CP exploding d10 的显示和 payload 中探测共同结构。
- `Resource` 应在 DND class resources、COC SAN/Luck、CP Humanity/HP 之间谨慎比较。
- `Item` 需要 DND equipment 与 CP inventory 至少两套系统证明。
- `Action` 不能只由 DND Action Registry 决定，需要 COC / CP 的玩家动作经验。
- `Effect` 涉及条件、伤害、恢复、状态改变，必须更晚。
- `Actor` 牵涉 PC / NPC / enemy / token / scene，不应在 P2 前大规模抽象。

硬性约束：

- 不要一次性统一所有模型。
- 每一步都要有 migration 方案。
- P2 前不要大规模抽象 Actor / Token / Scene。
- 共享类型一旦进入 store / schema，必须单独成轮、单独审计。

## 7. AI 协作开发流程

建议角色分工：

- ChatGPT / Opus：规划、架构、任务拆分、路线判断。
- Gemini：资料提取、竞品研究、规则查证、长上下文比对。
- Codex：小范围实现、文件编辑、验证命令、报告输出。
- Sonnet：只读审计、回归风险检查、scope check。
- 本地 agent：跑命令、整理报告、辅助流程，不掌握最终决策权。
- n8n：未来可做通知、触发、归档，但不掌握安全策略。

人类必须审核：

- commit
- push
- merge
- schema / migration
- 架构变更
- 权限模型
- AI Host 操作
- 高风险 ProposedCommand

明确禁止：

- 自动 `git add .`
- 自动 `git add -A`
- 自动 commit
- 自动 push
- 自动 merge
- AI 未审计直接改架构
- AI Host 全自动执行高风险操作

未来 AI / API 命令必须遵循：

```text
AI / API Output
→ ProposedCommand
→ Validation
→ User or Host Confirmation
→ Store Action / Runtime Action
→ RuntimeLogEntry
```

## 8. 风险控制

### 8.1 过早 UI polish

风险：

- 组件边界未固定时做视觉精修，会在组件化或职责清理后返工。

控制：

- 先做架构收口，再做视觉统一。

### 8.2 过早地图

风险：

- 地图会引入 Actor / Token / Scene / Sync 的连锁模型。

控制：

- P3 前只记录需求，不实现。

### 8.3 过早多人同步

风险：

- public / gmOnly / playerOnly / revealed 过滤不成熟会泄露隐藏信息。

控制：

- 先做本地 visibility filter，再做 Host Console，再做同步。

### 8.4 过早插件系统

风险：

- 插件安全、规则授权、数据污染和执行边界都很复杂。

控制：

- P6 前不实现插件生态。

### 8.5 规则自动化过度

风险：

- 自动化越过 DM/KP/GM 裁定，导致规则错误或体验僵硬。

控制：

- 先做辅助，保留人工裁定。

### 8.6 版权 / 授权问题

风险：

- 规则全文、模组文本、商业素材可能不能直接内置或分发。

控制：

- 使用摘要、引用边界、用户自导入、内容包授权记录。

### 8.7 AI 生成代码污染架构

风险：

- AI 为了完成单轮任务引入跨系统抽象或隐藏状态。

控制：

- 每轮明确允许 / 禁止范围。
- Sonnet 只读审计。
- 人类审核架构变更。

### 8.8 数据模型过早统一导致大重构

风险：

- Actor / Item / Action 过早统一会反向压迫三系统规则。

控制：

- 按 `RuntimeLogEntry → RollResult → Resource → Item → Action → Effect → Actor` 顺序推进。

### 8.9 文档和实现不同步

风险：

- 后续 AI 会按旧文档执行错误任务。

控制：

- 每个功能阶段同步 coverage / status / checklist。

### 8.10 git 操作失控

风险：

- 全量 stage 会把无关 dirty files 带进 commit。

控制：

- 永远精确 add 本轮允许文件。
- 禁止 `git add .` / `git add -A`。

## 9. 中文互联网差异化策略

本项目面向中文互联网跑团习惯，而不是复制重型 VTT。

差异化方向：

- 低门槛：打开网页即可使用，不要求部署服务器。
- 中文友好：中文标签、中文规则提示、中文模组材料导入。
- 一键开团：角色、运行时面板、RollConsole 快速进入游戏。
- 无需自托管：优先浏览器端 / 轻服务端体验。
- 适配 QQ / 微信 / 语音 / 文字混合跑团：支持复制结果、简洁日志、轻量叙事。
- 规则自动化适中：自动算清楚常用数值，但保留主持人裁定。
- 轻量地图：满足位置表达，不追求复杂 VTT。
- 剧情演绎：支持场景、线索、NPC、公开叙述和隐藏备注。
- AI 辅助备团：生成草稿、总结日志、建议分支，不默认接管主持权。
- 中文素材 / 模组导入：未来支持用户自带内容和授权内容包。

不做的方向：

- 不以重型地图编辑器为核心。
- 不把所有规则都自动化到不可裁定。
- 不把 AI Host 作为默认体验。
- 不优先做插件市场。

## 10. 当前停止线

当前阶段必须停止在以下边界内：

- 继续维护三系统 Player Gameplay 的稳定性。
- 继续补单系统 P1 规则闭环。
- 继续保持 Sheet / Gameplay / RollConsole 职责边界。
- 继续同步 PROJECT_STATUS / TEST_CHECKLIST / coverage docs。

当前不要开始：

- 地图
- 多人同步
- AI Host
- Host / Keeper / GM Console
- 插件生态
- 统一 Actor / Token / Scene
- 大规模 UI polish
- 全系统数据模型重构

平台化应当从已经证明可靠的局部抽象自然生长，而不是通过一次性重构获得。

## 11. 页面职责与结果中心

长期页面职责边界：

- Creator 负责创建期选择、初始属性、初始资源、创建期技能/装备分配。
- Sheet 负责角色信息展示和幕间维护，不负责检定、投骰、运行时 HP/SAN/弹药/资源变化。
- Player Gameplay 负责运行时操作、检定、投骰、动作、资源变化和玩家可见结果。
- RollConsole 是唯一结果中心，负责 Latest Result、计算过程、outcome/tags 和历史日志。
- Host / Keeper / GM Console 是未来独立表面，不塞进 Player Gameplay。

三系统应保持一致：

- Gameplay roll 不回流到 Sheet。
- 不保留多个结果区。
- 没有 DC / DV / target 时，不伪造成功/失败；显示等待 DM/KP/GM 判定。
- Free roll 和隐藏结果未来属于 Host Console 或高级工具；当前 Player Gameplay 中遗留的 free dice tray 只作为隔离 utility panel，后续再收口。

## 12. RuntimeLogEntry / RollConsole 架构

`RuntimeLogEntry` 是当前第一个已经被 DND / COC / Cyberpunk RED 三系统验证的共享抽象。

当前原则：

- 三系统 Player Gameplay 使用本地 `RuntimeLogEntry[]` 作为结果历史。
- RollConsole 从最新 entry 派生 Latest Result。
- RuntimeLogEntry / RollConsole 是玩家结果中心，不写入 Sheet。
- 默认 visibility 为 `public`。
- `gmOnly` / `playerOnly` / `revealed` 是长期 visibility 模型，但当前不实现权限、多人生效过滤或 reveal workflow。
- Host / GM / Keeper Console、持久化 session log、server-authoritative sync 均 deferred。

长期 visibility 边界：

- 隐藏骰不是独立骰子类型，而是结果可见性。
- Player RollConsole 不显示 `gmOnly`。
- Future Host Console 可以显示 `public`、`gmOnly`、`playerOnly`、`revealed`。
- 公开模式可以是 full result、outcome only、narration only 或 hidden。

## 13. Gameplay UI Contract

Gameplay 页面是运行控制台，不是普通长网页。

RollConsole / result UI 原则：

- Latest Result 应比历史日志更醒目。
- Latest Result 显示大号结果值、类型、计算过程、outcome 和特殊标签。
- History Log 内部滚动，不撑高整个页面。
- 小字必须可读，禁止浅色背景上的低对比灰字。
- 核心操作和结果区不能被固定高度或 overflow 裁切。
- Player Gameplay 不显示完整 Host Tools。

这些规则是长期原则；具体样式仍由各系统现有主题承载，不在当前阶段做系统性 UI polish。

## 14. AI / Host Boundary

AI 能力长期分层：

- AI Assistant：解释规则、总结日志、生成草稿，不做最终裁定。
- AI Co-Host：建议 DC/DV、剧情分支、NPC 行动、reveal 方式，由人类确认。
- AI Host：未来无人类主持时可推进场景和隐藏信息，但状态变化仍必须走命令提案与验证。

AI / API 状态变化必须遵循：

```text
AI / API Output
→ ProposedCommand
→ Validation
→ User or Host Confirmation
→ Store Action / Runtime Action
→ RuntimeLogEntry
```

默认不实现 AI API、Host Console、ProposedCommand runtime、权限系统、AI memory 或多人同步。高风险结果，例如死亡、疯狂、重伤、永久属性变化、角色删除和重大 reveal，必须保留人工确认边界。

## 15. 内容与商业边界 / Content and Business Boundary

这是一条长期、稳定的架构与商业决策，约束本项目如何对待版权内容、社区生态与商业化。它既保护项目，也不妨碍未来盈利。

### 15.0 一句话边界

> 我们卖平台能力，不卖未经授权的版权内容。
> 我们支持用户私有导入，不把用户私有内容变成公共分发。
> 我们建设开源社区原创生态，不建设盗版资源站。
>
> We sell platform capability, not unauthorized copyrighted content.
> We support private user import, not public redistribution of private content.
> We build an open-source original-content ecosystem, not a piracy repository.

### 15.1 三层内容边界

平台内容长期划分为三层，互不混淆：

**A. Official Core / 官方核心（本仓库）**
- 只包含：平台代码、数据 schema、导入器、校验器、编辑器、原创示例内容、开放授权内容、文档。
- 禁止包含：官方规则书全文、商业模组、未授权的怪物/法术/职业全文、盗版翻译、官方图片/地图。

**B. Public Community Content / 公共社区内容（未来）**
- 只接受：原创内容（模组/NPC/Boss/小怪/武器/物品/职业/地图/线索）或明确可再分发的开放授权内容。
- 每个公共内容包必须带元数据：author、source、license、redistributable、containsOfficialText。
- 必须具备：举报入口、下架机制、版本记录、作者声明、许可证记录、重复侵权账号处理。

**C. Private User Import / 用户私有导入**
- 允许用户本地导入自有资料，用于本地、私有团或私有服务器；可保存私有内容库、自用数据转换。
- 私有内容默认不公开、不进公共搜索、不进社区仓库、不作官方推荐、不作订阅卖点。
- 这是“用户自主选择权”的安全实现：平台不公开托管、不公开推荐、不公开分发未经授权内容。

### 15.2 法律风险分层

- 低风险（建议做）：开源代码/schema/编辑器；内置原创示例；用户本地私有导入。
- 低-中风险（可做，需记录）：内置开放授权内容（记 license）；用户私有云端存储（默认 private）。
- 中风险（可做，需机制）：公共社区原创内容库，必须有审核/举报/下架（参考 GitHub DMCA 托管平台处理模式）。
- 高风险（禁止）：官方仓库或公共库托管官方规则书全文/怪物库/法术全文/商业模组/官方地图美术/未授权翻译搬运/爬取资源站数据。
- 很高风险（绝对禁止）：订阅解锁未经授权官方内容。多家厂商 fan/homebrew 政策明确要求同人内容免费、不得置于付费墙或订阅墙后（Wizards Fan Content Policy、R. Talsorian Homebrew Content Policy、Chaosium fan material 条款）。

### 15.3 商业化对象

可商业化（卖平台服务/算力/存储/协作）：云同步、多人房间、私有 campaign 空间、AI Host / Co-Host 额度、自动备份、高级模组编辑器、地图容量、私有内容库容量、团队协作权限、版本管理、内容校验器、高级导入器、私有服务器托管、跨设备同步。

不可商业化（卖版权内容本体）：官方规则书内容、商业模组、官方怪物库、官方法术全文、官方地图素材、未授权翻译包、爬取资料库。

> 收费对象是平台服务、算力、存储、协作、编辑器、AI、同步和私有空间，不是版权内容本体。

### 15.4 schema 预留（stable architecture decision）

为支撑导入/校验/搜索/版本/署名/许可证过滤/公私隔离/下架，内容包 schema 应从一开始预留以下字段（属第 6 节数据模型演进中的稳定决策，先定形状，按依赖顺序实现）：

`id, name, version, author, license, source, system, rulesetVersion, contentType, dependencies, redistributable, containsOfficialText, visibility(private|public), createdBy, importedFrom`

未来 module package 示例：

```json
{
  "id": "community.dark-harbor",
  "name": "Dark Harbor",
  "version": "1.0.0",
  "author": "username",
  "system": ["coc7e"],
  "license": "CC-BY-SA-4.0",
  "source": "original",
  "redistributable": true,
  "containsOfficialText": false,
  "contentType": ["scenario", "npc", "handout", "map"],
  "dependencies": []
}
```

### 15.5 正式原则条文 / Formal Principle

Content and Business Boundary

The project monetizes platform services, not copyrighted official content.
The official repository may contain code, schemas, editors, importers, validators, original sample content, and open-license content.
The public community ecosystem may accept original or explicitly redistributable content only. Public content packages must include author, source, license, redistribution, and official-text metadata.
The platform may support private user import of user-provided content for local, private campaign, or private server use. Private user content is not part of the official repository or public community ecosystem.
The official project must not host, redistribute, scrape, recommend, or monetize unauthorized official books, commercial modules, monster databases, spell text, maps, artwork, translations, or derivative dumps.
Paid plans, if any, should monetize hosting, sync, storage, AI usage, collaboration, private libraries, editors, backup, versioning, and multiplayer services, not access to unauthorized copyrighted content.

内容与商业边界

本项目商业化的是平台服务，而不是受版权保护的官方内容。
官方仓库可以包含代码、schema、编辑器、导入器、校验器、原创示例内容和开放授权内容。
公共社区生态只接受原创内容或明确可再分发内容。公共内容包必须包含作者、来源、许可证、再分发权限和是否包含官方文本的元数据。
平台可以支持用户私有导入用户自行提供的内容，用于本地、私有团或私有服务器。用户私有内容不属于官方仓库或公共社区生态。
官方项目不得托管、再分发、爬取、推荐或商业化未经授权的官方规则书、商业模组、怪物库、法术全文、地图、美术、翻译搬运或衍生整理。
如果未来有付费计划，付费内容应是托管、同步、存储、AI 用量、协作、私有内容库、编辑器、备份、版本管理和多人服务，而不是未经授权版权内容的访问权。

### 15.6 最终定位

> 开源硬核多规则 TRPG 平台，公开生态只收原创和开放授权内容，用户私有内容自行导入，商业化只卖平台服务。
>
> Open-source hard-core multi-system TRPG platform; the public ecosystem accepts only original and open-license content; users import private content themselves; monetization sells platform services only.

商业路线 = 免费开源核心 + 原创/开放授权社区内容 + 用户私有导入能力 + 付费平台服务。
不走 = 盗版官方内容库 + 订阅解锁官方资料 + 公共分发商业模组。
