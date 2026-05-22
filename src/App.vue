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

        <v-list-item title="Exercises" link />

        <v-list-item title="Experiments" link />
        <v-list-item title="Final results" link />
        <v-list-item title="Groups" link />
        <v-list-item title="Paper Submission" link />
        <v-list-item title="Papers" link />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-toolbar-title class="headline text-uppercase"
        >Praktikum AAC</v-toolbar-title
      >
      <v-spacer></v-spacer>
      <div v-if="isAuthenticated" class="d-flex align-center ga-3 me-2">
        <v-menu min-width="200px">
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-avatar color="purple-accent-2" size="36">
                <v-icon icon="mdi-account-circle" /> </v-avatar></v-btn
          ></template>
          <v-card>
            <h5 class="my-0">{{ username }}</h5>
            <v-divider class="my-3"></v-divider>
            <div>Scope: {{ groupName ? "Group " + groupName : "Admin" }}</div>
          </v-card>
        </v-menu>
      </div>
      <v-btn
        v-if="isAuthenticated"
        icon="mdi-logout"
        title="Abmelden"
        @click="logout"
      />
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
          &copy; 2026&nbsp;&nbsp;|&nbsp;&nbsp;
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
import { useAuthStore } from "@/stores/auth";
import { mapState } from "pinia";

export default defineComponent({
  name: "App",
  data() {
    return {
      drawer: true,
    };
  },
  computed: {
    ...mapState(useAuthStore, ["isAuthenticated", "username", "groupName"]),
  },
  methods: {
    async logout() {
      await useAuthStore().logout();
      this.$router.push("/login");
    },
  },
});
</script>
