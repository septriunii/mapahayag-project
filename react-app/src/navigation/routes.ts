import { normalizePsgc } from '../geography/psgc';
import type { Psgc } from '../geography/types';
import { BARMM, REGION_IX, SULU } from '../geography/alignment';
import aliases from '../data/municipal-profile-aliases.json';

export type MapRoute =
  | { level: 'national' }
  | { level: 'region'; region: Psgc }
  | { level: 'province'; region: Psgc; province: Psgc }
  | { level: 'municity'; region: Psgc; province?: Psgc; municity: Psgc };

const currentSulu = normalizePsgc('0906600000');
const municipalSources = new Map(Object.entries(aliases).filter(([source]) => source.startsWith('19066'))
  .map(([source, current]) => [normalizePsgc(current), normalizePsgc(source)]));

/** Accept old BARMM links and current official IDs; routes retain source IDs. */
export function canonicalSuluRoute(route: MapRoute): MapRoute {
  if (route.level === 'national' || route.level === 'region' ||
      (route.region !== BARMM && route.region !== REGION_IX) ||
      (route.province !== SULU && route.province !== currentSulu)) return route;
  if (route.level === 'province') return { ...route, region: REGION_IX, province: SULU };
  return { ...route, region: REGION_IX, province: SULU, municity: municipalSources.get(route.municity) ?? route.municity };
}

export function parseRoute(hash: string): MapRoute {
  const route = hash.replace(/^#/, '');
  if (route === '' || route === '/') return { level: 'national' };
  const match = /^\/?region\/(\d{1,10})(?:\/province\/(\d{1,10}))?(?:\/municity\/(\d{1,10}))?$/.exec(route);
  if (!match) throw new Error('Invalid map route');
  const region = normalizePsgc(match[1]);
  const province = match[2] ? normalizePsgc(match[2]) : undefined;
  if (match[3]) return canonicalSuluRoute({ level: 'municity', region, ...(province ? { province } : {}), municity: normalizePsgc(match[3]) });
  if (province) return canonicalSuluRoute({ level: 'province', region, province });
  return { level: 'region', region };
}

export function formatRoute(route: MapRoute): string {
  if (route.level === 'national') return '#/';
  let hash = `#/region/${route.region}`;
  if ('province' in route && route.province) hash += `/province/${route.province}`;
  if (route.level === 'municity') hash += `/municity/${route.municity}`;
  return hash;
}

export function parentRoute(route: MapRoute): MapRoute {
  if (route.level === 'municity' && route.province) return { level: 'province', region: route.region, province: route.province };
  if (route.level === 'province' || route.level === 'municity') return { level: 'region', region: route.region };
  return { level: 'national' };
}
