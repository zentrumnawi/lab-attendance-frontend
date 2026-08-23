import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import {
  getSingleStudentData,
  getStudents,
  patchStudent,
  postStudent,
  updateLabPartnersBulk,
  type BulkLabPartnersPayload,
  deleteStudent,
} from "@/api/students";
import type { Attendee } from "./types";
import { useAuthStore } from "@/stores/auth";
import { useGroupStore } from "./groupStore";

export const useAttendeeStore = defineStore("attendees", {
  state: () => ({
    attendees: [] as Attendee[],
    studentsListLoaded: false,
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
    async saveAttendee(formData: Omit<Attendee, "id"> & { id?: string }) {
      if (formData.id) {
        await patchStudent(formData.id, {
          last_name: formData.name,
          first_name: formData.firstName,
          email: formData.email,
          lab_partner: formData.labPartner,
          matriculation_number: formData.matriculationNumber,
          group: formData.group,
          department: formData.department || null,
        });
        this.updateAttendeesList(formData as Attendee);
      } else {
        const newStudent = await postStudent({
          last_name: formData.name,
          first_name: formData.firstName,
          email: formData.email,
          lab_partner: formData.labPartner,
          matriculation_number: formData.matriculationNumber,
          group: formData.group,
          department: formData.department || null,
        });
        // don't push if group mismatch
        if (!this.groupMismatch(newStudent.group?.id ?? "")) {
          this.attendees.push({
            id: newStudent.id,
            name: newStudent.last_name,
            firstName: newStudent.first_name,
            studentId: newStudent.id,
            matriculationNumber: newStudent.matriculation_number ?? "",
            email: newStudent.email,
            labPartner: newStudent.lab_partner || "",
            group: newStudent.group?.id ?? "",
            department: newStudent.department?.id ?? "",
          });
        }
      }
    },

    groupMismatch(group: string): boolean {
      const scope = useAuthStore().adminGroupScope;
      if (!scope) return false;

      const groupName = useGroupStore().getGroupNameById(group);
      return groupName !== scope;
    },

    updateAttendeesList(attendee: Attendee) {
      const index = this.attendees.findIndex((a) => a.id === attendee.id);

      if (this.groupMismatch(attendee.group)) {
        if (index !== -1) this.attendees.splice(index, 1);
      } else {
        if (index === -1) this.attendees.push(attendee);
        else this.attendees[index] = attendee;
      }
    },

    async removeAttendee(id: string) {
      await deleteStudent(id);
      const index = this.attendees.findIndex((attendee) => attendee.id === id);

      if (index !== -1) {
        this.attendees.splice(index, 1);
      }
    },

    clearAttendees() {
      this.attendees = [];
      this.studentsListLoaded = false;
    },

    getAttendeeById(id: string): Attendee | undefined {
      return this.attendeeById.get(id);
    },

    populatedb() {
      this.attendees.push({
        id: uuidv4(),
        name: "Gatsby",
        firstName: "F. Scott",
        studentId: "1274567890",
        matriculationNumber: "",
        email: "f.scott.fitzgerald@example.com",
        labPartner: "Tim Banks",
        group: "",
        department: "",
      });
    },

    async fetchStudents(): Promise<Attendee[]> {
      this.loadingStudents = true;
      this.errorStudents = null;
      const auth = useAuthStore();
      const adminGroup = auth.isSuperuser
        ? (auth.groupName ?? undefined)
        : undefined;

      try {
        if (this.studentsListLoaded) {
          return this.attendees;
        }

        const students = await getStudents(adminGroup);

        const attendees = students.map((student) => ({
          id: student.id,
          name: student.last_name,
          firstName: student.first_name,
          studentId: student.id,
          matriculationNumber: student.matriculation_number ?? "",
          email: student.email,
          labPartner: student.lab_partner || "",
          group: student.group?.id ?? "",
          department: student.department?.id ?? "",
        }));

        this.attendees = attendees;
        this.studentsListLoaded = true;
        return attendees;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.errorStudents = message;
        throw e;
      } finally {
        this.loadingStudents = false;
      }
    },

    async saveLabPartners(payload: BulkLabPartnersPayload): Promise<void> {
      await updateLabPartnersBulk(payload);

      for (const record of payload.pairs) {
        const attendeeA = this.getAttendeeById(record.student_a_id);
        const attendeeB = this.getAttendeeById(record.student_b_id);
        if (attendeeA && attendeeB) {
          attendeeA.labPartner = attendeeB.id;
          attendeeB.labPartner = attendeeA.id;
        }
      }
      for (const studentId of payload.unpaired_student_ids) {
        const attendee = this.getAttendeeById(studentId);
        if (attendee) {
          attendee.labPartner = "";
        }
      }
    },

    async fetchSingleStudent(studentId: string): Promise<Attendee> {
      const existing = this.getAttendeeById(studentId);

      if (existing) {
        return existing;
      }

      const student = await getSingleStudentData(studentId);

      const attendee: Attendee = {
        id: student.id,
        name: student.last_name,
        firstName: student.first_name,
        studentId: student.id,
        matriculationNumber: student.matriculation_number ?? "",
        email: student.email,
        labPartner: student.lab_partner || "",
        group: student.group?.id ?? "",
        department: student.department?.id ?? "",
      };

      this.attendees.push(attendee);
      return attendee;
    },
  },

  persist: false,
});
