<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :hide-default-footer="attendees.length < 11"
      :items="attendees"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>
            <v-icon
              color="medium-emphasis"
              icon="mdi-account-multiple"
              size="x-small"
              start
            ></v-icon>

            Attendees
          </v-toolbar-title>

          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Add attendee"
            border
            @click="add"
          ></v-btn>
        </v-toolbar>
      </template>

      <template v-slot:item.name="{ value }">
        <v-chip
          :text="value"
          border="thin opacity-25"
          prepend-icon="mdi-account"
          label
        >
          <template v-slot:prepend>
            <v-icon color="medium-emphasis"></v-icon>
          </template>
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
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

      <template v-slot:no-data>
        <div><p>No attendees found</p></div>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" max-width="600">
    <v-card
      :subtitle="`${isEditing ? 'Update' : 'Create'} attendee`"
      :title="`${isEditing ? 'Edit' : 'Add'} attendee`"
    >
      <template v-slot:text>
        <v-row>
          <v-col cols="12">
            <v-text-field v-model="formModel.name" label="Name"></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="formModel.firstName"
              label="First Name"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="formModel.studentId"
              label="Student ID"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="8">
            <v-text-field
              v-model="formModel.email"
              label="Email"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="formModel.labPartner"
              label="Lab Partner"
            ></v-text-field>
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

<script setup>
import { computed, ref, shallowRef, toRef } from "vue";
import { useStore } from "vuex";
const store = useStore();

function createNewRecord() {
  return {
    id: "",
    name: "",
    firstName: "",
    studentId: "",
    email: "",
    labPartner: "",
  };
}

const attendees = computed(() => store.getters.attendees);
const formModel = ref(createNewRecord());
const dialog = shallowRef(false);
const isEditing = toRef(() => !!formModel.value.id);

const headers = [
  { title: "Name", key: "name", align: "start" },
  { title: "First Name", key: "firstName" },
  { title: "Student ID", key: "studentId" },
  { title: "", key: "actions", align: "end", sortable: false },
];

function add() {
  formModel.value = createNewRecord();
  dialog.value = true;
}

function edit(id) {
  const found = store.getters.attendees.find((attendee) => attendee.id === id);

  formModel.value = {
    id: found.id,
    name: found.name,
    firstName: found.firstName,
    studentId: found.studentId,
    email: found.email,
    labPartner: found.labPartner,
  };

  dialog.value = true;
}

function remove(id) {
  store.commit("removeAttendee", id);
}

function save() {
  store.commit("saveAttendee", formModel.value);
  dialog.value = false;
}
</script>
