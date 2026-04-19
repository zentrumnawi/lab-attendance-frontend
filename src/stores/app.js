import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

export const useAppStore = defineStore("app", {
  state: () => ({
    attendees: [],
    departments: [],
    courses_phy_act: [],
    courses_math_act: [],
    faculties_act: [],
    semester_toggle: 0,
  }),

  actions: {
    saveAttendee(formData) {
      if (formData.id) {
        const index = this.attendees.findIndex(
          (attendee) => attendee.id === formData.id,
        );
        if (index !== -1) {
          this.attendees[index] = formData;
        }
      } else {
        formData.id = uuidv4();
        this.attendees.push(formData);
      }
    },
    removeAttendee(id) {
      const index = this.attendees.findIndex((attendee) => attendee.id === id);
      if (index !== -1) {
        this.attendees.splice(index, 1);
      }
    },
    clearAttendees() {
      this.attendees = [];
    },
    populatedb() {
      this.attendees.push({
        id: uuidv4(),
        name: "Gatsby",
        firstName: "F. Scott",
        studentId: "1274567890",
        email: "f.scott.fitzgerald@example.com",
        labPartner: "Tim Banks",
      });
    },

     saveDepartment(formData) {
      if (formData.id) {
        const index = this.departments.findIndex(
          (department) => department.id === formData.id,
        );

        if (index !== -1) {
          this.departments[index] = { ...formData };
        }
      } else {
        this.departments.push({
          id: uuidv4(),
          name: formData.name,
        });
      }
    },

    
    removeDepartment(id) {
      const index = this.departments.findIndex(
        (department) => department.id === id,
      );

      if (index !== -1) {
        this.departments.splice(index, 1);
      }
    },

    clearDepartments() {
      this.departments = [];
    },
  },
  persist: true,
});
