<template>
  <div>
    <v-breadcrumbs
      :items="[
        { title: 'Anwesenheit', to: '/attendance' },
        { title: sessionTitle },
      ]"
      divider=">"
    ></v-breadcrumbs>

    <v-sheet border rounded>
      <v-alert
        v-if="saveMessage"
        :type="saveError ? 'error' : 'success'"
        class="ma-4"
        closable
        @click:close="saveMessage = null"
      >
        {{ saveMessage }}
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="rows"
        :hide-default-footer="rows.length < 11"
        item-value="id"
      >
        <template #top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon
                color="medium-emphasis"
                icon="mdi-clipboard-check-outline"
                size="x-small"
                start
              ></v-icon>
              Anwesenheit — {{ sessionTitle }}
            </v-toolbar-title>
            <v-spacer />
            <v-text-field
              v-if="!isSem"
              v-model.number="praktikumDay"
              class="mr-4"
              density="compact"
              hide-details
              label="Versuchstag"
              style="max-width: 140px"
              type="number"
              min="1"
            />
            <v-btn
              v-if="existingSession"
              class="mr-2"
              color="error"
              :disabled="saving || deleting"
              :loading="deleting"
              variant="outlined"
              @click="deleteDialog = true"
            >
              Löschen
            </v-btn>
            <v-btn
              color="primary"
              :disabled="saving || deleting || rows.length === 0 || !canSave"
              :loading="saving"
              @click="saveAttendance"
            >
              Speichern
            </v-btn>
          </v-toolbar>
        </template>

        <template #[`item.name`]="{ value }">
          <span class="font-weight-medium">{{ value }}</span>
        </template>

        <template #[`item.present`]="{ item }">
          <v-checkbox-btn
            v-model="item.present"
            hide-details
            density="compact"
            color="primary"
          />
        </template>

        <template #[`header.present`]>
          <div class="d-flex align-center ga-2">
            <v-checkbox-btn
              :model-value="allPresent"
              hide-details
              density="compact"
              color="primary"
              @update:model-value="togglePresent"
            />
            <span>Anwesend</span>
          </div>
        </template>

        <template #[`item.comment`]="{ item }">
          <div v-if="item.comment">
            <v-tooltip :text="item.comment">
              <template #activator="{ props: tooltipProps }">
                <v-icon
                  v-bind="tooltipProps"
                  color="medium-emphasis"
                  icon="mdi-comment-text-outline"
                  size="small"
                ></v-icon>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #[`item.actions`]="{ item }">
          <div>
            <v-icon
              color="medium-emphasis"
              icon="mdi-dots-vertical"
              size="small"
              @click="addComment(item.id)"
            ></v-icon>
          </div>
        </template>

        <template #no-data>
          <div><p>Keine Studierenden gefunden</p></div>
        </template>
      </v-data-table>
    </v-sheet>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Sitzung löschen</v-card-title>
        <v-card-text>
          Anwesenheitsliste für {{ sessionTitle }} löschen? Dies kann nicht
          rückgängig gemacht werden.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Abbrechen"
            variant="text"
            :disabled="deleting"
            @click="deleteDialog = false"
          />
          <v-btn
            color="error"
            text="Löschen"
            :loading="deleting"
            @click="deleteSession"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="commentDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Kommentar</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="commentText"
            auto-grow
            hide-details
            label="Kommentar"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Abbrechen"
            variant="text"
            @click="commentDialog = false"
          />
          <v-btn color="primary" text="Speichern" @click="saveComment" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useAttendanceStore } from "@/stores/attendance";
import { QueuedLocallyError } from "@/utils/network";

const props = defineProps<{
  date: string;
  group?: string;
  praktikumDay?: number;
  sem?: boolean;
}>();

interface SessionRow {
  id: string;
  name: string;
  present: boolean;
  comment?: string;
}

const router = useRouter();
const attendanceStore = useAttendanceStore();

const store = useAttendeeStore();
const rows = ref<SessionRow[]>([]);
const praktikumDay = ref<number | null>(props.praktikumDay ?? null);
const saving = ref(false);
const deleting = ref(false);
const deleteDialog = ref(false);
const commentDialog = ref(false);
const commentRowId = ref<string | null>(null);
const commentText = ref("");
const saveMessage = ref<string | null>(null);
const saveError = ref(false);
const existingSession = ref(false);

const isSem = computed(() => props.sem === true);

const sessionTitle = computed(() => {
  if (isSem.value) return props.date;
  const day = praktikumDay.value ?? props.praktikumDay;
  if (day != null) return `Versuchstag ${day} (${props.date})`;
  return props.date;
});

const canSave = computed(() =>
  isSem.value ? true : praktikumDay.value !== null,
);

const allPresent = computed(
  () => rows.value.length > 0 && rows.value.every((row) => row.present),
);

const headers: {
  title: string;
  key: string;
  align?: "start" | "end" | "center";
  sortable?: boolean;
  width?: string;
}[] = [
  { title: "Name", key: "name", align: "start", width: "40%" },
  { title: "Vorname", key: "firstName", align: "start", width: "40%" },
  { title: "", key: "comment", align: "end", sortable: false },
  {
    title: "Anwesenheit",
    key: "present",
    align: "end",
    sortable: false,
    width: "180",
  },
  { title: "", key: "actions", align: "end", sortable: false },
];

function togglePresent(value: boolean | null) {
  const present = value ?? !allPresent.value;
  rows.value.forEach((row) => {
    row.present = present;
  });
}

function addComment(id: string) {
  const row = rows.value.find((r) => r.id === id);
  commentRowId.value = id;
  commentText.value = row?.comment ?? "";
  commentDialog.value = true;
}

function saveComment() {
  const row = rows.value.find((r) => r.id === commentRowId.value);
  if (row) {
    const trimmed = commentText.value.trim();
    row.comment = trimmed || undefined;
  }
  commentDialog.value = false;
}

async function deleteSession() {
  deleting.value = true;
  saveMessage.value = null;
  saveError.value = false;

  try {
    const day = praktikumDay.value ?? props.praktikumDay;
    await attendanceStore.deleteSession(
      props.date,
      isSem.value ? "" : (props.group ?? ""),
      isSem.value ? "LECTURE" : "LAB",
      isSem.value ? undefined : (day ?? undefined),
    );
    deleteDialog.value = false;
    await router.push("/attendance");
  } catch {
    deleteDialog.value = false;
    saveError.value = true;
    saveMessage.value = "Sitzung konnte nicht gelöscht werden.";
  } finally {
    deleting.value = false;
  }
}

async function saveAttendance() {
  saving.value = true;
  saveMessage.value = null;
  saveError.value = false;

  try {
    if (isSem.value) {
      await attendanceStore.saveSeminarSession(
        props.date,
        rows.value.map((row) => ({
          student_id: row.id,
          is_present: row.present,
          ...(row.comment ? { comment: row.comment } : {}),
        })),
      );
    } else {
      const day = praktikumDay.value;
      if (day === null || day <= 0) return;
      await attendanceStore.saveLabSession(
        props.date,
        day,
        rows.value.map((row) => ({
          student_id: row.id,
          is_present: row.present,
          ...(row.comment ? { comment: row.comment } : {}),
        })),
        props.group ?? "",
      );
    }
    saveMessage.value = "Anwesenheit gespeichert.";
  } catch (e) {
    if (e instanceof QueuedLocallyError) {
      saveMessage.value =
        "Lokal gespeichert. Synchronisation unter „Ausstehende Synchronisation“.";
      saveError.value = false;
    } else {
      saveMessage.value = "Anwesenheit konnte nicht gespeichert werden.";
      saveError.value = true;
    }
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await store.fetchStudents();

  if (isSem.value) {
    const seminarSession = await attendanceStore.fetchSingleSeminarSession(
      props.date,
    );
    existingSession.value = seminarSession !== null;

    if (!seminarSession) {
      rows.value = store.attendees.map((student) => ({
        id: student.id,
        name: student.name,
        firstName: student.firstName,
        present: false,
      }));
    } else {
      rows.value = seminarSession.map((attendee) => ({
        id: attendee.student,
        name: store.getAttendeeById(attendee.student)!.name,
        firstName: store.getAttendeeById(attendee.student)!.firstName,
        present: attendee.is_present,
        ...(attendee.comment ? { comment: attendee.comment } : {}),
      }));
    }
    praktikumDay.value = null;
    return;
  }

  // LAB session — identity is group + praktikum_day
  await attendanceStore.fetchLabDates();
  const day = props.praktikumDay;
  const group = props.group ?? "";

  if (day == null) {
    // new session: date comes from calendar, user enters Versuchstag
    existingSession.value = false;
    rows.value = store.attendees.map((student) => ({
      id: student.id,
      name: student.name,
      firstName: student.firstName,
      present: false,
    }));
    praktikumDay.value = null;
    return;
  }

  const labSession = await attendanceStore.fetchSingleLabSession(day, group);
  existingSession.value = labSession !== null;
  praktikumDay.value = day;

  if (!labSession) {
    rows.value = store.attendees.map((student) => ({
      id: student.id,
      name: student.name,
      firstName: student.firstName,
      present: false,
    }));
  } else {
    rows.value = labSession.map((attendee) => ({
      id: attendee.student,
      name: store.getAttendeeById(attendee.student)!.name,
      firstName: store.getAttendeeById(attendee.student)!.firstName,
      present: attendee.is_present,
      ...(attendee.comment ? { comment: attendee.comment } : {}),
    }));
  }
});
</script>
