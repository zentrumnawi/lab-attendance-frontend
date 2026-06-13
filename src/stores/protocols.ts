import { defineStore } from "pinia";
import type { ProtocolData } from "@/api/protocols";
import { getProtocols } from "@/api/protocols";

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
