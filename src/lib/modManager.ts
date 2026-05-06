import { CustomMod } from './dnd-types';
import { OFFICIAL_MODS } from '../components/ModManager';

export interface ModConflict {
  mod1: string;
  mod2: string;
  reason: string;
}

export function evaluateModCompatibility(
  activeModNames: string[],
  customModsData: CustomMod[],
  newModBeingToggled: string
): { isValid: boolean, conflicts: ModConflict[], systemChanges?: boolean, targetSystem?: string } {
  const isEnabling = !activeModNames.includes(newModBeingToggled);
  if (!isEnabling) return { isValid: true, conflicts: [] };

  const proposedMods = [...activeModNames, newModBeingToggled];
  
  // Build a lookup map of all available mods
  const modRegistry = new Map<string, { name: string, system?: string, conflictsWith?: string[] }>();
  
  for (const oMod of OFFICIAL_MODS) {
    modRegistry.set(oMod.name, oMod);
  }
  for (const cMod of customModsData) {
    modRegistry.set(cMod.name, {
      name: cMod.name,
      system: cMod.baseSystem,
      conflictsWith: cMod.conflictsWith
    });
  }

  const conflicts: ModConflict[] = [];
  
  // Step 1: Detect System changes
  const newModData = modRegistry.get(newModBeingToggled);
  const targetSystem = newModData?.system;

  let hasSystemConflict = false;
  if (targetSystem) {
    for (const name of activeModNames) {
      const existingMod = modRegistry.get(name);
      if (existingMod?.system && existingMod.system !== targetSystem) {
        hasSystemConflict = true;
        conflicts.push({
          mod1: newModBeingToggled,
          mod2: name,
          reason: `系统不兼容: [${targetSystem}] 无法与 [${existingMod.system}] 混用。开启此模组将关闭所有其他系统的模组。`
        });
      }
    }
  }

  // Step 2: Detect Explicit Conflicts (from JSON or known incompatibilities)
  for (let i = 0; i < proposedMods.length; i++) {
    for (let j = i + 1; j < proposedMods.length; j++) {
      const m1 = proposedMods[i];
      const m2 = proposedMods[j];
      const data1 = modRegistry.get(m1);
      const data2 = modRegistry.get(m2);

      if (data1?.conflictsWith?.includes(m2) || data2?.conflictsWith?.includes(m1)) {
        conflicts.push({
          mod1: m1,
          mod2: m2,
          reason: `显式冲突声明: 模组开发者标记这两个模组为互斥。`
        });
      }
    }
  }

  // Step 3: Implicit "Hidden" Overrides (Heuristic compatibility check)
  // E.g., if two custom mods try to redefine the exact same Feat or Race
  const classNames = new Set<string>();
  const raceNames = new Set<string>();
  const featNames = new Set<string>();

  for (const mName of proposedMods) {
    const custMod = customModsData.find(c => c.name === mName);
    if (!custMod) continue;

    for (const r of custMod.races || []) {
      if (raceNames.has(r.name)) {
        conflicts.push({ mod1: mName, mod2: 'Multiple', reason: `重复定义隐形冲突: 种族 '${r.name}' 被重复定义，可能导致闪退。` });
      }
      raceNames.add(r.name);
    }
    for (const f of custMod.feats || []) {
      if (featNames.has(f.name)) {
        conflicts.push({ mod1: mName, mod2: 'Multiple', reason: `重复定义隐形冲突: 专长 '${f.name}' 被重复定义。` });
      }
      featNames.add(f.name);
    }
  }

  if (hasSystemConflict && conflicts.length === 1 && conflicts[0].reason.includes('系统不兼容')) {
    return { isValid: false, conflicts, systemChanges: true, targetSystem };
  }

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
}
