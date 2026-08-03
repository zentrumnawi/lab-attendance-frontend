import { defineStore } from "pinia";
import type { StudentPerformance } from "@/api/students";
import { getStudentPerformance, patchStudentPerformance } from "@/api/students";

export const useStudentPerformanceStore = defineStore("studentPerformance", {
  state: () => ({
    byStudentId: {} as Record<string, StudentPerformance>,
    loadingByStudentId: {} as Record<string, boolean>,
    errorByStudentId: {} as Record<string, string | null>,
  }),

  actions: {
    // This is so that performance is refetched when needed.
    invalidate(studentId: string): void {
      delete this.byStudentId[studentId];
      delete this.loadingByStudentId[studentId];
      delete this.errorByStudentId[studentId];
    },

    async fetchPerformance(studentId: string): Promise<StudentPerformance> {
      if (this.byStudentId[studentId]) {
        return this.byStudentId[studentId];
      }
      this.loadingByStudentId[studentId] = true;
      this.errorByStudentId[studentId] = null;

      try {
        const perf = await getStudentPerformance(studentId);
        this.byStudentId[studentId] = perf;
        return perf;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.errorByStudentId[studentId] = message;
        throw e;
      } finally {
        this.loadingByStudentId[studentId] = false;
      }
    },

    async saveComment(studentId: string, comment: string): Promise<void> {
      const trimmed = comment.trim();
      await patchStudentPerformance(studentId, {
        comment: trimmed || undefined,
      });
      const existing = this.byStudentId[studentId];
      if (existing) {
        this.byStudentId[studentId] = {
          ...existing,
          ...(trimmed ? { comment: trimmed } : {}),
        };
        if (!trimmed) {
          delete this.byStudentId[studentId].comment;
        }
      }
    },

    async savePassed(studentId: string): Promise<void> {
      await patchStudentPerformance(studentId, { status: "PASS" });
      const existing = this.byStudentId[studentId];
      if (existing) {
        this.byStudentId[studentId] = {
          ...existing,
          status: "PASS",
        };
      }
    },
  },
});
