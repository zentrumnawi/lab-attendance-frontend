import {
  BulkAttendanceRecord,
  deleteLabSessionByDate,
  getLabDates,
  getLabSessionByDate,
  LabDate,
  saveBulkAttendance,
} from "@/api/attendance";
import { defineStore } from "pinia";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    // list of passed lab dates, minimal info for calendar view
    labDates: [] as LabDate[],
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
    async fetchSingleLabSession(date: string) {
      const labDate = this.labDates.find((labDate) => labDate.date === date);
      // only fetch details if it's a past session (vs. newly to be created)
      if (!labDate) return null;
      const labSession = await getLabSessionByDate(date);
      return labSession;
    },
    getLabDate(date: string): LabDate | undefined {
      return this.labDates.find((labDate) => labDate.date === date);
    },
    async saveLabSession(
      date: string,
      praktikumDay: number,
      records: BulkAttendanceRecord[],
    ) {
      this.labDates.push({
        date,
        praktikum_day: praktikumDay,
        group: this.labDates[0].group ?? "",
      });
      await saveBulkAttendance({
        date,
        praktikum_day: praktikumDay,
        group: this.labDates[0].group ?? "",
        records,
      });
    },
    async deleteLabSession(date: string, group: string) {
      await deleteLabSessionByDate(date, group);
      this.labDates = this.labDates.filter((labDate) => labDate.date !== date);
    },
  },
});
