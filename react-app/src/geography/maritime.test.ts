import { WATER_LABELS } from './maritime';

it('keeps maritime labels separate from PSGC data and cites official naming references', () => {
  expect(WATER_LABELS.map(label => label.name)).toEqual(expect.arrayContaining(['West Philippine Sea', 'Philippine Sea', 'Pacific Ocean', 'Sulu Sea', 'Celebes Sea']));
  expect(new Set(WATER_LABELS.map(label => label.id)).size).toBe(WATER_LABELS.length);
  expect(WATER_LABELS.every(label => /^https:\/\/(www\.)?(namria\.gov\.ph|pagasa\.dost\.gov\.ph)\//.test(label.source))).toBe(true);
});
