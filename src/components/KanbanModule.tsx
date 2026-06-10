/**
 * KanbanModule — 阶段看板独立模块
 * 从 ScheduleModule 拆出，专属 activeSpace='schedule'。
 * 共享 scheduleStore（与 ScheduleModule 数据互通）。
 */
import React, { useState } from 'react';
import { CheckCircle2, Plus, Search, X } from 'lucide-react';
import { KanbanIcon } from '../gsyen-designer';

import { EventItem, ColumnId } from '../types/schedule';
import { DEFAULT_EVENTS }    from '../config/scheduleConfig';
import { useScheduleEvents } from '../hooks/useScheduleEvents';
import { scheduleStore }     from '../stores/scheduleStore';
import { useDragDrop }       from '../hooks/useDragDrop';
import { ScheduleFooter }    from './ScheduleChrome';

import ScheduleAddForm    from './ScheduleAddForm';
import ScheduleKanbanView from './ScheduleKanbanView';
import ScheduleEventModal from './ScheduleEventModal';

interface KanbanModuleProps { lang: 'zh' | 'en'; }

export default function KanbanModule({ lang }: KanbanModuleProps) {
  const todayDate   = new Date();
  const todayString = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;

  const [filterCategory,       setFilterCategory]       = useState('all');
  const [searchText,           setSearchText]           = useState('');
  const [showAddForm,          setShowAddForm]          = useState(false);
  const [addFormInitialStatus, setAddFormInitialStatus] = useState<ColumnId>('todo');
  const [selectedEventForView, setSelectedEventForView] = useState<EventItem | null>(null);
  const [notification,         setNotification]         = useState<string | null>(null);

  const { events, addEvent, updateEvent, removeEvent, changeStatus } = useScheduleEvents(DEFAULT_EVENTS);
  const { draggingId, dragOverColumn, onDragStart, onDragEnd, onDragOverColumn, onDropColumn } = useDragDrop();

  const notify = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const activeFilteredList = events.filter(item => {
    const matchSearch   = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.subtitle.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const openAddForm = (status: ColumnId = 'todo') => {
    setAddFormInitialStatus(status);
    setShowAddForm(true);
  };

  const handleAddEvent = (event: EventItem) => {
    addEvent(event);
    notify(lang === 'zh' ? `信条安排 Deploy 成功: ${event.title}` : `Card successfully deployed: ${event.title}`);
  };

  const handleDeleteEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = events.find(ev => ev.id === id);
    removeEvent(id);
    if (selectedEventForView?.id === id) setSelectedEventForView(null);
    notify(lang === 'zh' ? `丢弃卡片: ${item?.title}` : `Incident card purged from database`);
  };

  const handleClearAll = () => {
    if (!window.confirm(lang === 'zh' ? '清空全部日程？此操作不可撤销。' : 'Clear all events? This cannot be undone.')) return;
    scheduleStore.clearAll();
    window.dispatchEvent(new CustomEvent('schedule-updated'));
    setSelectedEventForView(null);
    notify(lang === 'zh' ? '已清空全部日程' : 'All events cleared');
  };

  const handleDropColumn = (e: React.DragEvent, targetStatus: ColumnId) => {
    const id = onDropColumn(e);
    if (id) {
      changeStatus(id, targetStatus);
      notify(lang === 'zh' ? `阶段迁移至 ${targetStatus.toUpperCase()}` : `Stage updated to ${targetStatus.toUpperCase()}`);
    }
  };

  const handleShiftCard = (id: string, dir: 'back' | 'forward', e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: ColumnId[] = ['todo', 'progress', 'review', 'done'];
    const ev = events.find(item => item.id === id);
    if (!ev) return;
    const cur = cycle.indexOf(ev.status || (ev.completed ? 'done' : 'todo'));
    const nxt = dir === 'forward' ? Math.min(cur + 1, 3) : Math.max(cur - 1, 0);
    if (nxt !== cur) changeStatus(id, cycle[nxt]);
  };

  const handleSaveEvent = (id: string, changes: Partial<EventItem>) => {
    updateEvent(id, changes);
    notify(lang === 'zh' ? '信条变动调整已同步保存' : 'Manuscript revisions deployed & updated successfully');
  };

  return (
    <div className="space-y-6 text-[#1A1A1A] font-sans animate-fadeIn">

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-[#1A1A1A] text-[#F9F8F6] px-5 py-3 border border-amber-900/40 text-xs font-mono uppercase tracking-widest z-50 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
          <span>{notification}</span>
        </div>
      )}

      {/* Module header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif text-[#1A1A1A] font-bold tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[#1A1A1A] text-white rounded-none"><KanbanIcon className="w-4 h-4" /></span>
            <span>{lang === 'zh' ? 'Chronos 极速格栅日程空间' : 'Chronos Multi-Interactive Calendar'}</span>
          </h2>
          <p className="text-xs text-[#1A1A1A]/40 font-mono uppercase tracking-widest mt-1">
            {lang === 'zh' ? '融合传统 Google Calendar 侧栏联动与极低延迟拖拽，守护本地机密文册' : 'Atelier workspace integrating day-grid visualizers and bespoke task schedulers'}
          </p>
        </div>
        <div className="flex gap-4 items-center bg-white border border-[#1A1A1A]/10 px-4 py-2 text-[10px] font-mono text-[#1A1A1A]/70 uppercase tracking-widest">
          <div>{lang === 'zh' ? '总日程安排:' : 'TOTAL ENGAGED:'} <strong className="text-amber-800 font-bold">{events.length} 项</strong></div>
          <div className="w-[1px] h-4 bg-[#1A1A1A]/10" />
          <div>{lang === 'zh' ? '当前筛选视图:' : 'DISPLAYING:'} <strong className="text-[#1A1A1A]">{activeFilteredList.length} 项</strong></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#1A1A1A]/10 p-3.5 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#1A1A1A]/40" />
            <input type="text" placeholder={lang === 'zh' ? '搜索文书卡片...' : 'Filter schedule archives...'}
              value={searchText} onChange={e => setSearchText(e.target.value)}
              className="w-64 pl-9 pr-4 py-1.5 text-xs border border-[#1A1A1A]/10 rounded-none bg-[#F9F8F6]/40 focus:bg-white focus:outline-none focus:border-[#1A1A1A]/40 transition-colors text-[#1A1A1A]" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="p-1 px-3 border border-[#1A1A1A]/10 rounded-none text-xs font-mono uppercase tracking-wider bg-transparent text-[#1A1A1A] cursor-pointer">
            <option value="all">■ {lang === 'zh' ? '全领域分流' : 'ALL CATEGORIES'}</option>
            <option value="creative">{lang === 'zh' ? '创意与排版' : 'CREATIVE & DESIGN'}</option>
            <option value="finance">{lang === 'zh' ? '资产与发票' : 'CAPITAL & FLOWS'}</option>
            <option value="secure">{lang === 'zh' ? '保密机制' : 'SECURITY SCHEMES'}</option>
            <option value="strategy">{lang === 'zh' ? '战略圆桌' : 'STRATEGIC ROUND'}</option>
          </select>
        </div>
        <div className="flex items-center justify-between w-full xl:w-auto gap-4 flex-wrap">
          <button onClick={handleClearAll}
            className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase border border-red-200 text-red-700 hover:bg-red-50 transition-all rounded-none">
            {lang === 'zh' ? '清空' : 'CLEAR ALL'}
          </button>
          <button onClick={() => setShowAddForm(o => !o)}
            className={`px-4 py-1.5 font-bold text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2 rounded-none ${showAddForm ? 'bg-red-800 text-white hover:bg-red-900' : 'bg-[#1A1A1A] text-white'}`}>
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddForm ? (lang === 'zh' ? '收回表单' : 'Collapse Scribe') : (lang === 'zh' ? '签发事件' : 'Sealed Event')}</span>
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <ScheduleAddForm
          lang={lang} todayString={todayString}
          initialStatus={addFormInitialStatus}
          onAdd={handleAddEvent}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Kanban view */}
      <ScheduleKanbanView
        lang={lang} activeFilteredList={activeFilteredList}
        dragOverColumn={dragOverColumn} draggingId={draggingId}
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDragOverColumn={onDragOverColumn} onDropColumn={handleDropColumn}
        onOpenEvent={setSelectedEventForView}
        onDeleteEvent={handleDeleteEvent} onShiftCard={handleShiftCard}
        onDraftHere={colId => openAddForm(colId)}
      />

      {/* Event modal */}
      {selectedEventForView && (
        <ScheduleEventModal
          lang={lang} event={selectedEventForView}
          onClose={() => setSelectedEventForView(null)}
          onSave={handleSaveEvent}
          onDelete={id => { handleDeleteEvent(id); setSelectedEventForView(null); }}
        />
      )}

      <ScheduleFooter lang={lang} total={events.length} active={activeFilteredList.length} />
    </div>
  );
}
