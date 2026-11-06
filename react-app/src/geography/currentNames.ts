import { featureCode } from './psgc';
import type { GeographicLevel, GeographicResource } from './types';

// PSA national municipality table, checked 5 November 2026. Display metadata
// only: source files, geometry, PSGC identities and data joins stay intact.
export const currentMunicipalNames: Readonly<Record<string, string>> = {
  '201522000': 'Sanchez Mira',
  '1705306000': "Brooke's Point",
  '1705323000': 'Dr. Jose P. Rizal',
  '1004217000': 'Don Victoriano',
  '1102324000': 'Sawata',
  '1903638000': 'Tagoloan II',
};

export function withCurrentNames(resource: GeographicResource, level: GeographicLevel): GeographicResource {
  if (level !== 'municity') return resource;
  return { ...resource, collection: { ...resource.collection, features: resource.collection.features.map(feature => {
    const name = currentMunicipalNames[featureCode(feature, level)];
    return name ? { ...feature, properties: { ...feature.properties, adm3_en: name } } : feature;
  }) } };
}
