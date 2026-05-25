import { createClient } from "@supabase/supabase-js";

// Shared Supabase project — same instance as HalfSphere & sgsyen.
const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL  as string) || "https://hrtynofmjcumuanjvpxz.supabase.co";
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydHlub2ZtamN1bXVhbmp2cHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTQ3MDMsImV4cCI6MjA5NDQ5MDcwM30.C5DqvCITuTGAfaHTwccTfBg_r2ZSITPqRcTmmBpcIw0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export interface HalfSphereUser {
  user_id: string;
  email: string;
  membership: "free" | "pro" | "enterprise";
  name?: string;
}

// user_tiers.tier → gsyen membership
function tierToMembership(tier?: string): HalfSphereUser["membership"] {
  if (tier === "owner" || tier === "admin") return "enterprise";
  if (tier === "user") return "pro";
  return "free";
}

const USER_KEY = "hs_user";

export const auth = {
  getUser(): HalfSphereUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as HalfSphereUser) : null;
    } catch { return null; }
  },

  save(user: HalfSphereUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(USER_KEY);
    supabase.auth.signOut(); // fire-and-forget
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem(USER_KEY);
  },
};

// After a successful Supabase login, build the HalfSphereUser by querying user_tiers.
export async function buildUser(): Promise<HalfSphereUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const u = session.user;

  const { data: tierRow } = await supabase
    .from("user_tiers")
    .select("tier")
    .eq("user_id", u.id)
    .single();

  return {
    user_id: u.id,
    email: u.email ?? "",
    membership: tierToMembership(tierRow?.tier),
    name: (u.user_metadata?.display_name ?? u.user_metadata?.name) as string | undefined,
  };
}

// Central fetch wrapper — attaches Supabase Bearer token to every GCP API call.
// On 401 it clears the session and fires "hs:session-expired" so the modal re-opens.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const base  = (import.meta.env.VITE_API_URL as string) || "";

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  if (res.status === 401) {
    auth.clear();
    window.dispatchEvent(new CustomEvent("hs:session-expired"));
  }

  return res;
}
