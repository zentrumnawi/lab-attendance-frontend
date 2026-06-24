import { httpJson } from "@/api/http";

export interface StudentData {
  last_name: string;
  first_name: string;
  id: string;
  email: string;
  lab_partner?: string;
  [key: string]: any;
}
export interface StudentPerformance {
  papers_completed: number;
  exercises_completed: number;
  attendance_count: number;
  [key: string]: any;
}

export async function getStudentPerformance(studentId: string) {
  return await httpJson<StudentPerformance>(
    `/api/final-results/${encodeURIComponent(studentId)}/`,
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
