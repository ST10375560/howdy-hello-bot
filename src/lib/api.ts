export type ApiResult<T> = { data?: T; error?: string };

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get CSRF token");
  const json = (await res.json()) as { csrfToken: string };
  return json.csrfToken;
}

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (json && (json.error as string)) || "Request failed" };
    }
    return { data: json as T };
  } catch (e: any) {
    return { error: e?.message || "Network error" };
  }
}

export const api = {
  register: (input: {
    fullName: string;
    idNumber: string;
    accountNumber: string;
    username: string;
    password: string;
  }) => postJson<{ message: string; user: { username: string } }>("/api/auth/register", input),

  login: (input: { username: string; accountNumber: string; password: string }) =>
    postJson<{ message: string; user: { username: string } }>("/api/auth/login", input),

  logout: () => postJson<{ message: string }>("/api/auth/logout", {}),

  me: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) return { error: json?.error || "Unauthorized" };
      return { data: json } as ApiResult<{ user: { username: string } }>;
    } catch (e: any) {
      return { error: e?.message || "Network error" };
    }
  },
};
