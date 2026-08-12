export type RuntimeAuxiliaryPanel = 'rail' | 'inspector' | 'log';

export type RuntimeAuxiliaryPanelsState = {
  railOpen: boolean;
  inspectorOpen: boolean;
  logOpen: boolean;
};

export type RuntimeAuxiliaryPanelsAction =
  | { type: 'toggle'; panel: RuntimeAuxiliaryPanel; compact: boolean }
  | { type: 'close-all' };

const CLOSED_RUNTIME_AUXILIARY_PANELS: RuntimeAuxiliaryPanelsState = {
  railOpen: false,
  inspectorOpen: false,
  logOpen: false,
};

export function initialRuntimeAuxiliaryPanels(hostDesktopOverview: boolean): RuntimeAuxiliaryPanelsState {
  return { ...CLOSED_RUNTIME_AUXILIARY_PANELS, inspectorOpen: hostDesktopOverview };
}

export function reduceRuntimeAuxiliaryPanels(
  current: RuntimeAuxiliaryPanelsState,
  action: RuntimeAuxiliaryPanelsAction,
): RuntimeAuxiliaryPanelsState {
  if (action.type === 'close-all') return { ...CLOSED_RUNTIME_AUXILIARY_PANELS };

  const key = action.panel === 'rail' ? 'railOpen' : action.panel === 'inspector' ? 'inspectorOpen' : 'logOpen';
  const opening = !current[key];
  if (action.compact && opening) {
    return { ...CLOSED_RUNTIME_AUXILIARY_PANELS, [key]: true };
  }
  return { ...current, [key]: opening };
}
