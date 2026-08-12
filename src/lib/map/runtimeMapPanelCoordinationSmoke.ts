import {
  isOpeningRuntimeMapPanel,
  resolveRuntimeMapPanelToggle,
  shouldCloseRuntimeMapPanelForCompetingSurface,
} from './runtimeMapPanelCoordination';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

check('closed map surface opens requested panel', resolveRuntimeMapPanelToggle(undefined, 'units') === 'units');
check('another map panel is replaced directly', resolveRuntimeMapPanelToggle('grid', 'units') === 'units');
check('active map panel toggles closed', resolveRuntimeMapPanelToggle('units', 'units') === undefined);
check('closed to requested transition announces opening', isOpeningRuntimeMapPanel(undefined, 'background'));
check('replacement transition announces opening', isOpeningRuntimeMapPanel('grid', 'template'));
check('closing active panel does not announce opening', !isOpeningRuntimeMapPanel('template', 'template'));
check('compact competing surface closes an open map panel', shouldCloseRuntimeMapPanelForCompetingSurface(true, 'units'));
check('compact competing surface ignores an already closed panel', !shouldCloseRuntimeMapPanelForCompetingSurface(true, undefined));
check('desktop competing surface preserves map panel independence', !shouldCloseRuntimeMapPanelForCompetingSurface(false, 'units'));

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
