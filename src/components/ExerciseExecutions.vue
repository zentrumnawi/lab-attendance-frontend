<template>
  <div>
    <v-select
      v-model="labDay"
      :items="labDayOptions"
      item-title="title"
      item-value="value"
      label="Versuchstag"
      class="mb-4"
      max-width="280"
    />

    <v-sheet v-if="!dayHasExercises" border rounded class="mb-4 pa-4">
      <div class="text-subtitle-2">
        Keine Übungsblätter für diesen Versuchstag
      </div>
    </v-sheet>

    <v-switch
      v-model="showChecklist"
      class="mb-4"
      :disabled="!dayHasExercises"
      hide-details
      label="Checkliste"
    />

    <v-sheet v-if="!showChecklist" border rounded>
      <v-data-table
        :headers="headers"
        :items="rows"
        expand-strategy="single"
        item-value="id"
        :hide-default-footer="rows.length < 11"
        :show-expand="dayHasExercises"
      >
        <template #top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon
                color="medium-emphasis"
                icon="mdi-flask"
                size="x-small"
                start
              ></v-icon>

              Übungsblätterabgaben
            </v-toolbar-title>
          </v-toolbar>
        </template>
        <template #[`item.status`]="{ value }">
          <v-tooltip :text="value">
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :icon="statusIcon(value)"
                :color="statusColor(value)"
                size="small"
              />
            </template>
          </v-tooltip>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length">
              <div class="d-flex justify-end" v-if="item.status === 'Offen'">
                <v-btn
                  class="text-none"
                  color="blue-darken-4"
                  rounded="0"
                  variant="outlined"
                  text="Als erledigt markieren"
                  @click="openCompleteDialog(item)"
                />
              </div>
              <div class="d-flex justify-end" v-if="item.status === 'Erledigt'">
                <v-btn
                  class="text-none"
                  color="blue-darken-4"
                  rounded="0"
                  variant="outlined"
                  text="Zurückziehen"
                  @click="openWithdrawDialog(item)"
                />
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-sheet>

    <v-sheet v-else border rounded>
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
        :headers="checklistHeaders"
        :items="checklistRows"
        item-value="id"
        :hide-default-footer="checklistRows.length < 11"
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

              Übungsblätterabgaben — Checkliste
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              color="primary"
              :disabled="
                saving || checklistRows.length === 0 || !dayHasExercises
              "
              :loading="saving"
              @click="saveChecklist"
            >
              Speichern
            </v-btn>
          </v-toolbar>
        </template>

        <template #[`item.completed`]="{ item }">
          <v-checkbox-btn
            v-model="item.completed"
            hide-details
            density="compact"
            color="primary"
          />
        </template>

        <template #[`header.completed`]>
          <div class="d-flex align-center ga-2">
            <v-checkbox-btn
              :model-value="allCompleted"
              hide-details
              density="compact"
              color="primary"
              @update:model-value="toggleCompleted"
            />
            <span>Erledigt</span>
          </div>
        </template>

        <template #no-data>
          <div><p>Keine Studierenden gefunden</p></div>
        </template>
      </v-data-table>
    </v-sheet>

    <v-dialog v-model="completeDialog" max-width="560">
      <v-card title="Übungsblatt erfolgreich bearbeitet">
        <template #text>
          <p v-if="selectedStudent" class="text-body-1 mb-4">
            {{ selectedStudent.firstName }} {{ selectedStudent.name }}
          </p>

          <v-checkbox
            v-model="markCompleted"
            hide-details
            label="Übungsblatt als erledigt markieren"
          />
        </template>

        <v-divider />

        <v-card-actions class="bg-surface-light">
          <v-btn
            text="Abbrechen"
            variant="plain"
            :disabled="saving"
            @click="completeDialog = false"
          />

          <v-spacer />

          <v-btn
            text="Speichern"
            :disabled="!markCompleted"
            :loading="saving"
            @click="saveCompletion"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="withdrawDialog" max-width="560">
      <v-card title="Erledigung zurückziehen">
        <template #text>
          <p v-if="selectedStudent" class="text-body-1 mb-4">
            {{ selectedStudent.firstName }} {{ selectedStudent.name }}
          </p>

          <v-checkbox
            v-model="withdrawCompleted"
            hide-details
            label="Erledigung zurückziehen"
          />
          <span class="text-body-2"
            >Diese Aktion setzt den Status des Übungsblatts zurück.</span
          >
        </template>

        <v-divider />

        <v-card-actions class="bg-surface-light">
          <v-btn
            text="Abbrechen"
            variant="plain"
            :disabled="saving"
            @click="withdrawDialog = false"
          />

          <v-spacer />

          <v-btn
            text="Speichern"
            :disabled="!withdrawCompleted"
            :loading="saving"
            @click="saveWithdrawal"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useExerciseStore } from "@/stores/exerciseStore";
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";

type ExerciseStatus = "Erledigt" | "Offen";
const showChecklist = ref(false);

interface ExerciseRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  status: ExerciseStatus;
  completed: boolean;
}

const headers: {
  title: string;
  key: string;
  align: "start" | "end" | "center";
  width: string;
}[] = [
  { title: "Name", key: "name", align: "start", width: "40%" },
  { title: "Vorname", key: "firstName", align: "start", width: "40%" },
  {
    title: "Matrikelnummer",
    key: "matriculationNumber",
    align: "start",
    width: "20%",
  },
  { title: "Status", key: "status", align: "center", width: "20%" },
];

const checklistHeaders: {
  title: string;
  key: string;
  align?: "start" | "end" | "center";
  sortable?: boolean;
  width?: string;
}[] = [
  { title: "Name", key: "name", align: "start", width: "40%" },
  { title: "Vorname", key: "firstName", align: "start", width: "40%" },
  {
    title: "Matrikelnummer",
    key: "matriculationNumber",
    align: "start",
    width: "20%",
  },
  {
    title: "Erledigt",
    key: "completed",
    align: "end",
    sortable: false,
    width: "180",
  },
];

function statusIcon(status: ExerciseStatus): string {
  switch (status) {
    case "Erledigt":
      return "mdi-check-circle";
    case "Offen":
      return "mdi-close-circle-outline";
  }
}

function statusColor(status: ExerciseStatus): string {
  switch (status) {
    case "Erledigt":
      return "success";
    case "Offen":
      return "error";
  }
}

const store = useExerciseStore();
const attendeeStore = useAttendeeStore();
const labDay = ref(1);
const labDayOptions = Array.from({ length: 8 }, (_, index) => ({
  title: `Versuchstag ${index + 1}`,
  value: index + 1,
}));
const completeDialog = shallowRef(false);
const withdrawDialog = shallowRef(false);
const selectedStudent = ref<ExerciseRow | null>(null);
const markCompleted = ref(false);
const withdrawCompleted = ref(false);
const saving = ref(false);
const checklistRows = ref<ExerciseRow[]>([]);
const saveMessage = ref<string | null>(null);
const saveError = ref(false);

const allCompleted = computed(
  () =>
    checklistRows.value.length > 0 &&
    checklistRows.value.every((row) => row.completed),
);

function syncChecklistRows() {
  checklistRows.value = rows.value.map((row) => ({ ...row }));
}

function toggleCompleted(value: boolean | null) {
  const completed = value ?? !allCompleted.value;
  checklistRows.value.forEach((row) => {
    row.completed = completed;
  });
}

async function saveChecklist() {
  if (!dayHasExercises.value) return;

  saving.value = true;
  saveMessage.value = null;
  saveError.value = false;

  try {
    await store.submitBulkExerciseData(
      labDay.value,
      checklistRows.value.map((row) => ({
        student_id: row.id,
        completed: row.completed,
        completion_date: row.completed ? new Date() : null,
      })),
    );
    saveMessage.value = "Übungsblätterabgaben gespeichert.";
  } catch {
    saveError.value = true;
    saveMessage.value =
      "Übungsblätterabgaben konnten nicht gespeichert werden.";
  } finally {
    saving.value = false;
  }
}

function openCompleteDialog(item: ExerciseRow) {
  selectedStudent.value = item;
  markCompleted.value = false;
  completeDialog.value = true;
}

function openWithdrawDialog(item: ExerciseRow) {
  selectedStudent.value = item;
  withdrawCompleted.value = false;
  withdrawDialog.value = true;
}

async function saveCompletion() {
  if (!selectedStudent.value || !markCompleted.value) return;

  saving.value = true;

  try {
    await store.submitSingleExerciseData(
      labDay.value,
      selectedStudent.value.id,
      true,
    );
    completeDialog.value = false;
  } finally {
    saving.value = false;
  }
}

async function saveWithdrawal() {
  if (!selectedStudent.value || !withdrawCompleted.value) return;

  saving.value = true;

  try {
    await store.submitSingleExerciseData(
      labDay.value,
      selectedStudent.value.id,
      false,
    );
    withdrawDialog.value = false;
  } finally {
    saving.value = false;
  }
}

const rows = computed<ExerciseRow[]>(() =>
  attendeeStore.attendees.map((attendee) => {
    const completed =
      store.exercise_completions.get(labDay.value)?.includes(attendee.id) ??
      false;
    return {
      id: attendee.id,
      name: attendee.name ?? "",
      firstName: attendee.firstName ?? "",
      matriculationNumber: attendee.matriculationNumber ?? "",
      status: completed ? "Erledigt" : "Offen",
      completed,
    };
  }),
);

const dayHasExercises = computed(() => {
  return store.exercises.some((exercise) => exercise.lab_day === labDay.value);
});

onMounted(async () => {
  await Promise.all([
    attendeeStore.fetchStudents(),
    store.fetchExerciseStatus(labDay.value),
    store.fetchExercises(),
  ]);
});

watch(showChecklist, (enabled) => {
  saveMessage.value = null;
  if (enabled) {
    syncChecklistRows();
  }
});

watch(labDay, (day) => {
  saveMessage.value = null;
  void store.fetchExerciseStatus(day).then(() => {
    if (showChecklist.value) {
      syncChecklistRows();
    }
  });
});
</script>
