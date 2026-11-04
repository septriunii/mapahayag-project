// @vitest-environment node
import facts from '../data/municipal-facts.json';
import aliases from '../data/municipal-profile-aliases.json';
import index from '../../../psgc-index.json';
import extracts from '../../../docs/migration/municipal-psa-extracts.json';
import { getProfileCatalog } from './municipalData';
import { profileKeyForSelection } from './catalog';
import { normalizePsgc } from '../geography/psgc';
import { loadProfileCatalog } from './schema';
import { createMunicipalProfileLoader } from './municipalLoader';
import { createProvinceCatalogLoader } from './provinceLoader';
import provinceProfiles from '../data/provincial-profiles.json';
import provinceSources from '../data/provincial-sources.json';

it('matches every pinned map identity to exactly one validated local profile', () => {
  expect(facts.records).toHaveLength(1634);
  expect(facts.records.filter(row => row.type === 'city')).toHaveLength(149);
  expect(facts.records.filter(row => row.type === 'municipality')).toHaveLength(1485);
  const keys = new Set<string>();
  for (const location of index.municities) {
    const key = profileKeyForSelection({ level: 'national' }, { level: 'municity', psgc: normalizePsgc(location.psgc) })!;
    const result = getProfileCatalog(key);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error(key);
    const profile = result.catalog.profiles.get(key)!;
    expect(profile).toBeDefined();
    expect(profile.psgc).toMatch(/^\d{10}$/);
    expect(profile.metrics.find(metric => metric.id === 'population')).toMatchObject({ status: 'verified', referenceDate: '2024-07-01' });
    expect(profile.sections.flatMap(section => section.paragraphs).filter(p => p.status === 'unavailable').every(p => p.sourceIds.length === 0)).toBe(true);
    keys.add(key);
  }
  expect(keys.size).toBe(index.municities.length);
});

it('ties each population to a row retained from its specific official source', () => {
  for (const row of facts.records) {
    const source = extracts.find(extract => extract.url === row.source);
    expect(source, row.source).toBeDefined();
    const line = source!.lines.find(line => line.includes(`| ${row.psgc} `));
    expect(line, row.psgc).toBeDefined();
    expect(Number(line!.split('|').at(-1)!.trim().replaceAll(',', ''))).toBe(row.population);
  }
});

it('keeps NIR/Sulu aliases explicit and distinguishes repeated names across provinces', () => {
  expect(Object.keys(aliases)).toHaveLength(82);
  expect(aliases).toMatchObject({ '0604503000': '1804503000', '0630200000': '1830200000', '1906602000': '0906602000' });
  for (const code of ['0501724000', '0702234000', '0908309000']) {
    const result = getProfileCatalog(`municity:${code}`);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.catalog.profiles.get(`municity:${code}`)?.psgc).toBe(code);
  }
  expect(getProfileCatalog('municity:0000000000')).toMatchObject({ status: 'ready' });
});

it('retains all province profiles and forbids presenting unsourced prose as verified', () => {
  const provinces = loadProfileCatalog(provinceProfiles, provinceSources);
  expect(provinces.status).toBe('ready');
  if (provinces.status === 'ready') expect(provinces.catalog.profiles.size).toBe(82);
  const result = getProfileCatalog('municity:0907203000');
  if (result.status !== 'ready') throw new Error('Missing Katipunan');
  const profile = structuredClone(result.catalog.profiles.get('municity:0907203000')!);
  profile.sections[2].paragraphs[0].status = 'verified';
  expect(loadProfileCatalog([profile], [...result.catalog.sources.values()]).status).toBe('error');
});

it('deduplicates imports, caches success and allows later retries after import failure', async () => {
  const importer = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ getProfileCatalog });
  const loader = createMunicipalProfileLoader(importer);
  expect((await loader('municity:0907203000')).status).toBe('error');
  const [first, second] = await Promise.all([loader('municity:0907203000'), loader('municity:1381701000')]);
  expect(first.status).toBe('ready'); expect(second.status).toBe('ready');
  expect(importer).toHaveBeenCalledTimes(2);
  expect(await loader('municity:0907203000')).toBe(first);
  const provinceImporter = vi.fn().mockResolvedValue({ profiles: provinceProfiles, sources: provinceSources });
  const provinceLoader = createProvinceCatalogLoader(provinceImporter);
  expect(await provinceLoader()).toBe(await provinceLoader());
  expect(provinceImporter).toHaveBeenCalledTimes(1);
});
