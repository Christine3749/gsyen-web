import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Palette } from './CanvasEditorTypes';
import { SYS_FONT } from './CanvasEditorTypes';
import { htmlToMarkdown } from './officeViewerHelpers';

interface Props {
  initialHtml: string;
  P: Palette;
  dark: boolean;
  onBack: () => void;
  onSaveMd: (markdown: string) => void | Promise<void>;
}

export function DocxEditor({ initialHtml, P, dark, onBack, onSaveMd }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
  });

  const paper = dark ? '#242424' : '#ffffff';
  const text  = dark ? '#d8d8d8' : '#1a1a1a';
  const line  = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  async function handleSave() {
    if (!editor) return;
    await onSaveMd(htmlToMarkdown(editor.getHTML()));
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: paper }}>
      <style>{`
        .gs-docx-edit .ProseMirror { outline: none; color:${text}; }
        .gs-docx-edit h1 { font-size:26px; font-weight:700; margin:0 0 16px; letter-spacing:-0.01em; }
        .gs-docx-edit h2 { font-size:20px; font-weight:700; margin:30px 0 12px; }
        .gs-docx-edit h3 { font-size:16px; font-weight:600; margin:22px 0 8px; }
        .gs-docx-edit p  { margin:0 0 14px; }
        .gs-docx-edit blockquote { border-left:3px solid ${P.accent}; margin:16px 0; padding:2px 0 2px 16px; font-style:italic; }
        .gs-docx-edit img { max-width:100%; border-radius:4px; margin:12px 0; display:block; }
        .gs-docx-edit ul, .gs-docx-edit ol { margin:0 0 14px; padding-left:22px; }
        .gs-docx-edit strong { font-weight:700; }
        .gs-docx-edit a { color:${P.accent}; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: `1px solid ${line}`, flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ padding: '5px 12px', fontSize: 12, fontFamily: SYS_FONT, border: 'none', borderRadius: 5,
            cursor: 'pointer', background: 'transparent', color: P.dim }}>
          ← View
        </button>
        <button onClick={handleSave}
          style={{ padding: '5px 14px', fontSize: 12, fontFamily: SYS_FONT, fontWeight: 600, border: 'none',
            borderRadius: 5, cursor: 'pointer', background: P.accent, color: '#fff' }}>
          Save .md
        </button>
      </div>

      <div className="gs-docx-edit" style={{ flex: 1, overflow: 'auto' }}>
        <EditorContent editor={editor}
          style={{ maxWidth: 760, margin: '0 auto', padding: '48px 56px',
            fontFamily: '"iA Writer Quattro","Georgia","Times New Roman",serif', fontSize: 15.5, lineHeight: 1.75 }} />
      </div>
    </div>
  );
}
