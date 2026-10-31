export type Notify = (text: string, error?: boolean) => void;
export interface ActionResult {
  ok?: boolean;
  message?: string;
  inserted?: number;
  duplicates?: number;
  text?: string;
}
export type Action = (
  body: Record<string, unknown>,
) => Promise<ActionResult | undefined>;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function requestJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(data.error || "Ошибка запроса", response.status);
  return data;
}
