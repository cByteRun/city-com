import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getUser, sign, assertOrigin, errorResponse } from "@/server/auth";
import { roleLabels } from "@/server/types";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
export async function GET() {
  return Response.json({ user: await getUser() });
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { role, workspace, password } = z
      .object({
        role: z.enum(["admin", "analyst", "department", "viewer"]),
        workspace: z.enum(["demo", "live"]),
        password: z.string().default(""),
      })
      .parse(await request.json());
    if (workspace === "live") {
      const k = request.headers.get("x-forwarded-for") || "local";
      const entry = attempts.get(k);
      if (entry && entry.until > Date.now() && entry.count >= 5)
        throw new Error("Слишком много попыток. Повторите через 15 минут.");
      const expected = process.env[`CITYCOM_${role.toUpperCase()}_PASSWORD`];
      if (!expected || expected.length < 12)
        throw new Error(
          "LIVE-доступ не настроен. Администратор должен задать пароль в окружении сервера.",
        );
      if (
        password.length !== expected.length ||
        !timingSafeEqual(Buffer.from(password), Buffer.from(expected))
      ) {
        attempts.set(k, {
          count:
            (entry?.until && entry.until > Date.now() ? entry.count : 0) + 1,
          until: Date.now() + 900000,
        });
        throw new Error("Неверный пароль");
      }
      attempts.delete(k);
    }
    const user = {
      role,
      workspace,
      department: process.env.CITYCOM_DEPARTMENT || "ЖКХ",
      name:
        workspace === "demo" ? `${roleLabels[role]} · демо` : roleLabels[role],
    };
    (await cookies()).set("citycom-session", sign(user), {
      httpOnly: true,
      sameSite: "strict",
      secure:
        process.env.NODE_ENV === "production" &&
        new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 28800,
    });
    return Response.json({ user });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    assertOrigin(request);
    (await cookies()).delete("citycom-session");
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
