<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="(experiments?.length ?? 0) < 6"
      :items="experiments"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title> Experimente </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Hinzufügen"
            border
            @click="add"
          ></v-btn>
        </v-toolbar>
      </template>

      <template #[`item.title`]="{ value }">
        <span class="d-inline-flex align-center ga-2">
          <v-icon
            icon="mdi-flask-outline"
            color="medium-emphasis"
            size="small"
          />
          <span class="font-weight-medium">{{ value }}</span>
        </span>
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="d-flex ga-2 justify-end">
          <v-icon
            color="medium-emphasis"
            icon="mdi-pencil"
            size="small"
            @click="edit(item.id)"
          ></v-icon>

          <v-icon
            icon="mdi-delete"
            color="medium-emphasis red"
            size="small"
            @click="confirmRemove(item.id)"
          ></v-icon>
        </div>
      </template>

      <template #no-data>
        <div><p>Keine Experimente gefunden</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card :title="`Experiment ${isEditing ? 'bearbeiten' : 'hinzufügen'}`">
      <template #text>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formModel.title"
                label="Titel"
                :rules="titleRules"
              ></v-text-field>
              <v-text-field
                v-model="formModel.description"
                label="Beschreibung"
                :rules="descriptionRules"
              ></v-text-field>
              <v-select
                v-model="formModel.lab_day"
                label="Versuchstag"
                :items="labDayOptions"
              ></v-select>
            </v-col>
          </v-row>
        </v-form>
      </template>

      <v-divider></v-divider>

      <v-card-actions class="bg-surface-light">
        <v-btn text="Abbrechen" variant="plain" @click="dialog = false"></v-btn>

        <v-spacer></v-spacer>

        <v-btn text="Speichern" @click="save"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6"> Experiment löschen </v-card-title>

      <v-card-text>
        Sind Sie sicher, dass Sie dieses Experiment löschen möchten?
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text="Abbrechen" variant="text" @click="deleteDialog = false" />

        <v-btn color="red" text="Löschen" @click="removeConfirmed" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, onMounted } from "vue";
import { useExperimentStore } from "@/stores/experimentStore";
import type { Experiment } from "@/stores/types";
const store = useExperimentStore();
const deleteDialog = ref(false);
const selectedExperimentId = ref<string | null>(null);

const form = ref();

const titleRules = [(v: string) => !!v || "Titel ist erforderlich"];

const descriptionRules = [
  (v: string) => !!v || "Beschreibung ist erforderlich",
];

const labDayOptions = Array.from({ length: 8 }, (_, index) => ({
  title: `Versuchstag ${index + 1}`,
  value: index + 1,
}));

function createNewRecord(): Experiment {
  return {
    id: "",
    title: "",
    description: "",
    lab_day: 1,
  };
}

const experiments = computed<Experiment[]>(() => store.experiments);
onMounted(() => {
  void store.fetchExperiments();
});
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = computed(() => !!formModel.value.id);

const headers = [
  { title: "Titel", key: "title", align: "start" as const },
  { title: "Beschreibung", key: "description", align: "start" as const },
  { title: "Versuchstag", key: "lab_day", align: "start" as const },
  { title: "Aktion", key: "actions", align: "end" as const, sortable: false },
];

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id: string): void {
  const found = store.experiments.find((experiments) => experiments.id === id);
  if (!found) return;

  formModel.value = {
    id: found.id,
    title: found.title,
    description: found.description,
    lab_day: found.lab_day,
  };

  dialog.value = true;
}

function confirmRemove(id: string): void {
  selectedExperimentId.value = id;
  deleteDialog.value = true;
}

function removeConfirmed(): void {
  if (!selectedExperimentId.value) return;

  store.removeExperiment(selectedExperimentId.value);

  deleteDialog.value = false;
  selectedExperimentId.value = null;
}

async function save() {
  const { valid } = await form.value.validate();

  if (!valid) return;
  store.saveExperiment(formModel.value);
  dialog.value = false;
}
</script>
