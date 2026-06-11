export const zhCN = {
  glossary: {
    trpg: 'TRPG',
    dnd2024: 'DND 5e 2024',
    coc7e: 'COC 7e',
    cyberpunkRed: 'Cyberpunk RED',
    aiHost: 'AI Host',
    contentStudio: 'Content Studio',
    privateImport: 'Private Import',
    communityModules: 'Community Modules',
    playWorkspace: 'Play Workspace',
    rollConsole: 'RollConsole',
    runtimeLogEntry: 'RuntimeLogEntry',
    json: 'JSON',
    p1: 'P1',
    v1: 'v1',
    v2: 'v2',
    v3: 'v3',
    v4: 'v4',
  },
  shell: {
    brand: 'TRPG Platform',
    subtitle: '开源硬核多规则平台外壳',
    navigationLabel: '平台导航',
    soon: '即将',
    placeholderBadge: '占位',
    enterPlay: '进入游玩工作区',
    backHome: '返回首页',
    sidebarNote: 'P1 保持规则运行时稳定。战役、社区模组、地图、多人和 AI Host 仍然延期。',
    language: {
      current: '语言：中文',
      switch: '切换到 English',
      aria: '切换界面语言到 English',
    },
    nav: {
      home: '首页',
      play: 'Play Workspace',
      campaigns: '战役管理',
      community: '社区模组',
      privateImport: '私有导入',
      studio: '内容创作工坊',
      aiHost: 'AI Host',
      settings: '设置',
    },
    placeholders: {
      campaigns: {
        title: '战役管理',
        phase: '即将开放 · v2',
        summary: '战役管理已纳入后续平台阶段，当前仅作为占位展示。',
        details: [
          '真实实现前需要场景、Actor、战役日志和权限边界先稳定。',
          'v1 没有新增战役存储、多角色库、云同步、地图或多人功能。',
        ],
      },
      community: {
        title: 'Community Modules（社区模组）',
        phase: '即将开放 · v3',
        summary: '公共社区内容仍属于未来生态层，当前仅作为占位展示。',
        details: [
          '未来内容包必须区分原创或可再分发公共内容与用户私有导入内容。',
          'v1 没有新增模组注册表、市场、公共分享或 ZIP 内容包导入。',
        ],
      },
      privateImport: {
        title: 'Private Import（私有导入）',
        phase: 'v1 边界',
        summary: '当前 Private Import 仅指 Play Workspace 内已有的角色 JSON 导入能力。',
        details: [
          'DND、COC、Cyberpunk RED 的角色 JSON 文件仍通过 Play Workspace 顶部工具栏导入。',
          '模组包、ZIP、公共社区导入和内容库导入仍然延期。',
        ],
      },
      studio: {
        title: 'Content Studio（内容创作工坊）',
        phase: '即将开放 · v3',
        summary: '内容创作工具需要等待内容包 schema 稳定后再实现。',
        details: [
          '未来可能用于创建私有内容包或可再分发内容包，并记录元数据。',
          'v1 没有新增编辑器、资料库构建器、schema 校验器或发布流程。',
        ],
      },
      aiHost: {
        title: 'AI Host（AI 主持）',
        phase: '即将开放 · v4',
        summary: 'AI Host 需要等待 ProposedCommand、校验和权限模型成熟后再实现。',
        details: [
          '未来 AI 可以通过可审查命令进行辅助、建议或主持。',
          'v1 没有新增 AI API、记忆、自主状态修改、隐藏信息流程或 Host Console。',
        ],
      },
      settings: {
        title: '设置',
        phase: '占位',
        summary: '设置当前只是平台外壳入口，占位展示。',
        details: [
          'Play Workspace 内已有的设置按钮仍保持原有提示行为。',
          'v1 没有新增账号、云端、主题持久化、服务器设置或权限配置。',
        ],
      },
    },
  },
  home: {
    hero: {
      badge: 'Platform Home（平台首页）',
      phase: 'P1 规则运行时收口',
      title: '硬核多规则 TRPG 平台',
      body: '面向规则游玩、本地角色工具、私有导入边界和分阶段硬核架构的平台工作台。Home 是默认入口；Play 会打开保留下来的规则运行时工作区。',
      enterPlay: '进入游玩工作区',
      privateImport: 'Private Import（私有导入）',
    },
    snapshot: {
      title: '当前角色快照',
      activeRuleset: '当前规则系统',
      currentCharacter: '当前角色',
      emptyCharacter: '还没有已命名角色',
      help: '快照只读展示，不会改变 store schema、migration 或规则运行时行为。',
    },
    workspaces: {
      title: '规则系统工作区',
      help: '选择一个系统，进入保留下来的 Play Workspace。',
      playBadge: '进入',
      dnd: {
        title: 'DND 5e 2024',
        subtitle: '奇幻规则运行时',
        description: '包含 Creator、Sheet、Gameplay、职业资源、施法、动作和 RollConsole。',
      },
      coc: {
        title: 'COC 7e',
        subtitle: '调查员工作区',
        description: '包含调查员创建、运行时 HP/MP/SAN/Luck、技能检定、孤注一掷、成长和日志。',
      },
      cp: {
        title: 'Cyberpunk RED',
        subtitle: '夜之城运行时',
        description: '包含 Creator、Sheet、Gameplay、Market、库存装备流、检定、伤害工具和日志。',
      },
    },
    privateImport: {
      title: 'Private Import（私有导入）边界',
      body: 'v1 仅支持 Play Workspace 内已有的角色 JSON 导入路径。模组包、ZIP 导入、公共分享和社区内容导入需要等待稳定内容包 schema 与许可证元数据。',
      action: '打开 Play 导入工具',
    },
    roadmap: {
      title: '路线图 / 即将开放',
      comingSoon: '即将开放',
      campaigns: {
        title: '战役管理',
        text: '等待场景、Actor、战役日志和权限边界稳定后再实现。',
      },
      community: {
        title: 'Community Modules（社区模组）',
        text: '未来支持带许可证元数据和校验的原创或可再分发内容包。',
      },
      studio: {
        title: 'Content Studio（内容创作工坊）',
        text: '未来用于创作私有内容或可再分发内容包。',
      },
      aiHost: {
        title: 'AI Host（AI 主持）',
        text: '等待 ProposedCommand、校验、权限和 Host 边界成熟后再实现。',
      },
    },
  },
} as const;
