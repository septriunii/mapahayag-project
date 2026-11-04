import type { loadProfileCatalog } from './schema';

type Result = ReturnType<typeof loadProfileCatalog>;
type Module = { getProfileCatalog: (key: string) => Result };
export function createMunicipalProfileLoader(importer: () => Promise<Module>) {
  let pending: Promise<Module> | undefined;
  return async (key: string): Promise<Result> => {
    try {
      const module = await (pending ??= importer());
      return module.getProfileCatalog(key);
    } catch {
      pending = undefined;
      return { status: 'error', message: 'Geographic profile unavailable. Showing existing location details.' };
    }
  };
}
export const loadMunicipalProfile = createMunicipalProfileLoader(() => import('./municipalData'));
