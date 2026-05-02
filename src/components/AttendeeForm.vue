<template>
  <h1>Add student</h1>
  <form @submit.prevent="submit">
    <v-text-field
      v-model="name.value.value"
      :counter="10"
      :error-messages="name.errorMessage.value"
      label="Name"
    ></v-text-field>

    <v-text-field
      v-model="studentId.value.value"
      :counter="7"
      :error-messages="studentId.errorMessage.value"
      label="Student ID"
    ></v-text-field>

    <v-text-field
      v-model="email.value.value"
      :error-messages="email.errorMessage.value"
      label="E-mail"
    ></v-text-field>

    <v-text-field
      v-model="labPartner.value.value"
      :error-messages="labPartner.errorMessage.value"
      label="Lab Partner"
    ></v-text-field>

    <v-btn class="me-4" type="submit"> submit </v-btn>

    <v-btn @click="handleReset"> clear </v-btn>
  </form>
</template>

<script setup lang="ts">
import { useField, useForm } from "vee-validate";
import { useAppStore } from "@/stores/app";
import { v4 as uuidv4 } from "uuid";

const store = useAppStore();
interface AttendeeForm {
  name: string;
  studentId: string;
  email: string;
  labPartner: string;
}
const { handleSubmit, handleReset } = useForm<AttendeeForm>({
  validationSchema: {
    name(value: string) {
      if (value?.length >= 2) return true;

      return "Name needs to be at least 2 characters.";
    },
    studentId(value: string) {
      if (/^[0-9-]{7,}$/.test(value)) return true;

      return "Student ID needs to be at least 7 digits.";
    },
    email(value: string) {
      if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(value)) return true;

      return "Must be a valid e-mail.";
    },
    labPartner(value: string) {
      if (value?.length >= 2) return true;

      return "Lab partner needs to be at least 2 characters.";
    },
  },
});
const name = useField<string>("name");
const studentId = useField<string>("studentId");
const email = useField<string>("email");
const labPartner = useField<string>("labPartner");

const submit = handleSubmit((values) => {
  store.saveAttendee({
    ...values,
    id: uuidv4(),
  });
});
</script>
