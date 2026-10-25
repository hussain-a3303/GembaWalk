import React from 'react';
import { Shield, Mail, FileSpreadsheet, Download, Sparkles } from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onOpenSmtp: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  children: React.ReactNode;
}

const TAB_METADATA: Record<string, { title: string; subtitle: string; tag: string }> = {
  dashboard: {
    title: 'Analytics & Tracking Dashboard',
    subtitle: 'Dynamic date slicer, real-time response KPIs, and findings resolution ledger.',
    tag: 'KPI Analytics',
  },
  findings: {
    title: 'Findings & Non-Compliance Register',
    subtitle: 'Track observations, attached photo evidence, and resolution workflow statuses.',
    tag: 'Incident Register',
  },
  visits: {
    title: 'Inspection Visits History',
    subtitle: 'Audit trail of completed Gemba walks across manufacturing, warehouse, and lab facilities.',
    tag: 'Visit Logs',
  },
  peoples: {
    title: 'Personnel & Multi-Zone Directory',
    subtitle: 'Configure multi-department, multi-area concern leads to receive automated EmailJS notifications.',
    tag: 'Personnel Matrix',
  },
  questions: {
    title: 'Checklist Question Bank',
    subtitle: 'Master checklist questions, category headings, and question-specific email routing rules.',
    tag: 'Question Bank',
  },
  emails: {
    title: 'Real-Time Email Alert Dispatches',
    subtitle: 'Complete ledger of multi-recipient email dispatches via EmailJS HTTP API.',
    tag: 'EmailJS Dispatch',
  },
  audit: {
    title: 'System & Security Audit Log',
    subtitle: 'Immutable record of user logins, walk submissions, bulk updates, and configuration changes.',
    tag: 'System Audit',
  },
  workbook: {
    title: 'Master Workbook Source',
    subtitle: 'Direct inspection of synchronized Excel checklist sheets and raw data schemas.',
    tag: 'Excel Master',
  },
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onOpenSmtp,
  onExportExcel,
  onExportCsv,
  children,
}) => {
  const meta = TAB_METADATA[currentTab] || {
    title: 'Reckitt Management Console',
    subtitle: 'Central Safety Operations, Action Assignment & Real-Time Alerts',
    tag: 'Admin Active',
  };

  return (
    <div className="space-y-6">
      {/* Unified Single Admin Console Header */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="w-8 h-8 rounded-xl bg-reckitt-navy text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-reckitt-pink" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reckitt Management Console
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-reckitt-pink-light text-reckitt-pink border border-reckitt-pink/20">
              {meta.tag}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            {meta.subtitle}
          </p>
        </div>

        {/* Global Admin Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Export all data to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
            title="Export all findings to CSV"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={onOpenSmtp}
            className="px-3.5 py-2 bg-reckitt-pink-light hover:bg-pink-100 text-reckitt-pink text-xs font-bold rounded-xl border border-reckitt-pink/20 flex items-center gap-1.5 transition cursor-pointer"
            title="Configure EmailJS & SMTP mail server"
          >
            <Mail className="w-3.5 h-3.5" />
            EmailJS &amp; SMTP
          </button>
        </div>
      </div>

      {/* Dynamic Tab Body */}
      <div>{children}</div>
    </div>
  );
};
