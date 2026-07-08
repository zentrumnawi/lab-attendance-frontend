import {
  BulkAttendanceRecord,
  deleteLabSessionByDate,
  deleteSeminarSessionByDate,
  getLabDates,
  getLabSessionByDate,
  getSeminarSessionByDate,
  LabDate,
  saveBulkAttendance,
  saveSeminarAttendance,
  type BulkAttendancePayload,
  type SeminarAttendancePayload,
} from "@/api/attendance";
import { defineStore } from "pinia";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    // list of passed lab dates, minimal info for calendar view
    labDates: [] as LabDate[],
    labSessions: [] as BulkAttendancePayload[],
    seminarSessions: [] as SeminarAttendancePayload[],
  }),
  actions: {
    async fetchLabDates() {
      if (this.labDates.length > 0) return this.labDates;
      try {
        const labDates = await getLabDates();
        this.labDates = [
          ...labDates.dates.map((date) => ({
            date: date.date,
            praktikum_day: date.praktikum_day,
            group: date.group,
          })),
        ];
        console.log(this.labDates);
        return labDates;
      } catch (error) {
        console.error(error);
        this.labDates = [];
      }
    },
    async fetchSingleLabSession(date: string, group: string) {
      if (this.labDates.length === 0) await this.fetchLabDates();
      const labDate = this.getLabDate(date, group);
      // only fetch details if it's a past session (vs. newly to be created)
      if (!labDate) return null;
      const labSession = await getLabSessionByDate(date, group);
      return labSession;
    },
    async fetchSingleSeminarSession(date: string) {
      try {
        const seminarSession = await getSeminarSessionByDate(date);
        return seminarSession.length > 0 ? seminarSession : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    getLabDate(date: string, group: string): LabDate | undefined {
      return this.labDates.find(
        (labDate) => labDate.date === date && labDate.group === group,
      );
    },
    async saveSeminarSession(date: string, records: BulkAttendanceRecord[]) {
      const payload: SeminarAttendancePayload = {
        date,
        day_type: "LECTURE",
        records,
      };
      await saveSeminarAttendance(payload);

      const existingSeminarSession = this.seminarSessions.find(
        (session) => session.date === date,
      );
      if (existingSeminarSession) {
        existingSeminarSession.records = records;
      } else {
        this.seminarSessions.push(payload);
      }
    },
    async saveLabSession(
      date: string,
      praktikumDay: number,
      records: BulkAttendanceRecord[],
      group: string,
    ) {
      const payload: BulkAttendancePayload = {
        date,
        praktikum_day: praktikumDay,
        group,
        day_type: "LAB",
        records,
      };

      const existingLabDate = this.getLabDate(date, group);
      if (existingLabDate) {
        existingLabDate.praktikum_day = praktikumDay;
      } else {
        this.labDates.push({
          date,
          praktikum_day: praktikumDay,
          group,
        });
      }

      await saveBulkAttendance(payload);

      const existingSession = this.labSessions.find(
        (session) => session.date === date && session.group === group,
      );
      if (existingSession) {
        existingSession.praktikum_day = praktikumDay;
        existingSession.records = records;
      } else {
        this.labSessions.push(payload);
      }
    },
    async deleteSession(
      date: string,
      group: string,
      day_type: "LAB" | "LECTURE",
    ) {
      if (day_type === "LAB") {
        await deleteLabSessionByDate(date, group);
      } else {
        await deleteSeminarSessionByDate(date);
      }
      if (day_type === "LAB") {
        this.labDates = this.labDates.filter(
          (labDate) => labDate.date !== date || labDate.group !== group,
        );
        this.labSessions = this.labSessions.filter(
          (session) => !(session.date === date && session.group === group),
        );
      } else {
        this.seminarSessions = this.seminarSessions.filter(
          (session) => session.date !== date,
        );
      }
    },
  },
});
