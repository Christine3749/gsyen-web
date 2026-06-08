/** Local YYYY-MM-DD date string. Use instead of toISOString().split('T')[0],
 *  which converts to UTC first and rolls the date back during UTC+8
 *  midnight–8am (e.g. 2026-06-08 00:30 local → "2026-06-07"). */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
