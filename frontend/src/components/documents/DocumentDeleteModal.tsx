import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DocumentItem } from '../../types/document';

interface DocumentDeleteModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DocumentDeleteModal: React.FC<DocumentDeleteModalProps> = ({
  document,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title="Delete Policy Document"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Confirm Delete
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-900">
              Are you sure you want to delete this document?
            </p>
            <p className="leading-relaxed">
              This action will permanently delete the document metadata, remove all vector embeddings from Pinecone, and invalidate any cached AI answers referencing this document.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Filename:</span>
            <span className="font-semibold text-slate-800 break-all">{document.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Document ID:</span>
            <span className="text-slate-700 font-mono">#{document.id}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
