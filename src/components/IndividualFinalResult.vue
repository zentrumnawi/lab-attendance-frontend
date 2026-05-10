<template>
  <v-expansion-panels v-model="expanded" multiple :elevation="5">
    <v-expansion-panel>
      <v-expansion-panel-title color="blue-grey-lighten-4"
        >General Data</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>First Name</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="John"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Last Name</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="Doe"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Email Address</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field
              model-value="john.doe@example.com"
              suffix="@gmail.com"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Immatriculation Number</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="1234567890" type="number"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Department</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="Computer Science"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Group</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="A"></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Lab Partner</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="John Doe"></v-text-field>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-title color="blue-grey-lighten-4"
        >Attendance and Performance</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="4">
            <v-list-subheader>Number of submitted papers</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="10" type="number"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Number of passed exercises</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="10" type="number"></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-list-subheader>Number of attended lab days</v-list-subheader>
          </v-col>

          <v-col cols="8">
            <v-text-field model-value="10" type="number"></v-text-field>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-title color="blue-grey-lighten-4"
        >Additional Comments</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <v-row class="justify-space-around" density="compact">
          <v-col cols="12">
            <v-textarea
              label="Legit reasons for absence, disability compensation etc."
              model-value="Additional Comments"
            ></v-textarea>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
<script setup>
import { ref } from "vue";

const expanded = ref([0, 1, 2]);
</script>
