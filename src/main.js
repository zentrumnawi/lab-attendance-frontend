import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
//import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css' // Ensure you are using css-loader
import * as VeeValidate from 'vee-validate';
import { DataTable } from 'v-data-table'
import { store } from './store/store'
import { Parser } from '@json2csv/plainjs'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md } from 'vuetify/iconsets/md'

import App from './App.vue'
import Admin from '@/components/Admin.vue'
import Form from '@/components/AttendeeForm.vue'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'md',
    sets: {
      md,
    },
  },
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

