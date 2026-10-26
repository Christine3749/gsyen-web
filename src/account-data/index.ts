/** Query the existing native account data API without a provider SDK. */
export type DataError = { message: string; code?: string; details?: string; hint?: string; status?: number };
export type DataResult = { data: any; error: DataError | null; count: number | null; status: number; statusText: string };
type CountOptions = { count?: 'exact' | 'planned' | 'estimated'; head?: boolean };
type WriteOptions = CountOptions & { onConflict?: string; ignoreDuplicates?: boolean; defaultToNull?: boolean };

class AccountQuery implements PromiseLike<DataResult> {
  private readonly query = new URLSearchParams();
  private readonly headers = new Headers();
  private method = 'GET';
  private body: unknown;
  private singular: 'one' | 'optional' | undefined;
  private signal?: AbortSignal;

  constructor(private readonly url: string, private readonly request: typeof fetch) {}

  private prefer(value: string) {
    const kind = value.split('=')[0];
    const values = (this.headers.get('Prefer') || '').split(',').filter(item => item && !item.startsWith(`${kind}=`));
    this.headers.set('Prefer', [...values, value].join(','));
    return this;
  }

  select(columns = '*', options: CountOptions = {}) {
    this.query.set('select', columns.replace(/\s+/g, ''));
    if (options.head && this.method === 'GET') this.method = 'HEAD';
    if (options.count) this.prefer(`count=${options.count}`);
    if (!['GET', 'HEAD'].includes(this.method)) this.prefer('return=representation');
    return this;
  }

  private write(method: string, value: unknown, options: WriteOptions = {}) {
    this.method = method;
    this.body = value;
    if (options.count) this.prefer(`count=${options.count}`);
    if (options.defaultToNull === false) this.prefer('missing=default');
    if (Array.isArray(value) && value.length) {
      this.query.set('columns', [...new Set(value.flatMap(row => Object.keys(row)))].map(key => `"${key}"`).join(','));
    }
    return this;
  }

  insert(value: unknown, options?: WriteOptions) { return this.write('POST', value, options); }
  update(value: unknown, options?: WriteOptions) { return this.write('PATCH', value, options); }
  upsert(value: unknown, options: WriteOptions = {}) {
    this.write('POST', value, options);
    if (options.onConflict) this.query.set('on_conflict', options.onConflict);
    return this.prefer(`resolution=${options.ignoreDuplicates ? 'ignore' : 'merge'}-duplicates`);
  }
  delete(options: CountOptions = {}) { return this.write('DELETE', undefined, options); }

  private filter(column: string, operation: string, value: unknown) {
    this.query.append(column, `${operation}.${String(value)}`);
    return this;
  }
  eq(column: string, value: unknown) { return this.filter(column, 'eq', value); }
  neq(column: string, value: unknown) { return this.filter(column, 'neq', value); }
  gt(column: string, value: unknown) { return this.filter(column, 'gt', value); }
  gte(column: string, value: unknown) { return this.filter(column, 'gte', value); }
  lt(column: string, value: unknown) { return this.filter(column, 'lt', value); }
  lte(column: string, value: unknown) { return this.filter(column, 'lte', value); }
  is(column: string, value: null | boolean) { return this.filter(column, 'is', value); }
  in(column: string, values: readonly unknown[]) {
    const list = [...new Set(values)].map(value => {
      const text = String(value);
      return /[,()"\\]/.test(text) ? `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : text;
    });
    return this.filter(column, 'in', `(${list.join(',')})`);
  }
  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    const previous = this.query.get('order');
    const entry = `${column}.${options.ascending === false ? 'desc' : 'asc'}`
      + (options.nullsFirst === undefined ? '' : options.nullsFirst ? '.nullsfirst' : '.nullslast');
    this.query.set('order', previous ? `${previous},${entry}` : entry);
    return this;
  }
  limit(count: number) { this.query.set('limit', String(count)); return this; }
  single() { this.singular = 'one'; return this; }
  maybeSingle() { this.singular = 'optional'; return this; }
  abortSignal(signal: AbortSignal) { this.signal = signal; return this; }
  returns<T>() { return this; }

  rpc(args: unknown, options: CountOptions & { get?: boolean } = {}) {
    this.method = options.head ? 'HEAD' : options.get ? 'GET' : 'POST';
    if (options.count) this.prefer(`count=${options.count}`);
    if (this.method === 'POST') this.body = args;
    else for (const [key, value] of Object.entries(args as object || {})) this.query.set(key, String(value));
    return this;
  }

  private async execute(): Promise<DataResult> {
    const headers = new Headers(this.headers);
    headers.set('Accept', this.singular === 'one' || (this.singular === 'optional' && this.method !== 'GET')
      ? 'application/vnd.pgrst.object+json' : 'application/json');
    if (this.body !== undefined) headers.set('Content-Type', 'application/json');
    try {
      const suffix = this.query.toString();
      const response = await this.request(`${this.url}${suffix ? `?${suffix}` : ''}`, {
        method: this.method, headers, body: this.body === undefined ? undefined : JSON.stringify(this.body), signal: this.signal,
      });
      const text = this.method === 'HEAD' ? '' : await response.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      const total = response.headers.get('Content-Range')?.split('/')[1];
      const count = total && total !== '*' ? Number(total) : null;
      if (!response.ok) {
        const error: DataError = data && typeof data === 'object' ? data : { message: text || response.statusText };
        if (this.singular === 'optional' && error.code === 'PGRST116' && /\b0 rows\b/.test(error.details || '')) {
          return { data: null, error: null, count, status: 200, statusText: 'OK' };
        }
        return { data: null, error, count, status: response.status, statusText: response.statusText };
      }
      if (this.singular === 'optional' && Array.isArray(data)) {
        if (data.length > 1) return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple rows returned' }, count, status: 406, statusText: 'Not Acceptable' };
        data = data[0] ?? null;
      }
      return { data, error: null, count, status: response.status, statusText: response.statusText };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : String(error) }, count: null, status: 0, statusText: '' };
    }
  }

  then<TResult1 = DataResult, TResult2 = never>(
    onfulfilled?: ((value: DataResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(onfulfilled, onrejected); }
}

export function createAccountDataClient(base: string, request: typeof fetch = fetch) {
  const root = `${base.replace(/\/+$/, '')}/rest/v1`;
  return {
    from(table: string) { return new AccountQuery(`${root}/${encodeURIComponent(table)}`, request); },
    rpc(name: string, args: unknown = {}, options?: CountOptions & { get?: boolean }) {
      return new AccountQuery(`${root}/rpc/${encodeURIComponent(name)}`, request).rpc(args, options);
    },
  };
}
