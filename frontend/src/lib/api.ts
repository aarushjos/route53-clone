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
      const first = body.detail?.[0];
      const index = first?.loc?.find((p: unknown) => typeof p === "number");
      message =
        typeof body.detail === "string"
          ? body.detail
          : first
            ? `${index !== undefined ? `Record ${index + 1}: ` : ""}${String(first.msg).replace(/^Value error, /, "")}`
            : message;
    } catch {
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}