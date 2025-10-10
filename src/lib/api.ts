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
  } catch (e: unknown) {
    return { error: (e instanceof Error ? e.message : "Network error") };
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

  employeeLogin: (input: { employeeNumber: string; password: string }) =>
    postJson<{ message: string; user: { username: string; role: string } }>("/api/auth/employee/login", input),

  logout: () => postJson<{ message: string }>("/api/auth/logout", {}),

  me: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) return { error: json?.error || "Unauthorized" };
      return { data: json } as ApiResult<{ user: { username: string } }>;
    } catch (e: unknown) {
      return { error: (e instanceof Error ? e.message : "Network error") };
    }
  },

  // Transaction endpoints
  createTransaction: (input: {
    amount: string;
    currency: string;
    provider: string;
    payeeAccountInfo: string;
    swiftCode: string;
  }) => postJson<{ message: string; transaction: unknown }>("/api/transactions", input),

  getMyTransactions: async () => {
    try {
      const res = await fetch("/api/transactions/my", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) return { error: json?.error || "Failed to fetch transactions" };
      return { data: json } as ApiResult<{ transactions: unknown[] }>;
    } catch (e: unknown) {
      return { error: (e instanceof Error ? e.message : "Network error") };
    }
  },

  // Employee endpoints
  getPendingTransactions: async () => {
    try {
      const res = await fetch("/api/transactions/pending", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) return { error: json?.error || "Failed to fetch pending transactions" };
      return { data: json } as ApiResult<{ transactions: unknown[] }>;
    } catch (e: unknown) {
      return { error: (e instanceof Error ? e.message : "Network error") };
    }
  },

  verifyTransaction: (input: { transactionId: string }) =>
    postJson<{ message: string }>("/api/transactions/verify", input),

  submitToSwift: (input: { transactionIds: string[] }) =>
    postJson<{ message: string; submittedCount: number }>("/api/transactions/submit-to-swift", input),
};
