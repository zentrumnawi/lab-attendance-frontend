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
      >
        <template #day-label="{ date }">
          <div class="day-label">
            <div class="day-number">{{ new Date(date).getDate() }}</div>
            <v-btn
              size="x-small"
              class="day-button"
              @click.stop="handleButtonClick(date)"
            >
              +
            </v-btn>
          </div>
        </template>
      </v-calendar>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAttendanceStore } from "@/stores/attendance";

const router = useRouter();
const AttendanceStore = useAttendanceStore();
const value = ref("");
const events = ref<
  { name: string; start: Date; end: Date; color: string; timed: boolean }[]
>([]);

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
    });
  }

  for (let labDate of AttendanceStore.labDates) {
    evts.push({
      name: "Labor " + labDate.praktikum_day + " " + labDate.group,
      start: new Date(labDate.date),
      end: new Date(labDate.date),
      color: "pink-accent-2",
      timed: false,
    });
  }

  events.value = evts;
}

function getEventColor(event: any) {
  return event.color;
}

function handleButtonClick(date: string | Date | number) {
  router.push({
    name: "SingleSession",
    params: { date: date.toString() },
  });
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
