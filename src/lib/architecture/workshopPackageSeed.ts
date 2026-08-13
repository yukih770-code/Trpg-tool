/**
 * Legacy Workshop manifest seed boundary.
 *
 * The public catalog stays empty until real publish/review persistence exists.
 * Protocol tests may construct manifests locally; production UI must not show
 * fictional packages as community work.
 */
import type { WorkshopPackageManifest } from './workshopPackage';

export const WORKSHOP_PACKAGE_SEED: WorkshopPackageManifest[] = [];

export function getWorkshopPackageSeedById(_packageId: string): WorkshopPackageManifest | undefined {
  return undefined;
}
