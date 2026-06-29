<template>
  <v-breadcrumbs
    :items="[
      { title: 'Teilnehmer', to: '/' },
      { title: attendee?.matriculationNumber ?? 'Unbekannt' },
    ]"
    divider=">"
  ></v-breadcrumbs>
  <v-expansion-panels v-model="expanded" multiple :elevation="5">
    <v-expansion-panel>
      <v-expansion-panel-title color="blue-grey-lighten-4"
        >Allgemeine Daten</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Vorname</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field :model-value="attendee?.firstName"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Nachname</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field :model-value="attendee?.name"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>E-Mail-Adresse</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field :model-value="attendee?.email"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Matrikelnummer</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="attendee?.matriculationNumber"
              type="number"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Studiengang</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field :model-value="attendee?.department"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Gruppe</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field :model-value="attendee?.group"></v-text-field>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-title color="blue-grey-lighten-4"
        >Anwesenheit und Leistung</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ error }}
        </v-alert>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Anzahl eingereichter Protokolle</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="performance?.papers_completed ?? ''"
              type="number"
              :loading="loading"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Anzahl bestandener Übungen</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="performance?.exercises_completed ?? ''"
              type="number"
              :loading="loading"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Anzahl besuchter Labortage</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="performance?.attendance_count ?? ''"
              type="number"
              :loading="loading"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-title color="blue-grey-lighten-4"
        >Zusätzliche Kommentare</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <v-row class="justify-space-around" density="compact">
          <v-col cols="12">
            <v-textarea
              label="Berechtigte Abwesenheitsgründe, Nachteilsausgleich usw."
              model-value=""
            ></v-textarea>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useStudentPerformanceStore } from "@/stores/studentPerformance";
import { useAttendeeStore } from "@/stores/attendeeStore";

const props = defineProps<{
  id: string;
}>();

const expanded = ref([0, 1, 2]);

const performanceStore = useStudentPerformanceStore();
const appStore = useAttendeeStore();
const attendee = computed(() => appStore.getAttendeeById(props.id));
const performance = computed(() => performanceStore.byStudentId[props.id]);
const loading = computed(() => performanceStore.loadingByStudentId[props.id]);
const error = computed(() => performanceStore.errorByStudentId[props.id]);

async function loadPerformance() {
  await performanceStore.fetchPerformance(props.id);
}

onMounted(() => {
  void loadPerformance();
});

watch(
  () => props.id,
  () => {
    void loadPerformance();
  },
);
</script>
