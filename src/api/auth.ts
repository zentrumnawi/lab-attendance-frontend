import { httpJson } from "./http";

export type CsrfTokenResponse = { csrfToken: string };

export function parseCsrfToken(data: CsrfTokenResponse): string {
  const token = data.csrfToken;
  if (token) {
    return token;
  }

  throw new Error("Unexpected CSRF response format");
}

export async function fetchCsrfToken(): Promise<string> {
  const data = await httpJson<CsrfTokenResponse>("/api/auth/csrf/");
  return parseCsrfToken(data);
}

export async function login(username: string, password: string) {
  return await httpJson<void>("/api/auth/login/", {
    method: "POST",
    body: { username, password },
  });
}

export async function logout() {
  return await httpJson<void>("/api/auth/logout/", {
    method: "POST",
  });
}
