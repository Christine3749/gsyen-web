import { getGcpAccessToken } from './gcpAuthSession';
import { resolveGsyenApiBase } from '../protocol/gsyenProtocol';

const apiBase = resolveGsyenApiBase(import.meta.env.VITE_GSYEN_API_URL as string | undefined);
export const gcpDataBase = `${apiBase || window.location.origin}/api/gcp`;

/** Keep the existing query builder; send its requests to the native data API. */
export const gcpDataFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  headers.delete('apikey');
  const token = await getGcpAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else if (headers.get('Authorization') === 'Bearer gsyen-gcp') headers.delete('Authorization');
  return fetch(input, { ...init, headers, credentials: 'include' });
};
