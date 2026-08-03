import { httpJson } from "@/api/http";

export interface StudentData {
  last_name: string;
  first_name: string;
  id: string;
  email: string;
  lab_partner?: string;
  matriculation_number?: string;
  group?: { id: string; name: string };
  [key: string]: any;
}
export interface StudentPerformance {
  papers_completed: number;
  exercises_completed: number;
  lab_attendance_count: number;
  lecture_attendance_count: number;
  experiments_completed: number;
  comment?: string;
  status?: "INC" | "PASS" | "FAIL";
  [key: string]: any;
}

export async function getStudentPerformance(studentId: string) {
  return await httpJson<StudentPerformance>(
    `/api/final-results/${encodeURIComponent(studentId)}/`,
  );
}

export async function patchStudentPerformance(
  studentId: string,
  data: Partial<StudentPerformance>,
) {
  return await httpJson<void>(
    `/api/final-results/${encodeURIComponent(studentId)}/`,
    {
      method: "PATCH",
      body: data,
    },
  );
}

export async function getSingleStudentData(studentId: string) {
  return await httpJson<StudentData>(
    `/api/students/${encodeURIComponent(studentId)}/`,
  );
}

export async function getStudents() {
  return await httpJson<StudentData[]>(`/api/students/`);
}

export interface LabPartnerRecord {
  student_a_id: string;
  student_b_id: string;
}

export interface BulkLabPartnersPayload {
  group: string;
  pairs: LabPartnerRecord[];
  unpaired_student_ids: string[];
}

export async function updateLabPartnersBulk(payload: BulkLabPartnersPayload) {
  return await httpJson<void>("/api/lab-partnerships/bulk/", {
    method: "POST",
    body: payload,
  });
}

export async function patchStudent(id: string, data: Partial<StudentData>) {
  return await httpJson<void>(`/api/students/${id}/`, {
    method: "PATCH",
    body: data,
  });
}

export async function postStudent(data: Omit<StudentData, "id">) {
  return await httpJson<StudentData>(`/api/students/`, {
    method: "POST",
    body: data,
  });
}

export async function deleteStudent(id: string) {
  return await httpJson<void>(`/api/students/${id}/`, {
    method: "DELETE",
  });
}

export async function getDepartments() {
  return await httpJson<{ id: string; name: string }[]>(`/api/departments/`);
}
