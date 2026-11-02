import "server-only";
import type { ApiErrorCode } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public status = 400,
    /** A short technical reason shown under the friendly message (no secrets). */
    public detail?: string,
  ) {
    super(code);
  }
}

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function fail(code: ApiErrorCode, status = 400, detail?: string): Response {
  return Response.json(detail ? { error: code, detail } : { error: code }, { status, headers: NO_STORE });
}

/** Wraps a route handler so thrown ApiErrors become JSON error responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.status, err.detail);
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
