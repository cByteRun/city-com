import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./store";
import type { User, Role } from "./types";
export function sign(user: User) {
  const data = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + 8 * 3600000 }),
  ).toString("base64url");
  return (
    data +
    "." +
    createHmac("sha256", sessionSecret()).update(data).digest("base64url")
  );
}
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get("citycom-session")?.value;
  if (!token) return null;
  try {
    const [data, sig] = token.split(".");
    const expected = createHmac("sha256", sessionSecret())
      .update(data)
      .digest("base64url");
    if (
      !sig ||
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return null;
    const u = JSON.parse(Buffer.from(data, "base64url").toString());
    return u.exp > Date.now() ? u : null;
  } catch {
    return null;
  }
}
export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
export function canEdit(role: Role) {
  return role !== "viewer";
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    origin &&
    new URL(origin).host !==
      (request.headers.get("host") || new URL(request.url).host)
  )
    throw new Error("FORBIDDEN");
}
export function errorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : "Ошибка операции";
  return Response.json(
    {
      error:
        message === "UNAUTHORIZED"
          ? "Войдите в систему"
          : message === "FORBIDDEN"
            ? "Недостаточно прав"
            : message,
    },
    {
      status:
        message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400,
    },
  );
}
