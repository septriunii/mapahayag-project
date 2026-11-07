export interface BarangayCoverage {
  count: number;
  expected?: number;
  high?: boolean;
  omit?: string[];
  corrections?: Record<string, { code: string; name: string }>;
}

export function barangayBoundaryPath(parent: string, high = false) {
  const resolution = high ? 'hires' : 'medres';
  const precision = high ? '0.1' : '0.01';
  return `municities/${resolution}/bgysubmuns-municity-${parent}.${precision}.json`;
}
