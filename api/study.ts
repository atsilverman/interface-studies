/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from "node:http";

const CURSOR = "https://api.cursor.com/v1";

const SPEC = `You generate one original interactive UI study for Interface Studies.

Return ONLY one fenced tsx block. No prose before or after. Do not write files. Do not clone interfaces.show widgets (Agent Run, Agent Calls, Agent Handoff, Vinyl Player, Toast Capsule, Padlock, Command Bar, charts).

Stack: React + TypeScript + Tailwind v4 + Motion (motion/react). Chrome icons: lucide-react.

Must:
- Default-export a function component.
- Wrap the object in StageCard from "../components/StageCard".
- Use zinc only, plus one accent if needed. Live / hit = emerald.
- Type: Inter via Tailwind font-sans, IBM Plex Serif is chrome-only, Geist Mono via font-mono for clocks/codes. Weight 400 default, 500 on titles/names.
- Motion: import { springs } from "../lib/tokens" (snappy, soft, stamp). Linear loops only for meters/clocks/live blink.
- Desktop AND mobile in one component. const compact = useViewport().layout === "mobile". Rearrange with StageMorph (stable id) — do not remount two copies, no CSS-rotate landscape.
- Play / pause / reset only via useStageDock({ playing, onToggle, onReset }) from "../lib/stage-dock" if the study is time-based. Never put transport inside StageCard. The hook returns { playing, progress } with progress from 0 to 1. Keep match clocks in the study. Do not destructure other fields.
- Dummy data local. Original physical metaphor or small tool — not a product page.

StageCard props: title, meta?, badge?, badgeTone?: "default"|"live"|"hit", footer?, wide?, children.
Inner well padding: px-5 pt-4 pb-4 (px-4 on compact). StageCard already draws the 28px zinc shell and concentric white well (inner radius = outer − inset). If you nest another rounded rectangle inside a rounded parent with a uniform gutter, import nestedRadius from "../lib/tokens" and use inner = outer − inset. Do not pick rounded-2xl by habit. Pills stay rounded-full.

Allowed imports only:
- react
- motion/react
- lucide-react
- ../components/StageCard
- ../components/StageMorph
- ../lib/tokens
- ../lib/stage-dock
- ../lib/viewport

Example skeleton:
\`\`\`tsx
import { useState } from "react";
import { motion } from "motion/react";
import { StageCard } from "../components/StageCard";
import { StageMorph } from "../components/StageMorph";
import { springs } from "../lib/tokens";
import { useViewport } from "../lib/viewport";

export default function Study() {
  const { layout } = useViewport();
  const compact = layout === "mobile";
  return (
    <StageCard title="Pulse" meta="Meter">
      <div className={compact ? "px-4 pt-4 pb-4" : "px-5 pt-4 pb-4"}>
        <StageMorph id="figure">
          <p className="font-mono text-[28px] tracking-tighter tabular-nums text-zinc-900">00</p>
        </StageMorph>
      </div>
    </StageCard>
  );
}
\`\`\`
`;

type StudyKind = "create" | "edit" | "remix";

type CreateStudyBody = {
  kind: StudyKind;
  title: string;
  prompt: string;
  parentSource?: string;
};

type CursorRun = { id?: string; status?: string; result?: string };

function key() {
  return process.env.CURSOR_API_KEY?.trim() ?? "";
}

function isCursorConfigured() {
  return key().length > 8;
}

async function cursorFetch(path: string, init?: RequestInit) {
  const token = key();
  try {
    const response = await fetch(`${CURSOR}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(12_000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = { message: text.slice(0, 400) };
      }
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      data: {
        message: timedOut
          ? "Cursor did not respond in time."
          : error instanceof Error
            ? error.message
            : "Cursor request failed.",
      },
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function errorMessage(data: unknown, fallback: string) {
  const record = asRecord(data);
  const message = record.message ?? record.error;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function extractSource(text: string) {
  const fence = text.match(/```(?:tsx|typescript|jsx|ts)\s*\n([\s\S]*?)```/i);
  if (fence?.[1]) return fence[1].trim();
  const stripped = text.trim();
  if (/export default function|export default \(/m.test(stripped) && stripped.includes("StageCard")) {
    return stripped;
  }
  return null;
}

function buildPrompt(body: CreateStudyBody) {
  const kind =
    body.kind === "edit" ? "Edit the parent study. Apply only the new direction." : body.kind === "remix" ? "Remix the parent. Keep the design language unless the brief demands a departure." : "Create a new study.";
  const parent = body.parentSource?.trim()
    ? `\n\nParent study source (start from this, do not clone it blindly):\n\`\`\`tsx\n${body.parentSource.trim()}\n\`\`\``
    : "";
  return `${SPEC}\n\n${kind}\nTitle: ${body.title}\nBrief:\n${body.prompt}${parent}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runIdFrom(record: Record<string, unknown>) {
  if (typeof record.latestRunId === "string" && record.latestRunId) return record.latestRunId;
  const run = asRecord(record.run);
  if (typeof run.id === "string" && run.id) return run.id;
  const agent = asRecord(record.agent);
  if (typeof agent.latestRunId === "string" && agent.latestRunId) return agent.latestRunId;
  return "";
}

async function lookupNamedAgent(name: string) {
  const listed = await cursorFetch("/agents?limit=20");
  if (!listed.ok) return null;
  const items = Array.isArray(asRecord(listed.data).items) ? (asRecord(listed.data).items as unknown[]) : [];
  const match = items.map(asRecord).find((item) => item.name === name);
  if (!match || typeof match.id !== "string") return null;
  let runId = runIdFrom(match);
  if (!runId) {
    const full = await cursorFetch(`/agents/${encodeURIComponent(match.id)}`);
    if (full.ok) runId = runIdFrom(asRecord(full.data));
  }
  return { agentId: match.id, runId };
}

async function startStudyRun(body: CreateStudyBody) {
  if (!isCursorConfigured()) {
    return { ok: false as const, status: 501, error: "CURSOR_API_KEY is not set on the server." };
  }
  const name = `Study: ${body.title} · ${Date.now().toString(36)}`.slice(0, 100);
  const payload = {
    prompt: { text: buildPrompt(body) },
    name,
  };
  // Create often never flushes a body until the run is far along, which trips
  // Vercel's 30s cap. The agent still appears on GET /v1/agents, so we kick
  // off create and resolve ids from the list.
  void cursorFetch("/agents", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  const deadline = Date.now() + 16_000;
  await sleep(400);
  while (Date.now() < deadline) {
    const found = await lookupNamedAgent(name);
    if (found?.agentId && found.runId) {
      return { ok: true as const, agentId: found.agentId, runId: found.runId };
    }
    await sleep(700);
  }
  return { ok: false as const, status: 504, error: "Cursor accepted the brief but did not return a run in time." };
}

async function pollStudyRun(agentId: string, runId: string) {
  if (!isCursorConfigured()) {
    return { ok: false as const, status: 501, error: "CURSOR_API_KEY is not set on the server." };
  }
  const run = await cursorFetch(`/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`);
  if (!run.ok) {
    return { ok: false as const, status: run.status, error: errorMessage(run.data, "Could not read the agent run.") };
  }
  const record = asRecord(run.data) as CursorRun;
  const status = (record.status ?? "").toUpperCase();
  if (status === "FINISHED") {
    const result = typeof record.result === "string" ? record.result : "";
    const source = extractSource(result);
    if (!source) {
      return {
        ok: false as const,
        status: 502,
        error: "The agent finished without a tsx study. Try the brief again.",
      };
    }
    return { ok: true as const, state: "ready" as const, source };
  }
  if (status === "ERROR" || status === "CANCELLED" || status === "EXPIRED") {
    const result = typeof record.result === "string" ? record.result : "";
    return {
      ok: false as const,
      status: 502,
      error: result.trim().slice(0, 280) || `Cursor run ${status.toLowerCase()}.`,
    };
  }
  return { ok: true as const, state: "running" as const, phase: status || "RUNNING" };
}

const hits = new Map<string, number[]>();

function clientIp(req: IncomingMessage) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
}

function rateLimited(ip: string) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function send(res: ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

type BodyRequest = IncomingMessage & { body?: unknown };

function readStream(req: IncomingMessage, ms = 4000) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => fail(new Error("body timeout")), ms);
    const fail = (error: Error) => {
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      reject(error);
    };
    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (size > 400_000) {
        fail(new Error("payload too large"));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => {
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const onError = (error: Error) => fail(error);
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
    req.resume();
  });
}

async function readJsonBody(req: BodyRequest) {
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await readStream(req);
  return raw ? JSON.parse(raw) : {};
}

function parseKind(value: unknown): StudyKind | null {
  return value === "create" || value === "edit" || value === "remix" ? value : null;
}

export async function handleStudy(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://studio.local");
  const method = (req.method ?? "GET").toUpperCase();

  if (method === "GET" && !url.searchParams.get("agentId")) {
    send(res, 200, { configured: isCursorConfigured() });
    return;
  }

  if (method === "GET") {
    const agentId = url.searchParams.get("agentId")?.trim() ?? "";
    const runId = url.searchParams.get("runId")?.trim() ?? "";
    if (!agentId || !runId) {
      send(res, 400, { error: "agentId and runId are required." });
      return;
    }
    const result = await pollStudyRun(agentId, runId);
    if (!result.ok) {
      send(res, result.status, { error: result.error });
      return;
    }
    send(res, 200, result);
    return;
  }

  if (method !== "POST") {
    send(res, 405, { error: "Method not allowed." });
    return;
  }

  if (rateLimited(clientIp(req))) {
    send(res, 429, { error: "Too many builds. Wait a few minutes." });
    return;
  }

  let parsed: CreateStudyBody;
  try {
    const raw = (await readJsonBody(req)) as Partial<CreateStudyBody>;
    const kind = parseKind(raw.kind);
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 80) : "";
    const prompt = typeof raw.prompt === "string" ? raw.prompt.trim().slice(0, 8000) : "";
    const parentSource = typeof raw.parentSource === "string" ? raw.parentSource.slice(0, 80_000) : undefined;
    if (!kind || !title || !prompt) {
      send(res, 400, { error: "kind, title, and prompt are required." });
      return;
    }
    parsed = { kind, title, prompt, parentSource };
  } catch (error) {
    send(
      res,
      400,
      { error: error instanceof Error && error.message === "body timeout" ? "Could not read the request body." : "Invalid JSON." },
    );
    return;
  }

  const started = await startStudyRun(parsed);
  if (!started.ok) {
    send(res, started.status, { error: started.error });
    return;
  }
  send(res, 200, { agentId: started.agentId, runId: started.runId });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await handleStudy(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error.";
    send(res, 500, { error: message });
  }
}
