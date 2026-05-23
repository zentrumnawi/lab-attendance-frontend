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
      ></v-calendar>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

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

  events.value = evts;
}

function getEventColor(event: any) {
  return event.color;
}
</script>
