import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Clock, MapPin, CheckCircle, ChevronLeft, ChevronRight, Bell, CalendarDays, CalendarRange, Clock3 } from "lucide-react";
import { calendarApi } from "../lib/api";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: "meeting" | "sync" | "development" | "other";
  description?: string;
}

interface CalendarViewProps {
  isDark: boolean;
  lang: "zh" | "en";
  isBound: boolean;
  onSyncNotify: () => void;
}

type CalendarMode = "year" | "month" | "week" | "day";

export default function CalendarView({ isDark, lang, isBound, onSyncNotify }: CalendarViewProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState("2026-05-24");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventType, setNewEventType] = useState<"meeting" | "sync" | "development" | "other">("meeting");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">("synced");

  const t = {
    zh: {
      calendarTitle: "全景协同日历",
      calendarSubTitle: "联邦对齐排程 · 实时云同步网关",
      addEvent: "新建日程",
      eventTitle: "日程标题",
      time: "开始时间",
      type: "日程类别",
      desc: "详情描述",
      cancel: "取消",
      save: "保存并同步",
      noEvents: "此区间未排定任何日程",
      selectedDayEvents: "日的日程活动",
      meeting: "视频会议",
      sync: "生态联调",
      development: "内核研发",
      other: "待办备忘",
      placeholderEventTitle: "例如：HalfSphere 月度协同讨论",
      placeholderEventDesc: "记录本阶段对齐要点与待办内容...",
      syncedWithHalfsphere: "双向同步至 Halfsphere",
      unsynced: "本地脱机模式",
      syncing: "正在对齐排程...",
      modeYear: "年",
      modeMonth: "月",
      modeWeek: "周",
      modeDay: "日",
      createPrompt: "在此新增日程卡片"
    },
    en: {
      calendarTitle: "Symphony Calendar",
      calendarSubTitle: "Federated Alignment & Remote Task Scheduling",
      addEvent: "New Event",
      eventTitle: "Event Title",
      time: "Start Time",
      type: "Category",
      desc: "Details",
      cancel: "Cancel",
      save: "Save & Sync",
      noEvents: "No scheduled events here",
      selectedDayEvents: "agenda",
      meeting: "Meeting",
      sync: "Sync-Up",
      development: "Core Dev",
      other: "Reminders",
      placeholderEventTitle: "e.g., Weekly roadmap align with Halfsphere",
      placeholderEventDesc: "Core agendas to discuss...",
      syncedWithHalfsphere: "Synced to Halfsphere",
      unsynced: "Local Cache Only",
      syncing: "Syncing plan...",
      modeYear: "Year",
      modeMonth: "Month",
      modeWeek: "Week",
      modeDay: "Day",
      createPrompt: "Schedule an event here"
    }
  }[lang];

  // Load — API when logged in, localStorage when offline
  useEffect(() => {
    if (isBound) {
      calendarApi.list().then(apiEvs => {
        const mapped: ScheduleEvent[] = apiEvs.map(e => ({
          id: e.id, title: e.title, date: e.date, time: e.time,
          type: e.type, description: e.description,
        }));
        setEvents(mapped);
        localStorage.setItem("gsyen_calendar_events", JSON.stringify(mapped));
      }).catch(() => {
        const saved = localStorage.getItem("gsyen_calendar_events");
        if (saved) setEvents(JSON.parse(saved));
      });
      return;
    }
    const saved = localStorage.getItem("gsyen_calendar_events");
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      const defaultEvents: ScheduleEvent[] = [
        { id: "event-1", title: lang === "zh" ? "gsyen & Halfsphere 新模块对齐会" : "gsyen & Halfsphere Alignment Session", date: "2026-05-24", time: "10:30", type: "meeting", description: lang === "zh" ? "核对看板、日历、邮箱三个大板块在极简框架下的视觉渲染与流畅下拉效果。" : "Ensure layout and smooth scroll transitions match criteria." },
        { id: "event-2", title: lang === "zh" ? "极速 IDE SSE 联调诊断" : "SSE Stream Diagnostic Benchmark", date: "2026-05-24", time: "15:00", type: "sync", description: lang === "zh" ? "对大于 1000 字的超长 Markdown 文本渲染和流式输出进行性能压测，确保不卡顿。" : "Benchmark rendering performance of streaming deep text modules with zero lags." },
        { id: "event-3", title: lang === "zh" ? "驼峰命名转换器部署校验" : "Deploy camelCase Converter", date: "2026-05-26", time: "09:00", type: "development", description: lang === "zh" ? "检查深层 JSON key 的递归处理，测试 kebab-case 极限用例。" : "Test edge cases for recursive object key conversions." },
      ];
      setEvents(defaultEvents);
      localStorage.setItem("gsyen_calendar_events", JSON.stringify(defaultEvents));
    }
  }, [isBound]);

  const saveEvents = (newEvents: ScheduleEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem("gsyen_calendar_events", JSON.stringify(newEvents));
    setSyncState("syncing");
    onSyncNotify();
    setTimeout(() => setSyncState("synced"), 800);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    if (isBound) {
      try {
        const apiEv = await calendarApi.create({ title: newEventTitle, date: selectedDate, time: newEventTime, type: newEventType, description: newEventDesc });
        saveEvents([...events, { id: apiEv.id, title: apiEv.title, date: apiEv.date, time: apiEv.time, type: apiEv.type, description: apiEv.description }]);
      } catch (err) { console.error("calendar add:", err); }
    } else {
      saveEvents([...events, { id: "ev-" + Date.now(), title: newEventTitle, date: selectedDate, time: newEventTime, type: newEventType, description: newEventDesc }]);
    }
    setNewEventTitle(""); setNewEventTime("10:00"); setNewEventType("meeting"); setNewEventDesc(""); setShowAddModal(false);
  };

  const handleQuickAddAtTime = (dateStr: string, timeStr: string) => {
    setSelectedDate(dateStr);
    setNewEventTime(timeStr);
    setShowAddModal(true);
  };

  const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveEvents(events.filter(ev => ev.id !== id));
    if (isBound) calendarApi.remove(id).catch(console.error);
  };

  // Fixed targeting May 2026 based on metadata timestamp
  const year2026 = 2026;
  const daysInMay = 31;
  const startDayOffset = 5; // May 1, 2026 is Friday index 5 map (Sunday=0, Monday=1, ... Fri=5)

  const getDayDetailsString = (dayNum: number, monthVal = 5) => {
    const paddedM = String(monthVal).padStart(2, "0");
    const paddedD = String(dayNum).padStart(2, "0");
    return `2026-${paddedM}-${paddedD}`;
  };

  const selectedDateDayNum = parseInt(selectedDate.split("-")[2]) || 24;
  const selectedDateMonthNum = parseInt(selectedDate.split("-")[1]) || 5;

  // Weekdays mapping
  const daysOfWeek = lang === "zh" 
    ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper: Get array of dates for the selected week
  const getSelectedWeekRange = () => {
    // Standard Math index for May 2026: May 1 is Friday (5)
    // Find absolute day of year or simpler: index inside May
    const dayOfWeekIdx = (selectedDateDayNum + 4) % 7; // Sunday is index 0
    const startOfWeekDay = selectedDateDayNum - dayOfWeekIdx;
    
    return Array.from({ length: 7 }).map((_, i) => {
      const activeDay = startOfWeekDay + i;
      if (activeDay >= 1 && activeDay <= 31) {
        return {
          dayNum: activeDay,
          dateStr: getDayDetailsString(activeDay),
          label: daysOfWeek[i]
        };
      } else if (activeDay < 1) {
        // Previous month (April has 30 days)
        const prevMonthDay = 30 + activeDay;
        return {
          dayNum: prevMonthDay,
          dateStr: getDayDetailsString(prevMonthDay, 4),
          label: daysOfWeek[i]
        };
      } else {
        // Next month (June)
        const nextMonthDay = activeDay - 31;
        return {
          dayNum: nextMonthDay,
          dateStr: getDayDetailsString(nextMonthDay, 6),
          label: daysOfWeek[i]
        };
      }
    });
  };

  // Mini month configurations for 2026
  const monthsOf2026 = [
    { name: lang === "zh" ? "一月" : "January", days: 31, offset: 4 },
    { name: lang === "zh" ? "二月" : "February", days: 28, offset: 0 },
    { name: lang === "zh" ? "三月" : "March", days: 31, offset: 0 },
    { name: lang === "zh" ? "四月" : "April", days: 30, offset: 3 },
    { name: lang === "zh" ? "五月" : "May", days: 31, offset: 5 },
    { name: lang === "zh" ? "六月" : "June", days: 30, offset: 1 },
    { name: lang === "zh" ? "七月" : "July", days: 31, offset: 3 },
    { name: lang === "zh" ? "八月" : "August", days: 31, offset: 6 },
    { name: lang === "zh" ? "九月" : "September", days: 30, offset: 2 },
    { name: lang === "zh" ? "十月" : "October", days: 31, offset: 4 },
    { name: lang === "zh" ? "十一月" : "November", days: 30, offset: 0 },
    { name: lang === "zh" ? "十二月" : "December", days: 31, offset: 2 }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden" id="calendar-view-container">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-color)] px-6 py-4.5 gap-4 shadow-sm bg-[var(--bg-main)]" id="calendar-view-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--accent-glow)] rounded-xl border border-[var(--accent-color)]/25 shadow-sm">
            <Calendar className="w-5.5 h-5.5 text-[var(--accent-color)]" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-xl text-[var(--text-main)] tracking-tight">
              {t.calendarTitle}
            </h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-bold">
              {t.calendarSubTitle}
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Controls (年月周日) */}
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Segmented Mode Picker */}
          <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)]" id="calendar-mode-selector">
            {(["year", "month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCalendarMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                  calendarMode === mode 
                    ? "bg-white dark:bg-[#1a1f22] text-[var(--accent-color)] shadow-xs" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {mode === "year" ? t.modeYear : mode === "month" ? t.modeMonth : mode === "week" ? t.modeWeek : t.modeDay}
              </button>
            ))}
          </div>

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[11px] font-mono font-bold shadow-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${isBound ? "bg-[var(--accent-color)]" : "bg-neutral-400"} ${syncState === "syncing" ? "animate-ping" : ""}`}></span>
            <span className="text-[var(--text-muted)]">
              {isBound 
                ? (syncState === "syncing" ? t.syncing : t.syncedWithHalfsphere) 
                : t.unsynced
              }
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-extrabold text-xs rounded-lg py-1.5 px-4.5 transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addEvent}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-color)] overflow-hidden">
        
        {/* Main Content Area based on View Mode */}
        <div className="flex-1 p-6 overflow-y-auto" id="calendar-workspace">
          
          {/* ================= YEAR VIEW ================= */}
          {calendarMode === "year" && (
            <div className="space-y-6" id="year-mode-canvas">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/60">
                <h2 className="text-base font-extrabold text-[var(--text-main)] font-sans">2026 年份全景图</h2>
                <span className="text-xs text-[var(--text-muted)] font-bold">点击任意月份快速切换进入月盘</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {monthsOf2026.map((mon, mIndex) => {
                  const mNum = mIndex + 1;
                  const totalEvs = events.filter(e => parseInt(e.date.split("-")[1]) === mNum).length;
                  return (
                    <div 
                      key={mon.name}
                      onClick={() => {
                        setSelectedDate(`2026-${String(mNum).padStart(2, "0")}-15`);
                        setCalendarMode("month");
                      }}
                      className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-color)]/40 hover:scale-[1.02] cursor-pointer transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-2 pb-1 border-b border-[var(--border-color)]/40">
                        <span className="text-xs font-extrabold text-[var(--text-main)]">{mon.name}</span>
                        {totalEvs > 0 && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[var(--accent-color)]/10 text-[var(--accent-color)] rounded-md">
                            {totalEvs} 任务
                          </span>
                        )}
                      </div>

                      {/* Micro calendar days preview */}
                      <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-bold text-[var(--text-muted)]/70 mb-1.5 font-mono">
                        {lang === "zh" ? ["日", "一", "二", "三", "四", "五", "六"].map(d => <span key={d}>{d}</span>) : ["S","M","T","W","T","F","S"].map((d, i) => <span key={i}>{d}</span>)}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 text-center">
                        {/* Offsets */}
                        {Array.from({ length: mon.offset }).map((_, i) => (
                          <div key={`o-${i}`} className="w-2.5 h-2.5" />
                        ))}
                        {/* Days */}
                        {Array.from({ length: mon.days }).map((_, dIdx) => {
                          const activeD = dIdx + 1;
                          const exactDStr = getDayDetailsString(activeD, mNum);
                          const hasEv = events.some(e => e.date === exactDStr);
                          return (
                            <span 
                              key={exactDStr}
                              className={`text-[9.5px] font-bold font-mono py-0.5 rounded-xs transition-colors ${
                                hasEv ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-main)] hover:bg-[var(--bg-card)]"
                              }`}
                            >
                              {activeD}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= MONTH VIEW ================= */}
          {calendarMode === "month" && (
            <div id="month-mode-canvas">
              {/* Days of week titles */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-3">
                {daysOfWeek.map((day, i) => (
                  <span key={i} className="text-xs font-mono font-extrabold uppercase tracking-widest text-[var(--text-muted)] py-1">
                    {day}
                  </span>
                ))}
              </div>

              {/* Calendar grid rendering */}
              <div className="grid grid-cols-7 gap-2.5" id="calendar-cell-nodes">
                {/* Blanks for start offset */}
                {Array.from({ length: startDayOffset }).map((_, idx) => (
                  <div 
                    key={`empty-${idx}`} 
                    className="aspect-square bg-transparent border border-dashed border-[var(--border-color)]/25 rounded-xl"
                  />
                ))}

                {/* Actual May days */}
                {Array.from({ length: daysInMay }).map((_, dIdx) => {
                  const dayStr = getDayDetailsString(dIdx + 1);
                  const dayEvents = events.filter(e => e.date === dayStr);
                  const isSelected = selectedDate === dayStr;
                  const isCurrentDay = dIdx + 1 === 24; // May 24, 2026 standard system index

                  return (
                    <button
                      key={`day-${dIdx + 1}`}
                      onClick={() => setSelectedDate(dayStr)}
                      className={`relative aspect-square flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer overflow-hidden group
                        ${isSelected 
                          ? "bg-[var(--bg-sidebar-active)] border-[var(--accent-color)] text-[var(--text-main)] shadow-md" 
                          : isCurrentDay 
                            ? "bg-[var(--accent-glow)]/40 border-[var(--accent-color)]/60 text-[var(--text-main)]" 
                            : "bg-[var(--bg-input)] border-[var(--border-color)] hover:border-[var(--border-color)]/100 hover:scale-[1.01] text-[var(--text-main)]"
                        }
                      `}
                      id={`calendar-cell-may-${dIdx + 1}`}
                    >
                      {/* Day number */}
                      <span className={`text-[13px] font-mono leading-none tracking-tight font-extrabold ${
                        isSelected ? "text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]" : isCurrentDay ? "text-[var(--accent-color)]" : "text-[var(--text-main)]"
                      }`}>
                        {dIdx + 1}
                      </span>

                      {/* Tiny pulsing beacon if current day */}
                      {isCurrentDay && (
                        <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-[var(--accent-color)] rounded-full animate-pulse shadow-sm shadow-[var(--accent-color)]/50" />
                      )}

                      {/* Day events badges inside cell */}
                      <div className="mt-auto space-y-1.5 w-full overflow-hidden" id={`day-preview-events-${dIdx + 1}`}>
                        {dayEvents.slice(0, 2).map((ev) => {
                          const dotColor = ev.type === "meeting" ? "bg-amber-500" 
                                        : ev.type === "sync" ? "bg-blue-500" 
                                        : ev.type === "development" ? "bg-emerald-500" 
                                        : "bg-stone-500";
                          return (
                            <div 
                              key={ev.id} 
                              className="flex items-center gap-1 text-[9.5px] truncate text-[var(--text-muted)] font-extrabold max-w-full leading-none scale-95 origin-left"
                              title={ev.title}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                              <span className="truncate group-hover:text-[var(--text-main)] transition-colors">{ev.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[8px] font-extrabold text-[var(--text-muted)] leading-none pl-1 font-mono">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= WEEK VIEW ================= */}
          {calendarMode === "week" && (
            <div className="space-y-4" id="week-mode-canvas">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/60 mb-2">
                <h2 className="text-sm font-extrabold text-[var(--text-main)] font-sans">
                  周日程对齐规划 ({getSelectedWeekRange()[0].dateStr} 至 {getSelectedWeekRange()[6].dateStr})
                </h2>
              </div>

              {/* 7 columns grid side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[420px]">
                {getSelectedWeekRange().map((wkDay) => {
                  const dayEvs = events.filter(e => e.date === wkDay.dateStr);
                  const isTargetDate = selectedDate === wkDay.dateStr;
                  return (
                    <div 
                      key={wkDay.dateStr} 
                      onClick={() => setSelectedDate(wkDay.dateStr)}
                      className={`flex flex-col bg-[var(--bg-input)] rounded-2xl p-3 border cursor-pointer transition-all duration-200 ${
                        isTargetDate 
                          ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-glow)] bg-[var(--bg-sidebar-active)]" 
                          : "border-[var(--border-color)] hover:border-neutral-400"
                      }`}
                    >
                      {/* Weekday column label header */}
                      <div className="text-center pb-2 border-b border-[var(--border-color)]/60 mb-3">
                        <span className="block text-[11px] text-[var(--text-muted)] font-sans font-extrabold uppercase">
                          {wkDay.label}
                        </span>
                        <span className={`text-base font-mono font-extrabold ${isTargetDate ? "text-[var(--accent-color)]" : "text-[var(--text-main)]"}`}>
                          {wkDay.dayNum}
                        </span>
                      </div>

                      {/* List of elements */}
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[310px]">
                        {dayEvs.length === 0 ? (
                          <div className="py-8 text-center text-[10px] text-neutral-400 dark:text-neutral-500 italic font-bold">
                            - Empty -
                          </div>
                        ) : (
                          dayEvs.map(ev => {
                            const badgeColor = ev.type === "meeting" ? "border-amber-400 text-amber-600 dark:text-amber-400" 
                                            : ev.type === "sync" ? "border-blue-400 text-blue-600 dark:text-blue-400" 
                                            : "border-emerald-400 text-emerald-600 dark:text-emerald-400";
                            return (
                              <div 
                                key={ev.id} 
                                className={`p-2 bg-[var(--bg-card)] rounded-lg text-[10.5px] border border-l-3 ${badgeColor} font-bold tracking-tight shadow-2xs hover:scale-[1.02] transition-transform`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="truncate max-w-[85%]" title={ev.title}>{ev.title}</span>
                                  <button onClick={(e) => handleDeleteEvent(ev.id, e)} className="text-neutral-400 hover:text-rose-500 cursor-pointer">
                                    ×
                                  </button>
                                </div>
                                <div className="text-[8px] font-mono text-[var(--text-muted)] mt-1">{ev.time}</div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Quick add trigger in footer */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddAtTime(wkDay.dateStr, "09:00");
                        }}
                        className="mt-3.5 w-full py-1 border border-dashed border-[var(--border-color)] rounded-lg text-[10px] font-extrabold text-[var(--text-muted)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-colors text-center"
                      >
                        + 日程
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= DAY VIEW ================= */}
          {calendarMode === "day" && (
            <div className="space-y-4" id="day-mode-canvas">
              <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-color)]/60">
                <h2 className="text-base font-extrabold text-[var(--text-main)] font-sans">
                  {selectedDate} ({daysOfWeek[(selectedDateDayNum + 4) % 7]}) 日计划清单
                </h2>
                <span className="text-xs text-[var(--text-muted)] font-bold">点击对应时间条槽，秒速秒建日程</span>
              </div>

              {/* Time block matrix column from 08:00 to 20:00 */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-2">
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map((timeSlot) => {
                  const evAtTime = events.find(e => e.date === selectedDate && e.time.startsWith(timeSlot.substring(0, 2)));

                  return (
                    <div 
                      key={timeSlot}
                      onClick={() => handleQuickAddAtTime(selectedDate, timeSlot)}
                      className="group flex gap-4 p-3 rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] hover:border-[var(--accent-color)]/40 transition-all cursor-pointer items-center min-h-[50px]"
                    >
                      <div className="w-14 text-xs font-mono font-extrabold text-slate-400 dark:text-neutral-500 text-center border-r border-[var(--border-color)]/60 pr-2 flex-shrink-0">
                        {timeSlot}
                      </div>

                      {evAtTime ? (
                        <div 
                          onClick={(e) => e.stopPropagation()} // Stop modal prompt
                          className="flex-1 flex justify-between items-center bg-white dark:bg-[#1f2429] p-2.5 rounded-lg border-l-4 border-[var(--accent-color)] shadow-xs"
                        >
                          <div>
                            <span className="font-extrabold text-xs text-[var(--text-main)] block">{evAtTime.title}</span>
                            {evAtTime.description && <span className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{evAtTime.description}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[var(--accent-glow)] text-[9px] font-extrabold text-[var(--accent-color)] font-mono">
                              {evAtTime.time} / {t[evAtTime.type]}
                            </span>
                            <button
                              onClick={(e) => handleDeleteEvent(evAtTime.id, e)}
                              className="text-neutral-400 hover:text-red-500 p-1 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-[11px] italic text-[var(--text-muted)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          + {t.createPrompt}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Quick Day Agenda display */}
        <div className="w-full lg:w-96 p-6 flex flex-col h-full bg-[var(--bg-card)]/35 overflow-y-auto" id="selected-day-agenda">
          <div className="flex items-center justify-between pb-3.5 mb-4.5 border-b border-[var(--border-color)]">
            <div>
              <h3 className="font-extrabold text-[13px] text-[var(--text-main)] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[var(--accent-color)]" />
                <span>2026-05-{String(selectedDateDayNum).padStart(2, "0")} {t.selectedDayEvents}</span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                {events.filter(e => e.date === selectedDate).length} 个日程安排已对齐
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="cursor-pointer bg-[var(--accent-glow)] hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] font-extrabold text-xs rounded-lg py-1 px-3 transition flex items-center gap-1 border border-[var(--accent-color)]/30 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addEvent}</span>
            </button>
          </div>

          {/* List of Selected Day events */}
          <div className="flex-1 space-y-3.5" id="events-agenda-container">
            {events.filter(e => e.date === selectedDate).length === 0 ? (
              <div className="py-24 text-center select-none border border-dashed border-[var(--border-color)]/40 rounded-2xl p-6 bg-[var(--bg-input)]/25">
                <Calendar className="w-8 h-8 text-[var(--text-muted)]/30 mx-auto mb-2.5" />
                <p className="text-xs italic font-bold text-[var(--text-muted)]">{t.noEvents}</p>
              </div>
            ) : (
              events.filter(e => e.date === selectedDate).map(ev => {
                const borderTheme = ev.type === "meeting" ? "border-amber-400/50 hover:border-amber-400" 
                                  : ev.type === "sync" ? "border-blue-400/50 hover:border-blue-400" 
                                  : ev.type === "development" ? "border-emerald-400/50 hover:border-emerald-400" 
                                  : "border-stone-400/50 hover:border-stone-400";

                return (
                  <div
                    key={ev.id}
                    className={`p-4 bg-[var(--bg-input)] rounded-xl border-l-[4px] ${borderTheme} shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:shadow-md group hover:translate-y-[-1px] transition-all`}
                    id={`agenda-event-${ev.id}`}
                  >
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="text-xs font-extrabold text-[var(--text-main)] group-hover:text-[var(--accent-color)] transition-colors leading-normal break-words">
                        {ev.title}
                      </span>
                      
                      <button
                        onClick={(e) => handleDeleteEvent(ev.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono font-bold py-1.5">
                      <span className="flex items-center gap-1 text-[var(--accent-color)]">
                        <Clock className="w-3.5 h-3.5" />
                        {ev.time}
                      </span>
                      <span className="capitalize px-1.5 py-0.2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[9.5px] font-sans font-bold">
                        {t[ev.type] || ev.type}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed mt-1 font-bold border-t border-[var(--border-color)]/20 pt-1.5 break-words whitespace-pre-wrap">
                        {ev.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Add Event Modal with premium styling and bold weights */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity" id="add-event-modal">
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col justify-between overflow-hidden">
            <h2 className="font-sans font-extrabold text-base text-[var(--text-main)] mb-4 pb-2 border-b border-[var(--border-color)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--accent-color)]" />
              <span>{t.addEvent} (2026-05-{String(selectedDateDayNum).padStart(2, "0")})</span>
            </h2>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[var(--text-muted)] mb-1.5 font-sans">{t.eventTitle}</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder={t.placeholderEventTitle}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2.5 text-xs text-[var(--text-main)] font-bold outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-muted)] mb-1.5 font-sans">{t.time}</label>
                  <input
                    type="time"
                    required
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2 text-xs text-[var(--text-main)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[var(--text-muted)] mb-1.5 font-sans">{t.type}</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2 text-xs text-[var(--text-main)] font-bold outline-none cursor-pointer"
                  >
                    <option value="meeting">{t.meeting}</option>
                    <option value="sync">{t.sync}</option>
                    <option value="development">{t.development}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[var(--text-muted)] mb-1.5 font-sans">{t.desc}</label>
                <textarea
                  rows={2}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder={t.placeholderEventDesc}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)]/80 rounded-lg p-2.5 text-xs text-[var(--text-main)] font-medium outline-none resize-none transition"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]/40 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg font-extrabold transition"
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
