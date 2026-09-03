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

    <v-alert border="top" type="info" variant="outlined" prominent>
      Hinweis: Speichern der Daten erfolgt sowohl für den ausgewählten
      Studierenden als auch für dessen Labor-Partner.
    </v-alert>
    <br />

    <v-sheet border rounded>
      <v-data-table
        :headers="headers"
        :items="rows"
        expand-strategy="single"
        item-value="id"
        :hide-default-footer="rows.length < 11"
        show-expand
      >
        <template #top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon
                color="medium-emphasis"
                icon="mdi-file-document-check"
                size="x-small"
                start
              ></v-icon>

              Protokollabgabe
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
              <div class="d-flex align-center justify-space-between">
                <div>
                  <v-chip
                    v-if="item.main_author"
                    class="ma-2"
                    color="yellow-darken-4"
                    label
                  >
                    <v-icon icon="mdi-pencil" start></v-icon>
                    Hauptautor
                  </v-chip>
                  <span v-if="item.status === 'Akzeptiert'" class="ma-2">
                    Akzeptiert am
                    {{ formatSubmissionDate(item.accepted_date) }}
                  </span>
                </div>
                <div>
                  <v-btn
                    v-if="item.status === 'Nicht eingereicht'"
                    class="text-none"
                    color="blue-darken-4"
                    rounded="0"
                    variant="outlined"
                    text="Abgabe"
                    @click="openSubmissionDialog(item)"
                  />
                  <v-btn
                    v-if="item.status === 'Eingereicht'"
                    class="text-none"
                    color="blue-darken-4"
                    rounded="0"
                    variant="outlined"
                    text="Abgabe akzeptieren"
                    @click="openEditedSubmissionDialog(item)"
                  />
                  <v-btn
                    v-if="item.status === 'Akzeptiert'"
                    class="text-none"
                    color="blue-darken-4"
                    rounded="0"
                    variant="outlined"
                    text="Zurückziehen"
                    @click="openWithdrawSubmissionDialog(item)"
                  />
                </div>
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
            Hauptautor: {{ mainAuthorLabel(selectedStudent) }}
          </p>
          <p v-if="selectedStudent" class="text-body-1 mb-4">
            Labor-Partner: {{ labPartnerLabel(selectedStudent) }}
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
            Hauptautor: {{ mainAuthorLabel(selectedEditStudent) }}
          </p>
          <p v-if="selectedEditStudent" class="text-body-1 mb-4">
            Labor-Partner: {{ labPartnerLabel(selectedEditStudent) }}
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
            Hauptautor: {{ mainAuthorLabel(selectedEditStudent) }}
          </p>
          <p v-if="selectedEditStudent" class="text-body-1 mb-4">
            Labor-Partner: {{ labPartnerLabel(selectedEditStudent) }}
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
import type { SubmitPaperRecord } from "@/api/protocols";
import { format } from "date-fns";
import { Attendee } from "@/stores/types";

type ProtocolStatus = "Akzeptiert" | "Eingereicht" | "Nicht eingereicht";

interface ProtocolRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  labPartnerId: string | null;
  status: ProtocolStatus;
  accepted_date: Date | null;
  accepted: boolean;
  necessary_corrections: string | null;
  submission_date: Date | null;
  submitted: boolean;
  main_author: boolean;
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

function buildLabPartnerName(student: Attendee): string {
  if (!student.labPartner) return "—";

  const labPartner = attendeeStore.getAttendeeById(student.labPartner);
  if (!labPartner) return "—";

  return `${labPartner.firstName} ${labPartner.name}`;
}

function formatStudentName(
  student: Pick<ProtocolRow, "firstName" | "name">,
): string {
  return `${student.firstName} ${student.name}`;
}

// Don't derive main author from who was clicked on
function resolveAuthorRoles(student: ProtocolRow): {
  mainAuthor: ProtocolRow;
  labPartner: ProtocolRow | null;
} {
  if (!student.labPartnerId) {
    return { mainAuthor: student, labPartner: null };
  }

  const partner =
    rows.value.find((row) => row.id === student.labPartnerId) ?? null;

  if (student.main_author) {
    return { mainAuthor: student, labPartner: partner };
  }

  if (partner?.main_author) {
    return { mainAuthor: partner, labPartner: student };
  }

  // No main author established yet (first submission): treat clicked student as author
  return { mainAuthor: student, labPartner: partner };
}

function mainAuthorLabel(student: ProtocolRow): string {
  return formatStudentName(resolveAuthorRoles(student).mainAuthor);
}

function labPartnerLabel(student: ProtocolRow): string {
  const { labPartner } = resolveAuthorRoles(student);
  if (!labPartner) return student.labPartner;
  return formatStudentName(labPartner);
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

function buildSubmissionRecords(student: ProtocolRow): SubmitPaperRecord[] {
  const submissionDate = new Date();
  const necessaryCorrections = requireCorrections.value
    ? correctionsText.value.trim() || null
    : null;
  const { mainAuthor, labPartner } = resolveAuthorRoles(student);

  const records: SubmitPaperRecord[] = [
    {
      student_id: mainAuthor.id,
      submitted: true,
      main_author: true,
      submission_date: submissionDate,
      necessary_corrections: necessaryCorrections,
      accepted: acceptImmediately.value,
      accepted_date: acceptImmediately.value ? submissionDate : null,
    },
  ];

  if (labPartner) {
    records.push({
      student_id: labPartner.id,
      submitted: true,
      main_author: false,
      submission_date: submissionDate,
      necessary_corrections: necessaryCorrections,
      accepted: acceptImmediately.value,
      accepted_date: acceptImmediately.value ? submissionDate : null,
    });
  }

  return records;
}

async function saveSubmission() {
  if (!selectedStudent.value || !canSaveSubmission.value) return;

  savingSubmission.value = true;

  try {
    await store.submitProtocol({
      lab_day: labDay.value,
      records: buildSubmissionRecords(selectedStudent.value),
    });
    submissionDialog.value = false;
  } finally {
    savingSubmission.value = false;
  }
}

async function saveEditedSubmission() {
  if (!selectedEditStudent.value || !acceptSubmission.value) return;

  savingEditSubmission.value = true;

  const { mainAuthor, labPartner } = resolveAuthorRoles(
    selectedEditStudent.value,
  );

  const baseData = {
    submitted: true,
    submission_date: selectedEditStudent.value.submission_date,
    necessary_corrections: selectedEditStudent.value.necessary_corrections,
    accepted: true,
    accepted_date: new Date(),
  };
  const records: SubmitPaperRecord[] = [
    {
      student_id: mainAuthor.id,
      ...baseData,
      main_author: true,
    },
  ];

  if (labPartner) {
    records.push({
      ...baseData,
      student_id: labPartner.id,
      main_author: false,
    });
  }

  try {
    await store.submitProtocol({
      lab_day: labDay.value,
      records: records,
    });
    editSubmissionDialog.value = false;
  } finally {
    savingEditSubmission.value = false;
  }
}

async function saveWithdrawSubmission() {
  if (!selectedEditStudent.value || !withdrawSubmission.value) return;

  const { mainAuthor, labPartner } = resolveAuthorRoles(
    selectedEditStudent.value,
  );

  const baseData = {
    submitted: true,
    submission_date: selectedEditStudent.value.submission_date,
    necessary_corrections: selectedEditStudent.value.necessary_corrections,
    accepted: false,
    accepted_date: null,
  };
  const records: SubmitPaperRecord[] = [
    {
      student_id: mainAuthor.id,
      ...baseData,
      main_author: true,
    },
  ];

  if (labPartner) {
    records.push({
      ...baseData,
      student_id: labPartner.id,
      main_author: false,
    });
  }

  try {
    await store.submitProtocol({
      lab_day: labDay.value,
      records: records,
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
      labPartnerId: attendee.labPartner || null,
      labPartner: buildLabPartnerName(attendee),
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
      main_author: protocol?.main_author ?? false,
    };
  }),
);
</script>
