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

export async function getProtocols(lab_day: number) {
  return await httpJson<ProtocolData[]>(
    `/api/paper-submissions/?lab_day=${lab_day}`,
  );
}
