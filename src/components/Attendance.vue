<template>
  <div>
    <v-sheet class="d-flex" tile>
      <div class="text-h6">Labor 2026</div>
    </v-sheet>
    <v-sheet height="600">
      <v-calendar
        ref="calendar"
        v-model="value"
        :event-color="getEventColor"
        event-overlap-mode="stack"
        :event-overlap-threshold="30"
        :events="events"
        type="month"
        start="2026-08-01"
        :weekdays="[1, 2, 3, 4, 5]"
        @change="getEvents"
        @click:event="handleEventClick"
        @click:more="handleMoreClick"
      >
        <template #day-label="{ date }">
          <div class="day-label">
            <div class="day-number">{{ new Date(date).getDate() }}</div>
            <v-btn
              v-if="
                !AuthStore.isSuperuser &&
                !SEMINAR_DAYS.includes(date.toString())
              "
              size="x-small"
              class="day-button"
              @click.stop="handleButtonClick(date, AuthStore.groupName)"
            >
              +
            </v-btn>
          </div>
        </template>
      </v-calendar>
    </v-sheet>
    <v-dialog v-model="showMoreDialog" max-width="500">
      <v-card>
        <v-card-title> Events on {{ selectedDate }} </v-card-title>

        <v-card-text>
          <v-list>
            <v-list-item
              v-for="(event, index) in selectedEvents"
              :key="`${event.name}-${event.start}-${index}`"
              @click="handleEventFromDialog(event)"
            >
              <template #prepend>
                <v-icon icon="mdi-calendar" :color="event.color" />
              </template>

              <v-list-item-title>
                {{ event.name }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="showMoreDialog = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAttendanceStore } from "@/stores/attendance";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const AttendanceStore = useAttendanceStore();
const AuthStore = useAuthStore();
const value = ref("");
const events = ref<
  {
    name: string;
    start: Date;
    end: Date;
    color: string;
    timed: boolean;
    group?: string;
    praktikum_day?: number;
    day_type?: string;
  }[]
>([]);

const showMoreDialog = ref(false);
const selectedDate = ref("");
const selectedEvents = ref<typeof events.value>([]);

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function handleMoreClick(nativeEvent: MouseEvent, { date }: { date: string }) {
  nativeEvent.stopPropagation();

  selectedDate.value = date;

  selectedEvents.value = events.value.filter(
    (event) => formatDate(event.start) === date,
  );

  showMoreDialog.value = true;
}

function handleEventFromDialog(event: (typeof events.value)[number]) {
  showMoreDialog.value = false;

  if (event.day_type === "seminar") {
    router.push({
      name: "SingleSessionSem",
      params: {
        date: formatDate(event.start),
      },
    });
  } else if (event.day_type === "lab") {
    router.push({
      name: "SingleSession",
      params: {
        date: formatDate(event.start),
        group: event.group ?? "",
        praktikumDay: String(event.praktikum_day),
      },
    });
  }
}

const SEMINAR_DAYS = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24"];

function getEvents() {
  const evts = [];

  for (let seminarDay of SEMINAR_DAYS) {
    evts.push({
      name: "Seminar",
      start: new Date(seminarDay),
      end: new Date(seminarDay),
      color: "deep-purple",
      timed: false,
      day_type: "seminar",
    });
  }

  for (let labDate of AttendanceStore.labDates) {
    evts.push({
      name: "Labortag " + labDate.praktikum_day + " (" + labDate.group + ")",
      start: new Date(labDate.date),
      end: new Date(labDate.date),
      color: "pink-accent-2",
      timed: false,
      group: labDate.group,
      praktikum_day: labDate.praktikum_day,
      day_type: "lab",
    });
  }

  events.value = evts;
}

function getEventColor(event: any) {
  return event.color;
}

function handleButtonClick(date: string | Date | number, group: string | null) {
  // new session: date from calendar, Versuchstag entered on the form
  router.push({
    name: "SingleSession",
    params: {
      date: date.toString(),
      group: group ?? "",
    },
  });
}

function handleEventClick(nativeEvent: any, { event }: any) {
  console.log(event);
  if (event.day_type === "seminar") {
    router.push({
      name: "SingleSessionSem",
      params: { date: event.start.toLocaleDateString("en-CA") },
    });
  } else if (event.day_type === "lab") {
    router.push({
      name: "SingleSession",
      params: {
        date: event.start.toLocaleDateString("en-CA"),
        group: event.group,
        praktikumDay: String(event.praktikum_day),
      },
    });
  }
}

onMounted(() => {
  void AttendanceStore.fetchLabDates().then(() => {
    getEvents();
  });
});
</script>

<style scoped>
.day-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
}

.day-number {
  font-weight: bold;
}
.day-button {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: lightgreen;
}
</style>
