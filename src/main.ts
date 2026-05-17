import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createRouter, createWebHashHistory } from "vue-router";
import "vuetify/dist/vuetify.min.css"; // Ensure you are using css-loader
import "vuetify/styles";
import { createVuetify } from "vuetify";
import "@mdi/font/css/materialdesignicons.css";
import { aliases, mdi } from "vuetify/iconsets/mdi";

import App from "./App.vue";
import Admin from "@/components/Admin.vue";
import Form from "@/components/AttendeeForm.vue";
import Overview from "@/components/AttendeeOverview.vue";
import DepartmentOverview from "@/components/DepartmentOverview.vue";

const vuetify = createVuetify({
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
});

const routes = [
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
  },

  {
    path: "/",
    name: "Overview",
    component: Overview,
  },
  {
    path: "/add-student",
    name: "Form",
    component: Form,
  },
  {
    path: "/departments",
    name: "Departments",
    component: DepartmentOverview,
  },
];

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(router).use(pinia).use(vuetify).mount("#app");
