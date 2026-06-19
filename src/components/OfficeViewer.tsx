import { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { fsAdapter, type FileEntry } from '../hooks/useFileSystem';
import type { Palette } from './CanvasEditorTypes';
import { SYS_FONT } from './CanvasEditorTypes';
import { buildSheetTable, DOCX_STYLE_MAP, officeCss, htmlToMarkdown } from './officeViewerHelpers';
import { DocxEditor } from './DocxEditor';

interface Props { entry: FileEntry; P: Palette; dark: boolean; }
interface SheetData { name: string; html: string; }

function mdSiblingEntry(entry: FileEntry): FileEntry {
  const name = entry.name.replace(/\.docx$/i, '.md');
  const path = entry.path.replace(/\.docx$/i, '.md');
  return { name, path, isMarkdown: true, lastModified: Date.now() };
}

async function readArrayBuffer(entry: FileEntry): Promise<ArrayBuffer> {
  if (entry.path && (window as any).electronAPI?.readFileBuffer) {
    const buf: Uint8Array | null = await (window as any).electronAPI.readFileBuffer(entry.path);
    if (!buf) throw new Error('读取文件失败');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  if (entry.handle) {
    const file = await (entry.handle as FileSystemFileHandle).getFile();
    return file.arrayBuffer();
  }
  throw new Error('无法读取文件');
}

export function OfficeViewer({ entry, P, dark }: Props) {
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [sheets,  setSheets]  = useState<SheetData[] | null>(null);
  const [active,  setActive]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLoading(true); setDocHtml(null); setSheets(null); setError(null); setActive(0); setEditing(false);
    (async () => {
      try {
        const buf = await readArrayBuffer(entry);
        if (/\.docx$/i.test(entry.name)) {
          const result = await mammoth.convertToHtml({ arrayBuffer: buf }, {
            styleMap: DOCX_STYLE_MAP,
            convertImage: mammoth.images.imgElement(async (img: any) => {
              const data = await img.read('base64');
              return { src: `data:${img.contentType};base64,${data}` };
            }),
          } as any);
          setDocHtml(result.value);
        } else if (/\.xlsx$/i.test(entry.name)) {
          const wb = XLSX.read(buf, { type: 'array' });
          setSheets(wb.SheetNames.map(name => ({
            name,
            html: buildSheetTable(XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' }) as unknown[][]),
          })));
        } else {
          setError('暂不支持 .pptx 预览');
        }
      } catch (e) {
        setError((e as Error).message ?? '解析失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [entry.path]);

  const center: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 10, color: P.dim, fontFamily: SYS_FONT, fontSize: 14,
  };

  if (loading) return <div style={center}>正在解析文档，请稍候…</div>;
  if (error) return (
    <div style={center}>
      <div>无法预览此文件</div>
      <div style={{ fontSize: 11, color: P.dim, maxWidth: 340, textAlign: 'center' }}>{error}</div>
    </div>
  );

  const paper = dark ? '#242424' : '#ffffff';

  if (editing && docHtml !== null) {
    return (
      <DocxEditor
        initialHtml={docHtml}
        P={P}
        dark={dark}
        onBack={() => setEditing(false)}
        onSaveMd={(markdown) => fsAdapter.writeFile(mdSiblingEntry(entry), markdown)}
      />
    );
  }

  if (sheets) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: paper }}>
        <style>{officeCss(P, dark)}</style>
        <div className="gs-office-sheet" style={{ flex: 1, overflow: 'auto', padding: 16 }}
          dangerouslySetInnerHTML={{ __html: sheets[active]?.html ?? '' }} />
        {sheets.length > 1 && (
          <div style={{ display: 'flex', gap: 4, padding: '6px 12px', borderTop: `1px solid ${P.border}`,
            background: dark ? '#1c1c1c' : '#f0f0f0', overflowX: 'auto', flexShrink: 0 }}>
            {sheets.map((s, i) => (
              <button key={s.name} onClick={() => setActive(i)}
                style={{ padding: '5px 14px', fontSize: 12, fontFamily: SYS_FONT, whiteSpace: 'nowrap',
                  border: 'none', borderRadius: 5, cursor: 'pointer',
                  background: i === active ? P.accent : 'transparent',
                  color: i === active ? '#fff' : P.fg, fontWeight: i === active ? 600 : 400 }}>
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: paper, position: 'relative' }}>
      <style>{officeCss(P, dark)}</style>
      <div style={{ position: 'sticky', top: 0, display: 'flex', justifyContent: 'flex-end', gap: 8,
        padding: '10px 16px', background: paper, zIndex: 1 }}>
        <button onClick={() => fsAdapter.writeFile(mdSiblingEntry(entry), htmlToMarkdown(docHtml ?? ''))}
          style={{ padding: '5px 14px', fontSize: 12, fontFamily: SYS_FONT, border: `1px solid ${P.border}`,
            borderRadius: 5, cursor: 'pointer', background: 'transparent', color: P.fg }}>
          Export .md
        </button>
        <button onClick={() => setEditing(true)}
          style={{ padding: '5px 14px', fontSize: 12, fontFamily: SYS_FONT, fontWeight: 600, border: 'none',
            borderRadius: 5, cursor: 'pointer', background: P.accent, color: '#fff' }}>
          Edit
        </button>
      </div>
      <div className="gs-office-doc" style={{ maxWidth: 760, margin: '0 auto', padding: '0 56px 48px',
        fontFamily: '"iA Writer Quattro","Georgia","Times New Roman",serif', fontSize: 15.5, lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: docHtml ?? '' }} />
    </div>
  );
}
