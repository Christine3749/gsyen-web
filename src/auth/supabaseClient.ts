import { createAccountDataClient } from '../account-data';
import { createGcpAuthSession } from './gcpAuthSession';
import { gcpDataBase, gcpDataFetch } from './gcpDataTransport';
import { createGcpRealtime } from './gcpRealtime';

// Keep the one-time cleanup of tokens left by the former provider.
try {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('sb-')) localStorage.removeItem(k);
  });
} catch {}

// Keep existing business call sites while all transport belongs to the native service.
const realtime = createGcpRealtime();
export const supabase = {
  ...createAccountDataClient(gcpDataBase, gcpDataFetch),
  auth: createGcpAuthSession(),
  channel: realtime.channel,
  removeChannel: realtime.removeChannel,
  removeAllChannels: realtime.removeAllChannels,
  getChannels: realtime.getChannels,
};
supabase.auth.onAuthStateChange(() => { realtime.authChanged(); });

if ((window as any).__supabaseClient && (window as any).__supabaseClient !== supabase) {
  console.warn('⚠️ Multiple Supabase client instances detected.');
}
(window as any).__supabaseClient = supabase;
