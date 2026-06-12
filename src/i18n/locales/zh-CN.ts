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
    subtitle: '多规则 TRPG 平台',
    navigationLabel: '平台导航',
    soon: '即将开放',
    comingSoon: '即将开放',
    plannedNote: '该功能已列入后续阶段。',
    enterPlay: '进入游玩工作区',
    backHome: '返回首页',
    sidebar: {
      collapse: '侧栏折叠',
      expand: '侧栏展开',
    },
    settings: {
      title: '设置',
      language: {
        title: '语言设置',
        aria: '选择界面语言',
        zhCN: '中文',
        en: 'English',
      },
      deferred: {
        title: '其他设置',
        body: '后续阶段开放。',
      },
    },
    nav: {
      home: '首页',
      play: '游玩',
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
      },
      community: {
        title: 'Community Modules（社区模组）',
      },
      privateImport: {
        title: 'Private Import（私有导入）',
        note: '角色 JSON 导入位于 Play Workspace 顶部工具栏。',
      },
      studio: {
        title: 'Content Studio（内容创作工坊）',
      },
      aiHost: {
        title: 'AI Host（AI 主持）',
      },
    },
  },
  playMenu: {
    title: '选择规则系统',
    backToMenu: '返回游玩菜单',
    status: {
      available: '可用',
      dataCorrection: '数据校正中',
      manualTracking: '手动追踪',
      sourceAudit: '规则源校对中',
    },
    dnd: {
      desc: '奇幻规则运行时 · Creator / Sheet / Gameplay',
      enter: '进入 DND 5e 2024',
    },
    coc: {
      desc: '调查员工作区 · Creator / Sheet / Gameplay',
      enter: '进入克苏鲁的呼唤 7版',
    },
    cp: {
      desc: '夜之城运行时 · Creator / Sheet / Gameplay / Market',
      enter: '进入 Cyberpunk RED',
    },
  },
  home: {
    hero: {
      title: '硬核多规则 TRPG 平台',
      subtitle: '本地角色与规则运行平台。',
      enterPlay: '进入游玩工作区',
      privateImport: 'Private Import（私有导入）',
    },
    snapshot: {
      title: '当前状态',
      activeRuleset: '规则系统',
      currentCharacter: '当前角色',
      emptyCharacter: '暂无角色',
    },
    workspaces: {
      title: '规则系统',
      playBadge: '进入',
      dnd: {
        subtitle: '奇幻规则运行时',
      },
      coc: {
        subtitle: '调查员工作区',
      },
      cp: {
        subtitle: '夜之城运行时',
      },
    },
    roadmap: {
      title: '即将开放',
      comingSoon: '即将开放',
      campaigns: {
        title: '战役管理',
      },
      community: {
        title: 'Community Modules（社区模组）',
      },
      studio: {
        title: 'Content Studio（内容创作工坊）',
      },
      aiHost: {
        title: 'AI Host（AI 主持）',
      },
    },
  },
} as const;
