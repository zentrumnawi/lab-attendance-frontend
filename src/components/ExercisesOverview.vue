<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="(exercises?.length ?? 0) < 6"
      :items="exercises"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title> Übungsblätter </v-toolbar-title>

          <v-btn
            v-if="isSuperuser"
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Übungsblatt hinzufügen"
            border
            @click="add"
          ></v-btn>
        </v-toolbar>
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
        <div><p>Keine Übungsblätter gefunden</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card
      :title="`${isEditing ? 'Übungsblatt bearbeiten' : 'Übungsblatt hinzufügen'}`"
    >
      <template #text>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formModel.title"
                label="Titel"
                :rules="titleRules"
              ></v-text-field>
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
      <v-card-title class="text-h6"> Übungsblatt löschen </v-card-title>

      <v-card-text>
        Sind Sie sicher, dass Sie dieses Übungsblatt löschen möchten?
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
import { useExerciseStore, type Exercise } from "@/stores/exerciseStore";
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref, shallowRef } from "vue";

const store = useExerciseStore();
const AuthStore = useAuthStore();
const deleteDialog = ref(false);
const selectedExerciseId = ref<string | null>(null);

const form = ref();

const titleRules = [(v: string) => !!v || "Titel ist erforderlich"];

function createNewRecord(): Exercise {
  return {
    id: "",
    title: "",
  };
}

onMounted(async () => {
  void store.fetchExercises();
});

const exercises = computed<Exercise[]>(() => store.exercises);
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = computed(() => !!formModel.value.id);
const isSuperuser = computed(() => AuthStore.isSuperuser);
const headers = computed(() => [
  { title: "Titel", key: "title", align: "start" as const, sortable: true },
  ...(isSuperuser.value
    ? [
        {
          title: "Aktion",
          key: "actions",
          align: "end" as const,
          sortable: false,
        },
      ]
    : []),
]);

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id: string): void {
  const found = store.exercises.find((exercises) => exercises.id === id);
  if (!found) return;

  formModel.value = {
    id: found.id,
    title: found.title,
  };

  dialog.value = true;
}

function confirmRemove(id: string): void {
  selectedExerciseId.value = id;
  deleteDialog.value = true;
}

async function removeConfirmed(): Promise<void> {
  if (!selectedExerciseId.value) return;

  await store.removeExercise(selectedExerciseId.value);

  deleteDialog.value = false;
  selectedExerciseId.value = null;
}

async function save(): Promise<void> {
  const { valid } = await form.value.validate();

  if (!valid) return;
  await store.saveExercise(formModel.value);
  dialog.value = false;
}
</script>
