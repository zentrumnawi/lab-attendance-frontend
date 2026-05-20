import { defineStore } from "pinia";
import * as authApi from "@/api/auth";
import { HttpError } from "@/api/http";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    csrfToken: null as string | null,
    username: null as string | null,
    isAuthenticated: false,
    csrfLoading: false,
    loginLoading: false,
    csrfError: null as string | null,
  }),

  actions: {
    async ensureCsrfToken(): Promise<void> {
      // since Django renews csrf token after login, we need to fetch it again
      await this.fetchCsrfToken();
    },

    async fetchCsrfToken(): Promise<void> {
      this.csrfLoading = true;
      this.csrfError = null;

      try {
        this.csrfToken = await authApi.fetchCsrfToken();
      } catch (e) {
        this.csrfError = formatAuthError(e);
        this.csrfToken = null;
        throw e;
      } finally {
        this.csrfLoading = false;
      }
    },

    async login(username: string, password: string): Promise<void> {
      this.loginLoading = true;

      try {
        await authApi.login(username, password);
        this.username = username;
        this.isAuthenticated = true;
      } finally {
        // see Django's login method to see why this is necessary
        await this.ensureCsrfToken();
        this.loginLoading = false;
      }
    },

    async logout(): Promise<void> {
      try {
        if (this.csrfToken) {
          await authApi.logout();
        }
      } finally {
        this.username = null;
        this.isAuthenticated = false;
        this.csrfToken = null;
        this.csrfError = null;
      }
    },
  },
});

function formatAuthError(e: unknown): string {
  if (e instanceof HttpError) {
    const body = e.body;
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}
