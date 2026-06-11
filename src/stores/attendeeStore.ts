import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { getSingleStudentData, getStudents } from "@/api/students";
import type { Attendee } from "./types";

export const useAttendeeStore = defineStore("attendees", {
  state: () => ({
    attendees: [] as Attendee[],
    loadingStudents: false,
    errorStudents: null as string | null,
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

    clearAttendees() {
      this.attendees = [];
    },

    getAttendeeById(id: string): Attendee | undefined {
      return this.attendees.find((attendee) => attendee.id === id);
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

    async fetchStudents(): Promise<Attendee[]> {
      this.loadingStudents = true;
      this.errorStudents = null;

      try {
        if (this.attendees.length > 0) {
          return this.attendees;
        }

        const students = await getStudents();

        const attendees = students.map((student) => ({
          id: student.id,
          name: student.name,
          firstName: student.first_name,
          studentId: student.id,
          matriculationNumber: student.matriculation_number ?? "",
          email: student.email,
          labPartner: student.lab_partner || "",
        }));

        this.attendees = attendees;
        return attendees;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.errorStudents = message;
        throw e;
      } finally {
        this.loadingStudents = false;
      }
    },

    async fetchSingleStudent(studentId: string): Promise<Attendee> {
      const attendee = this.getAttendeeById(studentId);

      if (attendee) {
        return attendee;
      }

      const student = await getSingleStudentData(studentId);

      return {
        id: student.id,
        name: student.name,
        firstName: student.first_name,
        studentId: student.id,
        matriculationNumber: student.matriculation_number ?? "",
        email: student.email,
        labPartner: student.lab_partner || "",
      };
    },
  },

  persist: true,
});
