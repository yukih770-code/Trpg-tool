import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CharacterData, AttributeName, SkillName, SpellInfo, CustomMod, CURRENT_DND_CHARACTER_SCHEMA_VERSION } from '../lib/dnd-types';
import { migrateCharacter } from '../lib/characterMigration';
import { initializeClassResourcesForCharacter } from '../lib/dnd2024/resource-utils';

const initialStats = { base: 8, pointbuy: 0, racebonus: 0, extrabonus: 0 };

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
  consumeSpellSlot: (level: number) => boolean;
  initializeRuntimeResources: () => void;
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
         character: { ...state.character } 
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
            hitDiceCurrent: Math.min(char.level, char.hitDiceCurrent + Math.max(1, Math.floor(char.level / 2)))
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

        return {
          character: {
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

      consumeSpellSlot: (level) => {
        const state = get();
        const slots = state.character.spellbook.slots[level];
        if (!slots || slots.current <= 0) return false;
        
        set({
          character: {
            ...state.character,
            spellbook: {
              ...state.character.spellbook,
              slots: {
                ...state.character.spellbook.slots,
                [level]: { ...slots, current: slots.current - 1 }
              }
            }
          }
        });
        return true;
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
