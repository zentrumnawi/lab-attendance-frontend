import Vue from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css' // Ensure you are using css-loader
import VeeValidate from 'vee-validate'
import DataTable from 'v-data-table'
import { store } from './store/store'
import json2csv from 'json2csv'

import 'vuetify/styles' // Import Vuetify styles
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'
import Admin from '@/components/Admin.vue'
import Form from '@/components/AttendeeForm.vue'

const vuetify = createVuetify({
  components,
  directives,
})

const routes = [
  {
      path: '/admin',
      name: 'Admin',
      component: Admin
  },
  {
      path: '/',
      name: 'Form',
      component: Form
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

createApp(App)
      .use(router)
      .use(store)
      .use(vuetify)
      .mount('#app')

