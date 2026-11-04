import { useEffect, useState } from 'react';
import { profileCatalog } from '../profiles/catalog';
import { loadProvinceCatalog } from '../profiles/provinceLoader';
import { loadMunicipalProfile } from '../profiles/municipalLoader';
import type { loadProfileCatalog } from '../profiles/schema';

type Result = ReturnType<typeof loadProfileCatalog>;
export function useGeographicProfile(key?: string) {
  const [loaded, setLoaded] = useState<{ key: string; result: Result }>();
  const province = key?.startsWith('province:') ?? false;
  const municipal = key?.startsWith('municity:') ?? false;
  const lazy = province || municipal;
  useEffect(() => {
    if (!lazy || !key) return;
    let active = true;
    void (municipal ? loadMunicipalProfile(key) : loadProvinceCatalog()).then(result => { if (active) setLoaded({ key, result }); });
    return () => { active = false; };
  }, [key, lazy, municipal]);
  const result = lazy ? loaded && loaded.key === key ? loaded.result : undefined : profileCatalog;
  return {
    profile: key && result?.status === 'ready' ? result.catalog.profiles.get(key) : undefined,
    sources: result?.status === 'ready' ? result.catalog.sources : undefined,
    loading: lazy && !result,
    error: key && result?.status === 'error' ? result.message : undefined,
  };
}
