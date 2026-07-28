<template>
  <div>
    <v-alert
      v-if="feedbackMessage"
      :type="feedbackType"
      class="mb-4"
      closable
      @click:close="feedbackMessage = null"
    >
      {{ feedbackMessage }}
    </v-alert>

    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6">Ausstehende Synchronisation</div>
      <v-btn
        v-if="items.length > 0"
        color="primary"
        :disabled="syncingAll"
        :loading="syncingAll"
        @click="syncAllAttendanceItems"
      >
        Alle senden
      </v-btn>
    </div>

    <v-sheet v-if="items.length === 0" border rounded class="pa-6 text-center">
      <v-icon
        class="mb-2"
        color="medium-emphasis"
        icon="mdi-cloud-check-outline"
        size="40"
      />
      <div class="text-subtitle-1">Keine ausstehenden Anwesenheitslisten</div>
      <div class="text-body-2 text-medium-emphasis mt-1">
        Alle gespeicherten Daten wurden mit dem Server synchronisiert.
      </div>
    </v-sheet>

    <v-expansion-panels v-else multiple>
      <v-expansion-panel v-for="item in items" :key="item.dedupeKey">
        <v-expansion-panel-title>
          <div
            class="d-flex flex-column flex-sm-row align-sm-center ga-2 w-100"
          >
            <span class="font-weight-medium">{{ labelForItem(item) }}</span>
            <v-spacer />
            <v-chip
              :color="statusColor(item.status)"
              label
              size="small"
              variant="tonal"
            >
              {{ statusLabel(item.status) }}
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="text-body-2 text-medium-emphasis mb-3">
            Gespeichert am {{ formatDate(item.createdAt) }}
          </div>

          <v-alert
            v-if="item.lastError"
            type="error"
            density="compact"
            class="mb-3"
            variant="tonal"
          >
            {{ item.lastError }}
          </v-alert>

          <v-data-table
            :headers="attendanceDetailHeaders"
            :items="attendanceDetailRows(item)"
            :hide-default-footer="attendanceDetailRows(item).length < 11"
            density="compact"
            item-value="id"
          >
            <template #[`item.present`]="{ value }">
              <v-icon
                :color="value ? 'success' : 'medium-emphasis'"
                :icon="value ? 'mdi-check-circle' : 'mdi-close-circle-outline'"
                size="small"
              />
            </template>
          </v-data-table>

          <div class="d-flex justify-end mt-4">
            <v-btn
              color="primary"
              :disabled="item.status === 'syncing' || syncingAll"
              :loading="item.status === 'syncing'"
              @click="syncOneAttendanceItem(item.dedupeKey)"
            >
              Jetzt senden
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";
import {
  labelForAttendanceItem,
  type AttendanceQueueItem,
  useSyncQueue,
} from "@/stores/syncQueue";

interface AttendanceDetailRow {
  id: string;
  name: string;
  firstName: string;
  present: boolean;
  comment: string;
}

const syncAttendanceQueue = useSyncQueue();
const attendeeStore = useAttendeeStore();

const syncingAll = ref(false);
const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<"success" | "error" | "warning">("success");

const items = computed(() => syncAttendanceQueue.queuedItems);

const attendanceDetailHeaders = [
  { title: "Name", key: "name" },
  { title: "Vorname", key: "firstName" },
  { title: "Anwesend", key: "present", sortable: false },
  { title: "Kommentar", key: "comment" },
];

function labelForItem(item: AttendanceQueueItem): string {
  return labelForAttendanceItem(item);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE");
}

function statusLabel(status: AttendanceQueueItem["status"]): string {
  switch (status) {
    case "pending":
      return "Ausstehend";
    case "syncing":
      return "Wird gesendet…";
    case "failed":
      return "Fehlgeschlagen";
  }
}

function statusColor(status: AttendanceQueueItem["status"]): string {
  switch (status) {
    case "pending":
      return "warning";
    case "syncing":
      return "info";
    case "failed":
      return "error";
  }
}

function attendanceDetailRows(
  item: AttendanceQueueItem,
): AttendanceDetailRow[] {
  return item.payload.records.map((record) => {
    const attendee = attendeeStore.getAttendeeById(record.student_id);
    return {
      id: record.student_id,
      name: attendee?.name ?? "—",
      firstName: attendee?.firstName ?? "—",
      present: record.is_present,
      comment: record.comment ?? "",
    };
  });
}

function showFeedback(
  message: string,
  type: "success" | "error" | "warning" = "success",
) {
  feedbackMessage.value = message;
  feedbackType.value = type;
}

async function syncOneAttendanceItem(dedupeKey: string) {
  const ok = await syncAttendanceQueue.syncItem(dedupeKey);
  if (ok) {
    showFeedback("Anwesenheitsliste erfolgreich synchronisiert.");
  } else {
    const item = syncAttendanceQueue.getItemByDedupeKey(dedupeKey);
    showFeedback(item?.lastError ?? "Synchronisation fehlgeschlagen.", "error");
  }
}

async function syncAllAttendanceItems() {
  syncingAll.value = true;
  feedbackMessage.value = null;

  try {
    const { succeeded, failed } = await syncAttendanceQueue.syncAllPending();

    if (failed === 0) {
      showFeedback(
        succeeded === 1
          ? "1 Anwesenheitsliste erfolgreich synchronisiert."
          : `${succeeded} Anwesenheitslisten erfolgreich synchronisiert.`,
      );
    } else if (succeeded === 0) {
      showFeedback(
        failed === 1
          ? "1 Anwesenheitsliste konnte nicht synchronisiert werden."
          : `${failed} Anwesenheitslisten konnten nicht synchronisiert werden.`,
        "error",
      );
    } else {
      showFeedback(
        `${succeeded} synchronisiert, ${failed} fehlgeschlagen.`,
        "warning",
      );
    }
  } finally {
    syncingAll.value = false;
  }
}

onMounted(async () => {
  await attendeeStore.fetchStudents();
});
</script>
