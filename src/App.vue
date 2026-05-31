<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer
      class="pt-12"
      v-model="drawer"
      color="primary"
      width="250"
    >
      <v-list base-color="white" active-color="white" nav>
        <v-list-item title="Attendance" link />

        <v-list-item title="Departments" to="/departments" link />

        <v-list-item title="Exercises" to="/exercises" link />

        <v-list-item title="Experiments" to="/experiments" link />
        <v-list-item title="Final results" link />
        <v-list-item title="Groups" link />
        <v-list-item title="Paper Submission" link />
        <v-list-item title="Papers" link />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-toolbar-title class="headline text-uppercase"
        >Anwesenheitsformular</v-toolbar-title
      >
      <v-spacer></v-spacer>
      <v-img
        aspect-ratio="1.5"
        contain
        max-height="100px"
        max-width="80px"
        src="/Goethe-Kopf-weiss.svg"
      ></v-img>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
    <v-footer app dark color="primary darken-1">
      <v-layout text-left ml-4>
        <v-col xs12>
          &copy; 2019&nbsp;&nbsp;|&nbsp;&nbsp;
          <router-link to="/admin">
            <img
              height="20px"
              src="/Icon_ZentrumNaturwissenschaften.svg"
            /> </router-link
          >&nbsp;&nbsp;
          <strong>Zentrum Naturwissenschaften</strong>
        </v-col>
      </v-layout>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "App",
  data() {
    return {
      drawer: true,
    };
  },
});
</script>
