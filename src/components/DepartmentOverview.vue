<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="departments.length < 6"
      :items="departments"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title> Studiengänge </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Studiengang hinzufügen"
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
            color="medium-emphasis"
            icon="mdi-delete"
            size="small"
            @click="remove(item.id)"
          ></v-icon>
        </div>
      </template>

      <template #no-data>
        <div><p>Keine Studiengänge gefunden</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card
      :subtitle="`${isEditing ? 'Studiengang aktualisieren' : 'Studiengang erstellen'}`"
      :title="`${isEditing ? 'Studiengang bearbeiten' : 'Studiengang hinzufügen'}`"
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
        <v-btn text="Abbrechen" variant="plain" @click="dialog = false"></v-btn>

        <v-spacer></v-spacer>

        <v-btn text="Speichern" @click="save"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { useDepartmentStore, type Department } from "@/stores/departmentStore";
const store = useDepartmentStore();

function createNewRecord(): Department {
  return {
    id: "",
    name: "",
  };
}

const departments = computed(() => store.departments);
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = computed(() => !!formModel.value.id);

const headers = [
  { title: "Name", key: "name", align: "start" as const },
  { title: "Aktion", key: "actions", align: "end" as const, sortable: false },
];

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id: string): void {
  const found = store.departments.find((department) => department.id === id);
  if (!found) return;

  formModel.value = {
    id: found.id,
    name: found.name,
  };

  dialog.value = true;
}

function remove(id: string): void {
  store.removeDepartment(id);
}

function save() {
  store.saveDepartment(formModel.value);
  dialog.value = false;
}
</script>
