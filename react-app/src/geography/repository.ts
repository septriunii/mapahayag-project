import type { MapConfig } from '../config/schema';
import { z } from 'zod';
import { geoPath } from 'd3';
import { ResourceCache } from './cache';
import { BARMM, BASILAN, ISABELA_GROUP, REGION_IX, SULU, NCR, NCR_DISTRICTS, NIR, usesNirOverride } from './alignment';
import { currentSuluNational } from './sulu';
import { withCurrentNames } from './currentNames';
import { featureCode, normalizePsgc } from './psgc';
import { parseGeography } from './validate';
import { barangayBoundaryPath, type BarangayCoverage } from './barangayCoverage';
import type { GeographicLevel, GeographicResource, GeographicView, SourcePsgc } from './types';

const barangaySource = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.looseObject({
    properties: z.looseObject({ adm3_psgc: z.unknown(), adm4_psgc: z.unknown() }),
  })),
});

export class GeographicRepository {
  private readonly assets: URL;
  private readonly geographicBase: URL;
  constructor(private readonly config: MapConfig, configUrl: string, private readonly cache: ResourceCache) {
    this.assets = new URL('.', configUrl);
    const base = new URL(config.geoBasePath, configUrl);
    base.pathname = base.pathname.replace(/\/$/, '') + '/';
    this.geographicBase = base;
  }
  private geography(relative: string) { return new URL(`2023/geojson/${relative}`, this.geographicBase).href; }
  private asset(relative: string) { return new URL(relative, this.assets).href; }
  private load(url: string, level: GeographicLevel): Promise<GeographicResource> {
    return this.cache.load(url, `geography:${level}`, value => withCurrentNames(parseGeography(value, level), level));
  }

  async national() {
    const source = await this.load(this.config.alignment === 'nir' ? this.asset('geo-nir/country.0.001.json') : this.geography('country/lowres/country.0.001.json'), 'region');
    return currentSuluNational(source, this.config.alignment);
  }
  async region(regionCode: SourcePsgc): Promise<GeographicView> {
    const region = normalizePsgc(regionCode);
    if (region === NIR && this.config.alignment === 'legacy') throw new Error('NIR is unavailable in legacy alignment');
    if (region === NCR) {
      const [national, ...districts] = await Promise.all([this.national(), ...NCR_DISTRICTS.map(code => this.load(this.geography(`provdists/medres/municities-provdist-${code}.0.01.json`), 'municity'))]);
      return {
        level: 'municity', collection: { type: 'FeatureCollection', features: districts.flatMap(d => d.collection.features) },
        background: { type: 'FeatureCollection', features: national.collection.features.filter(f => featureCode(f, 'region') === NCR) },
        warnings: districts.flatMap(resourceWarnings),
      };
    }
    const url = usesNirOverride(region, this.config.alignment) ? this.asset(`geo-nir/provdists-region-${region}.0.001.json`) : this.geography(`regions/lowres/provdists-region-${region}.0.001.json`);
    if (region === REGION_IX) {
      const [data, former] = await Promise.all([
        this.load(url, 'province'),
        this.load(this.geography(`regions/lowres/provdists-region-${BARMM}.0.001.json`), 'province'),
      ]);
      const sulu = former.collection.features.find(feature => featureCode(feature, 'province') === SULU);
      if (!sulu) throw new Error('Sulu province is missing from the pinned geographic source');
      const basilan = former.collection.features.find(feature => featureCode(feature, 'province') === BASILAN);
      // The largest polygon is Basilan's main island. Leave the outlying
      // BARMM islands out of the context for the Isabela City view.
      const area = geoPath().area;
      const mainland = basilan?.geometry.type === 'MultiPolygon'
        ? basilan.geometry.coordinates.reduce((largest, polygon) =>
          area({ type: 'Polygon', coordinates: polygon }) > area({ type: 'Polygon', coordinates: largest }) ? polygon : largest)
        : undefined;
      const context = basilan && mainland ? { ...basilan, geometry: { type: 'Polygon' as const, coordinates: mainland } } : basilan;
      return { level: 'province', collection: { ...data.collection, features: [...data.collection.features, sulu] }, context, warnings: resourceWarnings(data) };
    }
    if (region === BARMM) {
      const [data, regionIX] = await Promise.all([
        this.load(url, 'province'),
        this.load(this.geography(`regions/lowres/provdists-region-${REGION_IX}.0.001.json`), 'province'),
      ]);
      const context = regionIX.collection.features.find(feature => featureCode(feature, 'province') === ISABELA_GROUP);
      return { level: 'province', collection: { ...data.collection, features: data.collection.features.filter(feature => featureCode(feature, 'province') !== SULU) }, context, warnings: resourceWarnings(data) };
    }
    const data = await this.load(url, 'province');
    return { level: 'province', collection: data.collection, warnings: resourceWarnings(data) };
  }
  async barangays(parent: SourcePsgc): Promise<(GeographicView & { expected: number }) | 'unavailable' | undefined> {
    const city = normalizePsgc(parent);
    const { default: manifest } = await import('../data/barangay-coverage.json');
    const coverage = (manifest as Record<string, BarangayCoverage | null | undefined>)[city];
    if (coverage === null) return 'unavailable';
    if (!coverage) return;
    const url = coverage.asset ? this.asset(coverage.asset) : this.geography(barangayBoundaryPath(city, coverage.high));
    return this.cache.load(url, 'geography:barangay', input => {
      const source = barangaySource.parse(input);
      const omitted = new Set(coverage.omit);
      const kept = source.features.filter(feature => {
        if (normalizePsgc(feature.properties.adm3_psgc) !== city) throw new Error('Barangay boundary has the wrong source parent');
        return !omitted.delete(normalizePsgc(feature.properties.adm4_psgc));
      });
      const data = parseGeography({ ...source, features: kept }, 'barangay');
      if (omitted.size || data.collection.features.length !== coverage.count || data.missingNames.length || data.omittedNullGeometry.length) {
        throw new Error('Barangay boundaries failed coverage or parent validation');
      }
      const features = data.collection.features.map(feature => {
        const correction = coverage.corrections?.[featureCode(feature, 'barangay')];
        if (!correction) return feature;
        return { ...feature, properties: { ...feature.properties, adm4_psgc: correction.code, adm4_en: correction.name } };
      });
      if (new Set(features.map(feature => featureCode(feature, 'barangay'))).size !== features.length) {
        throw new Error('Duplicate barangay PSGC after applying the current directory');
      }
      return { level: 'barangay', collection: { ...data.collection, features }, warnings: [], expected: coverage.expected ?? coverage.count };
    });
  }

  async province(provinceCode: SourcePsgc): Promise<GeographicView> {
    const province = normalizePsgc(provinceCode);
    // Supplementary boundaries are required; a failure must not silently hide cities.
    const [data, supplementary] = await Promise.all([
      this.load(this.geography(`provdists/lowres/municities-provdist-${province}.0.001.json`), 'municity'),
      this.load(this.asset('huc-boundaries.json'), 'municity'),
    ]);
    const features = [...data.collection.features];
    const seen = new Set(features.map(f => featureCode(f, 'municity')));
    for (const feature of supplementary.collection.features) {
      const parent = feature.properties.parent_prov_psgc;
      if (parent != null && normalizePsgc(parent) === province && !seen.has(featureCode(feature, 'municity'))) {
        features.push(feature);
        seen.add(featureCode(feature, 'municity'));
      }
    }
    return { level: 'municity', collection: { type: 'FeatureCollection', features }, warnings: [...resourceWarnings(data), ...resourceWarnings(supplementary)] };
  }
}

function resourceWarnings(resource: GeographicResource) {
  return [...resource.omittedNullGeometry.map(code => `Missing geometry: ${code}`), ...resource.missingNames.map(code => `Missing source name: ${code}`)];
}
