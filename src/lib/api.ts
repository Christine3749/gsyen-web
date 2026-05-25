// Typed API client for gsyen data endpoints.
// When the user is not logged in (no token), calls are skipped and callers
// fall back to localStorage so the app stays fully functional offline.
import { apiFetch } from "./auth";

// ─── Kanban ───────────────────────────────────────────────────────────────────

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  col: "todo" | "progress" | "done";
  priority: "high" | "medium" | "low";
  tag: string;
  position: number;
  created_at: string;
}

export const kanbanApi = {
  async list(): Promise<ApiTask[]> {
    const res = await apiFetch("/api/kanban/tasks");
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async create(task: Omit<ApiTask, "id" | "created_at">): Promise<ApiTask> {
    const res = await apiFetch("/api/kanban/tasks", { method: "POST", body: JSON.stringify(task) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id: string, patch: Partial<Omit<ApiTask, "id" | "created_at">>): Promise<ApiTask> {
    const res = await apiFetch(`/api/kanban/tasks/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await apiFetch(`/api/kanban/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  },
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface ApiEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "meeting" | "sync" | "development" | "other";
  description: string;
  created_at: string;
}

export const calendarApi = {
  async list(): Promise<ApiEvent[]> {
    const res = await apiFetch("/api/calendar/events");
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async create(event: Omit<ApiEvent, "id" | "created_at">): Promise<ApiEvent> {
    const res = await apiFetch("/api/calendar/events", { method: "POST", body: JSON.stringify(event) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id: string, patch: Partial<Omit<ApiEvent, "id" | "created_at">>): Promise<ApiEvent> {
    const res = await apiFetch(`/api/calendar/events/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await apiFetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  },
};

// ─── Emails ───────────────────────────────────────────────────────────────────

export interface ApiEmail {
  id: string;
  sender: string;
  sender_email: string;
  avatar_letter: string;
  subject: string;
  date: string;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  category: "halfsphere" | "system" | "workspace";
  created_at: string;
}

export const emailApi = {
  async list(): Promise<ApiEmail[]> {
    const res = await apiFetch("/api/emails");
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async patch(id: string, patch: { is_read?: boolean; is_starred?: boolean }): Promise<ApiEmail> {
    const res = await apiFetch(`/api/emails/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
