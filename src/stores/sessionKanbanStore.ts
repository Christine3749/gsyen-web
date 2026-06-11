/** Per-session kanban store — columns + cards keyed by sessionId */
import { EventItem } from '../types/schedule';
import { DEFAULT_EVENTS } from '../config/scheduleConfig';
import { KanbanColumn } from './kanbanColumnStore';
export type { KanbanColumn };

const DEFAULT_COLS: KanbanColumn[] = [
  { id: 'todo',     title: '预约待编' },
  { id: 'progress', title: '执行中柜' },
  { id: 'review',   title: '评审阶段' },
  { id: 'done',     title: '极速已成' },
];

const colKey  = (sid: string) => `gsyen_kanban_cols_${sid}`;
const cardKey = (sid: string) => `gsyen_kanban_cards_${sid}`;

function loadCols(sid: string): KanbanColumn[] {
  try { const r = localStorage.getItem(colKey(sid)); if (r) return JSON.parse(r); } catch {}
  return DEFAULT_COLS.map(c => ({ ...c }));
}

function loadCards(sid: string): EventItem[] {
  try { const r = localStorage.getItem(cardKey(sid)); if (r) return JSON.parse(r); } catch {}
  return sid === 'default' ? DEFAULT_EVENTS : [];
}

function saveCols(sid: string, cols: KanbanColumn[]) {
  localStorage.setItem(colKey(sid), JSON.stringify(cols));
  window.dispatchEvent(new CustomEvent('kanban-columns-updated'));
}

function saveCards(sid: string, cards: EventItem[]) {
  localStorage.setItem(cardKey(sid), JSON.stringify(cards));
  window.dispatchEvent(new CustomEvent('schedule-updated'));
}

export const sessionKanbanStore = {
  getCols:  (sid: string) => loadCols(sid),
  getCards: (sid: string) => loadCards(sid),

  addCol: (sid: string, title: string) => {
    const cols = [...loadCols(sid), { id: `col_${Date.now()}`, title }];
    saveCols(sid, cols); return cols;
  },
  renameCol: (sid: string, id: string, title: string) => {
    const cols = loadCols(sid).map(c => c.id === id ? { ...c, title } : c);
    saveCols(sid, cols); return cols;
  },
  removeCol: (sid: string, id: string) => {
    const cols = loadCols(sid).filter(c => c.id !== id);
    saveCols(sid, cols); return cols;
  },
  reorderCols: (sid: string, fromId: string, toId: string) => {
    const cols = loadCols(sid);
    const fi = cols.findIndex(c => c.id === fromId);
    const ti = cols.findIndex(c => c.id === toId);
    if (fi < 0 || ti < 0 || fi === ti) return cols;
    const next = [...cols]; const [m] = next.splice(fi, 1); next.splice(ti, 0, m);
    saveCols(sid, next); return next;
  },

  addCard: (sid: string, card: EventItem) => {
    const cards = [...loadCards(sid), card];
    saveCards(sid, cards); return cards;
  },
  updateCard: (sid: string, id: string, changes: Partial<EventItem>) => {
    const cards = loadCards(sid).map(c => c.id === id ? { ...c, ...changes } : c);
    saveCards(sid, cards); return cards;
  },
  removeCard: (sid: string, id: string) => {
    const cards = loadCards(sid).filter(c => c.id !== id);
    saveCards(sid, cards); return cards;
  },
  clearCards: (sid: string) => { saveCards(sid, []); return []; },
};
