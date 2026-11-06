import type { Bounds } from './projection';

// Viewing extent leaves space for sea and ocean labels.
export const MARITIME_BOUNDS: Bounds = { lonMin: 112.2, lonMax: 131.2, latMin: 2.3, latMax: 25.3 };

export interface WaterLabel {
  id: string; name: string; lines: string[]; anchor: [number, number];
  kind: 'ocean' | 'sea' | 'local'; minScale: number; source: string;
}
const namriaMap = 'https://www.namria.gov.ph/jdownloads/Annual_Report/2019_NAMRIA_Annual_Report.pdf';
const localSeas = 'https://www.namria.gov.ph/jdownloads/Navigational_Warning/NAVPHIL_031_2022.pdf';
// Anchors are editorial label positions in water, not official centroids or
// sea boundaries. Names/locations follow the cited official reference maps.
export const WATER_LABELS: readonly WaterLabel[] = [
  { id: 'west-philippine', name: 'West Philippine Sea', lines: ['West Philippine', 'Sea'], anchor: [116.3, 14.8], kind: 'sea', minScale: 0.5, source: namriaMap },
  { id: 'philippine', name: 'Philippine Sea', lines: ['Philippine Sea'], anchor: [127.5, 17.4], kind: 'sea', minScale: 0.5, source: namriaMap },
  { id: 'pacific', name: 'Pacific Ocean', lines: ['Pacific', 'Ocean'], anchor: [129.7, 12.5], kind: 'ocean', minScale: 0.5, source: 'https://www.pagasa.dost.gov.ph/learning-tools/philippine-area-of-responsibility' },
  { id: 'sulu', name: 'Sulu Sea', lines: ['Sulu Sea'], anchor: [119.3, 8.4], kind: 'sea', minScale: 0.5, source: namriaMap },
  { id: 'celebes', name: 'Celebes Sea', lines: ['Celebes Sea'], anchor: [123.0, 4.1], kind: 'sea', minScale: 0.5, source: namriaMap },
  { id: 'sibuyan', name: 'Sibuyan Sea', lines: ['Sibuyan Sea'], anchor: [122.25, 12.5], kind: 'local', minScale: 65, source: localSeas },
  { id: 'visayan', name: 'Visayan Sea', lines: ['Visayan Sea'], anchor: [123.35, 11.5], kind: 'local', minScale: 100, source: localSeas },
  { id: 'camotes', name: 'Camotes Sea', lines: ['Camotes Sea'], anchor: [124.25, 10.55], kind: 'local', minScale: 135, source: 'https://www.namria.gov.ph/jdownloads/Navigational_Warning/NAVPHIL_030_2022.pdf' },
  { id: 'bohol', name: 'Bohol Sea', lines: ['Bohol Sea'], anchor: [124.0, 9.15], kind: 'local', minScale: 80, source: localSeas },
];
