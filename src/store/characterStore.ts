import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CharacterData, AttributeName, SkillName, SpellInfo, CustomMod, CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../lib/dnd-types';
import { migrateCharacter } from '../lib/characterMigration';
import { initializeClassResourcesForCharacter, refreshClassResourcesForCharacter } from '../lib/dnd2024/resource-utils';

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
  background: '',
  description: '',
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
  feats: [],
  coin: 0,
  remainingPoints: 27,
  isCompleted: false,
  // v2 fields
  classResources: [],
  pactMagicState: undefined,
};

interface CharacterState {
  character: CharacterData;
  updateField: <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => void;
  toggleMod: (modName: string) => void;
  addCustomMod: (mod: CustomMod) => void;
  removeCustomMod: (modId: string) => void;
  setMods: (mods: string[]) => void;
  updateAttrPointBuy: (attr: AttributeName, value: number) => void;
  restShort: () => void;
  restLong: () => void;
  levelUp: (hpIncrease: number, subclass?: string, attrs?: AttributeName[], feat?: string) => void;
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

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      character: { ...defaultChar, id: crypto.randomUUID?.() || Date.now().toString() },

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

      levelUp: (hpIncrease, newSubclass, extraAttrs, newFeat) => set((state) => {
        const char = state.character;
        const nextLvl = char.level + 1;
        const isCaster = ['法师', '吟游诗人', '牧师', '邪术师', '德鲁伊', '术士'].includes(char.jobClass);
        const newSlots = { ...char.spellbook.slots };
        
        if (isCaster) {
          if (nextLvl >= 1) newSlots[1] = { max: nextLvl === 1 ? 2 : nextLvl === 2 ? 3 : 4, current: nextLvl === 1 ? 2 : nextLvl === 2 ? 3 : 4 };
          if (nextLvl >= 3) newSlots[2] = { max: nextLvl === 3 ? 2 : 3, current: nextLvl === 3 ? 2 : 3 };
          if (nextLvl >= 5) newSlots[3] = { max: nextLvl === 5 ? 2 : 3, current: nextLvl === 5 ? 2 : 3 };
          if (nextLvl >= 7) newSlots[4] = { max: nextLvl === 7 ? 1 : 2, current: nextLvl === 7 ? 1 : 2 };
          if (nextLvl >= 9) newSlots[5] = { max: nextLvl === 9 ? 1 : 2, current: nextLvl === 9 ? 1 : 2 };
        }

        const newAttrs = { ...char.attrs };
        if (extraAttrs) {
           extraAttrs.forEach(a => {
              newAttrs[a] = { ...newAttrs[a], extrabonus: (newAttrs[a].extrabonus || 0) + 1 };
           });
        }

        const newFeats = [...char.feats];
        if (newFeat && !newFeats.includes(newFeat)) {
           newFeats.push(newFeat);
        }

        const leveledCharacter: CharacterData = {
          ...char,
          level: nextLvl,
          hpMax: char.hpMax + hpIncrease,
          hpCurrent: char.hpCurrent + hpIncrease,
          hitDiceCurrent: char.hitDiceCurrent + 1,
          subclass: newSubclass || char.subclass,
          attrs: newAttrs,
          feats: newFeats,
          spellbook: {
            ...char.spellbook,
            slots: newSlots
          }
        };

        const refreshedResources = refreshClassResourcesForCharacter(leveledCharacter);

        return {
          character: {
            ...leveledCharacter,
            classResources: refreshedResources.classResources,
            pactMagicState: refreshedResources.pactMagicState,
          }
        };
      }),

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

      resetCreator: () => set({ character: { ...defaultChar, id: crypto.randomUUID?.() || Date.now().toString() } }),

      loadCharacter: (data) => set({ character: migrateCharacter(data) })

    }),
    {
      name: 'dnd-character-storage',
      // On rehydration, run every saved character through the migration
      // pipeline so localStorage data from older schema versions is safely
      // upgraded before it reaches any component.
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{ character: unknown }> | null;
        if (!p || typeof p !== 'object') return current;
        return {
          ...current,
          character: migrateCharacter(p.character ?? {}),
        };
      },
    }
  )
);
