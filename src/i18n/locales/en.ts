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
    subtitle: 'Open-source hard-core multi-system shell',
    navigationLabel: 'Platform navigation',
    soon: 'Soon',
    placeholderBadge: 'Placeholder',
    enterPlay: 'Enter Play',
    backHome: 'Back to Home',
    sidebarNote: 'P1 keeps rules runtime stable. Campaigns, community modules, maps, multiplayer, and AI Host stay deferred.',
    language: {
      current: 'Language: English',
      switch: 'Switch to 中文',
      aria: 'Switch interface language to Chinese',
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
        phase: 'Coming Soon · v2',
        summary: 'Campaigns are intentionally deferred.',
        details: [
          'Needs scene, actor, campaign log, and permission boundaries before real implementation.',
          'No campaign storage, multi-character library, cloud sync, map, or multiplayer was added in v1.',
        ],
      },
      community: {
        title: 'Community Modules',
        phase: 'Coming Soon · v3',
        summary: 'Public community content remains a future ecosystem layer.',
        details: [
          'Future packages must separate original or redistributable public content from private user imports.',
          'No module registry, marketplace, public sharing, or ZIP package import was added in v1.',
        ],
      },
      privateImport: {
        title: 'Private Import',
        phase: 'v1 boundary',
        summary: 'Private import currently means the existing character JSON import inside Play Workspace.',
        details: [
          'Use Play Workspace toolbar import for DND, COC, and Cyberpunk RED character JSON files.',
          'Module packs, ZIPs, public community imports, and content library ingestion are deferred.',
        ],
      },
      studio: {
        title: 'Content Studio',
        phase: 'Coming Soon · v3',
        summary: 'Content authoring is deferred until content package schemas exist.',
        details: [
          'Future tools may create private or redistributable content packages with metadata.',
          'No editor, compendium builder, schema validator, or publish flow was added in v1.',
        ],
      },
      aiHost: {
        title: 'AI Host',
        phase: 'Coming Soon · v4',
        summary: 'AI Host is deferred behind ProposedCommand, validation, and permissions.',
        details: [
          'AI may later assist, suggest, or host through reviewable commands.',
          'No AI API, memory, autonomous state changes, hidden information flow, or Host Console was added in v1.',
        ],
      },
      settings: {
        title: 'Settings',
        phase: 'Placeholder',
        summary: 'Settings is a shell entry only for now.',
        details: [
          'Existing Play toolbar settings remains informational.',
          'No account, cloud, theme persistence, server settings, or permissions were added in v1.',
        ],
      },
    },
  },
  home: {
    hero: {
      badge: 'Platform Home',
      phase: 'P1 Rules Runtime Closure',
      title: 'Hardcore Multi-System TRPG Platform',
      body: 'A platform workbench for ruleset play, local character tools, private import boundaries, and staged hard-core architecture. Home is the default entry; Play opens the preserved rules runtime workspace.',
      enterPlay: 'Enter Play',
      privateImport: 'Private Import',
    },
    snapshot: {
      title: 'Current Character Snapshot',
      activeRuleset: 'Active Ruleset',
      currentCharacter: 'Current Character',
      emptyCharacter: 'No named character yet',
      help: 'Snapshot is read-only. It does not change store schema, migrations, or rules runtime behavior.',
    },
    workspaces: {
      title: 'Ruleset Workspaces',
      help: 'Choose a system to enter the preserved Play Workspace.',
      playBadge: 'Play',
      dnd: {
        title: 'DND 5e 2024',
        subtitle: 'Fantasy rules runtime',
        description: 'Creator, Sheet, Gameplay, class resources, spellcasting, actions, and RollConsole.',
      },
      coc: {
        title: 'COC 7e',
        subtitle: 'Investigator workspace',
        description: 'Investigator creation, runtime HP/MP/SAN/Luck, skill checks, pushed rolls, growth, and logs.',
      },
      cp: {
        title: 'Cyberpunk RED',
        subtitle: 'Night City runtime',
        description: 'Creator, Sheet, Gameplay, Market, inventory/equipment flow, checks, damage tools, and logs.',
      },
    },
    privateImport: {
      title: 'Private Import Boundary',
      body: 'v1 supports the existing character JSON import path inside Play Workspace. Module packs, ZIP imports, public sharing, and community content ingestion are deferred until stable package schemas and license metadata exist.',
      action: 'Open Play Import Tools',
    },
    roadmap: {
      title: 'Roadmap / Coming Soon',
      comingSoon: 'Coming Soon',
      campaigns: {
        title: 'Campaigns',
        text: 'Deferred until scene, actor, campaign log, and permission boundaries are ready.',
      },
      community: {
        title: 'Community Modules',
        text: 'Future original or redistributable content packages with license metadata and validation.',
      },
      studio: {
        title: 'Content Studio',
        text: 'Future authoring tools for private and redistributable content packages.',
      },
      aiHost: {
        title: 'AI Host',
        text: 'Deferred until ProposedCommand, validation, permissions, and Host boundaries exist.',
      },
    },
  },
} as const;
