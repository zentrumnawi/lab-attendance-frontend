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
      const protocols = await submitPaperSubmission(payload);

      for (const protocol of protocols) {
        const index = this.protocols.findIndex(
          (entry) => entry.student.id === protocol.student.id,
        );

        if (index !== -1) {
          this.protocols[index] = protocol;
        } else {
          this.protocols.push(protocol);
        }
      }

      return protocols;
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
