export class ApiResponseError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly preview?: string,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

export async function parseResponseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!response.ok) {
    let errorMsg = `Request failed with HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed.error === "string") {
        errorMsg = parsed.error;
      }
    } catch {}
    throw new ApiResponseError(
      errorMsg,
      response.status,
      body.slice(0, 200),
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiResponseError(
      "Expected JSON but received a non-JSON response",
      response.status,
      body.slice(0, 200),
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiResponseError(
      "Server returned invalid JSON",
      response.status,
      body.slice(0, 200),
    );
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  return parseResponseJson<T>(response);
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const metaEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_API_BASE_URL
      : undefined;
  const baseUrl = metaEnv || (typeof process !== "undefined" ? process.env?.VITE_API_BASE_URL : "") || "";
  if (!baseUrl || !baseUrl.trim()) {
    return normalizedPath;
  }

  // When running in development or AI Studio / Cloud Run preview (e.g. localhost, *.run.app),
  // the full-stack server is co-located on the same origin.
  // Using relative path directly avoids blocked cross-origin requests to the remote worker.
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname || "";
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".run.app")
    ) {
      return normalizedPath;
    }
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${normalizedPath}`;
}

export async function fetchWithFallback(path: string, init: RequestInit): Promise<Response> {
  const primaryUrl = getApiUrl(path);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const requestInit: RequestInit = {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  };

  if (primaryUrl === normalizedPath) {
    return fetch(primaryUrl, requestInit);
  }

  try {
    const response = await fetch(primaryUrl, requestInit);
    if (!response.ok && (response.status === 404 || response.status === 502 || response.status === 503)) {
      try {
        const fallbackRes = await fetch(normalizedPath, requestInit);
        const fallbackType = fallbackRes.headers.get("content-type") || "";
        // If the fallback returned HTML (e.g. Firebase Hosting SPA index.html), do NOT return it as API response!
        if (fallbackType.includes("text/html")) {
          return response;
        }
        return fallbackRes;
      } catch {
        return response;
      }
    }
    return response;
  } catch (err) {
    console.warn(`Fetch to ${primaryUrl} failed (${err instanceof Error ? err.message : String(err)}), falling back to relative endpoint: ${normalizedPath}`);
    try {
      const fallbackRes = await fetch(normalizedPath, requestInit);
      const fallbackType = fallbackRes.headers.get("content-type") || "";
      if (fallbackType.includes("text/html")) {
        throw new ApiResponseError("API service unreachable and fallback returned HTML", 503);
      }
      return fallbackRes;
    } catch (fallbackErr) {
      if (fallbackErr instanceof ApiResponseError) throw fallbackErr;
      throw err;
    }
  }
}

