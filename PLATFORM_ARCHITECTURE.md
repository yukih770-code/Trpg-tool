# 中文 TRPG 运行平台 — 长期产品架构与技术路线规划

Last updated: 2026-06-10

## 1. 产品定位

本项目长期定位为：

> 面向中文跑团玩家的低门槛、多规则 TRPG 运行平台。以多规则角色卡、规则自动化和统一日志中心为内核，网页即用、无需自托管，逐步扩展到轻量地图、剧情演绎、GM 工具、多人同步与 AI 辅助备团。

当前项目仍处于“多规则角色与运行时控制台”阶段，不是完整平台阶段。平台化是长期方向，不是当前重构理由。后续所有平台能力都应从已经稳定的 DND / COC / Cyberpunk RED 实现中逐步抽象，而不是为了“做平台”提前推翻现有结构。

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

- `AI_HOST_ARCHITECTURE.md`
- AI Assistant / Co-Host / Host 角色边界
- ProposedCommand 未来管线

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

1. CP Stable Item Instance ID v1
2. CP 日志 envelope 纯化
3. COC Pushed Roll v1
4. COC Growth Check v1
5. DND 施法路径 v1
6. DND Action Registry v1
7. DND 结构化装备 / 背包 v1
8. 共享 RollResult 抽象探测
9. 文档与 readiness 同步
10. visibility filter v1，本地

优先级解释：

- CP equipment v1 已经暴露 same-name item instance 问题，应先补 stable item id。
- COC 已具备 SAN / Luck 基础，可继续 Pushed Roll / Growth。
- DND 的 spellcasting / equipment / Action Registry 是下一轮系统闭环关键。
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
