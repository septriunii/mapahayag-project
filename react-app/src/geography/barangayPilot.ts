// Pinned 2023 source IDs and counts. Zamboanga City is independent of the
// province, though the existing map displays it under Zamboanga del Sur.
export const barangayPilot = new Map([
  ['931700000', 98],
  ['908301000', 27], ['908302000', 27], ['908303000', 22], ['908304000', 18],
  ['908305000', 28], ['908306000', 29], ['908307000', 18], ['908308000', 25],
  ['908309000', 23], ['908310000', 19], ['908311000', 29], ['908312000', 26],
  ['908313000', 29], ['908314000', 14], ['908315000', 30], ['908316000', 25],
]);

export function barangayPilotPath(parent: string) {
  // Titay has one missing polygon at medium resolution.
  const resolution = parent === '908315000' ? 'hires' : 'medres';
  const precision = resolution === 'hires' ? '0.1' : '0.01';
  return `municities/${resolution}/bgysubmuns-municity-${parent}.${precision}.json`;
}
