// 动态看板列，持久化到 localStorage
export interface KanbanColumn {
  id: string;
  title: string;
}

const KEY = 'gsyen_kanban_columns';

const DEFAULTS: KanbanColumn[] = [
  { id: 'todo',     title: '预约待编' },
  { id: 'progress', title: '执行中柜' },
  { id: 'review',   title: '评审阶段' },
  { id: 'done',     title: '极速已成' },
];

function load(): KanbanColumn[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULTS;
}

function persist(cols: KanbanColumn[]) {
  localStorage.setItem(KEY, JSON.stringify(cols));
  window.dispatchEvent(new CustomEvent('kanban-columns-updated'));
}

export const kanbanColumnStore = {
  getAll: (): KanbanColumn[] => load(),

  add: (title: string): KanbanColumn => {
    const col: KanbanColumn = { id: `col_${Date.now()}`, title };
    persist([...load(), col]);
    return col;
  },

  rename: (id: string, title: string) => {
    persist(load().map(c => c.id === id ? { ...c, title } : c));
  },

  remove: (id: string) => {
    persist(load().filter(c => c.id !== id));
  },
};
