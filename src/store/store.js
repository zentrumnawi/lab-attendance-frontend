import { createStore } from 'vuex'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

export const store = createStore({
  state: {
    attendees: [],
    courses_phy_act: [],
    courses_math_act: [],
    faculties_act: [],
    semester_toggle: 0
  },
  actions: {
    submitForm({ commit }, formData) {
      commit("saveAttendee", formData)
    },
    clearlist({commit}) {
      commit("clearAttendees")
    },
    dummydata({commit}) {
      commit("populatedb")   
    }
  },
  mutations: {
    saveAttendee (state, formData) {
        state.attendees.push(formData)
    },
    clearAttendees (state) {
        state.attendees = []
    },
    populatedb (state) {
        state.attendees.push({"pid":"imadummy","start":"Fri Oct 18 2019 15:47:57 GMT+0200 (Mitteleuropäische Sommerzeit)","end":"Fri Oct 18 2019 17:48:30 GMT+0200 (Mitteleuropäische Sommerzeit)","faculty":"Sonstige","semester":"7+","courses":["MathChem1","AP2"],"comments":"Buh!","idnumber":"c923593d-ba64-416d-8d6f-03462bf86b12"})
    }
  },
  getters: {
    attendees: state => state.attendees
  },
  plugins: [createPersistedState()]
})