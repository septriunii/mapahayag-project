import type { MapConfig } from '../config/schema';
import { ResourceCache } from './cache';
import { BARMM, REGION_IX, SULU, NCR, NCR_DISTRICTS, NIR, usesNirOverride } from './alignment';
import { currentSuluNational } from './sulu';
import { withCurrentNames } from './currentNames';
import { featureCode, normalizePsgc } from './psgc';
import { parseGeography } from './validate';
import { barangayPilot, barangayPilotPath } from './barangayPilot';
import type { GeographicLevel, GeographicResource, GeographicView, SourcePsgc } from './types';

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
      return { level: 'province', collection: { ...data.collection, features: [...data.collection.features, sulu] }, warnings: resourceWarnings(data) };
    }
    const data = await this.load(url, 'province');
    if (region === BARMM) return { level: 'province', collection: { ...data.collection, features: data.collection.features.filter(feature => featureCode(feature, 'province') !== SULU) }, warnings: resourceWarnings(data) };
    return { level: 'province', collection: data.collection, warnings: resourceWarnings(data) };
  }
  async barangays(parent: SourcePsgc): Promise<GeographicView> {
    const city = normalizePsgc(parent);
    const count = barangayPilot.get(city);
    if (!count) throw new Error('Barangay view is outside the pilot area');
    return this.cache.load(this.geography(barangayPilotPath(city)), 'geography:barangay', input => {
      const data = parseGeography(input, 'barangay');
      if (data.collection.features.length !== count || data.missingNames.length ||
          data.collection.features.some(feature => featureCode(feature, 'municity') !== city)) {
        throw new Error('Barangay boundaries failed coverage or parent validation');
      }
      return { level: 'barangay', collection: data.collection, warnings: [] };
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
