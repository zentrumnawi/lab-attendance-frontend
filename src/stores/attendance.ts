import { getLabDates, LabDate } from "@/api/attendance";
import { defineStore } from "pinia";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    labDates: [] as LabDate[],
  }),
  actions: {
    async fetchLabDates() {
      if (this.labDates.length > 0) return this.labDates;
      try {
        const labDates = await getLabDates();
        this.labDates = [
          ...labDates.dates.map((date) => ({
            date: new Date(date.date),
            praktikum_day: date.praktikum_day,
            group: date.group,
          })),
        ];
        return labDates;
      } catch (error) {
        console.error(error);
        this.labDates = [];
      }
    },
  },
});
