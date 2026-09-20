<template>
  <v-snackbar
    color="success"
    location="bottom end"
    prepend-icon="$success"
    text="Änderungen gespeichert."
    timeout="3000"
    title="Erfolgreich gespeichert"
    contained
    v-model="snackbar"
  >
  </v-snackbar>
  <v-snackbar
    color="error"
    location="bottom end"
    prepend-icon="$error"
    text="Versuchsdurchführung(en) konnte(n) nicht gespeichert werden."
    timeout="3000"
    title="Fehler beim Speichern"
    contained
    v-model="saveErrorSnackbar"
  >
  </v-snackbar>
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

    <v-alert border="top" type="info" variant="outlined" prominent>
      Hinweis: Speichern der Daten erfolgt sowohl für den ausgewählten
      Studierenden als auch für dessen Labor-Partner.
    </v-alert>
    <br />

    <v-sheet border rounded class="mb-4 pa-4">
      <div class="text-subtitle-2 font-weight-medium mb-2">Experimente</div>

      <ul
        v-if="experimentsForLabDay.length"
        class="d-flex flex-column ga-2 ps-4 mb-0"
      >
        <li
          v-for="experiment in experimentsForLabDay"
          :key="experiment.id"
          class="d-flex align-center ga-2"
        >
          <v-icon
            icon="mdi-flask-outline"
            color="medium-emphasis"
            size="small"
          />
          <span class="font-weight-medium">{{ experiment.title }}</span>
          <span
            v-if="experiment.description"
            class="text-medium-emphasis text-body-2"
          >
            — {{ experiment.description }}
          </span>
        </li>
      </ul>

      <p v-else class="text-medium-emphasis text-body-2 mb-0">
        Keine Experimente für diesen Versuchstag.
      </p>
    </v-sheet>

    <v-switch
      v-model="showChecklist"
      class="mb-4"
      :disabled="experimentsForLabDay.length === 0"
      hide-details
      :label="showChecklist ? 'Individuelle Auswahl' : 'Checkliste'"
    />

    <v-sheet v-if="!showChecklist" border rounded>
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
        expand-strategy="single"
        item-value="id"
        :hide-default-footer="rows.length < 11"
        :show-expand="experimentsForLabDay.length > 0"
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

              Versuchsdurchführungen
            </v-toolbar-title>
          </v-toolbar>
        </template>
        <template #[`item.status`]="{ value }">
          {{ value }}
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-4">
              <div
                v-for="experiment in item.experimentsWithCompletionStatus"
                :key="experiment.id"
                class="d-flex align-center"
              >
                <v-checkbox
                  :model-value="
                    draftCompleted(
                      item.id,
                      experiment.id,
                      experiment.completed,
                      item.experimentsWithCompletionStatus,
                    )
                  "
                  :label="experiment.title"
                  density="compact"
                  hide-details
                  @update:model-value="
                    updateDraft(
                      item.id,
                      experiment.id,
                      $event,
                      item.experimentsWithCompletionStatus,
                    )
                  "
                />
              </div>

              <v-btn
                class="mt-2"
                color="primary"
                size="small"
                text="Speichern"
                @click="saveCompletions(item.id)"
              />
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-sheet>

    <v-sheet v-else border rounded>
      <v-alert
        v-if="checklistSaveMessage"
        :type="checklistSaveError ? 'error' : 'success'"
        class="ma-4"
        closable
        @click:close="checklistSaveMessage = null"
      >
        {{ checklistSaveMessage }}
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

              Versuchsdurchführungen — Checkliste
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              color="primary"
              :disabled="
                savingChecklist ||
                checklistRows.length === 0 ||
                experimentsForLabDay.length === 0
              "
              :loading="savingChecklist"
              @click="saveChecklist"
            >
              Speichern
            </v-btn>
          </v-toolbar>
        </template>

        <template #[`item.completed`]="{ item }">
          <v-checkbox-btn
            :model-value="item.completed"
            hide-details
            density="compact"
            color="primary"
            @update:model-value="setCompleted(item.id, $event)"
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
            <span>Alle erledigt</span>
          </div>
        </template>

        <template #no-data>
          <div><p>Keine Studierenden gefunden</p></div>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useExperimentStore } from "@/stores/experimentStore";
import { ref, onMounted, computed, watch } from "vue";
import { QueuedLocallyError } from "@/utils/network";

interface ExperimentExecutionRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  status: string;
  completed: boolean;
  experimentsWithCompletionStatus: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface ChecklistRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  completed: boolean;
}

const attendeeStore = useAttendeeStore();
const experimentStore = useExperimentStore();
const labDay = ref(1);
const showChecklist = ref(false);
const draftCompletions = ref<Record<string, Record<string, boolean>>>({});
const checklistRows = ref<ChecklistRow[]>([]);
const savingChecklist = ref(false);
const checklistSaveMessage = ref<string | null>(null);
const checklistSaveError = ref(false);
const labDayOptions = Array.from({ length: 8 }, (_, index) => ({
  title: `Versuchstag ${index + 1}`,
  value: index + 1,
}));
const snackbar = ref(false);
const saveMessage = ref<string | null>(null);
const saveError = ref(false);
const saveErrorSnackbar = ref(false);

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
  { title: "Labor-Partner", key: "labPartner", align: "start", width: "20%" },
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
  { title: "Labor-Partner", key: "labPartner", align: "start", width: "20%" },
  {
    title: "Alle erledigt",
    key: "completed",
    align: "end",
    sortable: false,
    width: "180",
  },
];

onMounted(async () => {
  await Promise.all([
    attendeeStore.fetchStudents(),
    experimentStore.fetchExperiments(),
    experimentStore.fetchExperimentCompletions(labDay.value),
  ]);
});

watch(labDay, (day) => {
  // reset unsaved state of checkboxes
  draftCompletions.value = {};
  checklistSaveMessage.value = null;
  void experimentStore.fetchExperimentCompletions(day).then(() => {
    if (showChecklist.value) {
      syncChecklistRows();
    }
  });
});

watch(showChecklist, (enabled) => {
  checklistSaveMessage.value = null;
  if (enabled) {
    syncChecklistRows();
  }
});

type SuccessfulExperiment =
  ExperimentExecutionRow["experimentsWithCompletionStatus"][number];

function ensureDraft(studentId: string, experiments: SuccessfulExperiment[]) {
  if (draftCompletions.value[studentId]) return;

  draftCompletions.value = {
    ...draftCompletions.value,
    [studentId]: Object.fromEntries(
      experiments.map((experiment) => [experiment.id, experiment.completed]),
    ),
  };
}

// This is for local, not yet dispatched edits, so that checkboxes reflect the right state
function draftCompleted(
  studentId: string,
  experimentId: string,
  saved: boolean,
  experiments: SuccessfulExperiment[],
) {
  ensureDraft(studentId, experiments);
  return draftCompletions.value[studentId][experimentId] ?? saved;
}

function updateDraft(
  studentId: string,
  experimentId: string,
  completed: boolean | null,
  experiments: SuccessfulExperiment[],
) {
  if (completed === null) return;

  ensureDraft(studentId, experiments);
  draftCompletions.value = {
    ...draftCompletions.value,
    [studentId]: {
      ...draftCompletions.value[studentId],
      [experimentId]: completed,
    },
  };
}

async function saveCompletions(studentId: string) {
  saveMessage.value = null;
  saveError.value = false;
  const draft = draftCompletions.value[studentId];
  if (!draft) return;

  const experimentIds = [];
  for (const experimentId in draft) {
    if (draft[experimentId]) {
      experimentIds.push(experimentId);
    }
  }

  try {
    await experimentStore.setExperimentCompletion(
      labDay.value,
      studentId,
      experimentIds,
      attendeeStore.getAttendeeById(studentId)?.labPartner,
    );
    snackbar.value = true;
  } catch (e) {
    if (e instanceof QueuedLocallyError) {
      saveError.value = true;
      saveMessage.value =
        "Nur lokal gespeichert. Synchronisation unter „Ausstehende Synchronisation“.";
      saveErrorSnackbar.value = true;
    } else {
      saveErrorSnackbar.value = true;
      saveError.value = true;
      saveMessage.value =
        "Versuchsdurchführung(en) konnte(n) nicht gespeichert werden.";
    }
  }
  const remainingDrafts = { ...draftCompletions.value };
  delete remainingDrafts[studentId];
  draftCompletions.value = remainingDrafts;
}

const experimentsForLabDay = computed(() =>
  experimentStore.experiments.filter((e) => e.lab_day === labDay.value),
);

const successfulExecutionsForLabDay = computed(() =>
  experimentStore.experimentCompletions.get(labDay.value),
);

const rows = computed<ExperimentExecutionRow[]>(() =>
  attendeeStore.attendees.map((attendee) => {
    const completion = successfulExecutionsForLabDay.value?.find(
      (entry) => entry.student === attendee.id,
    );
    const completedIds = new Set(completion?.experiment_completions ?? []);

    const experimentsWithCompletionStatus = experimentsForLabDay.value.map(
      (experiment) => ({
        id: experiment.id,
        title: experiment.title,
        completed: completedIds.has(experiment.id),
      }),
    );
    const completedCount = experimentsWithCompletionStatus.filter(
      (experiment) => experiment.completed,
    ).length;
    const allDone =
      experimentsWithCompletionStatus.length > 0 &&
      completedCount === experimentsWithCompletionStatus.length;

    return {
      id: attendee.id,
      name: attendee.name ?? "",
      firstName: attendee.firstName ?? "",
      matriculationNumber: attendee.matriculationNumber ?? "",
      labPartner: attendee.labPartner
        ? (attendeeStore.getAttendeeById(attendee.labPartner)?.name ?? "—")
        : "—",
      status: `${completedCount}/${experimentsWithCompletionStatus.length}`,
      completed: allDone,
      experimentsWithCompletionStatus,
    };
  }),
);

const allCompleted = computed(
  () =>
    checklistRows.value.length > 0 &&
    checklistRows.value.every((row) => row.completed),
);

function syncChecklistRows() {
  checklistRows.value = rows.value.map((row) => ({
    id: row.id,
    name: row.name,
    firstName: row.firstName,
    matriculationNumber: row.matriculationNumber,
    labPartner: row.labPartner,
    completed: row.completed,
  }));
}

function setCompleted(studentId: string, value: boolean | null) {
  if (value === null) return;

  const row = checklistRows.value.find((r) => r.id === studentId);
  if (!row) return;
  row.completed = value;

  const partnerId = attendeeStore.getAttendeeById(studentId)?.labPartner;
  if (!partnerId) return;

  const partnerRow = checklistRows.value.find((r) => r.id === partnerId);
  if (partnerRow) {
    partnerRow.completed = value;
  }
}

function toggleCompleted(value: boolean | null) {
  const completed = value ?? !allCompleted.value;
  checklistRows.value.forEach((row) => {
    row.completed = completed;
  });
}

async function saveChecklist() {
  if (experimentsForLabDay.value.length === 0) return;

  savingChecklist.value = true;
  checklistSaveMessage.value = null;
  checklistSaveError.value = false;

  const allExperimentIds = experimentsForLabDay.value.map(
    (experiment) => experiment.id,
  );

  const recordsByStudent = new Map<
    string,
    { student_id: string; experiment_ids: string[] }
  >();

  for (const row of checklistRows.value) {
    const experimentIds = row.completed ? allExperimentIds : [];
    recordsByStudent.set(row.id, {
      student_id: row.id,
      experiment_ids: experimentIds,
    });
  }

  try {
    await experimentStore.setBulkExperimentCompletions(labDay.value, [
      ...recordsByStudent.values(),
    ]);
    checklistSaveMessage.value = "Versuchsdurchführungen gespeichert.";
  } catch (e) {
    if (e instanceof QueuedLocallyError) {
      checklistSaveError.value = false;
      checklistSaveMessage.value =
        "Nur lokal gespeichert. Synchronisation unter „Ausstehende Synchronisation“.";
    } else {
      checklistSaveError.value = true;
      checklistSaveMessage.value =
        "Versuchsdurchführungen konnten nicht gespeichert werden.";
    }
  } finally {
    savingChecklist.value = false;
  }
}
</script>
