import type { Palette } from './CanvasEditorTypes';

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function buildSheetTable(rows: unknown[][]): string {
  if (!rows.length) return '<div class="gs-empty">空表格</div>';
  const header = rows[0];
  const body = rows.slice(1);
  const isNumeric = (v: unknown) => v !== '' && v != null && !isNaN(Number(v));
  const th = header.map(c => `<th>${escapeHtml(String(c ?? ''))}</th>`).join('');
  const trs = body.map(r => {
    const tds = header.map((_, ci) => {
      const v = r[ci] ?? '';
      return `<td class="${isNumeric(v) ? 'num' : ''}">${escapeHtml(String(v))}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

export const DOCX_STYLE_MAP = [
  "p[style-name='Title'] => h1.gs-title:fresh",
  "p[style-name='Subtitle'] => p.gs-subtitle:fresh",
  "p[style-name='Quote'] => blockquote.gs-quote:fresh",
  "p[style-name='Intense Quote'] => blockquote.gs-quote:fresh",
];

export function officeCss(P: Palette, dark: boolean): string {
  const text  = dark ? '#d8d8d8' : '#1a1a1a';
  const sub   = dark ? '#9a9a9a' : '#6b6b6b';
  const line  = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const zebra = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const hover = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)';
  const head  = dark ? '#2c2c2c' : '#f4f4f4';
  return `
    .gs-office-doc { color:${text}; }
    .gs-office-doc h1 { font-size:26px; font-weight:700; margin:0 0 16px; letter-spacing:-0.01em; }
    .gs-office-doc h2 { font-size:20px; font-weight:700; margin:30px 0 12px; }
    .gs-office-doc h3 { font-size:16px; font-weight:600; margin:22px 0 8px; }
    .gs-office-doc p  { margin:0 0 14px; }
    .gs-office-doc .gs-title { font-size:30px; font-weight:700; margin:0 0 4px; }
    .gs-office-doc .gs-subtitle { font-size:14px; color:${sub}; margin:0 0 26px; }
    .gs-office-doc blockquote.gs-quote { border-left:3px solid ${P.accent}; margin:16px 0; padding:2px 0 2px 16px; color:${sub}; font-style:italic; }
    .gs-office-doc img { max-width:100%; border-radius:4px; margin:12px 0; display:block; }
    .gs-office-doc table { border-collapse:collapse; width:100%; margin:16px 0; font-size:13px; }
    .gs-office-doc table td, .gs-office-doc table th { border:1px solid ${line}; padding:6px 10px; }
    .gs-office-doc ul, .gs-office-doc ol { margin:0 0 14px; padding-left:22px; }
    .gs-office-doc strong { font-weight:700; }
    .gs-office-doc a { color:${P.accent}; }

    .gs-office-sheet table { border-collapse:collapse; width:max-content; min-width:100%; font-size:12.5px; }
    .gs-office-sheet th { position:sticky; top:0; background:${head}; color:${text};
      font-weight:600; text-align:left; padding:7px 10px; border:1px solid ${line}; white-space:nowrap; }
    .gs-office-sheet td { padding:6px 10px; border:1px solid ${line}; white-space:nowrap; color:${text}; }
    .gs-office-sheet td.num { text-align:right; font-family:ui-monospace,monospace; }
    .gs-office-sheet tbody tr:nth-child(even) { background:${zebra}; }
    .gs-office-sheet tbody tr:hover { background:${hover}; }
  `;
}
