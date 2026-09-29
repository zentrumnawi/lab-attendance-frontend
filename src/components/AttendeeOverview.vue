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
            v-if="isSuperuser"
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Teilnehmer hinzufügen"
            border
            @click="add"
          ></v-btn>
        </v-toolbar>
      </template>

      <template #[`item.name`]="{ item }">
        <v-tooltip text="Klicken, um Details anzuzeigen">
          <template #activator="{ props }">
            <span
              v-bind="props"
              class="d-inline-flex align-center ga-1 cursor-pointer"
            >
              {{ item.name }}
              <v-icon
                icon="mdi-open-in-new"
                size="x-small"
                color="medium-emphasis"
              />
            </span>
          </template>
        </v-tooltip>
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
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formModel.name"
                label="Name"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formModel.firstName"
                label="Vorname"
                :rules="[rules.required]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="formModel.matriculationNumber"
                label="Matrikelnummer"
                :rules="[rules.required, rules.matriculationNumber]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="8">
              <v-text-field
                v-model="formModel.email"
                label="E-Mail"
                :rules="[rules.required, rules.email]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="formModel.department"
                :items="departmentOptions"
                item-title="title"
                item-value="value"
                label="Studiengang"
              ></v-select>
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
      <v-card-title class="text-h6"> Studierenden löschen </v-card-title>

      <v-card-text>
        Sind Sie sicher, dass Sie diesen Studierenden löschen möchten?
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
import { computed, onMounted, ref, shallowRef, toRef } from "vue";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { useGroupStore } from "@/stores/groupStore";
import { useDepartmentStore } from "@/stores/departmentStore";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
const store = useAttendeeStore();
const groupStore = useGroupStore();
const departmentStore = useDepartmentStore();
const router = useRouter();
const auth = useAuthStore();
const isSuperuser = computed(() => auth.isSuperuser);
const deleteDialog = ref(false);
const selectedAttendeeId = ref<string | null>(null);
function createNewRecord() {
  return {
    id: "",
    name: "",
    firstName: "",
    studentId: "",
    matriculationNumber: "",
    email: "",
    labPartner: "",
    group: auth.adminGroupScope
      ? (groupOptions.value.find(
          (group) => group.title === auth.adminGroupScope,
        )?.value ?? null)
      : null,
    department: "",
  };
}

const attendees = computed(() => store.attendees);
const groupOptions = computed(() =>
  groupStore.groups.map((group) => ({
    title: group.name,
    value: group.id,
  })),
);
const departmentOptions = computed(() =>
  departmentStore.departments.map((department) => ({
    title: department.name,
    value: department.id,
  })),
);
const form = ref();
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = toRef(() => !!formModel.value.id);

const rules = {
  required: (value: string) => !!value || "Dieses Feld ist erforderlich",
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || "Ungültige E-Mail-Adresse";
  },
  matriculationNumber: (value: string) => {
    const matriculationNumberRegex = /^[0-9]+$/;
    return matriculationNumberRegex.test(value) || "Ungültige Matrikelnummer";
  },
};

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
  void departmentStore.fetchDepartments();
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
    department: found.department,
  };

  dialog.value = true;
  void departmentStore.fetchDepartments();
}

function remove(id: string): void {
  selectedAttendeeId.value = id;
  deleteDialog.value = true;
}

async function removeConfirmed(): Promise<void> {
  if (!selectedAttendeeId.value) return;

  await store.removeAttendee(selectedAttendeeId.value);

  deleteDialog.value = false;
  selectedAttendeeId.value = null;
}

async function save() {
  const { valid } = await form.value.validate();

  if (!valid) return;

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
