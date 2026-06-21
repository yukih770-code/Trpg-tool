import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CocCharacter, CocRuntimeState, COC_BASE_SKILLS, CURRENT_COC_CHARACTER_SCHEMA_VERSION } from '../lib/coc-types';
import { migrateCocCharacter } from '../lib/cocMigration';
import { applyCocHpDelta } from '../lib/coc-utils';

function makeCocCharacterId(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `coc-${Date.now()}-${rand}`;
}

function stableLegacyCocCharacterId(character: CocCharacter): string {
  const seed = [
    character.name,
    character.player,
    character.occupation,
    character.age,
    character.residence,
    character.birthplace,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `coc-legacy-${Math.abs(hash).toString(36) || 'actor'}`;
}

export function ensureCocCharacterId(character: CocCharacter): CocCharacter {
  const id = character.id?.trim();
  if (id) return { ...character, id };
  return { ...character, id: stableLegacyCocCharacterId(character) };
}

function createDefaultCocCharacter(): CocCharacter {
  return { ...defaultCocChar, id: crypto.randomUUID?.() || makeCocCharacterId() };
}

function syncActiveCocCharacter(
  character: CocCharacter,
  characters: CocCharacter[],
  activeCharacterId: string | null,
): CocCharacter[] {
  const activeCharacter = ensureCocCharacterId(migrateCocCharacter(character));
  const targetId = activeCharacterId?.trim() || activeCharacter.id;
  if (characters.some((item) => item.id === targetId)) {
    return characters.map((item) => (item.id === targetId ? activeCharacter : item));
  }
  return [...characters, activeCharacter];
}

function normalizeCocCharacterList(
  rawCharacters: unknown[] | undefined,
  compatCharacter: unknown,
  activeCharacterId: string | null | undefined,
): { character: CocCharacter; characters: CocCharacter[]; activeCharacterId: string } {
  const compat = ensureCocCharacterId(migrateCocCharacter(compatCharacter ?? {}));
  const sourceList = Array.isArray(rawCharacters) && rawCharacters.length > 0
    ? rawCharacters
    : [compat];
  const migrated = sourceList.map((item) => ensureCocCharacterId(migrateCocCharacter(item)));
  const deduped = migrated.reduce<CocCharacter[]>((acc, item) => {
    if (acc.some((existing) => existing.id === item.id)) return acc;
    return [...acc, item];
  }, []);
  const withCompat = deduped.some((item) => item.id === compat.id)
    ? deduped.map((item) => (item.id === compat.id ? compat : item))
    : [...deduped, compat];
  const requestedActiveId = activeCharacterId?.trim();
  const active =
    withCompat.find((item) => item.id === requestedActiveId) ??
    withCompat.find((item) => item.id === compat.id) ??
    withCompat[0] ??
    compat;

  return {
    character: active,
    characters: withCompat,
    activeCharacterId: active.id,
  };
}

interface CocState {
  character: CocCharacter;
  characters: CocCharacter[];
  activeCharacterId: string | null;
  setActiveCharacterId: (id: string) => void;
  addCharacter: (data: CocCharacter) => void;
  resetCreator: () => void;
  updateField: <K extends keyof CocCharacter>(key: K, value: CocCharacter[K]) => void;
  updateCharacteristic: (char: keyof CocCharacter['characteristics'], value: number) => void;
  updateSkill: (skillName: string, value: number, isOcc?: boolean, isPer?: boolean) => void;
  loadCharacter: (data: CocCharacter) => void;
  initializeRuntime: () => void;
  changeHp: (delta: number) => void;
  changeMp: (delta: number) => void;
  changeSan: (delta: number) => void;
  changeLuck: (delta: number) => void;
  setCocFlag: (flag: keyof CocRuntimeState['flags'], value: boolean) => void;
  toggleSkillGrowthMark: (skillKey: string) => void;
  clearPushedRollContext: () => void;
  setPushedRollContext: (context: NonNullable<CocRuntimeState['pushedRollContext']>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRuntime(character: CocCharacter): CocRuntimeState {
  return migrateCocCharacter(character).runtime!;
}

const defaultCocChar: CocCharacter = {
  schemaVersion: CURRENT_COC_CHARACTER_SCHEMA_VERSION,
  id: '',
  name: '',
  player: '',
  occupation: '',
  age: 20,
  sex: '',
  residence: '',
  birthplace: '',
  characteristics: {
    STR: 0, CON: 0, SIZ: 0, DEX: 0, APP: 0, INT: 0, POW: 0, EDU: 0, LUK: 0
  },
  hp: { current: 0, max: 0 },
  mp: { current: 0, max: 0 },
  sanity: { current: 0, start: 0, max: 99 },
  luck: { current: 0, start: 0 },
  runtime: {
    hp: { current: 0, max: 0 },
    mp: { current: 0, max: 0 },
    san: { current: 0, max: 99, initial: 0 },
    luck: { current: 0 },
    flags: {
      isMajorWound: false,
      isDying: false,
      isUnconscious: false,
      isTemporarilyInsane: false,
      isIndefinitelyInsane: false,
    },
    skillGrowthMarks: {},
    pushedRollContext: undefined,
  },
  skills: COC_BASE_SKILLS.map(s => ({
    name: s.name,
    baseValue: s.base,
    value: s.base,
    isOccupational: false,
    isPersonal: false,
    canImprove: false
  })),
  weapons: [],
  inventory: [],
  backstory: {
    personalDescription: '', ideologyBeliefs: '', significantPeople: '', meaningfulLocations: '', treasuredPossessions: '', traits: '', injuriesScars: '', phobiasManias: '', arcaneTomesSpells: '', encounters: ''
  },
  finances: {
    spendingLevel: '', cash: '', assets: ''
  }
};

export const useCocStore = create<CocState>()(
  persist(
    (set) => {
      const initialCharacter = createDefaultCocCharacter();
      return {
      character: initialCharacter,
      characters: [initialCharacter],
      activeCharacterId: initialCharacter.id,
      
      updateField: (key, value) => set((state) => ({
        character: { ...state.character, [key]: value }
      })),
      
      updateCharacteristic: (char, value) => set((state) => {
        const newChars = { ...state.character.characteristics, [char]: value };
        // Auto-calculate derived stats if needed, or handle it in UI
        return {
          character: {
            ...state.character,
            characteristics: newChars
          }
        };
      }),
      
      updateSkill: (skillName, value, isOcc, isPer) => set((state) => {
        const skills = [...state.character.skills];
        const idx = skills.findIndex(s => s.name === skillName);
        if (idx !== -1) {
          skills[idx] = { 
            ...skills[idx], 
            value,
            isOccupational: isOcc !== undefined ? isOcc : skills[idx].isOccupational,
            isPersonal: isPer !== undefined ? isPer : skills[idx].isPersonal,
          };
        } else {
           // custom skill like Science (Biology)
           skills.push({
             name: skillName,
             baseValue: 1, // rough default
             value,
             isOccupational: isOcc || false,
             isPersonal: isPer || false,
             canImprove: false
           });
        }
        return { character: { ...state.character, skills } };
      }),
      
      setActiveCharacterId: (id) => set((state) => {
        const updatedList = syncActiveCocCharacter(state.character, state.characters, state.activeCharacterId);
        const target = updatedList.find((item) => item.id === id);
        if (!target) return { characters: updatedList };
        return { character: target, characters: updatedList, activeCharacterId: target.id };
      }),

      addCharacter: (data) => set((state) => {
        const character = ensureCocCharacterId(migrateCocCharacter(data));
        const updatedList = syncActiveCocCharacter(state.character, state.characters, state.activeCharacterId);
        const nextList = updatedList.some((item) => item.id === character.id)
          ? updatedList.map((item) => (item.id === character.id ? character : item))
          : [...updatedList, character];
        return { character, characters: nextList, activeCharacterId: character.id };
      }),

      resetCreator: () => set((state) => {
        const updatedList = syncActiveCocCharacter(state.character, state.characters, state.activeCharacterId);
        const character = createDefaultCocCharacter();
        return { character, characters: [...updatedList, character], activeCharacterId: character.id };
      }),

      loadCharacter: (data) => set((state) => {
        const character = ensureCocCharacterId(migrateCocCharacter(data));
        const updatedList = syncActiveCocCharacter(state.character, state.characters, state.activeCharacterId);
        const nextList = updatedList.some((item) => item.id === character.id)
          ? updatedList.map((item) => (item.id === character.id ? character : item))
          : [...updatedList, character];
        return { character, characters: nextList, activeCharacterId: character.id };
      }),

      initializeRuntime: () => set((state) => ({
        character: migrateCocCharacter(state.character),
      })),

      changeHp: (delta) => set((state) => {
        const runtime = getRuntime(state.character);
        const hpResult = applyCocHpDelta({
          currentHp: runtime.hp.current,
          maxHp: runtime.hp.max,
          delta,
          wasMajorWound: runtime.flags.isMajorWound,
        });
        const nextRuntime: CocRuntimeState = {
          ...runtime,
          hp: { ...runtime.hp, current: hpResult.nextHp },
          flags: {
            ...runtime.flags,
            isMajorWound: hpResult.isMajorWound,
            isDying: hpResult.isDying,
            isUnconscious: hpResult.isUnconscious,
          },
        };
        return {
          character: {
            ...state.character,
            runtime: nextRuntime,
            hp: { ...state.character.hp, current: hpResult.nextHp, max: runtime.hp.max },
          },
        };
      }),

      changeMp: (delta) => set((state) => {
        const runtime = getRuntime(state.character);
        const nextCurrent = clamp(runtime.mp.current + delta, 0, runtime.mp.max);
        return {
          character: {
            ...state.character,
            runtime: { ...runtime, mp: { ...runtime.mp, current: nextCurrent } },
            mp: { ...state.character.mp, current: nextCurrent, max: runtime.mp.max },
          },
        };
      }),

      changeSan: (delta) => set((state) => {
        const runtime = getRuntime(state.character);
        const nextCurrent = clamp(runtime.san.current + delta, 0, runtime.san.max);
        return {
          character: {
            ...state.character,
            runtime: { ...runtime, san: { ...runtime.san, current: nextCurrent } },
            sanity: { ...state.character.sanity, current: nextCurrent, max: runtime.san.max },
          },
        };
      }),

      changeLuck: (delta) => set((state) => {
        const runtime = getRuntime(state.character);
        const nextCurrent = Math.max(0, runtime.luck.current + delta);
        return {
          character: {
            ...state.character,
            runtime: { ...runtime, luck: { current: nextCurrent } },
            luck: { ...state.character.luck, current: nextCurrent },
          },
        };
      }),

      setCocFlag: (flag, value) => set((state) => {
        const runtime = getRuntime(state.character);
        return {
          character: {
            ...state.character,
            runtime: {
              ...runtime,
              flags: { ...runtime.flags, [flag]: value },
            },
          },
        };
      }),

      toggleSkillGrowthMark: (skillKey) => set((state) => {
        const runtime = getRuntime(state.character);
        return {
          character: {
            ...state.character,
            runtime: {
              ...runtime,
              skillGrowthMarks: {
                ...runtime.skillGrowthMarks,
                [skillKey]: !runtime.skillGrowthMarks[skillKey],
              },
            },
          },
        };
      }),

      clearPushedRollContext: () => set((state) => {
        const runtime = getRuntime(state.character);
        return {
          character: {
            ...state.character,
            runtime: { ...runtime, pushedRollContext: undefined },
          },
        };
      }),

      setPushedRollContext: (context) => set((state) => {
        const runtime = getRuntime(state.character);
        return {
          character: {
            ...state.character,
            runtime: { ...runtime, pushedRollContext: context },
          },
        };
      }),
    };
    },
    {
      name: 'coc-character-storage',
      // On rehydration, run every saved investigator through the migration
      // pipeline so localStorage data from older schema versions is safely
      // upgraded before it reaches any component.
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          character: unknown;
          characters: unknown[];
          activeCharacterId: string | null;
        }> | null;
        if (!p || typeof p !== 'object') return current;
        const normalized = normalizeCocCharacterList(p.characters, p.character, p.activeCharacterId);
        return {
          ...current,
          ...normalized,
        };
      },
    }
  )
);
