import { defineStore } from "pinia";
import type { ProtocolData, SubmitPaperPayload } from "@/api/protocols";
import { getProtocols, submitPaperSubmission } from "@/api/protocols";
import { useStudentPerformanceStore } from "@/stores/studentPerformance";
import { useAuthStore } from "@/stores/auth";

export const useProtocolStore = defineStore("protocols", {
  state: () => ({
    protocolsByLabDay: new Map<number, ProtocolData[]>(),
    currentLabDay: null as number | null,
  }),
  getters: {
    protocols(state): ProtocolData[] {
      if (state.currentLabDay === null) return [];
      return state.protocolsByLabDay.get(state.currentLabDay) ?? [];
    },
    protocalByStudentId(state): Map<string, ProtocolData> {
      if (state.currentLabDay === null) {
        return new Map();
      }
      const protocols = state.protocolsByLabDay.get(state.currentLabDay) ?? [];
      return new Map(
        protocols.map((protocol) => [protocol.student.id, protocol]),
      );
    },
  },
  actions: {
    async fetchProtocols(labDay: number) {
      this.currentLabDay = labDay;

      if (this.protocolsByLabDay.has(labDay)) {
        return this.protocolsByLabDay.get(labDay)!;
      }

      // group-scoping for admins
      const auth = useAuthStore();
      const adminGroup = auth.adminGroupScope;
      const protocols = await getProtocols(labDay, adminGroup);
      this.protocolsByLabDay.set(labDay, protocols);
      return protocols;
    },
    async submitProtocol(payload: SubmitPaperPayload) {
      const protocols = await submitPaperSubmission(payload);
      const labDay = payload.lab_day;
      const existing = [...(this.protocolsByLabDay.get(labDay) ?? [])];

      for (const protocol of protocols) {
        const index = existing.findIndex(
          (entry) => entry.student.id === protocol.student.id,
        );

        if (index !== -1) {
          existing[index] = protocol;
        } else {
          existing.push(protocol);
        }
      }

      this.protocolsByLabDay.set(labDay, existing);

      // Protocol acceptance/submission impacts final-results counters.
      const perfStore = useStudentPerformanceStore();
      for (const protocol of protocols) {
        perfStore.invalidate(protocol.student.id);
      }

      return protocols;
    },
    removeProtocol(id: string) {
      if (this.currentLabDay === null) return;

      const protocols = this.protocolsByLabDay.get(this.currentLabDay);
      if (!protocols) return;

      const index = protocols.findIndex((p) => p.id === id);
      if (index !== -1) {
        protocols.splice(index, 1);
        this.protocolsByLabDay.set(this.currentLabDay, [...protocols]);
      }
    },
    clearProtocols() {
      this.protocolsByLabDay = new Map();
      this.currentLabDay = null;
    },
  },
});
