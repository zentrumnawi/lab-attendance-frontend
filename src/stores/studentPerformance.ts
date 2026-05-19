import { defineStore } from "pinia";
import type { StudentPerformance } from "@/api/students";
import { getStudentPerformance } from "@/api/students";

export const useStudentPerformanceStore = defineStore("studentPerformance", {
  state: () => ({
    byStudentId: {} as Record<string, StudentPerformance>,
    loadingByStudentId: {} as Record<string, boolean>,
    errorByStudentId: {} as Record<string, string | null>,
  }),

  actions: {
    async fetchPerformance(studentId: string): Promise<StudentPerformance> {
      this.loadingByStudentId[studentId] = true;
      this.errorByStudentId[studentId] = null;

      if (this.byStudentId[studentId]) return this.byStudentId[studentId];

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
  },
});
