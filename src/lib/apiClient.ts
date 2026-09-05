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
