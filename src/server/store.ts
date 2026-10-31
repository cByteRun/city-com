import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { seed, sources } from "./seed";
import type { State, Workspace } from "./types";
const path = resolve(process.env.CITYCOM_DB_PATH || "data/citycom.sqlite");
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path);
db.exec(
  "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS config (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
);
for (const workspace of ["demo", "live"] as const) {
  db.prepare("INSERT OR IGNORE INTO workspaces VALUES (?,?)").run(
    workspace,
    JSON.stringify(seed(workspace === "demo")),
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
  if (!state.directory) state.directory = seed(false).directory;
  if (workspace === "live") {
    const configured = sources(false);
    state.sources = state.sources.map((s) => {
      const config = configured.find((c) => c.id === s.id);
      return config
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
      JSON.stringify(state),
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
