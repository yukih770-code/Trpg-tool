import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CocCharacter, COC_BASE_SKILLS } from '../lib/coc-types';

interface CocState {
  character: CocCharacter;
  updateField: <K extends keyof CocCharacter>(key: K, value: CocCharacter[K]) => void;
  updateCharacteristic: (char: keyof CocCharacter['characteristics'], value: number) => void;
  updateSkill: (skillName: string, value: number, isOcc?: boolean, isPer?: boolean) => void;
  loadCharacter: (data: CocCharacter) => void;
}

const defaultCocChar: CocCharacter = {
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
    (set) => ({
      character: { ...defaultCocChar, id: crypto.randomUUID?.() || Date.now().toString() },
      
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
      
      loadCharacter: (data) => set({ character: data })
    }),
    {
      name: 'coc-character-storage'
    }
  )
);
