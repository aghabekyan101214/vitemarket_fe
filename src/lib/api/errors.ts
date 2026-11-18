/** `application/problem+json` (RFC 9457) errors from the backend. */
export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail: string,
    readonly endpoint: string,
  ) {
    super(`${endpoint} → ${status} ${code}: ${detail}`);
  }
}

/** 404 (`site_not_found`, `locale_not_supported`, …): pages call `notFound()`. */
export class NotFoundError extends ApiError {
  override name = "NotFoundError";
}

export function isNotFound(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError;
}

export async function errorFromResponse(res: Response, endpoint: string): Promise<ApiError> {
  let code = `http_${res.status}`;
  let detail = res.statusText;
  try {
    const body = (await res.json()) as { code?: unknown; detail?: unknown; title?: unknown };
    if (typeof body.code === "string") code = body.code;
    if (typeof body.detail === "string") detail = body.detail;
    else if (typeof body.title === "string") detail = body.title;
  } catch {
    // not JSON: keep the status text
  }
  const Cls = res.status === 404 ? NotFoundError : ApiError;
  return new Cls(res.status, code, detail, endpoint);
}
