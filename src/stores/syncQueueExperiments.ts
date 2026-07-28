import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/auth";
import {
  ExperimentCompletionRecord,
  saveExperimentCompletions,
  SaveExperimentCompletionsPayload,
} from "@/api/experiments";
export type ExperimentExecutionQueueItem = {
  id: string;
  dedupeKey: string;
  lab_day: number;
  records: ExperimentCompletionRecord[];
  createdAt: string;
  lastError?: string;
  status: "pending" | "syncing" | "failed";
};

export function experimentExecutionDedupeKey(
  lab_day: number,
  student_id: string,
): string {
  return `experiment:${lab_day}:${student_id}`;
}

export function labelForExperimentExecutionItem(
  item: ExperimentExecutionQueueItem,
): string {
  const experimentCount = item.records[0].experiment_ids.length;
  const studentCount = item.records.length;
  const students = item.records.map((r) => r.student_id).join(", ");

  return `Versuchstag ${item.lab_day} — ${experimentCount} Versuche-${studentCount} ${students}`;
}

function formatSyncError(error: unknown): string {
  return error instanceof Error ? error.message : "Unbekannter Fehler";
}

async function postExperimentExecutionPayload(
  payload: SaveExperimentCompletionsPayload,
): Promise<void> {
  await useAuthStore().ensureCsrfToken();

  return await saveExperimentCompletions(payload);
}

export const useSyncQueueExperiments = defineStore("syncQueueExperiments", {
  state: () => ({
    experimentExecutionQueue: [] as ExperimentExecutionQueueItem[],
  }),

  getters: {
    getItemByDedupeKey: (state) => (dedupeKey: string) =>
      state.experimentExecutionQueue.find(
        (item) => item.dedupeKey === dedupeKey,
      ),

    hasQueuedItem: (state) => (dedupeKey: string) =>
      state.experimentExecutionQueue.some(
        (item) => item.dedupeKey === dedupeKey,
      ),

    pendingCount: (state) =>
      state.experimentExecutionQueue.filter((item) => item.status === "pending")
        .length,

    queueCount: (state) => state.experimentExecutionQueue.length,

    queuedItems: (state) =>
      [...state.experimentExecutionQueue].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  },

  actions: {
    enqueueExperimentExecution(item: ExperimentExecutionQueueItem) {
      const queuedItem: ExperimentExecutionQueueItem = {
        ...item,
        status: "pending",
        lastError: undefined,
      };

      const index = this.experimentExecutionQueue.findIndex(
        (entry) => entry.dedupeKey === item.dedupeKey,
      );

      // replace the existing item with the new one
      if (index !== -1) {
        this.experimentExecutionQueue[index] = queuedItem;
        return;
      }

      this.experimentExecutionQueue.push(queuedItem);
    },

    removeByDedupeKey(dedupeKey: string) {
      this.experimentExecutionQueue = this.experimentExecutionQueue.filter(
        (item) => item.dedupeKey !== dedupeKey,
      );
    },

    async syncItem(dedupeKey: string): Promise<boolean> {
      const item = this.getItemByDedupeKey(dedupeKey);
      if (!item || item.status === "syncing") {
        return false;
      }

      item.status = "syncing";
      item.lastError = undefined;

      try {
        await postExperimentExecutionPayload({
          lab_day: item.lab_day,
          records: item.records,
        });
        this.removeByDedupeKey(dedupeKey);
        return true;
      } catch (error) {
        item.status = "failed";
        item.lastError = formatSyncError(error);
        return false;
      }
    },

    async syncAllPending(): Promise<{ succeeded: number; failed: number }> {
      const itemsToSync = this.experimentExecutionQueue.filter(
        (item) => item.status === "pending" || item.status === "failed",
      );

      let succeeded = 0;
      let failed = 0;

      for (const item of itemsToSync) {
        const ok = await this.syncItem(item.dedupeKey);
        if (ok) {
          succeeded += 1;
        } else {
          failed += 1;
        }
      }

      return { succeeded, failed };
    },
  },

  persist: true,
});
