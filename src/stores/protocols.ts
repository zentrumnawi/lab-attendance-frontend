import { defineStore } from "pinia";
import type { ProtocolData, SubmitPaperPayload } from "@/api/protocols";
import { getProtocols, submitPaperSubmission } from "@/api/protocols";

export const useProtocolStore = defineStore("protocols", {
  state: () => ({
    protocols: [] as ProtocolData[],
  }),
  getters: {
    protocalByStudentId(state): Map<string, ProtocolData> {
      return new Map(
        state.protocols.map((protocol) => [protocol.student.id, protocol]),
      );
    },
  },
  actions: {
    async fetchProtocols(labDay: number) {
      const protocols = await getProtocols(labDay);
      this.protocols = protocols;
    },
    async submitProtocol(payload: SubmitPaperPayload) {
      const protocol = await submitPaperSubmission(payload);
      // For now, let's assume that the protocol is only one (will change later)
      const index = this.protocols.findIndex(
        (entry) => entry.student.id === protocol[0].student.id,
      );

      if (index !== -1) {
        this.protocols[index] = protocol[0];
      } else {
        this.protocols.push(protocol[0]);
      }

      return protocol[0];
    },
    removeProtocol(id: string) {
      const index = this.protocols.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.protocols.splice(index, 1);
      }
    },
    clearProtocols() {
      this.protocols = [];
    },
  },
});
