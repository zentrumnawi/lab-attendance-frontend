<template>
  <v-row justify="center">
    <v-col cols="12" sm="8" md="6" lg="4">
      <v-card>
        <v-card-title class="text-center">
          <h2>Login</h2>
        </v-card-title>

        <v-card-text>
          <p class="text-medium-emphasis mb-4">
            Bitte geben Sie Benutzername und Passwort ein.
          </p>

          <v-alert
            v-if="auth.csrfError"
            class="mb-4"
            density="compact"
            type="warning"
            variant="tonal"
          >
            CSRF token could not be loaded: {{ auth.csrfError }}
          </v-alert>

          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="username"
              autocomplete="username"
              autofocus
              :disabled="auth.csrfLoading || auth.loginLoading"
              label="Username"
              :error-messages="usernameError"
            />

            <v-text-field
              v-model="password"
              autocomplete="current-password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="
                showPassword ? 'visibility_off' : 'visibility'
              "
              :disabled="auth.csrfLoading || auth.loginLoading"
              :error-messages="passwordError"
              @click:append-inner="showPassword = !showPassword"
              @keyup.enter="submit"
            />

            <v-select
              v-model="selectedGroup"
              :items="groupOptions"
              item-title="title"
              item-value="value"
              label="Gruppe (optional)"
              clearable
              :disabled="auth.csrfLoading || auth.loginLoading || groupsLoading"
              :loading="groupsLoading"
              hint="Nur für Admins: gewählte Gruppe beschränkt die Sitzung auf diese Gruppendaten. Für andere Benutzer wird die Auswahl ignoriert."
              persistent-hint
            />

            <v-alert
              v-if="loginError"
              class="mt-2"
              density="compact"
              type="error"
              variant="tonal"
            >
              {{ loginError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-center pb-4">
          <v-btn
            color="blue-darken-1"
            size="x-large"
            variant="flat"
            block
            :disabled="auth.csrfLoading || !!auth.csrfError"
            :loading="auth.csrfLoading || auth.loginLoading"
            @click="submit"
          >
            Login
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { HttpError } from "@/api/http";
import { useAuthStore } from "@/stores/auth";
import { useGroupStore } from "@/stores/groupStore";

const auth = useAuthStore();
const groupStore = useGroupStore();
const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const selectedGroup = ref<string | null>(null);
const groupsLoading = ref(false);
const usernameError = ref<string[]>([]);
const passwordError = ref<string[]>([]);
const loginError = ref("");

const groupOptions = computed(() =>
  groupStore.groups.map((group) => ({
    title: group.name,
    value: group.name,
  })),
);

onMounted(async () => {
  try {
    await auth.fetchCsrfToken();
  } catch {
    console.error("Failed to fetch CSRF token");
  }

  groupsLoading.value = true;
  try {
    await groupStore.fetchGroups();
  } catch {
    console.error("Failed to fetch groups for login");
  } finally {
    groupsLoading.value = false;
  }
});

async function submit() {
  usernameError.value = [];
  passwordError.value = [];
  loginError.value = "";

  if (!username.value.trim()) {
    usernameError.value = ["Benutzername ist erforderlich"];
  }
  if (!password.value) {
    passwordError.value = ["Passwort ist erforderlich"];
  }
  if (usernameError.value.length || passwordError.value.length) {
    return;
  }

  try {
    await auth.login(
      username.value.trim(),
      password.value,
      selectedGroup.value,
    );

    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
  } catch (e) {
    loginError.value = formatLoginError(e);
  }
}

function formatLoginError(e: unknown): string {
  if (e instanceof HttpError) {
    const body = e.body;
    if (body && typeof body === "object") {
      if (
        "detail" in body &&
        typeof (body as { detail: unknown }).detail === "string"
      ) {
        return (body as { detail: string }).detail;
      }
    }
    if (e.status === 401 || e.status === 400) {
      return "Benutzername oder Passwort ist falsch";
    }
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return "Anmeldung fehlgeschlagen";
}
</script>
