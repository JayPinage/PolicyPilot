export interface DocumentItem {
  id: number;
  filename: string;
  file_type: string;
  uploaded_by: number;
  created_at: string;
}

export interface DocumentUploadResponse {
  message: string;
  document_id: number;
  filename: string;
  chunks_created: number;
  vectors_upserted: number;
}

export interface DocumentDeleteResponse {
  message: string;
  document_id: number;
}
