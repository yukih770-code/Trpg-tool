/**
 * DND gameplay model contracts (v1) — barrel export.
 *
 * AI-LANDMARK: DND_GAMEPLAY_CONTRACTS_INDEX_V1
 *
 * Types-only contracts for the future gameplay layer: actions, effects, rolls,
 * resources, conditions, and runtime changes. No resolver, no store, no UI.
 */

export * from './rollTypes';
export * from './resourceTypes';
export * from './effectTypes';
export * from './conditionTypes';
export * from './runtimeChangeTypes';
export * from './runtimeStateTypes';
export * from './actionTypes';

// Data definitions (source-backed bridge; data only, no resolver).
export * from './dndActionDefinitions';
export * from './dndEffectDefinitions';

// Pure resolvers (no store / no UI / no RuntimeLog).
export * from './weaponAttackResolver';
export * from './runtimeChangeApplier';
export * from './runtimeLogDraftAdapter';
export * from './daggerAttackFlow';
export * from './daggerAttackFlowSmoke';
export * from './runtimeCombatStoreTypes';

// Local in-memory runtime combat store (no persistence, no UI, no log append).
export * from './runtimeCombatStore';
export * from './runtimeCombatStoreSmoke';
export * from './runtimeLogDraftMapper';
export * from './runtimeCombatStoreFlushSmoke';
