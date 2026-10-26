import "server-only";
import type { ApiErrorCode } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public status = 400,
  ) {
    super(code);
  }
}

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function fail(code: ApiErrorCode, status = 400): Response {
  return Response.json({ error: code }, { status, headers: NO_STORE });
}

/** Wraps a route handler so thrown ApiErrors become JSON error responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.status);
    console.error("[api] unexpected error", err);
    return fail("server_error", 500);
  }
}

export function bearer(req: Request): string {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError("bad_request");
  }
}
