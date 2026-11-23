import React, { useState, useEffect, useCallback } from 'react';
import { getDocumentsApi, deleteDocumentApi } from '../../api/documents';
import { DocumentItem } from '../../types/document';
import { DocumentList } from '../../components/documents/DocumentList';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';
import { DocumentDeleteModal } from '../../components/documents/DocumentDeleteModal';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/axios';

export const DocumentsPage: React.FC = () => {
  const { success, error } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDocumentsApi();
      setDocuments(data);
    } catch (err) {
      error(getErrorMessage(err), 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocumentApi(documentToDelete.id);
      success(`"${documentToDelete.filename}" deleted successfully.`, 'Document Deleted');
      setDocumentToDelete(null);
      await fetchDocuments();
    } catch (err) {
      error(getErrorMessage(err), 'Deletion Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Policy Documents</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload and manage policy files (PDF, DOCX, TXT) used for AI grounding and source citations.
        </p>
      </div>

      <DocumentList
        documents={documents}
        isLoading={isLoading}
        onDeleteRequest={(doc) => setDocumentToDelete(doc)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchDocuments}
      />

      <DocumentDeleteModal
        isOpen={!!documentToDelete}
        document={documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};
