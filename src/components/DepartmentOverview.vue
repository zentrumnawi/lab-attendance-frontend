<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="departments.length < 6"
      :items="departments"
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
            Departments
          </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Add department"
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
            color="medium-emphasis"
            icon="mdi-delete"
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
      :subtitle="`${isEditing ? 'Update' : 'Create'} department`"
      :title="`${isEditing ? 'Edit' : 'Add'} department`"
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
import { useAppStore, type Department } from "@/stores/app";
const store = useAppStore();

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
  { title: "Name", key: "name", align: "start" },
  { title: "Action", key: "actions", align: "end", sortable: false },
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
