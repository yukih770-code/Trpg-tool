import {
  initialRuntimeAuxiliaryPanels,
  reduceRuntimeAuxiliaryPanels,
  type RuntimeAuxiliaryPanelsState,
} from './runtimeOverlayCoordination';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

const closed = initialRuntimeAuxiliaryPanels(false);
check('mobile and non-host runtimes start map-first', !closed.railOpen && !closed.inspectorOpen && !closed.logOpen);

const hostDesktop = initialRuntimeAuxiliaryPanels(true);
check('desktop host may start with overview open', hostDesktop.inspectorOpen && !hostDesktop.railOpen && !hostDesktop.logOpen);

const railOpen = reduceRuntimeAuxiliaryPanels(closed, { type: 'toggle', panel: 'rail', compact: true });
check('mobile member panel opens', railOpen.railOpen && !railOpen.inspectorOpen && !railOpen.logOpen);

const inspectorOpen = reduceRuntimeAuxiliaryPanels(railOpen, { type: 'toggle', panel: 'inspector', compact: true });
check('mobile inspector replaces member panel', !inspectorOpen.railOpen && inspectorOpen.inspectorOpen && !inspectorOpen.logOpen);

const logOpen = reduceRuntimeAuxiliaryPanels(inspectorOpen, { type: 'toggle', panel: 'log', compact: true });
check('mobile log replaces inspector', !logOpen.railOpen && !logOpen.inspectorOpen && logOpen.logOpen);

const logClosed = reduceRuntimeAuxiliaryPanels(logOpen, { type: 'toggle', panel: 'log', compact: true });
check('toggling active mobile panel returns to map', !logClosed.railOpen && !logClosed.inspectorOpen && !logClosed.logOpen);

const desktopLayered = reduceRuntimeAuxiliaryPanels(hostDesktop, { type: 'toggle', panel: 'rail', compact: false });
check('desktop supporting panels retain independent behavior', desktopLayered.railOpen && desktopLayered.inspectorOpen);

const competing: RuntimeAuxiliaryPanelsState = { railOpen: true, inspectorOpen: true, logOpen: true };
const dismissed = reduceRuntimeAuxiliaryPanels(competing, { type: 'close-all' });
check('dock-open and Escape transition closes every supporting panel', !dismissed.railOpen && !dismissed.inspectorOpen && !dismissed.logOpen);

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
