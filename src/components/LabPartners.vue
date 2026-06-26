<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      color="success"
      location="bottom end"
      timeout="3000"
      text="Labor-Partner gespeichert."
      title="Erfolgreich gespeichert"
      contained
    />

    <v-alert
      v-if="errorMessage"
      class="mb-4"
      closable
      type="error"
      @click:close="errorMessage = null"
    >
      {{ errorMessage }}
    </v-alert>

    <v-sheet border rounded>
      <v-data-table
        :headers="headers"
        :hide-default-footer="rows.length < 11"
        :items="rows"
        :loading="loading"
        item-value="id"
      >
        <template #top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon
                color="medium-emphasis"
                icon="mdi-account-switch-outline"
                size="x-small"
                start
              />
              Labor-Partner
            </v-toolbar-title>
          </v-toolbar>
        </template>

        <template #[`item.labPartner`]="{ item }">
          <v-select
            :model-value="draftPartners[item.id] ?? null"
            :items="partnerOptionsFor(item.id)"
            density="compact"
            hide-details
            item-title="title"
            item-value="value"
            label="Labor-Partner"
            clearable
            @update:model-value="setPartner(item.id, $event)"
          />
        </template>

        <template #no-data>
          <div><p>Keine Teilnehmer gefunden</p></div>
        </template>
      </v-data-table>

      <div class="pa-4 d-flex justify-end">
        <v-btn
          color="primary"
          :disabled="loading || rows.length === 0"
          :loading="saving"
          text="Speichern"
          @click="save"
        />
      </div>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useAuthStore } from "@/stores/auth";
import type { BulkLabPartnersPayload } from "@/api/students";
import type { Attendee } from "@/stores/types";

interface LabPartnerRow {
  id: string;
  name: string;
  firstName: string;
  matriculationNumber: string;
}

interface PartnerOption {
  title: string;
  value: string;
}

const attendeeStore = useAttendeeStore();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const snackbar = ref(false);
const errorMessage = ref<string | null>(null);
const draftPartners = ref<Record<string, string | null>>({});

const headers: {
  title: string;
  key: string;
  align: "start" | "end" | "center";
  sortable?: boolean;
  width?: string;
}[] = [
  { title: "Name", key: "name", align: "start", width: "30%" },
  { title: "Vorname", key: "firstName", align: "start", width: "30%" },
  {
    title: "Matrikelnummer",
    key: "matriculationNumber",
    align: "start",
    width: "20%",
  },
  {
    title: "Labor-Partner",
    key: "labPartner",
    align: "start",
    sortable: false,
    width: "20%",
  },
];

const rows = computed<LabPartnerRow[]>(() =>
  attendeeStore.attendees.map((attendee) => ({
    id: attendee.id,
    name: attendee.name,
    firstName: attendee.firstName,
    matriculationNumber: attendee.matriculationNumber ?? "",
  })),
);

function partnerOptionsFor(studentId: string): PartnerOption[] {
  // paired individuals should not be available as options
  const partners = Object.entries(draftPartners.value).map(
    ([, partnerId]) => partnerId,
  );
  return attendeeStore.attendees
    .filter(
      (attendee) =>
        attendee.id !== studentId &&
        (!partners.includes(attendee.id) ||
          draftPartners.value[studentId] === attendee.id),
    )
    .map((attendee) => ({
      title: formatPartnerLabel(attendee),
      value: attendee.id,
    }));
}

function formatPartnerLabel(attendee: Attendee): string {
  const matriculation = attendee.matriculationNumber?.trim();
  const name = `${attendee.firstName} ${attendee.name}`.trim();

  if (matriculation) {
    return `${name} (${matriculation})`;
  }

  return name;
}

function isValidPartner(studentId: string, partnerId: string | null): boolean {
  if (!partnerId) return true;
  if (partnerId === studentId) return false;
  return attendeeStore.getAttendeeById(partnerId) !== undefined;
}

function initDraftFromStore() {
  const draft: Record<string, string | null> = {};

  for (const attendee of attendeeStore.attendees) {
    const partnerId = attendee.labPartner || null;
    draft[attendee.id] = isValidPartner(attendee.id, partnerId)
      ? partnerId
      : null;
  }

  draftPartners.value = draft;
}

function setPartner(studentId: string, partnerId: string | null) {
  // sever link to former partner
  const formerPartner = draftPartners.value[studentId];
  if (formerPartner) {
    draftPartners.value[formerPartner] = null;
  }
  if (partnerId === null) {
    delete draftPartners.value[studentId];
  } else {
    draftPartners.value[studentId] = partnerId;
    draftPartners.value[partnerId] = studentId;
  }
}

function buildLabPartnersPayload(): BulkLabPartnersPayload {
  const group = authStore.groupName;
  if (!group) {
    throw new Error("Keine Gruppe für den aktuellen Benutzer gefunden.");
  }

  const paired = new Set<string>();
  const pairs: BulkLabPartnersPayload["pairs"] = [];
  const unpaired_student_ids: string[] = [];

  for (const attendee of attendeeStore.attendees) {
    if (paired.has(attendee.id)) continue;

    const partnerId = draftPartners.value[attendee.id];
    if (partnerId && partnerId !== attendee.id && !paired.has(partnerId)) {
      pairs.push({
        student_a_id: attendee.id,
        student_b_id: partnerId,
      });
      paired.add(attendee.id);
      paired.add(partnerId);
    } else {
      unpaired_student_ids.push(attendee.id);
    }
  }

  return { group, pairs, unpaired_student_ids };
}

async function save() {
  saving.value = true;
  errorMessage.value = null;

  try {
    await attendeeStore.saveLabPartners(buildLabPartnersPayload());
    snackbar.value = true;
  } catch (e) {
    errorMessage.value =
      e instanceof Error
        ? e.message
        : "Labor-Partner konnten nicht gespeichert werden.";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  loading.value = true;

  try {
    await attendeeStore.fetchStudents();
    initDraftFromStore();
  } catch (e) {
    errorMessage.value =
      e instanceof Error
        ? e.message
        : "Teilnehmer konnten nicht geladen werden.";
  } finally {
    loading.value = false;
  }
});
</script>
