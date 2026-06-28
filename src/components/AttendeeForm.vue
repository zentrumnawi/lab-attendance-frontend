<template>
  <h1>Studierenden hinzufügen</h1>
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
      label="Matrikelnummer"
    ></v-text-field>

    <v-text-field
      v-model="email.value.value"
      :error-messages="email.errorMessage.value"
      label="E-Mail"
    ></v-text-field>

    <v-text-field
      v-model="labPartner.value.value"
      :error-messages="labPartner.errorMessage.value"
      label="Labor-Partner"
    ></v-text-field>

    <v-btn class="me-4" type="submit"> Absenden </v-btn>

    <v-btn @click="handleReset"> Zurücksetzen </v-btn>
  </form>
</template>

<script setup lang="ts">
import { useField, useForm } from "vee-validate";
import { useAttendeeStore } from "@/stores/attendeeStore";
import { v4 as uuidv4 } from "uuid";

const store = useAttendeeStore();
interface AttendeeForm {
  name: string;
  firstName: string;
  studentId: string;
  email: string;
  labPartner: string;
}
const { handleSubmit, handleReset } = useForm<AttendeeForm>({
  validationSchema: {
    name(value: string) {
      if (value?.length >= 2) return true;

      return "Der Name muss mindestens 2 Zeichen lang sein.";
    },
    studentId(value: string) {
      if (/^[0-9-]{7,}$/.test(value)) return true;

      return "Die Matrikelnummer muss mindestens 7 Ziffern haben.";
    },
    email(value: string) {
      if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(value)) return true;

      return "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    },
    labPartner(value: string) {
      if (value?.length >= 2) return true;

      return "Der Labor-Partner muss mindestens 2 Zeichen lang sein.";
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
    firstName: values.firstName,
    id: uuidv4(),
  });
});
</script>
