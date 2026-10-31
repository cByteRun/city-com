import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { seed, sources } from "./seed";
import type { State, Workspace } from "./types";
const path = resolve(process.env.CITYCOM_DB_PATH || "data/citycom.sqlite");
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path);
db.exec(
  "PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS config (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
);
for (const workspace of ["demo", "live"] as const) {
  db.prepare("INSERT OR IGNORE INTO workspaces VALUES (?,?)").run(
    workspace,
    JSON.stringify(seed(workspace === "demo")),
  );
}
function directKey() {
  const value = process.env.CITYCOM_DIRECT_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(value))
    throw new Error(
      "Для LIVE Direct требуется CITYCOM_DIRECT_KEY: 32 случайных байта в hex",
    );
  return Buffer.from(value, "hex");
}
export function protectDirect(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", directKey(), iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [
    "enc-v1",
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    body.toString("hex"),
  ].join(":");
}
function revealDirect(text: string) {
  if (!text.startsWith("enc-v1:")) return text;
  const [, iv, tag, body] = text.split(":");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    directKey(),
    Buffer.from(iv, "hex"),
  );
  cipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([
    cipher.update(Buffer.from(body, "hex")),
    cipher.final(),
  ]).toString("utf8");
}
export function purgeExpiredDirect(state: State) {
  state.items = state.items.filter(
    (item) =>
      !item.private || Date.parse(item.ingestedAt) > Date.now() - 7 * 86400000,
  );
  state.clusters = state.clusters.filter((cluster) =>
    state.items.some((item) => item.clusterId === cluster.id),
  );
}
export function readState(workspace: Workspace): State {
  const state: State = JSON.parse(
    (
      db.prepare("SELECT body FROM workspaces WHERE id=?").get(workspace) as {
        body: string;
      }
    ).body,
  );
  if (workspace === "live") {
    purgeExpiredDirect(state);
    state.items = state.items.map((item) =>
      item.private ? { ...item, text: revealDirect(item.text) } : item,
    );
  }
  if (!state.directory) state.directory = seed(false).directory;
  if (workspace === "live") {
    const configured = sources(false);
    state.sources = state.sources.map((s) => {
      const config = configured.find((c) => c.id === s.id);
      return config && !s.configured
        ? {
            ...s,
            url: config.url,
            permission: config.permission,
            name: config.name,
            type: config.type,
          }
        : s;
    });
  }
  return state;
}
export function mutate<T>(
  workspace: Workspace,
  callback: (state: State) => T,
): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const state = readState(workspace);
    const result = callback(state);
    state.updatedAt = new Date().toISOString();
    db.prepare("UPDATE workspaces SET body=? WHERE id=?").run(
      JSON.stringify(
        workspace === "live"
          ? {
              ...state,
              items: state.items.map((item) =>
                item.private
                  ? { ...item, text: protectDirect(item.text) }
                  : item,
              ),
            }
          : state,
      ),
      workspace,
    );
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function audit(
  state: State,
  actor: string,
  action: string,
  target: string,
) {
  state.audit.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    target,
  });
}
export function sessionSecret() {
  if (process.env.CITYCOM_SESSION_SECRET)
    return process.env.CITYCOM_SESSION_SECRET;
  db.prepare("INSERT OR IGNORE INTO config VALUES (?,?)").run(
    "session-secret",
    randomBytes(48).toString("hex"),
  );
  return (
    db.prepare("SELECT value FROM config WHERE id=?").get("session-secret") as {
      value: string;
    }
  ).value;
}
