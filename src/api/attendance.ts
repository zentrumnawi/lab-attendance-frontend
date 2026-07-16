import { httpJson } from "@/api/http";

export interface LabDate {
  date: string;
  praktikum_day: number;
  group: string;
}

export interface AttendanceRecordRead {
  student: string;
  comment: string;
  is_present: boolean;
}

export interface AttendanceRecordWrite {
  student_id: string;
  is_present: boolean;
  comment?: string;
}

export interface BulkAttendancePayload {
  date: string;
  praktikum_day: number;
  group: string;
  day_type: "LAB";
  records: AttendanceRecordWrite[];
}

export interface SeminarAttendancePayload {
  date: string;
  day_type: "LECTURE";
  records: AttendanceRecordWrite[];
}

export async function getLabDates() {
  return await httpJson<{ dates: LabDate[] }>(
    "/api/attendance-records/calendar/",
  );
}

// full roll call for a given date
export async function getLabSessionByLabDay(labDay: number, group: string) {
  return await httpJson<AttendanceRecordRead[]>(
    `/api/attendance-records/?praktikum_day=${labDay}&group=${group}`,
  );
}

export async function getSeminarSessionByDate(date: string) {
  return await httpJson<AttendanceRecordRead[]>(
    `/api/attendance-records/?date=${date}&day_type=LECTURE`,
  );
}

export async function saveBulkAttendance(payload: BulkAttendancePayload) {
  return await httpJson<void>("/api/attendance-records/bulk/", {
    method: "POST",
    body: payload,
  });
}

export async function saveSeminarAttendance(payload: SeminarAttendancePayload) {
  return await httpJson<void>("/api/attendance-records/bulk/", {
    method: "POST",
    body: payload,
  });
}

export async function deleteLabSessionByLabDay(labDay: number, group: string) {
  return await httpJson<void>(
    `/api/attendance-records/delete/?praktikum_day=${labDay}&group=${group}`,
    {
      method: "DELETE",
    },
  );
}

export async function deleteSeminarSessionByDate(date: string) {
  return await httpJson<void>(
    `/api/attendance-records/delete/?date=${date}&day_type=LECTURE`,
    {
      method: "DELETE",
    },
  );
}
