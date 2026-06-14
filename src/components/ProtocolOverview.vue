<template>
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
            <v-sheet class="ma-2" rounded="lg" border>
              <div v-if="item.status === 'Nicht eingereicht'">
                <v-btn text="Abgabe" @click="openSubmissionDialog(item)" />
              </div>
            </v-sheet>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="submissionDialog" max-width="560">
    <v-card title="Protokollabgabe">
      <template #text>
        <p v-if="selectedStudent" class="text-body-1 mb-4">
          {{ selectedStudent.firstName }} {{ selectedStudent.name }}
        </p>

        <v-checkbox
          v-model="acceptImmediately"
          hide-details
          label="Sofort akzeptieren"
          @update:model-value="onAcceptChange"
        />

        <v-checkbox
          v-model="requireCorrections"
          hide-details
          label="Korrekturen erforderlich"
          @update:model-value="onCorrectionsChange"
        />

        <v-textarea
          v-if="requireCorrections"
          v-model="correctionsText"
          auto-grow
          class="mt-2"
          hide-details
          label="Erforderliche Korrekturen"
          rows="3"
        />
      </template>

      <v-divider />

      <v-card-actions class="bg-surface-light">
        <v-btn
          text="Abbrechen"
          variant="plain"
          :disabled="savingSubmission"
          @click="submissionDialog = false"
        />

        <v-spacer />

        <v-btn
          text="Speichern"
          :disabled="!canSaveSubmission"
          :loading="savingSubmission"
          @click="saveSubmission"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useProtocolStore } from "@/stores/protocols";
import { computed, onMounted, ref, shallowRef } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";

type ProtocolStatus = "Akzeptiert" | "Eingereicht" | "Nicht eingereicht";

interface ProtocolRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  status: ProtocolStatus;
}

const headers: {
  title: string;
  key: string;
  align: "start" | "end" | "center";
  width: string;
}[] = [
  { title: "Name", key: "name", align: "start", width: "40%" },
  { title: "First Name", key: "firstName", align: "start", width: "40%" },
  {
    title: "Matriculation Number",
    key: "matriculationNumber",
    align: "start",
    width: "20%",
  },
  { title: "Lab Partner", key: "labPartner", align: "start", width: "20%" },
  { title: "Status", key: "status", align: "center", width: "20%" },
];

function statusIcon(status: ProtocolStatus): string {
  switch (status) {
    case "Akzeptiert":
      return "mdi-check-circle";
    case "Eingereicht":
      return "mdi-clock-outline";
    case "Nicht eingereicht":
      return "mdi-close-circle-outline";
  }
}

function statusColor(status: ProtocolStatus): string {
  switch (status) {
    case "Akzeptiert":
      return "success";
    case "Eingereicht":
      return "warning";
    case "Nicht eingereicht":
      return "error";
  }
}

const store = useProtocolStore();
const attendeeStore = useAttendeeStore();
const labDay = ref(1);
const submissionDialog = shallowRef(false);
const selectedStudent = ref<ProtocolRow | null>(null);
const acceptImmediately = ref(false);
const requireCorrections = ref(false);
const correctionsText = ref("");
const savingSubmission = ref(false);

const canSaveSubmission = computed(
  () =>
    selectedStudent.value !== null &&
    (acceptImmediately.value || requireCorrections.value),
);

function openSubmissionDialog(item: ProtocolRow) {
  selectedStudent.value = item;
  acceptImmediately.value = false;
  requireCorrections.value = false;
  correctionsText.value = "";
  submissionDialog.value = true;
}

function onAcceptChange(value: boolean | null) {
  if (value) {
    requireCorrections.value = false;
    correctionsText.value = "";
  }
}

function onCorrectionsChange(value: boolean | null) {
  if (value) {
    acceptImmediately.value = false;
  }
}

async function saveSubmission() {
  if (!selectedStudent.value || !canSaveSubmission.value) return;

  savingSubmission.value = true;

  try {
    await store.submitProtocol({
      lab_day: labDay.value,
      records: [
        {
          student_id: selectedStudent.value.id,
          submitted: true,
          submission_date: new Date(),
          necessary_corrections: requireCorrections.value
            ? correctionsText.value.trim() || null
            : null,
          accepted: acceptImmediately.value,
          accepted_date: acceptImmediately.value ? new Date() : null,
        },
      ],
    });
    submissionDialog.value = false;
  } finally {
    savingSubmission.value = false;
  }
}

onMounted(async () => {
  await Promise.all([
    attendeeStore.fetchStudents(),
    store.fetchProtocols(labDay.value),
  ]);
});

const rows = computed<ProtocolRow[]>(() =>
  attendeeStore.attendees.map((attendee) => {
    const protocol = store.protocalByStudentId.get(attendee.id);
    return {
      id: attendee.id,
      name: attendee.name ?? "",
      firstName: attendee.firstName ?? "",
      matriculationNumber: attendee.matriculationNumber ?? "",
      labPartner: attendee.labPartner ?? "",
      status: protocol?.accepted
        ? "Akzeptiert"
        : protocol?.submitted
          ? "Eingereicht"
          : "Nicht eingereicht",
    };
  }),
);
</script>
