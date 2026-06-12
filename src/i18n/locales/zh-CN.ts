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
  dndWorkspace: {
    title: 'DND 工作台',
    nav: {
      dashboard: '工作台总览',
      characters: '角色库',
      compendium: '规则库',
      sources: '规则源状态',
      play: '进入游玩',
    },
    dashboard: {
      scopeLabel: '当前规则范围',
      scope: 'DND 2024 / SRD5.2 + XGtE + TCoE',
      statusLabel: '当前状态',
      status: 'DND 优先完成中',
      completionTitle: '数据完成度',
      modulesTitle: '模块入口',
    },
    modules: {
      create: '创建角色',
      sheet: '打开角色卡',
      play: '进入游玩',
      compendium: '规则库',
      spellIndex: '法术索引',
      featIndex: '专长索引',
      equipmentIndex: '装备索引',
      classIndex: '职业与子职业',
      sources: '规则源状态',
    },
    completion: {
      species: '物种',
      backgrounds: '背景',
      classes: '职业',
      subclasses: '子职业',
      spells: '法术',
      feats: '专长',
      equipment: '装备',
    },
    sources: {
      title: '规则源状态',
      core: '核心规则',
      expansions: '拓展包',
      statusRuntimeReady: '运行时可用',
      statusIndexed: '索引已接入',
      statusNeedsCheck: '待人工核对',
      coreNote: '物种与背景默认列表来自该来源；其余内容已索引，细节待人工核对。',
      xgteNote: '法术 95 条与子职业 / 种族专长来源已索引；运行时接入待核对。',
      tcoeNote: '法术 21 条、奇械师与子职业来源已索引；运行时接入待核对。',
    },
    characters: {
      title: '角色库',
      current: '当前角色',
      empty: '暂无角色',
      hint: '多角色库属于后续阶段。',
    },
    compendium: {
      title: '规则库',
      note: '索引为来源定位层；规则文本待人工核对后接入。',
      entries: '条目',
      files: '来源文件',
      categories: '类别',
      backgroundsLine: '背景索引条目',
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
