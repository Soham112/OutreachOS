import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

export interface ProfileData {
  name: string;
  current_role: string;
  company: string;
  experience_summary: string;
  skills: string[];
  recipient_type: "RECRUITER" | "HIRING_MANAGER";
  raw_text: string;
  jd_text: string;
}

export interface AnalyzeResponse {
  success: boolean;
  profile: ProfileData;
}

export interface GenerateRequest {
  recipient_profile: string;
  recipient_type: "RECRUITER" | "HIRING_MANAGER";
  message_type:
    | "connection_request"
    | "followup"
    | "inmail"
    | "cold_email_short"
    | "cold_email_detailed"
    | "cold_email_followup";
  jd_text?: string;
}

export interface GenerateResult {
  message?: string;
  subject?: string;
  body?: string;
  raw?: string;
}

export interface GenerateResponse {
  success: boolean;
  result: GenerateResult;
  message_type: string;
}

export interface HistoryEntry {
  id: number;
  created_at: string;
  recipient_name: string;
  company: string;
  recipient_type: string;
  message_type: string;
  subject: string;
  message_body: string;
  status: "Draft" | "Sent" | "Replied" | "No Response";
}

export const analyzeProfile = async (
  linkedinPdf: File,
  jdPdf?: File | null,
  jdText?: string
): Promise<AnalyzeResponse> => {
  const form = new FormData();
  form.append("linkedin_pdf", linkedinPdf);
  if (jdPdf) form.append("jd_pdf", jdPdf);
  if (jdText) form.append("jd_text", jdText);
  const res = await api.post<AnalyzeResponse>("/analyze/profile", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const generateMessage = async (
  req: GenerateRequest
): Promise<GenerateResponse> => {
  const res = await api.post<GenerateResponse>("/generate/message", req);
  return res.data;
};

export const saveHistory = async (data: {
  recipient_name: string;
  company?: string;
  recipient_type?: string;
  message_type: string;
  subject?: string;
  message_body: string;
  status?: string;
}) => {
  const res = await api.post("/history/save", data);
  return res.data;
};

export const listHistory = async (): Promise<{ history: HistoryEntry[] }> => {
  const res = await api.get("/history/list");
  return res.data;
};

export const getHistoryEntry = async (
  id: number
): Promise<{ entry: HistoryEntry }> => {
  const res = await api.get(`/history/${id}`);
  return res.data;
};

export const updateStatus = async (id: number, status: string) => {
  const res = await api.patch(`/history/${id}/status`, { status });
  return res.data;
};

export const deleteEntry = async (id: number) => {
  const res = await api.delete(`/history/${id}`);
  return res.data;
};
