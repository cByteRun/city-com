import { z } from "zod";
export const incomingSchema = z.object({
  text: z.string().min(5).max(10000),
  url: z.string().max(2000).default(""),
  publishedAt: z.string().datetime(),
  publishedAtPrecision: z.enum(["day", "second"]).optional(),
  authorId: z.string().max(200).optional(),
  reactions: z.number().int().nonnegative().optional(),
  replies: z.number().int().nonnegative().optional(),
  views: z.number().int().nonnegative().optional(),
});
export type Incoming = z.infer<typeof incomingSchema>;
export function matchesKeywords(text: string, value = "") {
  const words = value
    .split(",")
    .map((word) => word.trim().toLocaleLowerCase())
    .filter(Boolean);
  return (
    !words.length ||
    words.some((word) => text.toLocaleLowerCase().includes(word))
  );
}
