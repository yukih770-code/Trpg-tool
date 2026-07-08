/**
 * In-memory ActorAdmission registry (Character Clearance v0).
 *
 * AI-LANDMARK: ROOM_SERVER_ACTOR_ADMISSION_REGISTRY_V0
 *
 * Memory-only store of ActorAdmissionRecords (mirrors room-registry style). No
 * persistence, no storage adapter, no dependency. ActorAdmissionRecord (M24.1)
 * has no `bindingId` field, so a binding→admission index is kept INTERNALLY here
 * (the contract is not changed); roomId comes from the record itself.
 */
export function createInMemoryActorAdmissionRegistry() {
    const byId = new Map();
    // bindingId -> admissionIds (internal index; bindingId is not on the record).
    const bindingIndex = new Map();
    return {
        create(record, bindingId) {
            byId.set(record.admissionId, record);
            if (bindingId) {
                const list = bindingIndex.get(bindingId) ?? [];
                if (!list.includes(record.admissionId))
                    list.push(record.admissionId);
                bindingIndex.set(bindingId, list);
            }
            return record;
        },
        get(admissionId) {
            return byId.get(admissionId);
        },
        update(admissionId, updater) {
            const current = byId.get(admissionId);
            if (!current)
                return undefined;
            const next = updater(current);
            byId.set(admissionId, next);
            return next;
        },
        listByRoom(roomId) {
            return [...byId.values()].filter((r) => r.roomId === roomId);
        },
        listByBinding(bindingId) {
            const ids = bindingIndex.get(bindingId) ?? [];
            return ids.map((id) => byId.get(id)).filter((r) => r !== undefined);
        },
    };
}
