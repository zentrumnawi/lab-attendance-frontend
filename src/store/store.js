import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import { v4 as uuidv4 } from "uuid";

export const store = createStore({
  state: {
    attendees: [],
    courses_phy_act: [],
    courses_math_act: [],
    faculties_act: [],
    semester_toggle: 0,
  },
  actions: {
    submitForm({ commit }, formData) {
      commit("saveAttendee", formData);
    },
    clearlist({ commit }) {
      commit("clearAttendees");
    },
    dummydata({ commit }) {
      commit("populatedb");
    },
  },
  mutations: {
    saveAttendee(state, formData) {
      if (formData.id) {
        const index = state.attendees.findIndex(
          (attendee) => attendee.id === formData.id,
        );
        if (index !== -1) {
          state.attendees[index] = formData;
        }
      } else {
        formData.id = uuidv4();
        state.attendees.push(formData);
      }
    },
    removeAttendee(state, id) {
      const index = state.attendees.findIndex((attendee) => attendee.id === id);
      if (index !== -1) {
        state.attendees.splice(index, 1);
      }
    },
    clearAttendees(state) {
      state.attendees = [];
    },
    populatedb(state) {
      state.attendees.push({
        id: uuidv4(),
        name: "Gatsby",
        firstName: "F. Scott",
        studentId: "1274567890",
        email: "f.scott.fitzgerald@example.com",
        labPartner: "Tim Banks",
      });
    },
  },
  getters: {
    attendees: (state) => state.attendees,
  },
  plugins: [createPersistedState()],
});
