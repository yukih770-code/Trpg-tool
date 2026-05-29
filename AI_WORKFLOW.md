# AI Development Workflow

Rules for AI-assisted development on this project.

---

## Core Principles

### 1. One Small Task Per Round

Each conversation turn addresses exactly one well-defined task.  
Do not chain tasks. Do not continue to the next step automatically.  
If a task is too large, split it and do one part at a time.

### 2. Scan Before Modifying

Before writing any code:
- Read all files that will be modified.
- Read all type definitions and utilities that will be used.
- Confirm the exact lines / functions to change.

### 3. Explicit Allow / Deny Lists

Every task prompt must include:
- **允许修改 (Allowed):** explicit list of files that may be changed.
- **禁止修改 (Forbidden):** explicit list of files that must not be touched.

Default forbidden (unless explicitly allowed):
- `src/lib/cp-types.ts`, `src/lib/cpMigration.ts`
- `src/lib/coc-types.ts`, `src/lib/cocMigration.ts`
- `src/lib/cp2024/cp-utils.ts`, `src/lib/coc-utils.ts`
- All DND files when working on COC or CP
- All COC files when working on DND or CP
- `package.json`, `package-lock.json`
- Route files, style files

### 4. Equivalent Replacements Only

When wiring utilities into pages / stores:
- Replace inline logic with pure-function equivalents only.
- Do not add new gameplay features, UI elements, or state.
- Do not change visual styling.

### 5. Stop and Report After Completion

After completing the task:
1. List every modified file and what changed.
2. Run `npx tsc --noEmit`.
3. If tsc passes, run `npm run build`.
4. Report pass / fail.
5. **Stop.** Do not proceed to the next step.

### 6. Build Checks

```bash
# Always run in project root
cd D:\Download\dnd

npx tsc --noEmit        # Type-check only, no output files
npm run build           # Full Vite production build
```

If the AI sandbox (`mcp__workspace__bash`) is unavailable ("Workspace still starting"), the user runs these locally and reports results. The AI should not block the report on sandbox availability.

### 7. Commit After Green Build

Once both tsc and build pass:
```bash
git add -A
git commit -m "<scope>: <short description>"
```

Suggested commit scope prefixes: `dnd`, `coc`, `cp`, `infra`, `docs`.

---

## Task Prompt Template

```
请执行 [任务名称]。

目标：[一句话说明]

允许修改：
- src/pages/XxxPage.tsx
- src/store/xxxStore.ts

禁止修改：
- 任何其他文件
- DND / COC / CP 相关文件（按需）
- package.json / 路由 / 样式

要求：
1. 只做等价替换，不新增功能。
2. 不改变 UI。
3. [其他具体限制]

完成后运行：
- npx tsc --noEmit
- npm run build

完成后输出：
# [任务名称] Report
## 1. Modified Files
## 2. Changes
## 3. Behavior Preservation
## 4. Test Result
```

---

## Common Pitfalls

| Pitfall | Prevention |
|---------|-----------|
| Accessing a field from the wrong type (e.g. `CpD10RollResult` field on `CpSkillCheckResult`) | Always read the type definitions before writing code |
| Replacing delta-based logic with absolute-value equivalent | Confirm semantics match before replacing |
| Accidentally touching a forbidden file | Re-read the allow/deny list before each edit |
| Continuing to the next task automatically | Wait for explicit user instruction |
| Reporting "done" without listing modified files | Always enumerate every changed file |
