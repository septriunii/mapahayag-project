import { z } from 'zod';
import facts from '../data/municipal-facts.json';
import { loadProfileCatalog, type GeographicProfileData, type GeographicSource } from './schema';

const code = z.string().regex(/^\d{10}$/);
const rowSchema = z.object({
  psgc: code, mapPsgc: code, name: z.string().min(1), mapName: z.string().min(1),
  type: z.enum(['city', 'municipality']), population: z.number().int().nonnegative(),
  province: code.nullable(), provinceName: z.string().min(1).nullable(),
  region: code, regionName: z.string().min(1),
  cityClassification: z.enum(['hucs', 'iccs', 'ccs']).optional(),
  source: z.url().refine(value => value.startsWith('https://psa.gov.ph/classification/psgc/')),
}).superRefine((row, ctx) => {
  if ((row.province === null) !== (row.provinceName === null) || (row.type === 'city') !== Boolean(row.cityClassification)) {
    ctx.addIssue({ code: 'custom', message: 'Municipal placement and city classification must agree with their fields' });
  }
});
const data = z.object({ checkedDate: z.iso.date(), populationReferenceDate: z.iso.date(), records: z.array(rowSchema) }).parse(facts);
const rows = new Map(data.records.map(row => [`municity:${row.psgc}`, row]));
if (rows.size !== data.records.length || new Set(data.records.map(row => row.mapPsgc)).size !== data.records.length) throw new Error('Duplicate municipal identity');

type Result = ReturnType<typeof loadProfileCatalog>;
const cache = new Map<string, Result>();
const checkedDate = data.checkedDate;
function officialSource(id: string, label: string, title: string, url: string): GeographicSource {
  return { id, label, title, url, publisher: 'Philippine Statistics Authority', publishedDate: null, checkedDate };
}
const census = officialSource('municipal-census', 'PSA census', '2024 POPCEN — reference date and official counts', 'https://psa.gov.ph/system/files/phcd/1_2024%20POPCEN%20Press%20Release_Declaration%20of%20Count_Revised_ONS-signed_0.pdf');
const nir: GeographicSource = { id: 'municipal-nir', label: 'RA 12000', title: 'Republic Act No. 12000 — Negros Island Region', url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/97490', publisher: 'Supreme Court E-Library', publishedDate: '2024-06-11', checkedDate };
const sulu: GeographicSource = { id: 'municipal-sulu', label: 'EO 91', title: 'Executive Order No. 91 — Sulu regional affiliation', url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/99470', publisher: 'Supreme Court E-Library', publishedDate: '2025-07-30', checkedDate };

/** Validate the selected profile only; do not allocate 1,634 full articles at import. */
export function getProfileCatalog(key: string): Result {
  const cached = cache.get(key);
  if (cached) return cached;
  const row = rows.get(key);
  if (!row) return loadProfileCatalog([], []);
  const place = row.provinceName ? `${row.provinceName}, ${row.regionName}` : row.regionName;
  const label = row.type === 'city' ? 'City' : 'Municipality';
  const listing = officialSource('municipal-listing', 'PSA POPCEN / PSGC', `${row.name} — 2024 population and official PSGC listing`, row.source);
  const sources = [listing, census];
  const notices: GeographicProfileData['notices'] = [];
  if (row.cityClassification === 'hucs' || row.cityClassification === 'iccs') {
    const classification = row.cityClassification === 'hucs' ? 'Highly Urbanized City' : 'Independent Component City';
    sources.push(officialSource('municipal-classification', 'PSA city classification', `PSGC — ${classification} listing`, `https://psa.gov.ph/classification/psgc/${row.cityClassification}`));
    notices.push({ title: 'Administrative coverage notice', text: `PSA classifies ${row.name} as ${row.cityClassification === 'hucs' ? 'a' : 'an'} ${classification}. Provincial or district placement used by the map is a navigation grouping and does not establish provincial jurisdiction over this city.`, sourceIds: ['municipal-classification'] });
  }
  if (row.mapPsgc !== row.psgc) {
    const alignmentSource = row.region === '1800000000' ? nir : sulu;
    sources.push(alignmentSource);
    notices.push({ title: 'Administrative alignment notice', text: `The current PSA code is ${row.psgc}; the pinned map retains source code ${row.mapPsgc}. This locality is displayed under ${row.regionName}.${alignmentSource === sulu ? ' Older Sulu links redirect to Region IX without changing geographic boundaries.' : ''}`, sourceIds: ['municipal-listing', alignmentSource.id] });
  }
  if (row.mapName !== row.name) {
    notices.push({ title: 'Source naming note', text: `The pinned geographic source uses “${row.mapName}”; the current map label and PSA listing use “${row.name}”. The profile is matched by the verified PSGC identity.`, sourceIds: ['municipal-listing'] });
  }
  const unavailable = (id: string, label: string, note: string) => ({ id, label, value: null, status: 'unavailable' as const, referenceDate: null, sourceIds: [], note });
  const gap = (text: string) => ({ text, status: 'unavailable' as const, sourceIds: [] });
  const profile: GeographicProfileData = {
    key, level: 'municity', psgc: row.psgc, name: row.name, levelLabel: label,
    subtitle: place, coverage: 'City / municipality census coverage · PSA 2024 POPCEN', checkedDate,
    metrics: [
      { id: 'population', label: 'Population', value: row.population, unit: 'people', status: 'verified', referenceDate: data.populationReferenceDate, sourceIds: ['municipal-listing', 'municipal-census'], note: '2024 census count; not a live estimate or a share of a provincial total.' },
      { id: 'psgc', label: `${label} PSGC`, value: row.psgc, status: 'verified', referenceDate: checkedDate, sourceIds: ['municipal-listing'], note: 'PSA listing checked on this date; this is not a founding date.' },
      unavailable('area', 'Land area', 'A compatible official city or municipality land-area reference has not yet been verified.'),
      unavailable('density', 'Population density', 'Withheld until a compatible official land-area reference is verified.'),
      unavailable('barangays', 'Barangays', 'A current city or municipality barangay count has not yet been verified. Province-wide counts are not reused here.'),
    ],
    notices,
    sections: [
      { title: 'Geography and Location', paragraphs: [{ text: `${row.name} is listed as a ${row.type} ${row.provinceName ? `with ${row.provinceName} in` : 'in'} ${row.regionName}, Philippines. The population figure describes this local government unit.`, sourceIds: ['municipal-listing'] }, gap('Detailed local terrain, boundaries and landmarks have not yet been verified for this profile.')] },
      { title: 'History and Administration', paragraphs: [{ text: `The PSA listing identifies ${row.name} with PSGC ${row.psgc}. The map supports city and municipality selection; barangay boundaries are not part of this drilldown.`, sourceIds: ['municipal-listing'] }, gap('A founding date and local historical account have not yet been verified from an official source.')] },
      { title: 'Economy and Culture', paragraphs: [gap('City- or municipality-specific industries, livelihoods, festivals and cultural traditions have not yet been verified. Provincial descriptions are not used as local facts.')] },
    ],
    notes: [{ text: 'Population is the PSA’s published 2024 POPCEN count with reference date 1 July 2024. The source-check date is separate. Geographic names and administrative groupings may differ from the older map dataset.', sourceIds: ['municipal-listing', 'municipal-census'] }, gap('Unavailable fields and background sections are editorial gaps awaiting official references. They do not mean the locality has no history, economy or cultural heritage.')],
  };
  const result = loadProfileCatalog([profile], sources);
  if (result.status === 'ready') cache.set(key, result);
  return result;
}
