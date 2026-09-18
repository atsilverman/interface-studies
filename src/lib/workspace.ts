const WORKSPACE_KEY = "silverman-studio-workspace";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isWorkspaceId(value: string) {
  return UUID.test(value.trim());
}

export function readWorkspaceId() {
  const existing = localStorage.getItem(WORKSPACE_KEY);
  if (existing && isWorkspaceId(existing)) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(WORKSPACE_KEY, id);
  return id;
}

export function writeWorkspaceId(id: string) {
  localStorage.setItem(WORKSPACE_KEY, id);
}
