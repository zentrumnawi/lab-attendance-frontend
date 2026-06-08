import { getSingleStudentData, getStudents } from "@/api/students";
import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

interface Attendee {
  id: string;
  name: string;
  firstName: string;
  studentId: string;
  email: string;
  labPartner: string;
  [key: string]: any;
}

export interface Department {
  id: string;
  name: string;
}

export interface Exercise {
  id: string;
  name: string;
}

export interface Experiment {
  id: string;
  name: string;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    attendees: [] as Attendee[],
    departments: [] as Department[],
    exercises: [] as Exercise[],
    experiments: [] as Experiment[],
    courses_phy_act: [],
    courses_math_act: [],
    faculties_act: [],
    semester_toggle: 0,
    students: [] as Attendee[],
    loadingStudents: false,
    errorStudents: null as string | null,
  }),

  getters: {
    attendeeById(state): Map<string, Attendee> {
      return new Map(
        state.attendees.map((attendee) => [attendee.id, attendee]),
      );
    },
  },

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
    getAttendeeById(id: string): Attendee | undefined {
      return this.attendeeById.get(id);
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

    saveExcercise(formData: Omit<Exercise, "id"> & { id?: string }): void {
      if (formData.id) {
        const index = this.exercises.findIndex(
          (exercise) => exercise.id === formData.id,
        );

        if (index !== -1) {
          this.exercises[index] = { ...formData, id: formData.id! };
        }
      } else {
        this.exercises.push({
          id: uuidv4(),
          name: formData.name,
        });
      }
    },

    removeExercise(id: string): void {
      const index = this.exercises.findIndex(
        (excercise) => excercise.id === id,
      );

      if (index !== -1) {
        this.exercises.splice(index, 1);
      }
    },

    clearExcercises(): void {
      this.exercises = [];
    },

    saveExperiment(formData: Omit<Experiment, "id"> & { id?: string }): void {
      if (formData.id) {
        const index = this.experiments.findIndex(
          (experiment) => experiment.id === formData.id,
        );

        if (index !== -1) {
          this.experiments[index] = { ...formData, id: formData.id! };
        }
      } else {
        this.experiments.push({
          id: uuidv4(),
          name: formData.name,
        });
      }
    },

    removeExperiments(id: string): void {
      const index = this.experiments.findIndex(
        (experiment) => experiment.id === id,
      );

      if (index !== -1) {
        this.experiments.splice(index, 1);
      }
    },

    clearExperiment(): void {
      this.experiments = [];
    },

    async fetchStudents(): Promise<Attendee[]> {
      this.loadingStudents = true;
      this.errorStudents = null;

      if (this.attendees.length > 0) return this.attendees;

      try {
        const students = await getStudents();
        const attendees = students.map((student) => ({
          id: student.id,
          name: student.last_name,
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
      if (attendee) return attendee;
      const student = await getSingleStudentData(studentId);
      return {
        id: student.id,
        name: student.last_name,
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
