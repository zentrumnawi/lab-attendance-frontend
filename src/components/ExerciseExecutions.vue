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

    <v-sheet border rounded>
      <v-data-table
        :headers="headers"
        :items="rows"
        expand-strategy="single"
        item-value="id"
        :hide-default-footer="rows.length < 11"
        show-expand
      >
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

onMounted(async () => {
  await Promise.all([
    attendeeStore.fetchStudents(),
    store.fetchExerciseStatus(labDay.value),
  ]);
});

watch(labDay, (day) => {
  void store.fetchExerciseStatus(day);
});

const rows = computed<ExerciseRow[]>(() =>
  attendeeStore.attendees.map((attendee) => {
    const completed = store.exercise_completions.includes(attendee.id);
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
</script>
