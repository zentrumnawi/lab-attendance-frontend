<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="exercises.length < 6"
      :items="exercises"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>
            <v-icon
              color="medium-emphasis"
              icon="mdi-account-multiple"
              size="x-small"
              start
            ></v-icon>
            Exercises
          </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Add Exercise"
            border
            @click="add"
          ></v-btn>
        </v-toolbar>
      </template>

      <template #[`item.name`]="{ value }">
        <v-chip
          :text="value"
          border="thin opacity-25"
          prepend-icon="mdi-account"
          label
        >
          <template #prepend>
            <v-icon color="medium-emphasis"></v-icon>
          </template>
        </v-chip>
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
            @click="remove(item.id)"
          ></v-icon>
        </div>
      </template>

      <template #no-data>
        <div><p>No departments found</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card
      :subtitle="`${isEditing ? 'Update' : 'Create'} exercises`"
      :title="`${isEditing ? 'Edit' : 'Add'} exercises`"
    >
      <template #text>
        <v-row>
          <v-col cols="12">
            <v-text-field v-model="formModel.name" label="Name"></v-text-field>
          </v-col>
        </v-row>
      </template>

      <v-divider></v-divider>

      <v-card-actions class="bg-surface-light">
        <v-btn text="Cancel" variant="plain" @click="dialog = false"></v-btn>

        <v-spacer></v-spacer>

        <v-btn text="Save" @click="save"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { useAppStore, type Excercise } from "@/stores/app";
const store = useAppStore();

function createNewRecord(): Excercise {
  return {
    id: "",
    name: "",
  };
}

const exercises = computed(() => store.exercises);
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = computed(() => !!formModel.value.id);

const headers = [
  { title: "Name", key: "name", align: "start" as const },
  { title: "Action", key: "actions", align: "end" as const, sortable: false },
];

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id: string): void {
  const found = store.exercises.find((exercises) => exercises.id === id);
  if (!found) return;

  formModel.value = {
    id: found.id,
    name: found.name,
  };

  dialog.value = true;
}

function remove(id: string): void {
  store.removeExercise(id);
}

function save() {
  store.saveExcercise(formModel.value);
  dialog.value = false;
}
</script>
