import {
  saveBulkAttendance,
  saveSeminarAttendance,
  type BulkAttendancePayload,
  type SeminarAttendancePayload,
} from "@/api/attendance";
import { defineStore } from "pinia";

export type AttendanceQueueItem = {
  id: string;
  type: "attendance.lab" | "attendance.seminar";
  dedupeKey: string;
  payload: BulkAttendancePayload | SeminarAttendancePayload;
  createdAt: string;
  lastError?: string;
  status: "pending" | "syncing" | "failed";
};

export function labDedupeKey(date: string, group: string): string {
  return `lab:${date}:${group}`;
}

export function seminarDedupeKey(date: string): string {
  return `seminar:${date}`;
}

export function labelForAttendanceItem(item: AttendanceQueueItem): string {
  const presentCount = item.payload.records.filter((r) => r.is_present).length;
  const total = item.payload.records.length;

  if (item.payload.day_type === "LAB") {
    return `Anwesenheit ${item.payload.date}, Gruppe ${item.payload.group} (Versuchstag ${item.payload.praktikum_day}) — ${presentCount}/${total} anwesend`;
  }

  return `Seminar ${item.payload.date} — ${presentCount}/${total} anwesend`;
}

function formatSyncError(error: unknown): string {
  return error instanceof Error ? error.message : "Unbekannter Fehler";
}

async function postAttendancePayload(
  payload: BulkAttendancePayload | SeminarAttendancePayload,
): Promise<void> {
  if (payload.day_type === "LAB") {
    await saveBulkAttendance(payload);
    return;
  }

  await saveSeminarAttendance(payload);
}

export const useSyncQueue = defineStore("syncQueue", {
  state: () => ({
    attendanceQueue: [] as AttendanceQueueItem[],
  }),

  getters: {
    getItemByDedupeKey: (state) => (dedupeKey: string) =>
      state.attendanceQueue.find((item) => item.dedupeKey === dedupeKey),

    hasQueuedItem: (state) => (dedupeKey: string) =>
      state.attendanceQueue.some((item) => item.dedupeKey === dedupeKey),

    pendingCount: (state) =>
      state.attendanceQueue.filter((item) => item.status === "pending").length,

    queueCount: (state) => state.attendanceQueue.length,

    queuedItems: (state) =>
      [...state.attendanceQueue].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  },

  actions: {
    enqueueAttendance(item: AttendanceQueueItem) {
      const queuedItem: AttendanceQueueItem = {
        ...item,
        status: "pending",
        lastError: undefined,
      };

      const index = this.attendanceQueue.findIndex(
        (entry) => entry.dedupeKey === item.dedupeKey,
      );

      // replace the existing item with the new one
      if (index !== -1) {
        this.attendanceQueue[index] = queuedItem;
        return;
      }

      this.attendanceQueue.push(queuedItem);
    },

    removeByDedupeKey(dedupeKey: string) {
      this.attendanceQueue = this.attendanceQueue.filter(
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
        await postAttendancePayload(item.payload);
        this.removeByDedupeKey(dedupeKey);
        return true;
      } catch (error) {
        item.status = "failed";
        item.lastError = formatSyncError(error);
        return false;
      }
    },

    async syncAllPending(): Promise<{ succeeded: number; failed: number }> {
      const itemsToSync = this.attendanceQueue.filter(
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
