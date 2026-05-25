import { httpJson } from "@/api/http";

export interface LabDate {
  date: Date;
  praktikum_day: number;
  group: string;
}

export async function getLabDates() {
  return await httpJson<{ dates: LabDate[] }>(
    "/api/attendance-records/calendar/",
  );
}
