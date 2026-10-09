export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message =
        typeof body.detail === "string"
          ? body.detail
          : body.detail?.[0]?.msg ?? message;
    } catch {
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}