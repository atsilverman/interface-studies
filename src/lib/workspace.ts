const WORKSPACE_KEY = "silverman-studio-workspace";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Shared cloud library for this playground so desktop and phone stay in sync. */
export const SITE_WORKSPACE = "2832bf93-03ef-4c5a-9c3b-1d74c093b9cc";

export function isWorkspaceId(value: string) {
  return UUID.test(value.trim());
}

export function siteWorkspaceId() {
  const fromEnv = import.meta.env.VITE_STUDIO_WORKSPACE?.trim() ?? "";
  if (isWorkspaceId(fromEnv)) return fromEnv;
  return SITE_WORKSPACE;
}

export function readWorkspaceId() {
  const existing = localStorage.getItem(WORKSPACE_KEY);
  if (existing && isWorkspaceId(existing)) return existing;
  const id = siteWorkspaceId();
  localStorage.setItem(WORKSPACE_KEY, id);
  return id;
}

export function writeWorkspaceId(id: string) {
  localStorage.setItem(WORKSPACE_KEY, id);
}
