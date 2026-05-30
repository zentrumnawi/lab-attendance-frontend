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
          </v-toolbar>
        </template>

        <template #[`item.name`]="{ value }">
          <span class="font-weight-medium">{{ value }}</span>
        </template>

        <template #[`item.present`]="{ item }">
          <v-checkbox-btn
            v-model="item.present"
            :label="item.present ? 'Present' : 'Absent'"
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
          </div>
        </template>

        <template #no-data>
          <div><p>No students found</p></div>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useAttendanceStore } from "@/stores/attendance";

const props = defineProps<{
  date: string;
}>();

interface SessionRow {
  id: string;
  name: string;
  present: boolean;
}

const attendanceStore = useAttendanceStore();

const store = useAppStore();
const rows = ref<SessionRow[]>([]);

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
  { title: "Student", key: "name", align: "start" },
  {
    title: "Attendance",
    key: "present",
    align: "start",
    sortable: false,
    width: "180",
  },
];

function displayName(attendee: { firstName: string; name: string }): string {
  return [attendee.firstName, attendee.name].filter(Boolean).join(" ").trim();
}

function togglePresent(value: boolean | null) {
  const present = value ?? !allPresent.value;
  rows.value.forEach((row) => {
    row.present = present;
  });
}

onMounted(async () => {
  await store.fetchStudents();
  // try to fetch attendance record for this date, if not found, create a new one
  const labSession = await attendanceStore.fetchSingleLabSession(props.date);
  if (!labSession) {
    rows.value = store.attendees.map((student) => ({
      id: student.id,
      name: displayName(student),
      present: false,
    }));
  } else {
    rows.value = labSession.map((attendee) => ({
      id: attendee.student,
      name: displayName(store.getAttendeeById(attendee.student)!),
      present: attendee.is_present,
    }));
  }
});
</script>
