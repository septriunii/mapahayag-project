import profiles from '../data/geographic-profiles.json';
import sources from '../data/geographic-sources.json';
import regionalProfiles from '../data/regional-profiles.json';
import regionalSources from '../data/regional-sources.json';
import municipalAliases from '../data/municipal-profile-aliases.json';
import type { MapRoute } from '../navigation/routes';
import type { LocationDetails } from '../navigation/view';
import { normalizePsgc } from '../geography/psgc';
import { loadProfileCatalog } from './schema';

// Local editorial data: validated once and independent of data.json/geography.
export const profileCatalog = loadProfileCatalog([...profiles, ...regionalProfiles], [...sources, ...regionalSources]);

// Editorial identity only. Never apply these aliases to geometry or routing.
export const provinceProfileAliases: Readonly<Record<string, string>> = {
  '0604500000': '1804500000',
  '0704600000': '1804600000',
  '0706100000': '1806100000',
  '1906600000': '0906600000',
};

export function profileKeyForSelection(route: MapRoute, selection?: Pick<LocationDetails, 'level' | 'psgc'>) {
  if (selection?.level === 'region') return `region:${normalizePsgc(selection.psgc).padStart(10, '0')}`;
  if (selection?.level === 'municity') {
    const code = normalizePsgc(selection.psgc).padStart(10, '0');
    return `municity:${(municipalAliases as Readonly<Record<string, string>>)[code] ?? code}`;
  }
  if (selection?.level === 'province') {
    const code = normalizePsgc(selection.psgc).padStart(10, '0');
    // NCR districts, Isabela City and the Special Geographic Area are not provinces.
    if (code.startsWith('13') || code === '0990100000' || code === '1909900000') return undefined;
    return `province:${provinceProfileAliases[code] ?? code}`;
  }
  if (route.level === 'national' && !selection) return 'national';
  return undefined;
}
