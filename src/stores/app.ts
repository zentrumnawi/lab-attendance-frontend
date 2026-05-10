import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

interface Attendee {
  id: string;
  name: string;
  firstName: string;
  studentId: string;
  email: string;
  labPartner: string;
}

export interface Department {
  id: string;
  name: string;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    attendees: [] as Attendee[],
    departments: [] as Department[],
    courses_phy_act: [],
    courses_math_act: [],
    faculties_act: [],
    semester_toggle: 0,
  }),

  actions: {
    saveAttendee(formData: Omit<Attendee, "id"> & { id?: string }) {
      if (formData.id) {
        const index = this.attendees.findIndex(
          (attendee) => attendee.id === formData.id,
        );
        if (index !== -1) {
          this.attendees[index] = formData as Attendee;
        }
      } else {
        formData.id = uuidv4();
        this.attendees.push(formData as Attendee);
      }
    },
    removeAttendee(id: string) {
      const index = this.attendees.findIndex((attendee) => attendee.id === id);
      if (index !== -1) {
        this.attendees.splice(index, 1);
      }
    },
    clearAttendees(): void {
      this.attendees = [];
    },
    populatedb(): void {
      this.attendees.push({
        id: uuidv4(),
        name: "Gatsby",
        firstName: "F. Scott",
        studentId: "1274567890",
        email: "f.scott.fitzgerald@example.com",
        labPartner: "Tim Banks",
      } as Attendee);
    },

    saveDepartment(formData: Omit<Department, "id"> & { id?: string }): void {
      if (formData.id) {
        const index = this.departments.findIndex(
          (department) => department.id === formData.id,
        );

        if (index !== -1) {
          this.departments[index] = { ...formData, id: formData.id! };
        }
      } else {
        this.departments.push({
          id: uuidv4(),
          name: formData.name,
        });
      }
    },

    removeDepartment(id: string): void {
      const index = this.departments.findIndex(
        (department) => department.id === id,
      );

      if (index !== -1) {
        this.departments.splice(index, 1);
      }
    },

    clearDepartments(): void {
      this.departments = [];
    },
  },
  persist: true,
});
