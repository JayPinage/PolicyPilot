import { apiClient } from './axios';
import { DocumentItem, DocumentUploadResponse, DocumentDeleteResponse } from '../types/document';

/**
 * Admin: List all uploaded policy documents.
 */
export async function getDocumentsApi(): Promise<DocumentItem[]> {
  const response = await apiClient.get<DocumentItem[]>('/api/documents/');
  return response.data;
}

/**
 * Admin: Upload a policy document (PDF, DOCX, TXT) via multipart/form-data.
 */
export async function uploadDocumentApi(
  file: File,
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<DocumentUploadResponse>('/api/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
}

/**
 * Admin: Delete a policy document by ID.
 */
export async function deleteDocumentApi(documentId: number): Promise<DocumentDeleteResponse> {
  const response = await apiClient.delete<DocumentDeleteResponse>(`/api/documents/${documentId}`);
  return response.data;
}
