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
              <div>
                <p>Details for {{ item.firstName }} {{ item.name }}</p>
              </div>
            </v-sheet>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-sheet>
</template>

<script setup lang="ts">
import { useProtocolStore } from "@/stores/protocols";
import { computed, onMounted } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";

type ProtocolStatus = "Akzeptiert" | "Eingereicht" | "Nicht eingereicht";

interface ProtocolRow {
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

// const rows = ref<ProtocolRow[]>([]);

onMounted(async () => {
  await Promise.all([attendeeStore.fetchStudents(), store.fetchProtocols(1)]);
  console.log(store.protocols);
});

const rows = computed<ProtocolRow[]>(() =>
  attendeeStore.attendees.map((attendee) => {
    const protocol = store.protocalByStudentId.get(attendee.id);
    console.log(attendee.firstName, attendee.id, attendee.name);
    return {
      id: attendee.id,
      name: attendee.name ?? null,
      firstName: attendee.firstName ?? null,
      matriculationNumber: attendee.matriculationNumber ?? null,
      labPartner: attendee.labPartner ?? null,
      status: protocol?.accepted
        ? "Akzeptiert"
        : protocol?.submitted
          ? "Eingereicht"
          : "Nicht eingereicht",
    };
  }),
);
</script>
