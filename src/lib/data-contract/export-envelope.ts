import { CURRENT_COC_CHARACTER_SCHEMA_VERSION } from '../coc-types';
import { CURRENT_CP_CHARACTER_SCHEMA_VERSION } from '../cp-types';
import { CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../dnd-types';

export const TRPG_CHARACTER_EXPORT_KIND = 'trpg-platform.character' as const;

export type PlatformRulesetSystem = 'D&D' | 'CoC' | 'CP';
export type TrpgCharacterExportSystem = 'dnd' | 'coc' | 'cpred';

export type TrpgCharacterExportEnvelope = {
  kind: typeof TRPG_CHARACTER_EXPORT_KIND;
  system: TrpgCharacterExportSystem;
  schemaVersion: number;
  exportedAt: string;
  appVersion?: string;
  character: unknown;
};

export type CharacterImportResult =
  | {
      ok: true;
      mode: 'envelope' | 'legacy';
      system: TrpgCharacterExportSystem;
      platformSystem: PlatformRulesetSystem;
      schemaVersion: number;
      character: unknown;
      message?: string;
    }
  | {
      ok: false;
      reason:
        | 'invalid-json'
        | 'unsupported-file'
        | 'unsupported-system'
        | 'missing-schema-version'
        | 'incompatible-schema-version'
        | 'missing-character'
        | 'module-package-unsupported';
      message: string;
    };

const CURRENT_SCHEMA_VERSION_BY_SYSTEM: Record<TrpgCharacterExportSystem, number> = {
  dnd: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
  coc: CURRENT_COC_CHARACTER_SCHEMA_VERSION,
  cpred: CURRENT_CP_CHARACTER_SCHEMA_VERSION,
};

const PLATFORM_SYSTEM_BY_EXPORT_SYSTEM: Record<TrpgCharacterExportSystem, PlatformRulesetSystem> = {
  dnd: 'D&D',
  coc: 'CoC',
  cpred: 'CP',
};

const EXPORT_SYSTEM_BY_PLATFORM_SYSTEM: Record<PlatformRulesetSystem, TrpgCharacterExportSystem> = {
  'D&D': 'dnd',
  CoC: 'coc',
  CP: 'cpred',
};

// AI-LANDMARK: LOCAL_DATA_CONTRACT_CHARACTER_ENVELOPE
// Local character JSON uses a small envelope so future library/backend work can
// identify system and schema metadata without changing current store schemas.
export function createCharacterExportEnvelope(params: {
  system: PlatformRulesetSystem;
  character: unknown;
  appVersion?: string;
  exportedAt?: string;
}): TrpgCharacterExportEnvelope {
  const exportSystem = platformSystemToExportSystem(params.system);

  return {
    kind: TRPG_CHARACTER_EXPORT_KIND,
    system: exportSystem,
    schemaVersion: getCharacterSchemaVersion(params.character) ?? CURRENT_SCHEMA_VERSION_BY_SYSTEM[exportSystem],
    exportedAt: params.exportedAt ?? new Date().toISOString(),
    appVersion: params.appVersion,
    character: params.character,
  };
}

export function parseCharacterImportJson(source: string): CharacterImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return {
      ok: false,
      reason: 'invalid-json',
      message: 'JSON 无法解析，请检查文件格式。',
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      reason: 'unsupported-file',
      message: '这不是支持的角色 JSON 文件。',
    };
  }

  if (isModuleOrCommunityPackage(parsed)) {
    return {
      ok: false,
      reason: 'module-package-unsupported',
      message: '当前仅支持私有角色 JSON 导入。模组包 / 社区内容包导入仍未开放。',
    };
  }

  if (parsed.kind === TRPG_CHARACTER_EXPORT_KIND) {
    return parseCharacterEnvelope(parsed);
  }

  return parseLegacyCharacter(parsed);
}

export function platformSystemToExportSystem(system: PlatformRulesetSystem): TrpgCharacterExportSystem {
  return EXPORT_SYSTEM_BY_PLATFORM_SYSTEM[system];
}

export function exportSystemToPlatformSystem(system: TrpgCharacterExportSystem): PlatformRulesetSystem {
  return PLATFORM_SYSTEM_BY_EXPORT_SYSTEM[system];
}

function parseCharacterEnvelope(envelope: Record<string, unknown>): CharacterImportResult {
  if (!isSupportedExportSystem(envelope.system)) {
    return {
      ok: false,
      reason: 'unsupported-system',
      message: '角色文件中的 system 不受支持。',
    };
  }

  if (!('schemaVersion' in envelope) || typeof envelope.schemaVersion !== 'number') {
    return {
      ok: false,
      reason: 'missing-schema-version',
      message: '角色文件缺少有效的 schemaVersion。',
    };
  }

  if (!('character' in envelope) || !isRecord(envelope.character)) {
    return {
      ok: false,
      reason: 'missing-character',
      message: '角色文件缺少有效的 character 字段。',
    };
  }

  const incompatible = validateSchemaVersion(envelope.system, envelope.schemaVersion);
  if (incompatible) return incompatible;

  return {
    ok: true,
    mode: 'envelope',
    system: envelope.system,
    platformSystem: exportSystemToPlatformSystem(envelope.system),
    schemaVersion: envelope.schemaVersion,
    character: envelope.character,
  };
}

function parseLegacyCharacter(character: Record<string, unknown>): CharacterImportResult {
  const system = sniffLegacyCharacterSystem(character);

  if (!system) {
    return {
      ok: false,
      reason: 'unsupported-file',
      message: '这不是支持的 DND / COC / Cyberpunk RED 角色 JSON 文件。',
    };
  }

  const schemaVersion = getCharacterSchemaVersion(character) ?? 0;
  const incompatible = validateSchemaVersion(system, schemaVersion);
  if (incompatible) return incompatible;

  return {
    ok: true,
    mode: 'legacy',
    system,
    platformSystem: exportSystemToPlatformSystem(system),
    schemaVersion,
    character,
    message: '检测到旧版角色 JSON，已按兼容模式导入。',
  };
}

function sniffLegacyCharacterSystem(character: Record<string, unknown>): TrpgCharacterExportSystem | null {
  if (isRecord(character.attrs)) return 'dnd';
  if (isRecord(character.characteristics)) return 'coc';
  if (isRecord(character.stats)) return 'cpred';
  return null;
}

function getCharacterSchemaVersion(character: unknown): number | null {
  if (!isRecord(character)) return null;
  return typeof character.schemaVersion === 'number' ? character.schemaVersion : null;
}

function validateSchemaVersion(
  system: TrpgCharacterExportSystem,
  schemaVersion: number,
): CharacterImportResult | null {
  if (!Number.isInteger(schemaVersion) || schemaVersion < 0) {
    return {
      ok: false,
      reason: 'incompatible-schema-version',
      message: '角色文件的 schemaVersion 无效。',
    };
  }

  const currentVersion = CURRENT_SCHEMA_VERSION_BY_SYSTEM[system];
  if (schemaVersion > currentVersion) {
    return {
      ok: false,
      reason: 'incompatible-schema-version',
      message: `角色文件 schemaVersion ${schemaVersion} 高于当前支持版本 ${currentVersion}，请升级应用后再导入。`,
    };
  }

  return null;
}

function isSupportedExportSystem(system: unknown): system is TrpgCharacterExportSystem {
  return system === 'dnd' || system === 'coc' || system === 'cpred';
}

function isModuleOrCommunityPackage(value: Record<string, unknown>): boolean {
  const kind = typeof value.kind === 'string' ? value.kind.toLowerCase() : '';
  if (kind.includes('module') || kind.includes('content') || kind.includes('package')) {
    return kind !== TRPG_CHARACTER_EXPORT_KIND;
  }

  return (
    'modules' in value ||
    'moduleManifest' in value ||
    'contentManifest' in value ||
    'communityPackage' in value ||
    'contentPackage' in value
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
