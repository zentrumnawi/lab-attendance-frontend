<template>
  <div>
    <v-breadcrumbs
      :items="[
        { title: 'Attendance', to: '/attendance' },
        { title: props.date },
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
              Attendance — {{ props.date }}
            </v-toolbar-title>
            <v-spacer />
            <v-text-field
              v-model.number="praktikumDay"
              class="mr-4"
              density="compact"
              hide-details
              label="Praktikum day"
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
              Delete
            </v-btn>
            <v-btn
              color="primary"
              :disabled="saving || deleting || rows.length === 0 || !canSave"
              :loading="saving"
              @click="saveAttendance"
            >
              Save
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
            <span>present</span>
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
          <div><p>No students found</p></div>
        </template>
      </v-data-table>
    </v-sheet>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete session</v-card-title>
        <v-card-text>
          Delete the roll call for {{ props.date }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Cancel"
            variant="text"
            :disabled="deleting"
            @click="deleteDialog = false"
          />
          <v-btn
            color="error"
            text="Delete"
            :loading="deleting"
            @click="deleteSession"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="commentDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Comment</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="commentText"
            auto-grow
            hide-details
            label="Comment"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" variant="text" @click="commentDialog = false" />
          <v-btn color="primary" text="Save" @click="saveComment" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useAttendanceStore } from "@/stores/attendance";

const props = defineProps<{
  date: string;
}>();

interface SessionRow {
  id: string;
  name: string;
  present: boolean;
  comment?: string;
}

const router = useRouter();
const attendanceStore = useAttendanceStore();

const store = useAppStore();
const rows = ref<SessionRow[]>([]);
const praktikumDay = ref<number | null>(null);
const saving = ref(false);
const deleting = ref(false);
const deleteDialog = ref(false);
const commentDialog = ref(false);
const commentRowId = ref<string | null>(null);
const commentText = ref("");
const saveMessage = ref<string | null>(null);
const saveError = ref(false);
const existingSession = ref(false);

const canSave = computed(() => praktikumDay.value !== null);

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
  { title: "First Name", key: "firstName", align: "start", width: "40%" },
  { title: "", key: "comment", align: "end", sortable: false },
  {
    title: "Attendance",
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
    await attendanceStore.deleteLabSession(
      props.date,
      attendanceStore.getLabDate(props.date)?.group ?? "",
    );
    deleteDialog.value = false;
    await router.push("/attendance");
  } catch {
    deleteDialog.value = false;
    saveError.value = true;
    saveMessage.value = "Failed to delete session.";
  } finally {
    deleting.value = false;
  }
}

async function saveAttendance() {
  const day = praktikumDay.value;
  if (day === null || day <= 0) return;

  saving.value = true;
  saveMessage.value = null;
  saveError.value = false;

  try {
    await attendanceStore.saveLabSession(
      props.date,
      day,
      rows.value.map((row) => ({
        student_id: row.id,
        is_present: row.present,
        ...(row.comment ? { comment: row.comment } : {}),
      })),
    );
    saveMessage.value = "Attendance saved.";
  } catch {
    saveError.value = true;
    saveMessage.value = "Failed to save attendance.";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await store.fetchStudents();

  // try to fetch attendance record for this date, if not found, create a new one
  const labSession = await attendanceStore.fetchSingleLabSession(props.date);
  existingSession.value = labSession !== null;
  if (!labSession) {
    rows.value = store.attendees.map((student) => ({
      id: student.id,
      name: student.name,
      firstName: student.firstName,
      present: false,
    }));
    praktikumDay.value = null;
  } else {
    rows.value = labSession.map((attendee) => ({
      id: attendee.student,
      name: store.getAttendeeById(attendee.student)!.name,
      firstName: store.getAttendeeById(attendee.student)!.firstName,
      present: attendee.is_present,
      ...(attendee.comment ? { comment: attendee.comment } : {}),
    }));
    console.log("lab date", attendanceStore.getLabDate(props.date));
    // get number of praktikum day from state
    praktikumDay.value =
      attendanceStore.getLabDate(props.date)?.praktikum_day ?? null;
    console.log(praktikumDay.value);
  }
});
</script>
