import { httpJson } from "@/api/http";

export interface ProtocolData {
  student: {
    id: string;
    matriculationNumber: string;
  };
  submitted: boolean;
  submission_date: Date | null;
  necessary_corrections: string | null;
  accepted: boolean;
  accepted_date: Date | null;
  [key: string]: any;
}

export interface SubmitPaperPayload {
  lab_day: number;
  records: SubmitPaperRecord[];
}
export interface SubmitPaperRecord {
  student_id: string;
  submitted: boolean;
  submission_date: Date | null;
  necessary_corrections?: string | null;
  accepted?: boolean;
  accepted_date?: Date | null;
}

export async function getProtocols(lab_day: number) {
  return await httpJson<ProtocolData[]>(
    `/api/paper-submissions/?lab_day=${lab_day}`,
  );
}

export async function submitPaperSubmission(payload: SubmitPaperPayload) {
  return await httpJson<ProtocolData[]>("/api/paper-submissions/bulk/", {
    method: "POST",
    body: payload,
  });
}
