import membership from '../data/sulu-national-membership.json';
import { BARMM, REGION_IX } from './alignment';
import { featureCode } from './psgc';
import { geometryFingerprint } from './fingerprint';
import type { Alignment, GeographicResource } from './types';

const regrouped = new WeakMap<GeographicResource, GeographicResource>();
/** Move whole existing island components, retaining every source coordinate. */
export function currentSuluNational(source: GeographicResource, alignment: Alignment): GeographicResource {
  const cached = regrouped.get(source);
  if (cached) return cached;
  const ix = source.collection.features.find(feature => featureCode(feature, 'region') === REGION_IX);
  const barmm = source.collection.features.find(feature => featureCode(feature, 'region') === BARMM);
  const manifest = membership[alignment];
  if (!ix || !barmm || ix.geometry.type !== 'MultiPolygon' || barmm.geometry.type !== 'MultiPolygon' ||
      geometryFingerprint(ix.geometry) !== manifest.ixFingerprint || geometryFingerprint(barmm.geometry) !== manifest.barmmFingerprint) {
    throw new Error('Sulu alignment requires the pinned national geometry. Review and regenerate its membership manifest for a different dataset.');
  }
  const indexes = new Set(manifest.componentIndexes);
  const moved = barmm.geometry.coordinates.filter((_, index) => indexes.has(index));
  const retained = barmm.geometry.coordinates.filter((_, index) => !indexes.has(index));
  const nextIx = { ...ix, geometry: { ...ix.geometry, coordinates: [...ix.geometry.coordinates, ...moved] } };
  const nextBarmm = { ...barmm, geometry: { ...barmm.geometry, coordinates: retained } };
  const result = { ...source, collection: { ...source.collection, features: source.collection.features.map(feature => feature === ix ? nextIx : feature === barmm ? nextBarmm : feature) } };
  regrouped.set(source, result);
  return result;
}
