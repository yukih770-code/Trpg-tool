export type RuntimeMapUtilityPanel = 'background' | 'grid' | 'template' | 'units';

export function resolveRuntimeMapPanelToggle(
  current: RuntimeMapUtilityPanel | undefined,
  requested: RuntimeMapUtilityPanel,
): RuntimeMapUtilityPanel | undefined {
  return current === requested ? undefined : requested;
}

export function isOpeningRuntimeMapPanel(
  current: RuntimeMapUtilityPanel | undefined,
  requested: RuntimeMapUtilityPanel,
): boolean {
  return current !== requested;
}

export function shouldCloseRuntimeMapPanelForCompetingSurface(
  compact: boolean,
  current: RuntimeMapUtilityPanel | undefined,
): boolean {
  return compact && current !== undefined;
}
