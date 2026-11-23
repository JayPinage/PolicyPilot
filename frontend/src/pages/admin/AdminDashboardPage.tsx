import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UserPlus,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getDocumentsApi } from '../../api/documents';
import { DocumentItem } from '../../types/document';
import { formatDateTime } from '../../utils/date';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await getDocumentsApi();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents for dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const recentDocuments = documents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              PolicyPilot Administration
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/30 text-sky-300 border border-sky-400/30">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Manage company policy documents, vector embedding ingestion, and provision secure employee access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/employees')}
            icon={<UserPlus className="w-4 h-4 text-slate-700" />}
            className="bg-white hover:bg-slate-100 text-slate-800 border-transparent"
          >
            Create Employee
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            icon={<UploadCloud className="w-4 h-4" />}
            className="bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Documents */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Uploaded Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {isLoading ? '...' : documents.length}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Active policy manuals in Pinecone
            </p>
          </div>
        </Card>

        {/* Supported Document Formats */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supported Formats
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5 font-bold text-lg text-slate-900">
              <span>PDF</span>
              <span className="text-slate-300">•</span>
              <span>DOCX</span>
              <span className="text-slate-300">•</span>
              <span>TXT</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Parsed with PyPDF, Docx & semantic chunker
            </p>
          </div>
        </Card>

        {/* System & Guardrails Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              RAG Guardrails
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-base font-semibold text-slate-900">Active & Enforced</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Presidio PII + Citation verification enabled
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Quick Management"
            description="Frequently used administrative workflows"
          />
          <CardContent className="space-y-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                    Upload Policy Manual
                  </h4>
                  <p className="text-[11px] text-slate-500">Add new rules or employee handbooks</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/admin/employees')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Provision Employee Account
                  </h4>
                  <p className="text-[11px] text-slate-500">Create login credentials for staff</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/admin/documents')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Browse All Documents
                  </h4>
                  <p className="text-[11px] text-slate-500">View and remove indexed policies</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </CardContent>
        </Card>

        {/* Recent Upload Activity */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Document Activity"
            description="Latest company policies ingested into PolicyPilot"
            action={
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/admin/documents')}
              >
                View all ({documents.length})
              </Button>
            }
          />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No documents uploaded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click 'Upload Document' above to ingest your first policy manual.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {doc.filename}
                        </p>
                        <p className="text-[11px] text-slate-400">ID: #{doc.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(doc.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchDocuments}
      />
    </div>
  );
};
