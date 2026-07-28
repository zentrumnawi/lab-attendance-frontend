<template>
  <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
    <v-breadcrumbs
      :items="[
        { title: 'Teilnehmer', to: '/' },
        { title: attendee?.matriculationNumber ?? 'Unbekannt' },
      ]"
      divider=">"
      class="pa-0"
    ></v-breadcrumbs>
    <v-btn
      color="primary"
      prepend-icon="mdi-file-pdf-box"
      text="PDF herunterladen"
      variant="tonal"
      :disabled="!attendee || loading"
      @click="downloadPdf"
    />
  </div>
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
            <v-text-field
              :model-value="attendee?.firstName"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Nachname</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field :model-value="attendee?.name" readonly></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>E-Mail-Adresse</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="attendee?.email"
              readonly
            ></v-text-field>
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
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Studiengang</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="
                departmentStore.getDepartmentNameById(
                  attendee?.department ?? '',
                ) ?? ''
              "
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Gruppe</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="groupStore.getGroupNameById(attendee?.group ?? '')"
              readonly
            ></v-text-field>
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
            <v-list-subheader>Anzahl akzeptierter Protokolle</v-list-subheader>
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
            <v-list-subheader
              >Anzahl akzeptierter Übungsblätter</v-list-subheader
            >
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
              :model-value="performance?.lab_attendance_count ?? ''"
              type="number"
              :loading="loading"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader
              >Anzahl besuchter Seminarsitzungen</v-list-subheader
            >
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="performance?.lecture_attendance_count ?? ''"
              type="number"
              :loading="loading"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Anzahl absolvierter Versuche</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              :model-value="experimentsCompletionDisplay"
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
          <v-col cols="11">
            <v-textarea
              label="Berechtigte Abwesenheitsgründe, Nachteilsausgleich, Gründe für Nichtbestehen usw."
              :model-value="performance?.comment ?? ''"
              auto-grow
              hide-details
              readonly
            ></v-textarea>
          </v-col>
          <v-col cols="1" class="d-flex align-start justify-end pt-1">
            <v-btn
              color="primary"
              icon
              size="default"
              variant="tonal"
              @click="openCommentDialog"
            >
              <v-icon icon="mdi-dots-vertical" size="medium" />
            </v-btn>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <v-dialog v-model="commentDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h6">Kommentar</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="commentText"
          auto-grow
          hide-details
          label="Kommentar"
          rows="3"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="Abbrechen"
          variant="text"
          :disabled="savingComment"
          @click="commentDialog = false"
        />
        <v-btn
          color="primary"
          text="Speichern"
          :loading="savingComment"
          @click="saveComment"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useStudentPerformanceStore } from "@/stores/studentPerformance";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useGroupStore } from "@/stores/groupStore";
import { useDepartmentStore } from "@/stores/departmentStore";
import { useExperimentStore } from "@/stores/experimentStore";
import { downloadIndividualResultPdf } from "@/utils/generateIndividualResultPdf";

const groupStore = useGroupStore();
const departmentStore = useDepartmentStore();
const experimentStore = useExperimentStore();

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

const experimentsCompletionDisplay = computed(
  () =>
    `${performance.value?.experiments_completed ?? ""} / ${experimentStore.experiments.length}`,
);

const commentDialog = ref(false);
const commentText = ref("");
const savingComment = ref(false);

function openCommentDialog() {
  commentText.value = performance.value?.comment ?? "";
  commentDialog.value = true;
}

function downloadPdf() {
  if (!attendee.value) {
    return;
  }

  downloadIndividualResultPdf({
    firstName: attendee.value.firstName ?? "",
    lastName: attendee.value.name ?? "",
    email: attendee.value.email ?? "",
    matriculationNumber: String(attendee.value.matriculationNumber ?? ""),
    department:
      departmentStore.getDepartmentNameById(attendee.value.department ?? "") ??
      "",
    groupName: groupStore.getGroupNameById(attendee.value.group ?? "") ?? "",
    papersCompleted: String(performance.value?.papers_completed ?? ""),
    exercisesCompleted: String(performance.value?.exercises_completed ?? ""),
    labAttendanceCount: String(performance.value?.lab_attendance_count ?? ""),
    lectureAttendanceCount: String(
      performance.value?.lecture_attendance_count ?? "",
    ),
    experimentsCompleted: experimentsCompletionDisplay.value,
    comment: performance.value?.comment ?? "",
  });
}

async function saveComment() {
  savingComment.value = true;
  try {
    await performanceStore.saveComment(props.id, commentText.value);
    commentDialog.value = false;
  } finally {
    savingComment.value = false;
  }
}

async function loadPerformance() {
  await performanceStore.fetchPerformance(props.id);
}

async function loadStudentData() {
  await appStore.fetchSingleStudent(props.id);
}

async function loadPageData() {
  await Promise.all([
    loadPerformance(),
    loadStudentData(),
    experimentStore.fetchExperiments(),
    groupStore.fetchGroups(),
    departmentStore.fetchDepartments(),
  ]);
}

onMounted(() => {
  void loadPageData();
});

watch(
  () => props.id,
  () => {
    void loadPageData();
  },
);
</script>
