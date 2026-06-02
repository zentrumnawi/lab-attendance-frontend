import { httpJson } from "@/api/http";

export interface LabDate {
  date: string;
  praktikum_day: number;
  group: string;
}

export interface IndividualAttendanceRecord {
  student: string;
  comment: string;
  is_present: boolean;
}

export interface BulkAttendanceRecord {
  student_id: string;
  is_present: boolean;
  comment?: string;
}

export interface BulkAttendancePayload {
  date: string;
  praktikum_day: number;
  group: string;
  records: BulkAttendanceRecord[];
}

export async function getLabDates() {
  return await httpJson<{ dates: LabDate[] }>(
    "/api/attendance-records/calendar/",
  );
}

// full roll call for a given date
export async function getLabSessionByDate(date: string) {
  return await httpJson<IndividualAttendanceRecord[]>(
    `/api/attendance-records/?date=${date}`,
  );
}

export async function saveBulkAttendance(payload: BulkAttendancePayload) {
  return await httpJson<void>("/api/attendance-records/bulk/", {
    method: "POST",
    body: payload,
  });
}
