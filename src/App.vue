<style scoped>
.no-focus:focus,
.no-focus:focus-visible,
.no-focus:active {
  outline: none !important;
  box-shadow: none !important;
}
</style>
<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      color="primary"
      width="250"
      :rail="!drawer"
      :rail-width="80"
      :expand-on-hover="!drawer"
      :temporary="$vuetify.display.smAndDown"
    >
      <v-list density="compact" nav>
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
      <v-btn
        icon
        size="small"
        :ripple="false"
        class="no-focus"
        @click="toggleDrawer"
      >
        <v-icon>
          {{ drawer ? "mdi-menu-open" : "mdi-menu" }}
        </v-icon>
      </v-btn>
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

<script>
export default {
  name: "app",
  data() {
    return {
      drawer: true,
    };
  },
  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
    },
  },
};
</script>
