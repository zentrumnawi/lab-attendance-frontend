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
              <div
                class="d-flex justify-end"
                v-if="item.status === 'Nicht eingereicht'"
              >
                <v-btn
                  class="text-none"
                  color="blue-darken-4"
                  rounded="0"
                  variant="outlined"
                  text="Abgabe"
                  @click="openSubmissionDialog(item)"
                />
              </div>
              <div
                class="d-flex justify-end"
                v-if="item.status === 'Eingereicht'"
              >
                <v-btn
                  class="text-none"
                  color="blue-darken-4"
                  rounded="0"
                  variant="outlined"
                  text="Abgabe akzeptieren"
                  @click="openEditedSubmissionDialog(item)"
                />
              </div>
              <div
                class="d-flex justify-space-between"
                v-if="item.status === 'Akzeptiert'"
              >
                <span
                  >Akzeptiert am
                  {{ formatSubmissionDate(item.accepted_date) }}</span
                >
                <v-btn
                  class="text-none"
                  color="blue-darken-4"
                  rounded="0"
                  variant="outlined"
                  text="Zurückziehen"
                  @click="openWithdrawSubmissionDialog(item)"
                />
              </div>
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

    <v-dialog v-model="editSubmissionDialog" max-width="560">
      <v-card title="Abgabe bearbeiten">
        <template #text>
          <p v-if="selectedEditStudent" class="text-body-1 mb-4">
            {{ selectedEditStudent.firstName }} {{ selectedEditStudent.name }}
          </p>

          <v-list density="compact" class="bg-surface-light rounded mb-4">
            <v-list-item>
              <v-list-item-title>Einreichungsdatum</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatSubmissionDate(selectedEditStudent?.submission_date) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Erforderliche Korrekturen</v-list-item-title>
              <v-list-item-subtitle>
                <v-textarea
                  :model-value="
                    selectedEditStudent?.necessary_corrections ?? ''
                  "
                  auto-grow
                  class="mt-2"
                  hide-details
                  label="Erforderliche Korrekturen"
                  rows="3"
                />
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-checkbox
            v-model="acceptSubmission"
            hide-details
            label="Abgabe akzeptieren"
          />
        </template>

        <v-divider />

        <v-card-actions class="bg-surface-light">
          <v-btn
            text="Abbrechen"
            variant="plain"
            :disabled="savingEditSubmission"
            @click="editSubmissionDialog = false"
          />

          <v-spacer />

          <v-btn
            text="Speichern"
            :disabled="!acceptSubmission"
            :loading="savingEditSubmission"
            @click="saveEditedSubmission"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="withdrawSubmissionDialog" max-width="560">
      <v-card title="Abgabe zurückziehen">
        <template #text>
          <p v-if="selectedEditStudent" class="text-body-1 mb-4">
            {{ selectedEditStudent.firstName }} {{ selectedEditStudent.name }}
          </p>

          <v-list density="compact" class="bg-surface-light rounded mb-4">
            <v-list-item>
              <v-list-item-title>Einreichungsdatum</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatSubmissionDate(selectedEditStudent?.submission_date) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Erforderliche Korrekturen</v-list-item-title>
              <v-list-item-subtitle>
                <v-textarea
                  :model-value="
                    selectedEditStudent?.necessary_corrections ?? ''
                  "
                  auto-grow
                  class="mt-2"
                  hide-details
                  label="Erforderliche Korrekturen"
                  rows="3"
                />
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Akzeptiert am</v-list-item-title>
              <v-list-item-subtitle>
                {{
                  formatSubmissionDate(
                    selectedEditStudent?.accepted_date ?? null,
                  ) ?? "—"
                }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-checkbox
            v-model="withdrawSubmission"
            hide-details
            label="Abgabe zurückziehen"
          />
          <span class="text-body-2"
            >Diese Aktion wird den Status der Abgabe auf "eingereicht"
            zurücksetzen.</span
          >
        </template>

        <v-divider />

        <v-card-actions class="bg-surface-light">
          <v-btn
            text="Abbrechen"
            variant="plain"
            :disabled="savingEditSubmission"
            @click="withdrawSubmissionDialog = false"
          />

          <v-spacer />

          <v-btn
            text="Speichern"
            :disabled="!withdrawSubmission"
            :loading="savingEditSubmission"
            @click="saveWithdrawSubmission"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useProtocolStore } from "@/stores/protocols";
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { format } from "date-fns";

type ProtocolStatus = "Akzeptiert" | "Eingereicht" | "Nicht eingereicht";

interface ProtocolRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  status: ProtocolStatus;
  accepted_date: Date | null;
  accepted: boolean;
  necessary_corrections: string | null;
  submission_date: Date | null;
  submitted: boolean;
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
  { title: "Labor-Partner", key: "labPartner", align: "start", width: "20%" },
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
const labDayOptions = Array.from({ length: 8 }, (_, index) => ({
  title: `Versuchstag ${index + 1}`,
  value: index + 1,
}));
const submissionDialog = shallowRef(false);
const editSubmissionDialog = shallowRef(false);
const selectedStudent = ref<ProtocolRow | null>(null);
const selectedEditStudent = ref<ProtocolRow | null>(null);
const acceptImmediately = ref(false);
const requireCorrections = ref(false);
const correctionsText = ref("");
const acceptSubmission = ref(false);
const savingSubmission = ref(false);
const savingEditSubmission = ref(false);
const withdrawSubmissionDialog = shallowRef(false);
const withdrawSubmission = ref(false);

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

function openEditedSubmissionDialog(item: ProtocolRow) {
  selectedEditStudent.value = item;
  acceptSubmission.value = false;
  editSubmissionDialog.value = true;
}

function openWithdrawSubmissionDialog(item: ProtocolRow) {
  selectedEditStudent.value = item;
  withdrawSubmission.value = false;
  withdrawSubmissionDialog.value = true;
}

function formatSubmissionDate(value: Date | string | null | undefined): string {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return format(date, "dd.MM.yyyy");
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

async function saveEditedSubmission() {
  if (!selectedEditStudent.value || !acceptSubmission.value) return;

  savingEditSubmission.value = true;

  try {
    console.log("selectedEditStudent.value", selectedEditStudent.value);
    await store.submitProtocol({
      lab_day: labDay.value,
      records: [
        {
          student_id: selectedEditStudent.value.id,
          submitted: true,
          submission_date: selectedEditStudent.value.submission_date,
          necessary_corrections:
            selectedEditStudent.value.necessary_corrections,
          accepted: true,
          accepted_date: new Date(),
        },
      ],
    });
    editSubmissionDialog.value = false;
  } finally {
    savingEditSubmission.value = false;
  }
}

async function saveWithdrawSubmission() {
  if (!selectedEditStudent.value || !withdrawSubmission.value) return;

  try {
    await store.submitProtocol({
      lab_day: labDay.value,
      records: [
        {
          student_id: selectedEditStudent.value.id,
          submitted: true,
          submission_date: selectedEditStudent.value.submission_date,
          necessary_corrections:
            selectedEditStudent.value.necessary_corrections,
          accepted: false,
          accepted_date: null,
        },
      ],
    });
  } finally {
    withdrawSubmissionDialog.value = false;
  }
}

onMounted(async () => {
  await Promise.all([
    attendeeStore.fetchStudents(),
    store.fetchProtocols(labDay.value),
  ]);
});

watch(labDay, (day) => {
  void store.fetchProtocols(day);
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
      accepted_date: protocol?.accepted_date ?? null,
      accepted: protocol?.accepted ?? false,
      necessary_corrections: protocol?.necessary_corrections ?? null,
      submission_date: protocol?.submission_date ?? null,
      submitted: protocol?.submitted ?? false,
    };
  }),
);
</script>
