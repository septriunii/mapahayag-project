import { loadProfileCatalog } from './schema';

type ProvinceModule = { profiles: unknown; sources: unknown };
type Result = ReturnType<typeof loadProfileCatalog>;
export function createProvinceCatalogLoader(importer: () => Promise<ProvinceModule>) {
  let pending: Promise<Result> | undefined;
  return () => pending ??= importer()
    .then(data => loadProfileCatalog(data.profiles, data.sources))
    .catch((): Result => ({ status: 'error', message: 'Geographic profile unavailable. Showing existing location details.' }))
    .then(result => {
      // Cache valid data and in-flight work, but allow a later visit to retry failure.
      if (result.status === 'error') pending = undefined;
      return result;
    });
}

export const loadProvinceCatalog = createProvinceCatalogLoader(() => import('./provinceData'));
