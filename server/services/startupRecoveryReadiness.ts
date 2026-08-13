export type StartupRecoveryFailureKind =
  | 'lifecycle_unavailable'
  | 'runtime_log_unavailable'
  | 'room_map_unavailable'
  | 'unexpected_failure';

export interface StartupRecoveryEvidence {
  restoredRoomCount?: number;
  restoredAdmissionCount?: number;
  restoredRuntimeLogEventCount?: number;
  restoredRoomMapEventCount?: number;
}

export interface StartupRecoverySnapshot extends StartupRecoveryEvidence {
  required: boolean;
  status: 'pending' | 'ready' | 'failed';
  startedAt: string;
  completedAt?: string;
  failureKind?: StartupRecoveryFailureKind;
}

export interface StartupRecoveryReadiness {
  isReady(): boolean;
  snapshot(): StartupRecoverySnapshot;
  markReady(evidence?: StartupRecoveryEvidence): StartupRecoverySnapshot;
  markFailed(failureKind: StartupRecoveryFailureKind): StartupRecoverySnapshot;
}

/**
 * Keeps startup recovery fail-closed without coupling HTTP/WS transports to the
 * persistence implementation. A terminal ready/failed decision cannot be
 * overwritten by a later callback.
 */
export function createStartupRecoveryReadiness(
  required: boolean,
  now: () => Date = () => new Date(),
): StartupRecoveryReadiness {
  const startedAt = now().toISOString();
  let state: StartupRecoverySnapshot = required
    ? { required: true, status: 'pending', startedAt }
    : { required: false, status: 'ready', startedAt, completedAt: startedAt };

  const snapshot = (): StartupRecoverySnapshot => ({ ...state });

  return {
    isReady: () => state.status === 'ready',
    snapshot,
    markReady(evidence = {}) {
      if (state.status !== 'pending') return snapshot();
      state = {
        required: true,
        status: 'ready',
        startedAt,
        completedAt: now().toISOString(),
        ...evidence,
      };
      return snapshot();
    },
    markFailed(failureKind) {
      if (state.status !== 'pending') return snapshot();
      state = {
        required: true,
        status: 'failed',
        startedAt,
        completedAt: now().toISOString(),
        failureKind,
      };
      return snapshot();
    },
  };
}
