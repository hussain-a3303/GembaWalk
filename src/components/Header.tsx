import React from 'react';
import {
  ClipboardCheck,
  Shield,
  LogOut,
  Play,
  FileText,
  Clock,
  Users,
  HelpCircle,
  Mail,
  FileSpreadsheet,
  Download,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { ObserverProfile } from '../types/gemba';

interface HeaderProps {
  profile: ObserverProfile | null;
  activeRole: 'Inspector' | 'Plant Administrator';
  currentTab: string;
  onTabChange: (tab: string) => void;
  onExit: () => void;
  walkId?: string;
  activeFindingsCount?: number;
  onOpenSmtp?: () => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  findingCount?: number;
  visitsCount?: number;
  peoplesCount?: number;
  questionsCount?: number;
  auditCount?: number;
  canAccessChecklist?: boolean;
  canAccessReview?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeRole,
  currentTab,
  onTabChange,
  onExit,
  walkId,
  activeFindingsCount = 0,
  onOpenSmtp,
  onExportExcel,
  onExportCsv,
  findingCount = 0,
  visitsCount = 0,
  peoplesCount = 0,
  questionsCount = 166,
  auditCount = 0,
  canAccessChecklist = true,
  canAccessReview = true,
}) => {
  const isInspector = activeRole === 'Inspector';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Info (Reckitt Pink & Deep Navy) */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white ${
                isInspector ? 'bg-reckitt-pink' : 'bg-reckitt-navy'
              }`}
            >
              {isInspector ? <ClipboardCheck className="w-6 h-6" /> : <Shield className="w-6 h-6 text-reckitt-pink" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-reckitt-navy tracking-tight text-lg">
                  Reckitt <span className="text-reckitt-pink">GembaWalk</span>
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                    isInspector
                      ? 'bg-reckitt-pink-light text-reckitt-pink border border-reckitt-pink/20'
                      : 'bg-[#0B1736]/10 text-reckitt-navy border border-reckitt-navy/20'
                  }`}
                >
                  {isInspector ? 'INSPECTOR PORTAL' : 'ADMINISTRATOR CONSOLE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isInspector
                  ? `Logged in as: ${profile?.name || 'Jane Doe (Inspector)'} (${
                      profile?.department || 'Quality & Safety Operations'
                    })`
                  : 'Central Safety Operations, Action Assignment & Real-Time Alerts'}
              </p>
            </div>
          </div>

          {/* Right: Cloud status & Exit */}
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Connected to Reckitt Cloud Safety Database"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cloud Connected
            </div>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-reckitt-pink hover:bg-slate-50 rounded-xl transition border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isInspector ? 'Exit Walk' : 'Exit Admin'}
            </button>
          </div>
        </div>

        {/* Sub-navigation bar */}
        <div className="flex items-center justify-between border-t border-slate-100 py-2 overflow-x-auto scrollbar-none">
          {isInspector ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTabChange('start')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'start'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-reckitt-navy hover:bg-slate-100'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Walk
                </button>
                <button
                  onClick={() => canAccessChecklist && onTabChange('checklist')}
                  disabled={!canAccessChecklist}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'checklist'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : canAccessChecklist
                      ? 'text-slate-600 hover:text-reckitt-navy hover:bg-slate-100'
                      : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Walk Checklist
                  {activeFindingsCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px]">
                      {activeFindingsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => canAccessReview && onTabChange('review')}
                  disabled={!canAccessReview}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'review'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : canAccessReview
                      ? 'text-slate-600 hover:text-reckitt-navy hover:bg-slate-100'
                      : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Review &amp; Submit
                </button>
              </div>
              {walkId && (
                <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Walk: <span className="text-reckitt-pink font-extrabold">{walkId}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <nav className="flex items-center gap-1">
                {/* Requirement 4: Added Dashboard Tab to Admin navigation */}
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'dashboard'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </button>
                <button
                  onClick={() => onTabChange('findings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'findings'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Findings Register
                  {findingCount > 0 && <span className="text-slate-300 font-normal">({findingCount})</span>}
                </button>
                <button
                  onClick={() => onTabChange('visits')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'visits'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Visits History
                  {visitsCount > 0 && <span className="text-slate-300 font-normal">({visitsCount})</span>}
                </button>
                <button
                  onClick={() => onTabChange('peoples')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'peoples'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Peoples
                  {peoplesCount >= 0 && <span className="text-slate-300 font-normal">({peoplesCount})</span>}
                </button>
                <button
                  onClick={() => onTabChange('questions')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'questions'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Question Bank
                  <span className="text-slate-300 font-normal">({questionsCount})</span>
                </button>
                <button
                  onClick={() => onTabChange('emails')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'emails'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Alerts
                </button>
                <button
                  onClick={() => onTabChange('audit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'audit'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  System Audit Log
                  {auditCount >= 0 && <span className="text-slate-300 font-normal">({auditCount})</span>}
                </button>
                <button
                  onClick={() => onTabChange('workbook')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'workbook'
                      ? 'bg-reckitt-pink text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Workbook Source
                </button>
              </nav>

              <div className="flex items-center gap-2 pl-4">
                {onExportExcel && (
                  <button
                    onClick={onExportExcel}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                    title="Export to Excel Spreadsheet (.xlsx)"
                  >
                    <Download className="w-3 h-3" />
                    Export Excel
                  </button>
                )}
                {onExportCsv && (
                  <button
                    onClick={onExportCsv}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
                    title="Export data as CSV"
                  >
                    <Download className="w-3 h-3" />
                    CSV
                  </button>
                )}
                {onOpenSmtp && (
                  <button
                    onClick={onOpenSmtp}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-reckitt-pink bg-reckitt-pink-light hover:bg-reckitt-pink-subtle border border-reckitt-pink/20 rounded-lg transition"
                  >
                    <Settings className="w-3 h-3" />
                    Mail Server (SMTP)
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
