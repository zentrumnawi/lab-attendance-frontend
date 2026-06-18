export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

let csrfTokenProvider: (() => string | null) | null = null;

export function setCsrfTokenProvider(provider: () => string | null): void {
  csrfTokenProvider = provider;
}

function isUnsafeMethod(method: HttpMethod): boolean {
  return method !== "GET";
}

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, opts: { status: number; body: unknown }) {
    super(message);
    this.name = "HttpError";
    this.status = opts.status;
    this.body = opts.body;
  }
}

async function parseJsonOrText(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await res.json().catch(() => null);
  }
  return await res.text().catch(() => null);
}

export async function httpJson<T>(
  path: string,
  opts?: {
    method?: HttpMethod;
    body?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts?.headers ?? {}),
  };

  const method = opts?.method ?? "GET";

  if (isUnsafeMethod(method)) {
    const csrfToken = csrfTokenProvider?.() ?? null;
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  let body: string | undefined;
  if (opts?.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(path, {
    method,
    headers,
    body,
    signal: opts?.signal,
    credentials: "include",
  });

  const parsed = await parseJsonOrText(res);
  if (!res.ok) {
    const message = `HTTP ${res.status} ${res.statusText}`;
    throw new HttpError(message, { status: res.status, body: parsed });
  }

  return parsed as T;
}
