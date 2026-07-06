<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="(groups?.length ?? 0) < 6"
      :items="groups"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title> Gruppen </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Gruppe hinzufügen"
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
        <div><p>Keine Gruppen gefunden</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card
      :subtitle="`${isEditing ? 'Gruppe aktualisieren' : 'Gruppe erstellen'}`"
      :title="`${isEditing ? 'Gruppe bearbeiten' : 'Gruppe hinzufügen'}`"
    >
      <template #text>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formModel.name"
                label="Name"
                :rules="nameRules"
              ></v-text-field>
              <v-textarea
                auto-grow
                v-model="formModel.description"
                label="Bemerkungen/Termine etc."
                :rules="descriptionRules"
              ></v-textarea>
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
      <v-card-title class="text-h6"> Gruppe löschen </v-card-title>

      <v-card-text>
        Sind Sie sicher, dass Sie diese Gruppe löschen möchten?
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
import { computed, onMounted, ref, shallowRef } from "vue";
import { useGroupStore } from "@/stores/groupStore";
import type { Group } from "@/stores/types";
const store = useGroupStore();
const deleteDialog = ref(false);
const selectedGroupId = ref<string | null>(null);

const form = ref();

const nameRules = [(v: string) => !!v || "Name ist erforderlich"];
const descriptionRules = [
  (v: string) => !!v || "Beschreibung ist erforderlich",
];

function createNewRecord(): Group {
  return {
    id: "",
    name: "",
    description: "",
    teaching_assistant: { id: "", username: "" },
  };
}

onMounted(async () => {
  void store.fetchGroups();
  void store.fetchUsers();
});
const groups = computed<Group[]>(() => store.groups);
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = computed(() => !!formModel.value.id);

const headers = [
  { title: "Name", key: "name", align: "start" as const },
  {
    title: "Kommentare/Termine etc.",
    key: "description",
    align: "start" as const,
  },
  {
    title: "Tutor",
    key: "teaching_assistant.username",
    align: "start" as const,
  },
  { title: "Aktion", key: "actions", align: "end" as const, sortable: false },
];

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id: string): void {
  const found = store.groups.find((groups) => groups.id === id);
  if (!found) return;

  formModel.value = {
    id: found.id,
    name: found.name,
    description: found.description,
    teaching_assistant: found.teaching_assistant,
  };

  dialog.value = true;
}

function confirmRemove(id: string): void {
  selectedGroupId.value = id;
  deleteDialog.value = true;
}

function removeConfirmed(): void {
  if (!selectedGroupId.value) return;

  store.removeGroup(selectedGroupId.value);

  deleteDialog.value = false;
  selectedGroupId.value = null;
}

async function save(): Promise<void> {
  const { valid } = await form.value.validate();

  if (!valid) return;
  await store.saveGroup(formModel.value);
  dialog.value = false;
}
</script>
