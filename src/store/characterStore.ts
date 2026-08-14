import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CharacterData, AttributeName, SkillName, SpellInfo, CustomMod, CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../lib/dnd-types';
import { migrateCharacter } from '../lib/characterMigration';
import { initializeClassResourcesForCharacter } from '../lib/dnd2024/resource-utils';
import { isPristineDndCharacterDraft } from '../lib/dnd2024/dndLevelOneCharacter';
import {
  canUndoDndLevelAdvancement,
  makeDndLevelAdvancementReceipt,
  type DndLevelAdvancementPlan,
  type DndLevelAdvancementReceipt,
} from '../lib/dnd2024/dndLevelAdvancement';
import {
  canUndoDndCharacterAssistantCommit,
  type DndCharacterAssistantAuditRecord,
  type DndCharacterAssistantCommitReceipt,
  type DndCharacterAssistantPlan,
} from '../lib/ai/dndCharacterAssistant';

export type DndSpellcastingResourceConsumption = {
  ok: boolean;
  resourceType: 'cantrip' | 'spellSlot' | 'pactMagic';
  slotLevel?: number;
  previousSlots?: number;
  remainingSlots?: number;
  maxSlots?: number;
  pactMagic?: boolean;
  reason?: string;
};

export type DndClassResourceConsumption = {
  ok: boolean;
  resourceId: string;
  previous?: number;
  remaining?: number;
  max?: number;
  amount: number;
  reason?: 'missing-resource' | 'insufficient-resource';
};

const initialStats = { base: 8, pointbuy: 0, racebonus: 0, extrabonus: 0 };

function clampResourceCurrent(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function normalizeResourceConsumptionAmount(amount = 1): number {
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;
}

function recoversOnShortRest(recoveryType?: string): boolean {
  return recoveryType === 'shortRest' ||
    recoveryType === 'shortOrLongRest' ||
    recoveryType === 'short' ||
    recoveryType === '短休';
}

function recoversOnLongRest(recoveryType?: string): boolean {
  // V1 rest model: long rest subsumes short-rest recovery in addition to long-rest recovery.
  return recoveryType === 'shortRest' ||
    recoveryType === 'longRest' ||
    recoveryType === 'shortOrLongRest' ||
    recoveryType === 'short' ||
    recoveryType === 'long' ||
    recoveryType === '短休' ||
    recoveryType === '长休';
}

function getSpecialShortRestRecoveryAmount(resource: CharacterData['classResources'][number]): number {
  if (
    resource.id === 'fighter_second_wind' ||
    resource.id === 'cleric_channel_divinity' ||
    resource.id === 'druid_wild_shape'
  ) {
    return 1;
  }
  return 0;
}

function shouldSpecialLongRestFullRecover(resource: CharacterData['classResources'][number]): boolean {
  return resource.id === 'fighter_second_wind' ||
    resource.id === 'cleric_channel_divinity' ||
    resource.id === 'druid_wild_shape';
}

const defaultChar: CharacterData = {
  schemaVersion: CURRENT_DND_CHARACTER_SCHEMA_VERSION,
  id: '',
  name: '',
  age: '',
  gender: '',
  race: '',
  subrace: '',
  jobClass: '',
  subclass: '',
  classLevels: [],
  background: '',
  description: '',
  appearanceDescription: '',
  level: 1,
  hpMax: 10,
  hpCurrent: 10,
  tempHp: 0,
  deathSaves: { successes: 0, failures: 0 },
  hitDiceCurrent: 1,
  acMod: 10,
  speed: '30',
  size: '中型',
  attrs: {
    Str: { ...initialStats },
    Dex: { ...initialStats },
    Con: { ...initialStats },
    Int: { ...initialStats },
    Wis: { ...initialStats },
    Cha: { ...initialStats },
  },
  skillProficiencies: [],
  savingThrowProficiencies: [],
  weaponProficiencies: [],
  armorTraining: [],
  spellbook: {
    known: [],
    prepared: [],
    slots: {
      1: { max: 2, current: 2 }
    }
  },
  customLanguages: '通用语',
  inventory: [],
  activeMods: ['玩家手册 2024 (基础规则已集成)'],
  customModsData: [],
  personalContentReferences: [],
  feats: [],
  coin: 0,
  remainingPoints: 27,
  isCompleted: false,
  // v2 fields
  classResources: [],
  pactMagicState: undefined,
};

// AI-LANDMARK: DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1
// Sync the in-flight `character` compat field back into the `characters[]` slot
// for `activeCharacterId`. All mutations go through `character`; this helper
// is called at switch / reset / load checkpoints so the array stays coherent.
function syncActiveCharacter(
  character: CharacterData,
  characters: CharacterData[],
  activeCharacterId: string | null,
): CharacterData[] {
  if (!activeCharacterId) {
    return characters.some(c => c.id === character.id) ? characters : [...characters, character];
  }
  if (characters.some(c => c.id === activeCharacterId)) {
    return characters.map(c => (c.id === activeCharacterId ? character : c));
  }
  return [...characters, character];
}

interface CharacterState {
  character: CharacterData;
  // ── Multi-actor fields (DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1) ──
  characters: CharacterData[];
  activeCharacterId: string | null;
  lastLevelAdvancement: DndLevelAdvancementReceipt | null;
  dndCharacterAssistantAudit: DndCharacterAssistantAuditRecord[];
  lastDndCharacterAssistantCommit: DndCharacterAssistantCommitReceipt | null;
  setActiveCharacterId: (id: string) => void;
  addCharacter: (data: CharacterData) => void;
  commitCompletedCharacter: (data: CharacterData) => void;
  // ── End multi-actor fields ──
  updateField: <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => void;
  toggleMod: (modName: string) => void;
  addCustomMod: (mod: CustomMod) => void;
  removeCustomMod: (modId: string) => void;
  setMods: (mods: string[]) => void;
  updateAttrPointBuy: (attr: AttributeName, value: number) => void;
  restShort: () => void;
  restLong: () => void;
  commitLevelAdvancement: (plan: DndLevelAdvancementPlan) => boolean;
  undoLastLevelAdvancement: () => boolean;
  commitDndCharacterAssistantPlan: (plan: DndCharacterAssistantPlan) => boolean;
  undoLastDndCharacterAssistantCommit: () => boolean;
  modifyHp: (amount: number) => void;
  updateSpellbook: (known: SpellInfo[], prepared: string[]) => void;
  consumeSpellcastingResource: (spellLevel: number) => DndSpellcastingResourceConsumption;
  consumeSpellSlot: (level: number) => boolean;
  consumeClassResource: (resourceId: string, amount?: number) => DndClassResourceConsumption;
  initializeRuntimeResources: () => void;
  updateClassResourceCurrent: (id: string, nextCurrent: number) => void;
  resetClassResource: (id: string) => void;
  updatePactMagicCurrent: (nextCurrent: number) => void;
  resetPactMagic: () => void;
  resetCreator: () => void;
  loadCharacter: (data: CharacterData) => void;
}

const _initialChar: CharacterData = { ...defaultChar, id: crypto.randomUUID?.() || Date.now().toString() };

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      character: _initialChar,
      characters: [_initialChar],
      activeCharacterId: _initialChar.id,
      lastLevelAdvancement: null,
      dndCharacterAssistantAudit: [],
      lastDndCharacterAssistantCommit: null,

      updateField: (key, value) => set((state) => ({
        character: { ...state.character, [key]: value }
      })),

      toggleMod: (modName) => set((state) => {
        const currentMods = state.character.activeMods || [];
        const isLoaded = currentMods.includes(modName);
        return {
          character: {
            ...state.character,
            activeMods: isLoaded ? currentMods.filter(m => m !== modName) : [...currentMods, modName]
          }
        };
      }),

      setMods: (mods) => set((state) => ({
        character: {
          ...state.character,
          activeMods: mods
        }
      })),
      
      addCustomMod: (mod) => set((state) => {
        const currentData = state.character.customModsData || [];
        if (currentData.find(m => m.id === mod.id || m.name === mod.name)) return state;
        return {
          character: {
            ...state.character,
            customModsData: [...currentData, mod],
            activeMods: [...(state.character.activeMods || []), mod.name]
          }
        };
      }),

      removeCustomMod: (modId) => set((state) => {
        const currentData = state.character.customModsData || [];
        const modToRemove = currentData.find(m => m.id === modId);
        return {
          character: {
            ...state.character,
            customModsData: currentData.filter(m => m.id !== modId),
            activeMods: (state.character.activeMods || []).filter(name => name !== modToRemove?.name)
          }
        };
      }),

      updateAttrPointBuy: (attr, newVal) => set((state) => {
        const char = state.character;
        const oldVal = char.attrs[attr].pointbuy;
        const diff = newVal - oldVal;
        
        let costOld = 0;
        for (let i = 1; i <= oldVal; i++) costOld += (i + 8 <= 13 ? 1 : 2);
        
        let costNew = 0;
        for (let i = 1; i <= newVal; i++) costNew += (i + 8 <= 13 ? 1 : 2);
        
        const pointsDiff = costNew - costOld;
        
        if (char.remainingPoints - pointsDiff < 0) return state; // invalid
        if (newVal < 0 || newVal > 7) return state; // max base is 15 -> +7
        
        return {
          character: {
            ...char,
            remainingPoints: char.remainingPoints - pointsDiff,
            attrs: {
              ...char.attrs,
              [attr]: { ...char.attrs[attr], pointbuy: newVal }
            }
          }
        };
      }),

      restShort: () => set((state) => ({
         // Stub: actually you'd manage hit dice usage here
         character: {
           ...state.character,
           classResources: state.character.classResources.map((resource) =>
             recoversOnShortRest(resource.recoveryType)
               ? { ...resource, current: resource.max }
               : {
                   ...resource,
                   current: clampResourceCurrent(
                     resource.current + getSpecialShortRestRecoveryAmount(resource),
                     resource.max,
                   ),
                 },
           ),
           pactMagicState: state.character.pactMagicState
             ? { ...state.character.pactMagicState, current: state.character.pactMagicState.max }
             : undefined,
         }
      })),

      restLong: () => set((state) => {
        const char = state.character;
        // Restore all HP
        // Restore all Spell Slots
        const newSlots = { ...char.spellbook.slots };
        for (let lvl in newSlots) {
          newSlots[lvl].current = newSlots[lvl].max;
        }
        return {
          character: {
            ...char,
            hpCurrent: char.hpMax,
            spellbook: { ...char.spellbook, slots: newSlots },
            hitDiceCurrent: Math.min(char.level, char.hitDiceCurrent + Math.max(1, Math.floor(char.level / 2))),
            classResources: char.classResources.map((resource) =>
              recoversOnLongRest(resource.recoveryType) || shouldSpecialLongRestFullRecover(resource)
                ? { ...resource, current: resource.max }
                : resource,
            ),
            pactMagicState: char.pactMagicState
              ? { ...char.pactMagicState, current: char.pactMagicState.max }
              : undefined,
          }
        };
      }),

      commitLevelAdvancement: (plan) => {
        const state = get();
        if (
          !plan.ready ||
          !plan.nextCharacter ||
          plan.actorId !== state.character.id ||
          plan.baseLevel !== state.character.level ||
          plan.baseFingerprint !== JSON.stringify(state.character)
        ) {
          return false;
        }
        const receipt = makeDndLevelAdvancementReceipt(state.character, plan);
        if (!receipt) return false;
        const nextCharacter = plan.nextCharacter;
        set({
          character: nextCharacter,
          characters: state.characters.some((character) => character.id === nextCharacter.id)
            ? state.characters.map((character) => character.id === nextCharacter.id ? nextCharacter : character)
            : [...state.characters, nextCharacter],
          activeCharacterId: nextCharacter.id,
          lastLevelAdvancement: receipt,
        });
        return true;
      },

      undoLastLevelAdvancement: () => {
        const state = get();
        if (!canUndoDndLevelAdvancement(state.character, state.lastLevelAdvancement)) return false;
        const previous = state.lastLevelAdvancement!.before;
        set({
          character: previous,
          characters: state.characters.map((character) => character.id === previous.id ? previous : character),
          activeCharacterId: previous.id,
          lastLevelAdvancement: null,
        });
        return true;
      },

      commitDndCharacterAssistantPlan: (plan) => {
        const state = get();
        if (
          !plan.ready ||
          !plan.nextCharacter ||
          plan.actorId !== state.character.id ||
          plan.baseFingerprint !== JSON.stringify(state.character)
        ) return false;
        const committedAt = Date.now();
        const nextCharacter = plan.nextCharacter;
        const audit: DndCharacterAssistantAuditRecord = {
          auditId: `dnd-ai-audit-${plan.suggestionId}-${committedAt}`,
          suggestionId: plan.suggestionId,
          actorId: nextCharacter.id,
          action: 'applied',
          provider: plan.provider,
          model: plan.model,
          summary: plan.summary,
          changedFields: plan.changedFields,
          occurredAt: committedAt,
        };
        set({
          character: nextCharacter,
          characters: state.characters.some((character) => character.id === nextCharacter.id)
            ? state.characters.map((character) => character.id === nextCharacter.id ? nextCharacter : character)
            : [...state.characters, nextCharacter],
          activeCharacterId: nextCharacter.id,
          dndCharacterAssistantAudit: [...state.dndCharacterAssistantAudit, audit].slice(-50),
          lastDndCharacterAssistantCommit: {
            suggestionId: plan.suggestionId,
            actorId: nextCharacter.id,
            provider: plan.provider,
            model: plan.model,
            summary: plan.summary,
            changedFields: plan.changedFields,
            before: state.character,
            after: nextCharacter,
            committedAt,
          },
        });
        return true;
      },

      undoLastDndCharacterAssistantCommit: () => {
        const state = get();
        const receipt = state.lastDndCharacterAssistantCommit;
        if (!canUndoDndCharacterAssistantCommit(state.character, receipt)) return false;
        const previous = receipt!.before;
        const occurredAt = Date.now();
        const audit: DndCharacterAssistantAuditRecord = {
          auditId: `dnd-ai-audit-revert-${receipt!.suggestionId}-${occurredAt}`,
          suggestionId: receipt!.suggestionId,
          actorId: previous.id,
          action: 'reverted',
          provider: receipt!.provider,
          model: receipt!.model,
          summary: `撤销：${receipt!.summary}`,
          changedFields: receipt!.changedFields,
          occurredAt,
        };
        set({
          character: previous,
          characters: state.characters.map((character) => character.id === previous.id ? previous : character),
          activeCharacterId: previous.id,
          dndCharacterAssistantAudit: [...state.dndCharacterAssistantAudit, audit].slice(-50),
          lastDndCharacterAssistantCommit: null,
        });
        return true;
      },

      modifyHp: (amount) => set((state) => {
        let temp = state.character.tempHp;
        let hp = state.character.hpCurrent;
        
        if (amount < 0) {
          const dmg = -amount;
          if (temp > 0) {
            const tempDmg = Math.min(temp, dmg);
            temp -= tempDmg;
            hp -= (dmg - tempDmg);
          } else {
            hp -= dmg;
          }
        } else {
          hp = Math.min(state.character.hpMax, hp + amount);
        }

        return {
          character: {
            ...state.character,
            hpCurrent: hp,
            tempHp: temp
          }
        };
      }),

      updateSpellbook: (known, prepared) => set((state) => ({
        character: {
          ...state.character,
          spellbook: {
            ...state.character.spellbook,
            known,
            prepared
          }
        }
      })),

      // AI-LANDMARK: DND_SPELLCASTING_RESOURCE_CONSUMPTION
      consumeSpellcastingResource: (spellLevel) => {
        const state = get();
        if (spellLevel <= 0) {
          return {
            ok: true,
            resourceType: 'cantrip',
            slotLevel: 0,
            previousSlots: undefined,
            remainingSlots: undefined,
            maxSlots: undefined,
            pactMagic: false,
          };
        }

        const pactMagic = state.character.pactMagicState;
        if (pactMagic && spellLevel <= pactMagic.slotLevel) {
          if (pactMagic.current <= 0) {
            return {
              ok: false,
              resourceType: 'pactMagic',
              slotLevel: pactMagic.slotLevel,
              previousSlots: pactMagic.current,
              remainingSlots: pactMagic.current,
              maxSlots: pactMagic.max,
              pactMagic: true,
              reason: `没有剩余的契约魔法位。`,
            };
          }

          const remainingSlots = pactMagic.current - 1;
          set({
            character: {
              ...state.character,
              pactMagicState: {
                ...pactMagic,
                current: remainingSlots,
              },
            },
          });
          return {
            ok: true,
            resourceType: 'pactMagic',
            slotLevel: pactMagic.slotLevel,
            previousSlots: pactMagic.current,
            remainingSlots,
            maxSlots: pactMagic.max,
            pactMagic: true,
          };
        }

        const slots = state.character.spellbook.slots[spellLevel];
        if (!slots || slots.current <= 0) {
          return {
            ok: false,
            resourceType: 'spellSlot',
            slotLevel: spellLevel,
            previousSlots: slots?.current ?? 0,
            remainingSlots: slots?.current ?? 0,
            maxSlots: slots?.max ?? 0,
            pactMagic: false,
            reason: `你没有剩余的 ${spellLevel}环 法术位。`,
          };
        }

        const remainingSlots = slots.current - 1;
        set({
          character: {
            ...state.character,
            spellbook: {
              ...state.character.spellbook,
              slots: {
                ...state.character.spellbook.slots,
                [spellLevel]: { ...slots, current: remainingSlots }
              }
            }
          }
        });
        return {
          ok: true,
          resourceType: 'spellSlot',
          slotLevel: spellLevel,
          previousSlots: slots.current,
          remainingSlots,
          maxSlots: slots.max,
          pactMagic: false,
        };
      },

      consumeSpellSlot: (level) => {
        return get().consumeSpellcastingResource(level).ok;
      },

      // AI-LANDMARK: DND_RESOURCE_CONSUMPTION_UNIFICATION
      consumeClassResource: (resourceId, amount = 1) => {
        const consumptionAmount = normalizeResourceConsumptionAmount(amount);
        const state = get();
        const resource = state.character.classResources.find((item) => item.id === resourceId);

        if (!resource) {
          return {
            ok: false,
            resourceId,
            amount: consumptionAmount,
            reason: 'missing-resource',
          };
        }

        if (resource.current < consumptionAmount) {
          return {
            ok: false,
            resourceId,
            previous: resource.current,
            remaining: resource.current,
            max: resource.max,
            amount: consumptionAmount,
            reason: 'insufficient-resource',
          };
        }

        const remaining = resource.current - consumptionAmount;
        set({
          character: {
            ...state.character,
            classResources: state.character.classResources.map((item) =>
              item.id === resourceId
                ? {
                    ...item,
                    current: remaining,
                  }
                : item,
            ),
          },
        });

        return {
          ok: true,
          resourceId,
          previous: resource.current,
          remaining,
          max: resource.max,
          amount: consumptionAmount,
        };
      },

      initializeRuntimeResources: () => set((state) => {
        const runtimeResources = initializeClassResourcesForCharacter(state.character);
        return {
          character: {
            ...state.character,
            classResources: runtimeResources.classResources,
            pactMagicState: runtimeResources.pactMagicState,
          },
        };
      }),

      updateClassResourceCurrent: (id, nextCurrent) => set((state) => ({
        character: {
          ...state.character,
          classResources: state.character.classResources.map((resource) =>
            resource.id === id
              ? {
                  ...resource,
                  current: clampResourceCurrent(nextCurrent, resource.max),
                }
              : resource,
          ),
        },
      })),

      resetClassResource: (id) => set((state) => ({
        character: {
          ...state.character,
          classResources: state.character.classResources.map((resource) =>
            resource.id === id
              ? {
                  ...resource,
                  current: resource.max,
                }
              : resource,
          ),
        },
      })),

      updatePactMagicCurrent: (nextCurrent) => set((state) => {
        if (!state.character.pactMagicState) return state;
        return {
          character: {
            ...state.character,
            pactMagicState: {
              ...state.character.pactMagicState,
              current: clampResourceCurrent(nextCurrent, state.character.pactMagicState.max),
            },
          },
        };
      }),

      resetPactMagic: () => set((state) => {
        if (!state.character.pactMagicState) return state;
        return {
          character: {
            ...state.character,
            pactMagicState: {
              ...state.character.pactMagicState,
              current: state.character.pactMagicState.max,
            },
          },
        };
      }),

      setActiveCharacterId: (id) => set((state) => {
        const updatedList = syncActiveCharacter(state.character, state.characters, state.activeCharacterId);
        const target = updatedList.find(c => c.id === id);
        if (!target) return { characters: updatedList };
        return { character: target, characters: updatedList, activeCharacterId: id };
      }),

      addCharacter: (data) => set((state) => {
        const withId: CharacterData = data.id ? data : { ...data, id: crypto.randomUUID?.() || Date.now().toString() };
        const migrated = migrateCharacter(withId);
        const updatedList = syncActiveCharacter(state.character, state.characters, state.activeCharacterId);
        return { character: migrated, characters: [...updatedList, migrated], activeCharacterId: migrated.id };
      }),

      // Builder commit boundary: the completed compat character and its Owned
      // Actor vault record are written atomically, so refresh/selection/runtime
      // readers cannot observe two different versions.
      commitCompletedCharacter: (data) => set((state) => {
        const migrated = migrateCharacter({ ...data, isCompleted: true });
        const updatedList = state.characters.some((character) => character.id === migrated.id)
          ? state.characters.map((character) => character.id === migrated.id ? migrated : character)
          : [...state.characters, migrated];
        return {
          character: migrated,
          characters: updatedList,
          activeCharacterId: migrated.id,
        };
      }),

      resetCreator: () => set((state) => {
        const updatedList = syncActiveCharacter(state.character, state.characters, state.activeCharacterId)
          .filter((character) => !isPristineDndCharacterDraft(character));
        // Resetting an in-flight draft keeps its id so the surrounding formal
        // creation return context remains attached. Starting from a finalized
        // actor creates a new Owned Actor candidate with a new id.
        const draftId = !state.character.isCompleted && state.character.id
          ? state.character.id
          : crypto.randomUUID?.() || Date.now().toString();
        const newChar: CharacterData = { ...defaultChar, id: draftId };
        return { character: newChar, characters: [...updatedList, newChar], activeCharacterId: newChar.id };
      }),

      loadCharacter: (data) => set((state) => {
        const migrated = migrateCharacter(data);
        const updatedList = syncActiveCharacter(state.character, state.characters, state.activeCharacterId);
        const newList = updatedList.some(c => c.id === migrated.id)
          ? updatedList.map(c => (c.id === migrated.id ? migrated : c))
          : [...updatedList, migrated];
        return { character: migrated, characters: newList, activeCharacterId: migrated.id };
      }),

    }),
    {
      name: 'dnd-character-storage',
      // On rehydration, run every saved character through the migration
      // pipeline so localStorage data from older schema versions is safely
      // upgraded before it reaches any component.
      //
      // DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1: handles both shapes:
      //   Legacy  { character: T }                    → wraps to characters[0]
      //   Multi   { character: T, characters: T[], activeCharacterId: string }
      // The `character` compat field is the authoritative copy of the active
      // character (all in-session mutations go through it), so we substitute it
      // back into the characters[] array at the active slot on rehydration.
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          character: unknown;
          characters: unknown[];
          activeCharacterId: string | null;
          lastLevelAdvancement: unknown;
          dndCharacterAssistantAudit: unknown;
          lastDndCharacterAssistantCommit: unknown;
        }> | null;
        if (!p || typeof p !== 'object') return current;

        const legacyChar = migrateCharacter(p.character ?? {});

        // Legacy save: no characters array → wrap the single character
        if (!Array.isArray(p.characters) || p.characters.length === 0) {
          return {
            ...current,
            character: legacyChar,
            characters: [legacyChar],
            activeCharacterId: legacyChar.id,
          };
        }

        // Multi-actor save: migrate every character in the array
        let migratedList = (p.characters as unknown[]).map(c => migrateCharacter(c));
        // Substitute the `character` compat field back into its array slot so
        // any in-session mutations that didn't sync to the array aren't lost.
        migratedList = migratedList.map(c => (c.id === legacyChar.id ? legacyChar : c));

        const savedActiveId = typeof p.activeCharacterId === 'string' ? p.activeCharacterId : null;
        const activeChar =
          migratedList.find(c => c.id === savedActiveId) ??
          migratedList.find(c => c.id === legacyChar.id) ??
          migratedList[0] ??
          legacyChar;

        return {
          ...current,
          character: activeChar,
          characters: migratedList,
          activeCharacterId: activeChar.id,
          lastLevelAdvancement: p.lastLevelAdvancement && typeof p.lastLevelAdvancement === 'object'
            ? p.lastLevelAdvancement as DndLevelAdvancementReceipt
            : null,
          dndCharacterAssistantAudit: Array.isArray(p.dndCharacterAssistantAudit)
            ? p.dndCharacterAssistantAudit.slice(-50) as DndCharacterAssistantAuditRecord[]
            : [],
          lastDndCharacterAssistantCommit: p.lastDndCharacterAssistantCommit && typeof p.lastDndCharacterAssistantCommit === 'object'
            ? p.lastDndCharacterAssistantCommit as DndCharacterAssistantCommitReceipt
            : null,
        };
      },
    }
  )
);
