# TRPG 多人平台

这是一个面向中文 TRPG 玩家与创作者的多系统平台。产品主线是：

```text
服务器 → 战役 → 房间 / 大厅 → Runtime 跑团桌面
```

当前处于“单节点私有 Alpha”阶段，不再只是本地角色卡工具，也还不是可公开运营的成熟生态。

## 已经真实存在

- DND 5e 2024、COC 7e、Cyberpunk RED 的角色与规则工作区；DND 车卡和等级成长最完整。
- World Server、Campaign、Room、Lobby、角色提交/审批、Ready 与角色 Token 准入。
- 主持人、玩家、旁观者的 Runtime 投影；地图、Token、测距/范围、公开信息、投骰、先攻与回合。
- PostgreSQL、迁移、HTTP/WebSocket 服务、房间恢复与单节点持久化确认。
- 私有 Alpha 登录门、Render + PostgreSQL 部署准备、本地与 LAN 启动链路。
- 私人资料的基础编辑、导入、版本引用与房间独立审核边界。
- 内生 AI v1：后端模型网关、Ollama 本地 provider、真实可用性检查；DND Builder 提供结构化建议、确定性预览、确认写入与安全撤销；活跃主持人可在 Runtime 用投影日志生成 Session 草稿并明确选择私密/公开追加。

## 尚未完成

- DND Beyond 级别的完整车卡与升级体验；COC / CP RED 的完整纵向闭环。
- 正式账号安全、对象存储、公开发布审核、订阅/安装/更新与作者生态。
- 战役资料检索、带来源规则定位、Session GeneratedArtifact 成果库、云端模型 provider、用量计费，以及跨任务编排与预算治理。
- 多实例房间 authority、跨进程实时分发和面向公网的大规模运行。

Workshop 与同人区只展示真实数据。没有真实公开作品或订阅时会显示空态，不使用虚构社区内容填充页面。

## 内生 AI 定位

本地 AI 不是向用户出售的独立服务，而是深入平台内部的“智能执行层”：辅助车卡、备团、运行时主持、资料创作和其他项目工作。本地模型与未来付费云端 API 通过同一模型网关提供计算，但 AI 只能产生建议、草稿或待确认意图；确定性规则、权限、校验和持久化仍由平台服务负责。

当前 v1 可连接部署者自行运行的 Ollama。项目不捆绑模型，也不会假装模型已安装；未配置时车卡助手和主持人 Session 助手都会显示真实不可用状态。配置示例见 `.env.example` 中的 `LOCAL_AI_*` 项。

完整方向见 [生态与内生 AI 路线](ECOSYSTEM_AND_AI_ROADMAP.md)。

## 本地开发

首次安装：

```powershell
npm install
```

推荐使用完整本地编排：

```powershell
npm run dev:local
npm run dev:local:doctor
npm run dev:local:stop
```

仅启动前端：

```powershell
npm run dev
```

基础验证：

```powershell
npx tsc --noEmit
npm run build
npm run server:build
```

本地登录与数据库准备以 `.env.example`、`LOCAL_TESTING.md` 和部署文档为准。单独启动前端不等于完整本地平台，World Server / 登录 / 房间能力需要后端与 PostgreSQL。

## 文档入口

- [当前平台阶段](CURRENT_PLATFORM_STAGE.md)：最短、最高优先级的产品事实。
- [生态与内生 AI 路线](ECOSYSTEM_AND_AI_ROADMAP.md)：后续完整链条任务与顺序。
- [项目状态](PROJECT_STATUS.md)：详细完成记录与边界。
- [测试清单](TEST_CHECKLIST.md)：回归与里程碑验收。
- [平台架构](PLATFORM_ARCHITECTURE.md)：长期架构原则。
- `docs/architecture/`：强制契约与专题设计。
- `docs/rules/`：各规则系统覆盖矩阵。

事实优先级：当前代码与测试结果 > `CURRENT_PLATFORM_STAGE.md` > `PROJECT_STATUS.md` > 旧计划与归档。

## 协作约束

- 每个完成的逻辑任务独立提交。
- 只暂存本轮明确修改的文件，不使用 `git add .` 或 `git add -A`。
- 不提交或删除本地保留目录 `output/`、`tools/`、`work/`。
- DND 规则资料以本地合法拥有来源为唯一资料来源；默认只补 schema 可承载的声明式数据。
- UI 壳、类型合同与预留接口不等于真实服务；所有未完成能力必须保持状态透明。
