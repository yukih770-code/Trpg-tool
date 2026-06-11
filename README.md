# TRPG Multi-System Web Toolkit

面向中文跑团玩家的多规则 TRPG 网页工具。当前项目覆盖：

- DND 5e 2024
- Call of Cthulhu 7e
- Cyberpunk RED

最终目标是硬核多规则 TRPG 平台；低门槛、网页即用是 UX 交付原则，不是能力上限。当前阶段先把角色卡、Gameplay 面板、常用检定、资源变化和结构化日志中心打稳。

## What This Project Is

本项目目前处于硬核平台路线的 P1 Rules Runtime Closure 阶段，不是完整 VTT，也不是多人跑团服务器。

核心能力：

- 多规则角色创建、角色卡展示和 Gameplay 面板
- Sheet 与 Gameplay 职责分离
- `RuntimeLogEntry[]` 作为结构化 runtime log
- RollConsole 作为 Latest Result / 历史日志结果中心
- DND / COC / Cyberpunk RED 三系统逐步对齐同一套页面职责边界

长期方向包括轻量地图、多人同步、GM / Keeper 工具、AI 辅助备团与剧情演绎，但这些当前暂不实现。

## Current Status

项目处于 P0 / P1 架构收口与核心规则闭环阶段。

当前概况：

- DND / COC / Cyberpunk RED Gameplay 已组件化
- 三系统都围绕 `RuntimeLogEntry[]` 与 RollConsole 组织结果
- CP RED inventory stable instance id v1 已完成
- COC SAN / Luck / Pushed Roll v1 已完成
- Documentation governance 已建立，当前事实由 owner 文档维护

See `PROJECT_STATUS.md` for current status.

## Documentation Map

当前主要文档入口：

- `PROJECT_STATUS.md` — 当前功能状态与已知边界
- `PLATFORM_ARCHITECTURE.md` — 长期平台架构与路线
- `AI_WORKFLOW.md` — AI 协作、文档治理和 git 安全规则
- `TEST_CHECKLIST.md` — 验收与回归检查清单
- `docs/rules/` — DND / COC / CP RED 规则覆盖矩阵
- `docs/ai/` — AI 导航索引、符号地图、当前任务卡和任务归档
- `docs/archive/` — 历史归档，不是 current source of truth

AI 默认不读取 `docs/archive/`，除非 `docs/ai/ACTIVE_TASK.md` 显式列出。

## Development Workflow

开发采用小步实现和审计制：

- Codex 负责小范围实现与验证
- Sonnet 负责只读审计
- 人类负责最终 commit / push / 架构判断
- 每轮只 stage 本轮允许修改的精确文件
- 禁止使用 `git add .`
- 禁止使用 `git add -A`

详细规则见 `AI_WORKFLOW.md`。

## Commands

```powershell
npm install
npm run build
npx tsc --noEmit
npm run dev
```

开发服务器默认使用 Vite，当前 `npm run dev` 会在 `0.0.0.0:3000` 启动。

## Scope Boundaries

当前不做：

- full map / multiplayer
- AI Host
- GM / Keeper Console
- full automation
- plugin ecosystem
- full damage pipeline
- heavy UI polish

这些方向保留在长期平台路线中，当前开发仍以单系统、小范围、可审计的规则闭环为主。
