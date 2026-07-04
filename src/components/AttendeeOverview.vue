<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers as any"
      :hide-default-footer="attendees.length < 11"
      :items="attendees"
      @click:row="handleClickRow"
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

            Teilnehmer
          </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Teilnehmer hinzufügen"
            border
            @click="add"
          ></v-btn>
        </v-toolbar>
      </template>

      <template #[`item.group`]="{ item }">
        {{ groupLabel(item.group) }}
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="d-flex ga-2 justify-end" @click.stop>
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
        <div><p>Keine Teilnehmer gefunden</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card
      :title="`${isEditing ? 'Teilnehmer bearbeiten' : 'Teilnehmer hinzufügen'}`"
    >
      <template #text>
        <v-row>
          <v-col cols="12">
            <v-text-field v-model="formModel.name" label="Name"></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="formModel.firstName"
              label="Vorname"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="formModel.matriculationNumber"
              label="Matrikelnummer"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="8">
            <v-text-field
              v-model="formModel.email"
              label="E-Mail"
            ></v-text-field>
          </v-col>

          <v-col v-if="isSuperuser" cols="12">
            <v-select
              v-model="formModel.group"
              :items="groupOptions"
              item-title="title"
              item-value="value"
              label="Gruppe"
            ></v-select>
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
import { computed, onMounted, ref, shallowRef, toRef } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useGroupStore } from "@/stores/groupStore";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
const store = useAttendeeStore();
const groupStore = useGroupStore();
const router = useRouter();
const auth = useAuthStore();
const isSuperuser = computed(() => auth.isSuperuser);
function createNewRecord() {
  return {
    id: "",
    name: "",
    firstName: "",
    studentId: "",
    matriculationNumber: "",
    email: "",
    labPartner: "",
    group: "",
  };
}

const attendees = computed(() => store.attendees);
const groupOptions = computed(() =>
  groupStore.groups.map((group) => ({
    title: group.name,
    value: group.id,
  })),
);
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = toRef(() => !!formModel.value.id);

function groupLabel(groupRef: string): string {
  if (!groupRef) return "";

  const byId = groupStore.groups.find((group) => group.id === groupRef);
  if (byId) return byId.name;

  const byName = groupStore.groups.find((group) => group.name === groupRef);
  return byName?.name ?? groupRef;
}

const headers: {
  title: string;
  key: string;
  align?: string;
  sortable?: boolean;
}[] = [
  { title: "Name", key: "name", align: "start" },
  { title: "Vorname", key: "firstName" },
  { title: "Matrikelnummer", key: "matriculationNumber" },
  { title: "Gruppe", key: "group" },
  { title: "", key: "actions", align: "end", sortable: false },
];

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id: string): void {
  const found = store.attendees.find((attendee) => attendee.id === id);
  if (!found) return;
  formModel.value = {
    id: found.id,
    name: found.name,
    firstName: found.firstName,
    studentId: found.studentId,
    matriculationNumber: found.matriculationNumber,
    email: found.email,
    labPartner: found.labPartner,
    group: found.group,
  };

  dialog.value = true;
}

function remove(id: string): void {
  store.removeAttendee(id);
}

async function save() {
  await store.saveAttendee(formModel.value);
  dialog.value = false;
}

function handleClickRow(event: Event, row: any) {
  router.push(`/attendee/${row.item.id}`);
}

onMounted(() => {
  void Promise.all([store.fetchStudents(), groupStore.fetchGroups()]);
});
</script>
