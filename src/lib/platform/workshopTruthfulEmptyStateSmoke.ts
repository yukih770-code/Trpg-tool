import { platformRepo } from '../architecture/repositoryComposition';
import { WORKSHOP_PACKAGE_SEED } from '../architecture/workshopPackageSeed';
import { FAN_WORKS, RELATED_FAN_WORKS_BY_WORKSHOP } from './communityMockData';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(platformRepo.workshopPackages.list().length === 0, 'public Workshop repository must start empty');
assert(platformRepo.workshopPackages.listSubscriptions().length === 0, 'joined Workshop repository must start empty');
assert(platformRepo.fanWorks.list().length === 0, 'public Fan Plaza repository must start empty');
assert(FAN_WORKS.length === 0, 'legacy Fan Plaza seed must not contain fictional works');
assert(WORKSHOP_PACKAGE_SEED.length === 0, 'legacy Workshop manifest seed must not contain fictional packages');
assert(Object.keys(RELATED_FAN_WORKS_BY_WORKSHOP).length === 0, 'legacy community relation seed must start empty');

console.log('Workshop truthful empty-state smoke passed.');
