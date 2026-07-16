import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import { dndMonsterTemplateApiClient } from '../api/dndMonsterTemplateApiClient';
import type { DndPrivateMonsterTemplate } from './dndMonsterTemplateTypes';

export function useDndMonsterTemplates(worldServerId: string) {
  const enabled = worldServerId.trim() !== '';
  const [monsters, setMonsters] = useState<DndPrivateMonsterTemplate[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiClientError | null>(null);
  const refresh = useCallback(async () => {
    if (!enabled) { setMonsters([]); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    try { setMonsters(await dndMonsterTemplateApiClient.list(worldServerId)); }
    catch (reason) { setError(reason instanceof ApiClientError ? reason : new ApiClientError('invalid_response', '私有怪物库暂时无法加载。')); }
    finally { setLoading(false); }
  }, [enabled, worldServerId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const byId = useMemo(() => new Map(monsters.map((monster) => [monster.monsterTemplateId, monster])), [monsters]);
  return { monsters, byId, loading, error, refresh };
}
