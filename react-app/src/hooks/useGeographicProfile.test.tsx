import { act, renderHook, waitFor } from '@testing-library/react';
import { useGeographicProfile } from './useGeographicProfile';
import { loadMunicipalProfile } from '../profiles/municipalLoader';
import { parseProfileCatalog } from '../profiles/schema';

vi.mock('../profiles/municipalLoader', () => ({ loadMunicipalProfile: vi.fn() }));

it('hides old content while switching identities and ignores stale profile results', async () => {
  let release!: (result: Awaited<ReturnType<typeof loadMunicipalProfile>>) => void;
  vi.mocked(loadMunicipalProfile).mockReturnValue(new Promise(resolve => { release = resolve; }));
  const { result, rerender, unmount } = renderHook(({ key }) => useGeographicProfile(key), { initialProps: { key: 'national' } });
  expect(result.current.profile?.key).toBe('national');
  rerender({ key: 'municity:0907203000' });
  expect(result.current.profile).toBeUndefined(); expect(result.current.loading).toBe(true);
  rerender({ key: 'region:0900000000' });
  expect(result.current.profile?.key).toBe('region:0900000000');
  await act(async () => { release({ status: 'ready', catalog: parseProfileCatalog([], []) }); });
  await waitFor(() => expect(result.current.profile?.key).toBe('region:0900000000'));
  unmount();
});
