import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Search,
  FileCode,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  FilePlus,
} from 'lucide-react';
import { DocumentItem } from '../../types/document';
import { formatDateTime } from '../../utils/date';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface DocumentListProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onDeleteRequest: (doc: DocumentItem) => void;
  onOpenUpload: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onDeleteRequest,
  onOpenUpload,
}) => {
  const [search, setSearch] = useState('');

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (ext === 'docx' || ext === 'doc') {
      return (
        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
          <FileCode className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-4 h-4" />
      </div>
    );
  };

  const getFormatBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    if (ext === 'PDF') return <Badge variant="danger" size="sm">PDF</Badge>;
    if (ext === 'DOCX') return <Badge variant="primary" size="sm">DOCX</Badge>;
    return <Badge variant="neutral" size="sm">{ext}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header controls: Search and Upload CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white placeholder:text-slate-400"
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenUpload}
          icon={<FilePlus className="w-4 h-4" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              {search ? <AlertCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              {search ? 'No matching documents found' : 'No policy documents uploaded yet'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? 'Try a different keyword or clear your search query.'
                : 'Upload company HR policies, employee handbooks, leave policies, or rules to enable AI grounding.'}
            </p>
            {!search && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenUpload}
                  icon={<FilePlus className="w-4 h-4" />}
                >
                  Upload First Document
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.filename)}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {doc.filename}
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal">
                            Document ID: #{doc.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getFormatBadge(doc.filename)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(doc.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="font-medium">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
