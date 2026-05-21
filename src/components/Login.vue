<template>
  <v-row justify="center">
    <v-col cols="12" sm="8" md="6" lg="4">
      <v-card>
        <v-card-title class="text-center">
          <h2>Login</h2>
        </v-card-title>

        <v-card-text>
          <p class="text-medium-emphasis mb-4">
            Please enter your username and password.
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
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { HttpError } from "@/api/http";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const usernameError = ref<string[]>([]);
const passwordError = ref<string[]>([]);
const loginError = ref("");

onMounted(async () => {
  try {
    await auth.fetchCsrfToken();
  } catch {
    console.error("Failed to fetch CSRF token");
  }
});

async function submit() {
  usernameError.value = [];
  passwordError.value = [];
  loginError.value = "";

  if (!username.value.trim()) {
    usernameError.value = ["Username is required"];
  }
  if (!password.value) {
    passwordError.value = ["Password is required"];
  }
  if (usernameError.value.length || passwordError.value.length) {
    return;
  }

  try {
    await auth.login(username.value.trim(), password.value);

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
      return "Username or password is incorrect";
    }
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return "Login failed";
}
</script>
