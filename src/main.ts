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
import ExercisesOverview from "@/components/ExercisesOverview.vue";
import ExperimentsOverview from "@/components/ExperimentsOverview.vue";
import DepartmentOverview from "@/components/DepartmentOverview.vue";
import GroupsOverview from "@/components/GroupsOverview.vue";
import IndividualFinalResult from "@/components/IndividualFinalResult.vue";
import Attendance from "@/components/Attendance.vue";
import SingleSession from "@/components/SingleSession.vue";
import Login from "@/components/Login.vue";
import { setCsrfTokenProvider } from "@/api/http";
import { useAuthStore } from "@/stores/auth";
import ProtocolOverview from "@/components/ProtocolOverview.vue";

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
    path: "/login",
    name: "Login",
    component: Login,
    meta: { public: true },
  },
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
  {
    path: "/exercises",
    name: "Exercises",
    component: ExercisesOverview,
  },
  {
    path: "/experiments",
    name: "Experiments",
    component: ExperimentsOverview,
  },
  {
    path: "/groups",
    name: "Groups",
    component: GroupsOverview,
  },
  {
    path: "/attendee/:id",
    name: "IndividualFinalResult",
    component: IndividualFinalResult,
    props: true,
  },
  {
    path: "/protocols",
    name: "ProtocolOverview",
    component: ProtocolOverview,
  },
  {
    path: "/attendance",
    name: "Attendance",
    component: Attendance,
  },
  {
    path: "/attendance/:date",
    name: "SingleSession",
    component: SingleSession,
    props: true,
  },
];

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

setCsrfTokenProvider(() => useAuthStore(pinia).csrfToken);

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// direct to login if not authenticated and not public
router.beforeEach((to) => {
  const auth = useAuthStore(pinia);

  if (auth.isAuthenticated) {
    if (to.name === "Login") {
      return { path: "/" };
    }
    return true;
  }

  if (to.meta.public) {
    return true;
  }

  return {
    path: "/login",
    query: { redirect: to.fullPath },
  };
});

async function bootstrap() {
  const app = createApp(App);
  app.use(pinia);

  const auth = useAuthStore(pinia);
  if (auth.isAuthenticated) {
    try {
      await auth.ensureCsrfToken();
    } catch {
      console.error("Failed to fetch CSRF token");
    }
  }

  app.use(router).use(vuetify).mount("#app");
}

bootstrap();
