import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, ArrowRight, AlertTriangle, GripVertical } from "lucide-react";

const KanbanLogo = ({ isDark }: { isDark: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="21" height="21" rx="4" stroke="var(--accent-color)" strokeWidth="2" />
    <rect x="5"   y="5"   width="6"  height="11" rx="1.5" fill="var(--accent-color)" />
    <rect x="13"  y="5"   width="6"  height="6.5" rx="1.5" fill="var(--accent-color)" />
  </svg>
);
import { kanbanApi } from "../lib/api";

interface Task {
  id: string;
  title: string;
  description: string;
  column: "todo" | "progress" | "done";
  priority: "high" | "medium" | "low";
  tag: string;
  createdAt: string;
}

interface KanbanViewProps {
  isDark: boolean;
  lang: "zh" | "en";
  isBound: boolean;
  onSyncNotify: () => void;
}

export default function KanbanView({ isDark, lang, isBound, onSyncNotify }: KanbanViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTag, setNewTag] = useState("Feature");
  const [filterTag, setFilterTag] = useState("all");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">("synced");
  const [targetColumn, setTargetColumn] = useState<"todo" | "progress" | "done">("todo");

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<"todo" | "progress" | "done" | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const t = {
    zh: {
      todo: "待处理", progress: "进行中", done: "已完成",
      addTask: "添加卡片", quickAdd: "添加卡片...",
      noTasks: "拖动卡片至此处，或创建新卡片",
      title: "任务标题", desc: "详情描述", priority: "优先级", tag: "分类标签",
      cancel: "取消", save: "保存",
      high: "紧急", medium: "中等", low: "普通",
      allTags: "全部标签",
      placeholderTitle: "例如：支持嵌套 JSON 驼峰转换",
      placeholderDesc: "描述具体要完成的内容和评估要求...",
      syncedWithHalfsphere: "已同步 HalfSphere", unsynced: "本地脱机模式", syncing: "同步中...",
      addCardShort: "添加卡片", deleteConfirm: "删除卡片",
    },
    en: {
      todo: "To Do", progress: "In Progress", done: "Done",
      addTask: "Add Card", quickAdd: "Add a card...",
      noTasks: "Drag cards here or add a new one",
      title: "Title", desc: "Description", priority: "Priority", tag: "Tag",
      cancel: "Cancel", save: "Save",
      high: "Urgent", medium: "Medium", low: "Low",
      allTags: "All Tags",
      placeholderTitle: "e.g., Support nested JSON conversion",
      placeholderDesc: "Describe what needs to be accomplished...",
      syncedWithHalfsphere: "Synced to HalfSphere", unsynced: "Local Mode", syncing: "Syncing...",
      addCardShort: "Add a card", deleteConfirm: "Delete",
    }
  }[lang];

  useEffect(() => {
    if (isBound) {
      kanbanApi.list().then(apiTasks => {
        const mapped: Task[] = apiTasks.map(t => ({
          id: t.id, title: t.title, description: t.description,
          column: t.col, priority: t.priority, tag: t.tag,
          createdAt: t.created_at.slice(0, 16).replace("T", " "),
        }));
        setTasks(mapped);
        localStorage.setItem("gsyen_kanban_tasks", JSON.stringify(mapped));
      }).catch(() => {
        const saved = localStorage.getItem("gsyen_kanban_tasks");
        if (saved) setTasks(JSON.parse(saved));
      });
      return;
    }
    const saved = localStorage.getItem("gsyen_kanban_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const defaults: Task[] = [
        { id: "task-1", title: lang === "zh" ? "编写 SSE 实时流媒体 API 手册" : "Document SSE streaming API endpoint", description: lang === "zh" ? "输出高清晰的中英文 Readme 格式说明文件。" : "Write clear bilingual API docs.", column: "todo", priority: "high", tag: "Docs", createdAt: "2026-05-24 12:30" },
        { id: "task-2", title: lang === "zh" ? "React 极简代办列表本地缓存组件" : "Optimize client-side Todo local persistence", description: lang === "zh" ? "开发完备的 CRUD 周期和微动效。" : "Smooth transitions and localStorage sync.", column: "todo", priority: "medium", tag: "UI Component", createdAt: "2026-05-24 14:05" },
      ];
      setTasks(defaults);
    }
  }, [isBound]);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("gsyen_kanban_tasks", JSON.stringify(newTasks));
    setSyncState("syncing");
    onSyncNotify();
    setTimeout(() => setSyncState("synced"), 850);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (isBound) {
      try {
        const apiTask = await kanbanApi.create({ title: newTitle, description: newDesc, col: targetColumn, priority: newPriority, tag: newTag || "Task", position: 0 });
        const task: Task = { id: apiTask.id, title: apiTask.title, description: apiTask.description, column: apiTask.col, priority: apiTask.priority, tag: apiTask.tag, createdAt: apiTask.created_at.slice(0, 16).replace("T", " ") };
        saveTasks([task, ...tasks]);
      } catch (err) { console.error("kanban add:", err); }
    } else {
      saveTasks([{ id: "task-" + Date.now(), title: newTitle, description: newDesc, column: targetColumn, priority: newPriority, tag: newTag || "Task", createdAt: new Date().toISOString().replace("T", " ").substring(0, 16) }, ...tasks]);
    }
    setNewTitle(""); setNewDesc(""); setNewPriority("medium"); setNewTag("Feature"); setShowAddModal(false);
  };

  const moveTask = (taskId: string, direction: "prev" | "next") => {
    const cols: ("todo" | "progress" | "done")[] = ["todo", "progress", "done"];
    let newCol: "todo" | "progress" | "done" = "todo";
    const updated = tasks.map(task => {
      if (task.id === taskId) {
        const idx = cols.indexOf(task.column);
        const nextIdx = direction === "prev" ? Math.max(0, idx - 1) : Math.min(2, idx + 1);
        newCol = cols[nextIdx];
        return { ...task, column: newCol };
      }
      return task;
    });
    saveTasks(updated);
    if (isBound) kanbanApi.update(taskId, { col: newCol }).catch(console.error);
  };

  const deleteTask = (taskId: string) => {
    saveTasks(tasks.filter(t => t.id !== taskId));
    if (isBound) kanbanApi.remove(taskId).catch(console.error);
  };

  const openAddModal = (col: "todo" | "progress" | "done") => {
    setTargetColumn(col);
    setShowAddModal(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
    setDragOverTaskId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, col: "todo" | "progress" | "done") => {
    e.preventDefault();
    if (dragOverCol !== col) setDragOverCol(col);
  };

  const handleDragOverCard = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardId !== draggedTaskId && dragOverTaskId !== cardId) setDragOverTaskId(cardId);
  };

  const handleDropColumn = (e: React.DragEvent, targetCol: "todo" | "progress" | "done") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const dragTask = tasks[taskIndex];
    if (dragTask.column === targetCol && dragOverTaskId === null) { handleDragEnd(); return; }
    const updatedTasks = [...tasks];
    updatedTasks.splice(taskIndex, 1);
    updatedTasks.push({ ...dragTask, column: targetCol });
    saveTasks(updatedTasks);
    if (isBound && dragTask.column !== targetCol) kanbanApi.update(dragTask.id, { col: targetCol }).catch(console.error);
    handleDragEnd();
  };

  const handleDropCard = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId || taskId === targetTaskId) { handleDragEnd(); return; }
    const dragIdx = tasks.findIndex(t => t.id === taskId);
    const targetIdx = tasks.findIndex(t => t.id === targetTaskId);
    if (dragIdx === -1 || targetIdx === -1) return;
    const dragTask = tasks[dragIdx];
    const targetTask = tasks[targetIdx];
    const updatedTasks = [...tasks];
    updatedTasks.splice(dragIdx, 1);
    const newTargetIdx = updatedTasks.findIndex(t => t.id === targetTaskId);
    updatedTasks.splice(newTargetIdx, 0, { ...dragTask, column: targetTask.column });
    saveTasks(updatedTasks);
    handleDragEnd();
  };

  const distinctTags = Array.from(new Set(tasks.map(t => t.tag)));
  const tagsList = ["all", ...distinctTags];
  const filteredTasks = filterTag === "all" ? tasks : tasks.filter(t => t.tag === filterTag);

  const colMeta = {
    todo:     { dot: "bg-[var(--accent-color)]",   badge: "bg-[var(--accent-glow)] text-[var(--accent-color)] border border-[var(--accent-color)]/20" },
    progress: { dot: "bg-amber-400",                badge: "bg-amber-400/10 text-amber-600 border border-amber-400/20 dark:text-amber-400" },
    done:     { dot: "bg-emerald-500",              badge: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400" },
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden" id="kanban-view-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-main)] px-5 py-3.5 gap-3 flex-shrink-0 z-10" id="kanban-view-header">
        <div className="flex items-center gap-3">
          <KanbanLogo isDark={isDark} />
          <div>
            <h1 className="font-sans font-bold text-[15px] text-[var(--text-main)] tracking-tight leading-none">
              {lang === "zh" ? "研发协同看板" : "Kanban Board"}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {lang === "zh" ? "拖拽卡片，支持多端同步" : "Drag & drop cards, multi-device sync"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tag filter */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] outline-none cursor-pointer hover:border-[var(--accent-color)]/40 focus:border-[var(--accent-color)] transition-all"
          >
            <option value="all">{t.allTags}</option>
            {tagsList.filter(tg => tg !== "all").map(tg => (
              <option key={tg} value={tg}>{tg}</option>
            ))}
          </select>

          {/* Sync status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isBound ? "bg-emerald-500" : "bg-[var(--text-muted)]"} ${syncState === "syncing" ? "animate-ping" : ""}`} />
            <span className="text-[var(--text-muted)] font-medium">
              {isBound ? (syncState === "syncing" ? t.syncing : t.syncedWithHalfsphere) : t.unsynced}
            </span>
          </div>

          <button
            onClick={() => openAddModal("todo")}
            className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-semibold text-[12px] rounded-lg py-1.5 px-4 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addTask}</span>
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-5 flex gap-4 select-none" id="kanban-scroller">
        {(["todo", "progress", "done"] as const).map(col => {
          const colTasks = filteredTasks.filter(tsk => tsk.column === col);
          const isOverThisCol = dragOverCol === col;
          const meta = colMeta[col];

          return (
            <div
              key={col}
              onDragOver={(e) => handleDragOverColumn(e, col)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDropColumn(e, col)}
              className={`w-72 min-w-[288px] flex flex-col h-full max-h-[calc(100vh-160px)] bg-[var(--bg-card)] rounded-2xl border transition-all duration-200 p-3.5 ${
                isOverThisCol
                  ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-glow)] scale-[1.01]"
                  : "border-[var(--border-color)]"
              }`}
              id={`col-${col}`}
            >
              {/* Column header */}
              <div className="flex justify-between items-center px-1 py-1 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                  <h3 className="text-[12px] font-semibold text-[var(--text-main)] tracking-wide">
                    {t[col]}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openAddModal(col)}
                  className="p-1 rounded-md hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  title={t.addTask}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Card list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5" id={`card-list-${col}`}>
                {colTasks.length === 0 ? (
                  <div className="py-16 text-center text-[11px] text-[var(--text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-xl px-4">
                    {t.noTasks}
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isDragged = draggedTaskId === task.id;
                    const isDragOverThis = dragOverTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverCard(e, task.id)}
                        onDrop={(e) => handleDropCard(e, task.id)}
                        className={`group relative flex flex-col bg-[var(--bg-input)] border rounded-xl p-3.5 transition-all duration-150 cursor-grab active:cursor-grabbing ${
                          isDragged
                            ? "opacity-30 scale-95 border-dashed border-[var(--accent-color)]"
                            : isDragOverThis
                              ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-glow)] -translate-y-0.5 shadow-md"
                              : "border-[var(--border-color)] hover:border-[var(--accent-color)]/30 hover:shadow-sm"
                        }`}
                        id={`task-card-${task.id}`}
                      >
                        {/* Drag handle */}
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 text-[var(--text-muted)] cursor-grab">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex justify-between items-start gap-2 mb-1.5 pl-2">
                          <span className="text-[13px] font-semibold text-[var(--text-main)] leading-snug group-hover:text-[var(--accent-color)] transition-colors break-words">
                            {task.title}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all cursor-pointer flex-shrink-0"
                            title={t.deleteConfirm}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed break-words pl-2">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-auto pt-2.5 border-t border-[var(--border-color)] flex items-center justify-between gap-2 flex-wrap pl-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              task.priority === "high"
                                ? "bg-red-500/8 text-red-600 dark:text-red-400 border border-red-500/15"
                                : task.priority === "medium"
                                  ? "bg-[var(--accent-glow)] text-[var(--accent-color)] border border-[var(--accent-color)]/15"
                                  : "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15"
                            }`}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {t[task.priority]}
                            </span>
                            <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] px-2 py-0.5 rounded-md">
                              {task.tag}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col !== "todo" && (
                              <button
                                onClick={() => moveTask(task.id, "prev")}
                                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition"
                                title="Move left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {col !== "done" && (
                              <button
                                onClick={() => moveTask(task.id, "next")}
                                className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition"
                                title="Move right"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column footer add */}
              <button
                onClick={() => openAddModal(col)}
                className="mt-2.5 py-2 px-3 hover:bg-[var(--border-color)]/60 text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium text-[12px] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer w-full"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addCardShort}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" id="add-task-modal">
          <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl p-5 relative">
            <h2 className="font-semibold text-[14px] text-[var(--text-main)] mb-4 pb-3 border-b border-[var(--border-color)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--accent-color)]" />
              {t.addTask} · {t[targetColumn]}
            </h2>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">{t.title}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.placeholderTitle}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-lg p-2.5 text-[12px] text-[var(--text-main)] font-medium outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">{t.desc}</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={t.placeholderDesc}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-lg p-2.5 text-[12px] text-[var(--text-main)] outline-none resize-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">{t.priority}</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-lg p-2 text-[12px] text-[var(--text-main)] font-medium outline-none cursor-pointer"
                  >
                    <option value="high">{t.high}</option>
                    <option value="medium">{t.medium}</option>
                    <option value="low">{t.low}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">{t.tag}</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-lg p-2 text-[12px] text-[var(--text-main)] font-medium outline-none cursor-pointer"
                  >
                    <option value="Algorithm">{lang === "zh" ? "算法模块" : "Algorithm"}</option>
                    <option value="UI Component">{lang === "zh" ? "UI 组件" : "UI Component"}</option>
                    <option value="Docs">{lang === "zh" ? "文档" : "Docs"}</option>
                    <option value="Feat">{lang === "zh" ? "新功能" : "Feat"}</option>
                    <option value="System">{lang === "zh" ? "系统设计" : "System"}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-4 py-1.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition text-[12px] font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white px-4 py-1.5 rounded-lg font-semibold text-[12px] transition active:scale-95"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
