import { defineStore } from "pinia";
import * as authApi from "@/api/auth";
import { HttpError } from "@/api/http";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useAttendanceStore } from "@/stores/attendance";
import { useExerciseStore } from "@/stores/exerciseStore";
import { useExperimentStore } from "@/stores/experimentStore";
import { useProtocolStore } from "@/stores/protocols";
import { useStudentPerformanceStore } from "@/stores/studentPerformance";
import { useSyncQueueExperiments } from "@/stores/syncQueueExperiments";
import { useSyncQueue } from "@/stores/syncQueue";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    csrfToken: null as string | null,
    username: null as string | null,
    isAuthenticated: false,
    csrfLoading: false,
    loginLoading: false,
    csrfError: null as string | null,
    isSuperuser: false,
    groupName: null as string | null,
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

    async login(
      username: string,
      password: string,
      group: string | null,
    ): Promise<void> {
      this.loginLoading = true;

      try {
        const response = await authApi.login(username, password);
        this.username = username;
        this.isAuthenticated = true;
        this.isSuperuser = response.is_superuser;
        this.groupName = response.is_superuser
          ? group
          : response.profile?.group?.name || null;
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
        resetApplicationStores();
        this.$reset();
      }
    },
    adminGroupScope(): string | undefined {
      return this.isSuperuser ? (this.groupName ?? undefined) : undefined;
    },
  },
  persist: {
    pick: ["isAuthenticated", "username", "isSuperuser", "groupName"],
  },
});

function resetApplicationStores(): void {
  useAttendeeStore().$reset();
  useAttendanceStore().$reset();
  useExerciseStore().$reset();
  useExperimentStore().$reset();
  useProtocolStore().$reset();
  useStudentPerformanceStore().$reset();
  useSyncQueueExperiments().$reset();
  useSyncQueue().$reset();
}

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
