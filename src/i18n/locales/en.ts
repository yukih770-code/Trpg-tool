export const en = {
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
    subtitle: 'Multi-system TRPG platform',
    navigationLabel: 'Platform navigation',
    soon: 'Coming Soon',
    comingSoon: 'Coming Soon',
    plannedNote: 'Planned for a later phase.',
    enterPlay: 'Enter Play',
    backHome: 'Back to Home',
    sidebar: {
      collapse: 'Collapse sidebar',
      expand: 'Expand sidebar',
    },
    settings: {
      title: 'Settings',
      language: {
        title: 'Language',
        aria: 'Choose interface language',
        zhCN: '中文',
        en: 'English',
      },
      deferred: {
        title: 'Other Settings',
        body: 'Coming in a later phase.',
      },
    },
    nav: {
      home: 'Home',
      play: 'Play',
      campaigns: 'Campaigns',
      community: 'Community Modules',
      privateImport: 'Private Import',
      studio: 'Content Studio',
      aiHost: 'AI Host',
      settings: 'Settings',
    },
    placeholders: {
      campaigns: {
        title: 'Campaigns',
      },
      community: {
        title: 'Community Modules',
      },
      privateImport: {
        title: 'Private Import',
        note: 'Character JSON import lives in the Play Workspace toolbar.',
      },
      studio: {
        title: 'Content Studio',
      },
      aiHost: {
        title: 'AI Host',
      },
    },
  },
  playMenu: {
    title: 'Choose a Ruleset',
    backToMenu: 'Back to Play Menu',
    status: {
      available: 'Available',
      dataCorrection: 'Data correction in progress',
      manualTracking: 'Manual tracking',
      sourceAudit: 'Rule source proofreading',
    },
    dnd: {
      desc: 'Fantasy rules runtime · Creator / Sheet / Gameplay',
      enter: 'Enter DND 5e 2024',
    },
    coc: {
      desc: 'Investigator workspace · Creator / Sheet / Gameplay',
      enter: 'Enter Call of Cthulhu 7e',
    },
    cp: {
      desc: 'Night City runtime · Creator / Sheet / Gameplay / Market',
      enter: 'Enter Cyberpunk RED',
    },
  },
  dndWorkspace: {
    title: 'DND Workspace',
    nav: {
      dashboard: 'Dashboard',
      characters: 'Character Vault',
      compendium: 'Compendium',
      sources: 'Source Status',
      play: 'Enter Play',
    },
    dashboard: {
      scopeLabel: 'Current rule scope',
      scope: 'DND 2024 / SRD5.2 + XGtE + TCoE',
      statusLabel: 'Status',
      status: 'DND completion in progress',
      completionTitle: 'Data Completion',
      modulesTitle: 'Modules',
    },
    modules: {
      create: 'Create Character',
      sheet: 'Open Character Sheet',
      play: 'Enter Play',
      compendium: 'Compendium',
      spellIndex: 'Spell Index',
      featIndex: 'Feat Index',
      equipmentIndex: 'Equipment Index',
      classIndex: 'Classes & Subclasses',
      sources: 'Source Status',
    },
    completion: {
      species: 'Species',
      backgrounds: 'Backgrounds',
      classes: 'Classes',
      subclasses: 'Subclasses',
      spells: 'Spells',
      feats: 'Feats',
      equipment: 'Equipment',
    },
    sources: {
      title: 'Source Status',
      core: 'Core',
      expansions: 'Expansions',
      statusRuntimeReady: 'Runtime ready',
      statusIndexed: 'Source indexed',
      statusNeedsCheck: 'Needs human check',
      coreNote: 'Default species and backgrounds come from this source; remaining content is indexed with details pending human verification.',
      xgteNote: '95 spells plus subclass / racial feat sources indexed; runtime promotion pending verification.',
      tcoeNote: '21 spells, Artificer, and subclass sources indexed; runtime promotion pending verification.',
    },
    characters: {
      title: 'Character Vault',
      current: 'Current Character',
      empty: 'No character yet',
      hint: 'Multi-character vault is planned for a later phase.',
    },
    compendium: {
      title: 'Compendium',
      note: 'Indexes are a source-location layer; rules text will be wired in after human verification.',
      entries: 'entries',
      files: 'source files',
      categories: 'categories',
      backgroundsLine: 'Background index entries',
    },
  },
  home: {
    hero: {
      title: 'Hardcore Multi-System TRPG Platform',
      subtitle: 'Local characters and rules runtime.',
      enterPlay: 'Enter Play',
      privateImport: 'Private Import',
    },
    snapshot: {
      title: 'Current Status',
      activeRuleset: 'Active Ruleset',
      currentCharacter: 'Current Character',
      emptyCharacter: 'No character yet',
    },
    workspaces: {
      title: 'Rulesets',
      playBadge: 'Play',
      dnd: {
        subtitle: 'Fantasy rules runtime',
      },
      coc: {
        subtitle: 'Investigator workspace',
      },
      cp: {
        subtitle: 'Night City runtime',
      },
    },
    roadmap: {
      title: 'Coming Soon',
      comingSoon: 'Coming Soon',
      campaigns: {
        title: 'Campaigns',
      },
      community: {
        title: 'Community Modules',
      },
      studio: {
        title: 'Content Studio',
      },
      aiHost: {
        title: 'AI Host',
      },
    },
  },
} as const;
