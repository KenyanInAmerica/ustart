export type DocumentSubmissionStatus =
  | "pending_review"
  | "approved"
  | "resubmit_requested"
  | "cancelled";

export interface DocumentSubmissionFile {
  id: string;
  submission_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  signedUrl?: string | null;
}

export interface DocumentSubmission {
  id: string;
  user_id: string;
  task_id: string | null;
  template_id: string | null;
  section_label: string | null;
  status: DocumentSubmissionStatus;
  admin_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  files: DocumentSubmissionFile[];
}

export interface CreateSubmissionData {
  task_id?: string;
  template_id?: string;
  section_label?: string;
  files: File[];
}
