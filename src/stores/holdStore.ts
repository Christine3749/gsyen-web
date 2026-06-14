import { supabase } from '../lib/supabase';

export type HoldCategory = 'electronic' | 'consumable' | 'fashion' | 'home' | 'other';
export type HoldStatus   = 'wishlist' | 'owned' | 'retired';

export interface HoldItem {
  id:            string;
  name:          string;
  category:      HoldCategory;
  brand?:        string;
  price?:        number;
  quantity?:     number;
  purchaseDate?: string;
  expiryDate?:   string;
  status:        HoldStatus;
  notes?:        string;
}

const LS_KEY     = 'gsyen_hold';
const SYNCED_KEY = 'gsyen_hold_synced_ids';

function getSyncedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY) || '[]')); }
  catch { return new Set(); }
}
function addSyncedId(id: string) {
  const ids = getSyncedIds(); ids.add(id);
  localStorage.setItem(SYNCED_KEY, JSON.stringify([...ids]));
}
function load(): HoldItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function save(rows: HoldItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event('hold-updated'));
}

export const holdStore = {
  getAll: (): HoldItem[] => load(),
  add(item: HoldItem) {
    if (!_uid) return;
    save([item, ...load()]);
    void _upsert(item);
  },
  remove(id: string) {
    save(load().filter(r => r.id !== id));
    void _delete(id);
  },
  update(id: string, patch: Partial<HoldItem>) {
    if (!_uid) return;
    const rows = load().map(r => r.id === id ? { ...r, ...patch } : r);
    save(rows);
    const updated = rows.find(r => r.id === id);
    if (updated) void _upsert(updated);
  },
};

let _uid: string | null = null;
const _pendingDeletes    = new Set<string>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _rt: any = null;

async function _upsert(item: HoldItem) {
  if (!supabase || !_uid) return;
  const { error } = await supabase.from('gsyen_hold').upsert(
    { id: item.id, user_id: _uid, data: item, updated_at: new Date().toISOString() }
  );
  if (error) return;
  addSyncedId(item.id);
}

async function _delete(id: string) {
  if (!supabase || !_uid) return;
  _pendingDeletes.add(id);
  try {
    const { error } = await supabase.from('gsyen_hold').delete().eq('id', id).eq('user_id', _uid);
    if (error) return;
  } finally {
    _pendingDeletes.delete(id);
  }
}

async function _pull(userId: string) {
  if (!supabase) return;
  const { data } = await supabase.from('gsyen_hold').select('*').eq('user_id', userId);
  if (!data) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remote: HoldItem[] = data.map((r: any) => r.data as HoldItem).filter(r => !_pendingDeletes.has(r.id));
  const local     = load();
  const remIds    = new Set(remote.map(r => r.id));
  const syncedIds = getSyncedIds();
  const localOnly = local.filter(r => !remIds.has(r.id) && !syncedIds.has(r.id));
  for (const item of localOnly) await _upsert(item);
  for (const r of remote) addSyncedId(r.id);
  save([...remote, ...localOnly]);
}

function _subscribeRealtime(uid: string) {
  _rt?.unsubscribe();
  _rt = supabase!
    .channel(`gsyen_hold:${uid}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'gsyen_hold', filter: `user_id=eq.${uid}` },
      () => _pull(uid)
    )
    .subscribe();
}

supabase?.auth.onAuthStateChange((_ev, session) => {
  const newUid = session?.user?.id ?? null;
  if (newUid && newUid !== _uid) {
    _rt?.unsubscribe(); _rt = null;
    localStorage.removeItem(LS_KEY); localStorage.removeItem(SYNCED_KEY);
    _pendingDeletes.clear();
    _uid = newUid; void _pull(_uid); _subscribeRealtime(_uid);
  } else if (!newUid && _uid) {
    _uid = null; _rt?.unsubscribe(); _rt = null;
    localStorage.removeItem(LS_KEY); localStorage.removeItem(SYNCED_KEY);
    window.dispatchEvent(new Event('hold-updated'));
  } else { _uid = newUid; }
});
