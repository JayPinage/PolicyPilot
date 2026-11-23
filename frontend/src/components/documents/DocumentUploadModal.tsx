import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { uploadDocumentApi } from '../../api/documents';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/axios';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { success, error } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setValidationError(null);
    const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setValidationError(`Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setValidationError('File size exceeds the 25 MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const result = await uploadDocumentApi(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      success(
        `"${result.filename}" uploaded successfully (${result.chunks_created} chunks, ${result.vectors_upserted} vectors indexed).`,
        'Document Ingested'
      );
      handleReset();
      onUploadSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      error(msg, 'Upload Failed');
      setValidationError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) {
          handleReset();
          onClose();
        }
      }}
      title="Upload Policy Document"
      description="Upload company policy documents (PDF, DOCX, TXT). Documents will be chunked, embedded, and added to the semantic search index."
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={!file || isUploading}
            isLoading={isUploading}
            icon={<UploadCloud className="w-4 h-4" />}
          >
            {isUploading ? `Ingesting (${uploadProgress}%)...` : 'Upload & Process'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-50/60'
              : file
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
              file
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-sky-100 text-sky-600'
            }`}
          >
            {file ? <File className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
          </div>

          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 break-all">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for upload
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                <span className="text-sky-600 font-semibold hover:underline">Click to browse</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                Supports PDF, DOCX, and TXT files (up to 25 MB)
              </p>
            </div>
          )}

          {file && !isUploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar during upload */}
        {isUploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Extracting and indexing chunks in Pinecone...</span>
              <span className="font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Validation or backend error alert */}
        {validationError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 break-words">{validationError}</div>
          </div>
        )}
      </div>
    </Modal>
  );
};
