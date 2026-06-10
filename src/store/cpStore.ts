import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CpCharacter, CpStat, CpRole, CpArmor, CpCyberware, CpWeapon, CpClothing,
  CpLifePath, CpRelation, CpEnemy, CpInventory, CpRuntimeState,
  CP_SKILLS, makeEmptyInventory,
  CURRENT_CP_CHARACTER_SCHEMA_VERSION,
} from '../lib/cp-types';
import { migrateCpCharacter } from '../lib/cpMigration';
import {
  getCpMaxHp,
  getCpSeriouslyWoundedThreshold,
  getCpDeathSaveBase,
  getCpHumanityMax,
  isCpCyberpsycho,
  buildInitialCpRuntime,
  refreshCpRuntimeDerived,
  applyCpHpDelta,
  applyCpHumanityDelta,
} from '../lib/cp2024/cp-utils';

// ── Helpers ────────────────────────────────────────────────
export function computeCpDerived(stats: Record<CpStat, number>) {
  const maxHp            = getCpMaxHp(stats.BODY, stats.WILL);
  const seriouslyWounded = getCpSeriouslyWoundedThreshold(maxHp);
  const deathSave        = getCpDeathSaveBase(stats.BODY);
  const maxHumanity      = getCpHumanityMax(stats.EMP);
  return { maxHp, seriouslyWounded, deathSave, maxHumanity };
}

export function computeEmpFromHumanity(
  oldHumanity: number,
  newHumanity: number,
  currentEmp: number
): number {
  const oldTens = Math.floor(oldHumanity / 10);
  const newTens = Math.floor(newHumanity / 10);
  const drops = oldTens - newTens;
  if (drops > 0) return Math.max(0, currentEmp - drops);
  return currentEmp;
}

/** Get the inventory from a character, with safe fallback for old saves */
function safeInv(char: CpCharacter): CpInventory {
  return char.inventory ?? makeEmptyInventory();
}

function ensureRuntime(char: CpCharacter): CpRuntimeState {
  return char.runtime
    ? refreshCpRuntimeDerived(char.runtime, char)
    : buildInitialCpRuntime(char);
}

function withRuntime(char: CpCharacter, runtime?: CpRuntimeState): CpCharacter {
  return {
    ...char,
    runtime: runtime ? refreshCpRuntimeDerived(runtime, char) : ensureRuntime(char),
  };
}

// ── Default blank character ────────────────────────────────
const defaultStats: Record<CpStat, number> = {
  INT: 5, REF: 5, DEX: 5, TECH: 5, COOL: 5,
  WILL: 5, MOVE: 5, BODY: 5, EMP: 5, LUCK: 5,
};

function makeDefaultChar(): CpCharacter {
  const stats = { ...defaultStats };
  const { maxHp, seriouslyWounded, deathSave, maxHumanity } = computeCpDerived(stats);

  const skills: Record<string, number> = {};
  for (const s of CP_SKILLS) {
    skills[s.name] = s.baseLevel;
  }

  const character: CpCharacter = {
    schemaVersion: CURRENT_CP_CHARACTER_SCHEMA_VERSION,
    id: crypto.randomUUID?.() || Date.now().toString(),
    name: '',
    player: '',
    role: 'Solo',
    age: 20,
    gender: '',
    stats,
    maxHp,
    seriouslyWounded,
    deathSave,
    maxHumanity,
    hp: { current: maxHp, max: maxHp },
    humanity: { current: maxHumanity, max: maxHumanity },
    skills,
    armorBody: null,
    armorHead: null,
    cyberware: [],
    weapons: [],
    eb: 2550,
    fashionEb: 800,
    roleLevel: 4,
    housing: '货运集装箱（第一个月免费，后续月租 1100 eb）',
    notes: '',
    clothing: [],
    injuries: [],
    friends: [],
    romances: [],
    enemies: [],
    inventory: makeEmptyInventory(),
    lifePath: {
      handle: '', hometown: '', livingStandard: '货运集装箱', monthlySpending: 1100,
      clothingStyle: '', hairstyle: '', affectation: '',
      motivation: '', personality: '', originsFamily: '',
      childhoodEnv: '', childhoodHero: '',
      lifeEvent1: '', lifeEvent2: '', careerPath: '',
    },
  };

  return {
    ...character,
    runtime: buildInitialCpRuntime(character),
  };
}

// ── Store Interface ────────────────────────────────────────
interface CpState {
  character: CpCharacter;
  updateField: <K extends keyof CpCharacter>(key: K, value: CpCharacter[K]) => void;
  setStat: (stat: CpStat, value: number) => void;
  setAllStats: (stats: Record<CpStat, number>) => void;
  setSkill: (name: string, level: number) => void;

  // ── Cyberware ──────────────────────────────────────────
  /** Buy cyberware → adds to inventory.cyberware (no humanity cost yet) */
  addCyberwareToInventory: (cw: CpCyberware) => void;
  /** Install cyberware from inventory → moves to character.cyberware; humanity automation deferred */
  installCyberware: (cw: CpCyberware) => void;
  /** Uninstall cyberware → returns to inventory.cyberware; humanity automation deferred */
  removeCyberware: (name: string) => void;
  /** Permanently sell/discard cyberware from inventory (does NOT remove from installed) */
  discardCyberware: (name: string) => void;

  // ── Armor ──────────────────────────────────────────────
  /** Buy armor → adds to inventory.armor */
  addArmorToInventory: (a: CpArmor) => void;
  /** Equip armor from inventory → moves to armorBody/armorHead; old armor goes back to inventory */
  equipArmor: (armor: CpArmor, location: 'body' | 'head') => void;
  /** Unequip armor → returns to inventory.armor */
  unequipArmor: (location: 'body' | 'head') => void;
  /** Permanently sell/discard armor from inventory */
  discardArmor: (name: string) => void;

  // ── Weapons ─────────────────────────────────────────────
  /** Buy weapon → adds to inventory.weapons */
  addWeaponToInventory: (w: CpWeapon) => void;
  /** Move weapon from inventory to character.weapons (carry it) */
  carryWeapon: (name: string) => void;
  /** Move weapon from character.weapons back to inventory (drop/stow) */
  removeWeapon: (name: string) => void;
  /** Legacy: add weapon directly to carried list (backward compat) */
  addWeapon: (w: CpWeapon) => void;
  /** Permanently sell/discard weapon from inventory */
  discardWeapon: (name: string) => void;

  // ── Fashion / Clothing ──────────────────────────────────
  /** Buy fashion → adds to inventory.fashion */
  addFashionToInventory: (c: CpClothing) => void;
  /** Move fashion from inventory to character.clothing (wear it) */
  wearFashion: (name: string) => void;
  /** Move fashion from character.clothing back to inventory (take off) */
  removeClothing: (name: string) => void;
  /** Legacy: add clothing directly to worn list (backward compat) */
  addClothing: (c: CpClothing) => void;
  /** Permanently sell/discard fashion from inventory */
  discardFashion: (name: string) => void;

  // ── Misc Gear ────────────────────────────────────────────
  /** Buy misc gear → adds to inventory.gear */
  addGearToInventory: (name: string) => void;
  /** Permanently sell/discard misc gear */
  discardGear: (name: string) => void;

  // ── Resources / HP ──────────────────────────────────────
  spendEb: (amount: number) => boolean;
  gainEb: (amount: number) => void;
  spendFashionEb: (amount: number) => boolean;
  initializeRuntime: () => void;
  refreshRuntime: () => void;
  changeHp: (delta: number) => void;
  changeHumanity: (delta: number) => void;
  setCpRuntimeFlag: (flagName: keyof CpRuntimeState['flags'], value: boolean) => void;
  addCriticalInjury: (name: string) => void;
  removeCriticalInjury: (nameOrIndex: string | number) => void;

  // ── Misc ─────────────────────────────────────────────────
  addInjury: (injury: string) => void;
  removeInjury: (injury: string) => void;
  loadCharacter: (data: CpCharacter) => void;
  resetCharacter: () => void;
  updateLifePath: (fields: Partial<CpLifePath>) => void;
  addFriend: (r: CpRelation) => void;
  removeFriend: (name: string) => void;
  addRomance: (r: CpRelation) => void;
  removeRomance: (name: string) => void;
  addEnemy: (e: CpEnemy) => void;
  removeEnemy: (name: string) => void;
}

export const useCpStore = create<CpState>()(
  persist(
    (set, get) => ({
      character: makeDefaultChar(),

      updateField: (key, value) => set(state => ({
        character: { ...state.character, [key]: value }
      })),

      setStat: (stat, value) => set(state => {
        const clamped = Math.max(2, Math.min(8, value));
        const newStats = { ...state.character.stats, [stat]: clamped };
        const derived = computeCpDerived(newStats);
        const nextCharacter: CpCharacter = {
          ...state.character,
          stats: newStats,
          ...derived,
          hp: { ...state.character.hp, max: derived.maxHp },
          humanity: { ...state.character.humanity, max: derived.maxHumanity },
        };
        return {
          character: withRuntime(nextCharacter)
        };
      }),

      setAllStats: (stats) => set(state => {
        const clamped = Object.fromEntries(
          Object.entries(stats).map(([k, v]) => [k, Math.max(2, Math.min(8, v as number))])
        ) as Record<CpStat, number>;
        const derived = computeCpDerived(clamped);
        const nextCharacter: CpCharacter = {
          ...state.character,
          stats: clamped,
          ...derived,
          hp: { current: derived.maxHp, max: derived.maxHp },
          humanity: { current: derived.maxHumanity, max: derived.maxHumanity },
        };
        return {
          character: {
            ...nextCharacter,
            runtime: buildInitialCpRuntime(nextCharacter),
          }
        };
      }),

      setSkill: (name, level) => set(state => ({
        character: {
          ...state.character,
          skills: { ...state.character.skills, [name]: Math.max(0, Math.min(6, level)) }
        }
      })),

      // ── Cyberware ──────────────────────────────────────────

      addCyberwareToInventory: (cw) => set(state => {
        const inv = safeInv(state.character);
        // Don't add if already in inventory or installed
        if (inv.cyberware.some(c => c.name === cw.name)) return state;
        if (state.character.cyberware.some(c => c.name === cw.name)) return state;
        return {
          character: {
            ...state.character,
            inventory: { ...inv, cyberware: [...inv.cyberware, cw] },
          }
        };
      }),

      installCyberware: (cw) => set(state => {
        if (state.character.cyberware.find(c => c.name === cw.name)) return state;

        const inv = safeInv(state.character);
        const nextCharacter: CpCharacter = {
          ...state.character,
          cyberware: [...state.character.cyberware, cw],
          // Remove from inventory if it was there (it should be, but handle gracefully)
          inventory: { ...inv, cyberware: inv.cyberware.filter(c => c.name !== cw.name) },
        };

        return {
          character: nextCharacter
        };
      }),

      removeCyberware: (name) => set(state => {
        const cw = state.character.cyberware.find(c => c.name === name);
        if (!cw) return state;

        const inv = safeInv(state.character);
        const newInstalled = state.character.cyberware.filter(c => c.name !== name);

        // Return to inventory if not already there
        const alreadyInInv = inv.cyberware.some(c => c.name === name);
        const newInvCyberware = alreadyInInv ? inv.cyberware : [...inv.cyberware, cw];

        const nextCharacter: CpCharacter = {
          ...state.character,
          cyberware: newInstalled,
          inventory: { ...inv, cyberware: newInvCyberware },
        };

        return {
          character: nextCharacter
        };
      }),

      discardCyberware: (name) => set(state => {
        const inv = safeInv(state.character);
        return {
          character: {
            ...state.character,
            inventory: { ...inv, cyberware: inv.cyberware.filter(c => c.name !== name) }
          }
        };
      }),

      // ── Armor ──────────────────────────────────────────────

      addArmorToInventory: (a) => set(state => {
        const inv = safeInv(state.character);
        // Don't add if already owned somewhere
        if (inv.armor.some(x => x.name === a.name)) return state;
        if (state.character.armorBody?.name === a.name) return state;
        if (state.character.armorHead?.name === a.name) return state;
        return {
          character: {
            ...state.character,
            inventory: { ...inv, armor: [...inv.armor, a] }
          }
        };
      }),

      equipArmor: (armor, location) => set(state => {
        const key = location === 'body' ? 'armorBody' : 'armorHead';
        const inv = safeInv(state.character);

        // Return currently equipped armor to inventory if different
        const currentlyEquipped = state.character[key];
        let newInvArmor = inv.armor.filter(a => a.name !== armor.name); // remove the new one from inv
        if (currentlyEquipped && currentlyEquipped.name !== armor.name) {
          if (!newInvArmor.some(a => a.name === currentlyEquipped.name)) {
            newInvArmor = [...newInvArmor, currentlyEquipped];
          }
        }

        const nextCharacter: CpCharacter = {
          ...state.character,
          [key]: armor,
          inventory: { ...inv, armor: newInvArmor }
        };

        return {
          character: withRuntime(nextCharacter)
        };
      }),

      unequipArmor: (location) => set(state => {
        const key = location === 'body' ? 'armorBody' : 'armorHead';
        const armor = state.character[key];
        if (!armor) return state;

        const inv = safeInv(state.character);
        const alreadyInInv = inv.armor.some(a => a.name === armor.name);
        const nextCharacter: CpCharacter = {
          ...state.character,
          [key]: null,
          inventory: {
            ...inv,
            armor: alreadyInInv ? inv.armor : [...inv.armor, armor]
          }
        };

        return {
          character: withRuntime(nextCharacter)
        };
      }),

      discardArmor: (name) => set(state => {
        const inv = safeInv(state.character);
        return {
          character: {
            ...state.character,
            inventory: { ...inv, armor: inv.armor.filter(a => a.name !== name) }
          }
        };
      }),

      // ── Weapons ─────────────────────────────────────────────

      addWeaponToInventory: (w) => set(state => {
        const inv = safeInv(state.character);
        if (inv.weapons.some(x => x.name === w.name)) return state;
        if (state.character.weapons.some(x => x.name === w.name)) return state;
        return {
          character: {
            ...state.character,
            inventory: { ...inv, weapons: [...inv.weapons, w] }
          }
        };
      }),

      carryWeapon: (name) => set(state => {
        const inv = safeInv(state.character);
        const weapon = inv.weapons.find(w => w.name === name);
        if (!weapon) return state;
        if (state.character.weapons.some(w => w.name === name)) return state;
        return {
          character: {
            ...state.character,
            weapons: [...state.character.weapons, weapon],
            inventory: { ...inv, weapons: inv.weapons.filter(w => w.name !== name) }
          }
        };
      }),

      removeWeapon: (name) => set(state => {
        const weapon = state.character.weapons.find(w => w.name === name);
        if (!weapon) return state;
        const inv = safeInv(state.character);
        const alreadyInInv = inv.weapons.some(w => w.name === name);
        return {
          character: {
            ...state.character,
            weapons: state.character.weapons.filter(w => w.name !== name),
            inventory: {
              ...inv,
              weapons: alreadyInInv ? inv.weapons : [...inv.weapons, weapon]
            }
          }
        };
      }),

      // Legacy: add weapon directly to carried list
      addWeapon: (w) => set(state => ({
        character: { ...state.character, weapons: [...state.character.weapons, w] }
      })),

      discardWeapon: (name) => set(state => {
        const inv = safeInv(state.character);
        return {
          character: {
            ...state.character,
            inventory: { ...inv, weapons: inv.weapons.filter(w => w.name !== name) }
          }
        };
      }),

      // ── Fashion / Clothing ──────────────────────────────────

      addFashionToInventory: (c) => set(state => {
        const inv = safeInv(state.character);
        if (inv.fashion.some(x => x.name === c.name)) return state;
        if ((state.character.clothing ?? []).some(x => x.name === c.name)) return state;
        return {
          character: {
            ...state.character,
            inventory: { ...inv, fashion: [...inv.fashion, c] }
          }
        };
      }),

      wearFashion: (name) => set(state => {
        const inv = safeInv(state.character);
        const cloth = inv.fashion.find(c => c.name === name);
        if (!cloth) return state;
        return {
          character: {
            ...state.character,
            clothing: [...(state.character.clothing ?? []), cloth],
            inventory: { ...inv, fashion: inv.fashion.filter(c => c.name !== name) }
          }
        };
      }),

      removeClothing: (name) => set(state => {
        const cloth = (state.character.clothing ?? []).find(c => c.name === name);
        if (!cloth) return state;
        const inv = safeInv(state.character);
        const alreadyInInv = inv.fashion.some(c => c.name === name);
        return {
          character: {
            ...state.character,
            clothing: (state.character.clothing ?? []).filter(c => c.name !== name),
            inventory: {
              ...inv,
              fashion: alreadyInInv ? inv.fashion : [...inv.fashion, cloth]
            }
          }
        };
      }),

      // Legacy: add clothing directly to worn list
      addClothing: (c) => set(state => ({
        character: { ...state.character, clothing: [...(state.character.clothing ?? []), c] }
      })),

      discardFashion: (name) => set(state => {
        const inv = safeInv(state.character);
        return {
          character: {
            ...state.character,
            inventory: { ...inv, fashion: inv.fashion.filter(c => c.name !== name) }
          }
        };
      }),

      // ── Misc Gear ────────────────────────────────────────────

      addGearToInventory: (name) => set(state => {
        const inv = safeInv(state.character);
        if (inv.gear.includes(name)) return state;
        return {
          character: {
            ...state.character,
            inventory: { ...inv, gear: [...inv.gear, name] }
          }
        };
      }),

      discardGear: (name) => set(state => {
        const inv = safeInv(state.character);
        return {
          character: {
            ...state.character,
            inventory: { ...inv, gear: inv.gear.filter(g => g !== name) }
          }
        };
      }),

      // ── Resources / HP ──────────────────────────────────────

      spendEb: (amount) => {
        const { character } = get();
        if (character.eb < amount) return false;
        set(state => ({ character: { ...state.character, eb: state.character.eb - amount } }));
        return true;
      },

      gainEb: (amount) => set(state => ({
        character: { ...state.character, eb: state.character.eb + amount }
      })),

      spendFashionEb: (amount) => {
        const { character } = get();
        if (character.fashionEb < amount) return false;
        set(state => ({ character: { ...state.character, fashionEb: state.character.fashionEb - amount } }));
        return true;
      },

      initializeRuntime: () => set(state => {
        if (state.character.runtime) return state;
        return {
          character: {
            ...state.character,
            runtime: buildInitialCpRuntime(state.character),
          }
        };
      }),

      refreshRuntime: () => set(state => ({
        character: withRuntime(state.character)
      })),

      changeHp: (delta) => set(state => {
        const runtime = applyCpHpDelta(ensureRuntime(state.character), delta);
        return {
          character: {
            ...state.character,
            hp: { current: runtime.hp.current, max: runtime.hp.max },
            runtime,
          }
        };
      }),

      changeHumanity: (delta) => set(state => {
        const oldHumanity = state.character.humanity.current;
        const newHumanity = Math.max(0, Math.min(state.character.humanity.max, oldHumanity + delta));
        const newEmp = computeEmpFromHumanity(oldHumanity, newHumanity, state.character.stats.EMP);
        const newStats = { ...state.character.stats, EMP: newEmp };
        const derived = computeCpDerived(newStats);
        const nextCharacter: CpCharacter = {
          ...state.character,
          stats: newStats,
          ...derived,
          humanity: { current: newHumanity, max: derived.maxHumanity },
          cyberPsycho: isCpCyberpsycho(newHumanity),
        };
        const runtime = refreshCpRuntimeDerived(
          applyCpHumanityDelta(ensureRuntime(state.character), delta),
          nextCharacter,
        );
        return {
          character: {
            ...nextCharacter,
            humanity: { current: runtime.humanity.current, max: runtime.humanity.max },
            cyberPsycho: isCpCyberpsycho(runtime.humanity.current),
            runtime,
          }
        };
      }),

      setCpRuntimeFlag: (flagName, value) => set(state => {
        const runtime = ensureRuntime(state.character);
        return {
          character: {
            ...state.character,
            runtime: {
              ...runtime,
              flags: {
                ...runtime.flags,
                [flagName]: value,
              },
            },
          }
        };
      }),

      addCriticalInjury: (name) => set(state => {
        const trimmed = name.trim();
        if (!trimmed) return state;
        const runtime = ensureRuntime(state.character);
        const criticalInjuries = [...runtime.criticalInjuries, trimmed];
        return {
          character: {
            ...state.character,
            injuries: [...(state.character.injuries ?? []), trimmed],
            runtime: {
              ...runtime,
              criticalInjuries,
            },
          }
        };
      }),

      removeCriticalInjury: (nameOrIndex) => set(state => {
        const runtime = ensureRuntime(state.character);
        const removeByIndex = typeof nameOrIndex === 'number';
        const criticalInjuries = runtime.criticalInjuries.filter((injury, index) =>
          removeByIndex ? index !== nameOrIndex : injury !== nameOrIndex
        );
        const injuries = (state.character.injuries ?? []).filter((injury, index) =>
          removeByIndex ? index !== nameOrIndex : injury !== nameOrIndex
        );
        return {
          character: {
            ...state.character,
            injuries,
            runtime: {
              ...runtime,
              criticalInjuries,
            },
          }
        };
      }),

      // ── Misc ─────────────────────────────────────────────────

      addInjury: (injury) => set(state => {
        const runtime = ensureRuntime(state.character);
        return {
          character: {
            ...state.character,
            injuries: [...(state.character.injuries ?? []), injury],
            runtime: {
              ...runtime,
              criticalInjuries: [...runtime.criticalInjuries, injury],
            },
          }
        };
      }),
      removeInjury: (injury) => set(state => {
        const runtime = ensureRuntime(state.character);
        return {
          character: {
            ...state.character,
            injuries: (state.character.injuries ?? []).filter(i => i !== injury),
            runtime: {
              ...runtime,
              criticalInjuries: runtime.criticalInjuries.filter(i => i !== injury),
            },
          }
        };
      }),
      loadCharacter: (data) => set({ character: migrateCpCharacter(data) }),
      resetCharacter: () => set({ character: makeDefaultChar() }),

      updateLifePath: (fields) => set(state => ({
        character: {
          ...state.character,
          lifePath: { ...(state.character.lifePath ?? {}), ...fields } as CpLifePath
        }
      })),
      addFriend: (r) => set(state => ({
        character: { ...state.character, friends: [...(state.character.friends ?? []), r] }
      })),
      removeFriend: (name) => set(state => ({
        character: { ...state.character, friends: (state.character.friends ?? []).filter(f => f.name !== name) }
      })),
      addRomance: (r) => set(state => ({
        character: { ...state.character, romances: [...(state.character.romances ?? []), r] }
      })),
      removeRomance: (name) => set(state => ({
        character: { ...state.character, romances: (state.character.romances ?? []).filter(r => r.name !== name) }
      })),
      addEnemy: (e) => set(state => ({
        character: { ...state.character, enemies: [...(state.character.enemies ?? []), e] }
      })),
      removeEnemy: (name) => set(state => ({
        character: { ...state.character, enemies: (state.character.enemies ?? []).filter(e => e.name !== name) }
      })),
    }),
    {
      name: 'cp-red-character-storage',
      // On rehydration, route every saved character through the migration
      // pipeline so localStorage data from older schema versions is safely
      // upgraded before it reaches any component.
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{ character: unknown }> | null;
        if (!p || typeof p !== 'object') return current;
        return {
          ...current,
          character: migrateCpCharacter(p.character ?? {}),
        };
      },
    }
  )
);
