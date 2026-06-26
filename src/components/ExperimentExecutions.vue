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
  </div>
</template>

<script setup lang="ts">
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useExperimentStore } from "@/stores/experimentStore";
import { ref, onMounted, computed, watch } from "vue";

interface ExperimentExecutionRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  status: string;
  experimentsWithCompletionStatus: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

const attendeeStore = useAttendeeStore();
const experimentStore = useExperimentStore();
const labDay = ref(1);
const draftCompletions = ref<Record<string, Record<string, boolean>>>({});
const labDayOptions = Array.from({ length: 8 }, (_, index) => ({
  title: `Versuchstag ${index + 1}`,
  value: index + 1,
}));
const snackbar = ref(false);

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
  void experimentStore.fetchExperimentCompletions(day);
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
  const draft = draftCompletions.value[studentId];
  if (!draft) return;

  const experimentIds = [];
  for (const experimentId in draft) {
    if (draft[experimentId]) {
      experimentIds.push(experimentId);
    }
  }

  await experimentStore.setExperimentCompletion(
    labDay.value,
    studentId,
    experimentIds,
  );

  const remainingDrafts = { ...draftCompletions.value };
  delete remainingDrafts[studentId];
  draftCompletions.value = remainingDrafts;
  snackbar.value = true;
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

    return {
      id: attendee.id,
      name: attendee.name ?? "",
      firstName: attendee.firstName ?? "",
      matriculationNumber: attendee.matriculationNumber ?? "",
      labPartner: attendee.labPartner
        ? (attendeeStore.getAttendeeById(attendee.labPartner)?.name ?? "—")
        : "—",
      status: `${completedCount}/${experimentsWithCompletionStatus.length}`,
      experimentsWithCompletionStatus,
    };
  }),
);
</script>
