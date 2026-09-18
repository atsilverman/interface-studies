import { parseLibrary, type Library } from "./library";

export type CloudRow = {
  payload: unknown;
  updated_at: string;
};

export function isCloudConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

function rpcUrl(name: string) {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  return { href: `${base}/rest/v1/rpc/${name}`, key };
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const target = rpcUrl(name);
  if (!target) throw new Error("Cloud save is not configured");
  const response = await fetch(target.href, {
    method: "POST",
    headers: {
      apikey: target.key,
      Authorization: `Bearer ${target.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Cloud save failed (${response.status})`);
  }
  return (await response.json()) as T;
}

function rowToLibrary(row: CloudRow | null | undefined): Library | null {
  if (!row) return null;
  const parsed = parseLibrary(row.payload);
  if (!parsed) return null;
  const stamp = Date.parse(row.updated_at);
  if (!Number.isFinite(stamp)) return parsed;
  return { ...parsed, updatedAt: Math.max(parsed.updatedAt, stamp) };
}

function firstRow(data: CloudRow[] | CloudRow | null): CloudRow | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

export async function pullLibrary(id: string): Promise<Library | null> {
  const data = await rpc<CloudRow[] | CloudRow | null>("studio_get_library", { p_id: id });
  return rowToLibrary(firstRow(data));
}

export async function pushLibrary(id: string, library: Library): Promise<Library> {
  const data = await rpc<CloudRow[] | CloudRow>("studio_put_library", {
    p_id: id,
    p_payload: library,
    p_updated_at: new Date(library.updatedAt).toISOString(),
  });
  return rowToLibrary(firstRow(data)) ?? library;
}
