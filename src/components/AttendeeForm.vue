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

<script setup>
import { useField, useForm } from "vee-validate";
import { useStore } from "vuex";
import { v4 as uuidv4 } from "uuid";

const store = useStore();

const { handleSubmit, handleReset } = useForm({
  validationSchema: {
    name(value) {
      if (value?.length >= 2) return true;

      return "Name needs to be at least 2 characters.";
    },
    studentId(value) {
      if (/^[0-9-]{7,}$/.test(value)) return true;

      return "Student ID needs to be at least 7 digits.";
    },
    email(value) {
      if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(value)) return true;

      return "Must be a valid e-mail.";
    },
    labPartner(value) {
      if (value?.length >= 2) return true;

      return "Lab partner needs to be at least 2 characters.";
    },
  },
});
const name = useField("name");
const studentId = useField("studentId");
const email = useField("email");
const labPartner = useField("labPartner");

const submit = handleSubmit((values) => {
  store.dispatch("submitForm", {
    ...values,
    id: uuidv4(),
  });
});
</script>
