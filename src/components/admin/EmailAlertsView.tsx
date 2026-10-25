import React, { useState } from 'react';
import {
  Mail,
  Search,
  ExternalLink,
  Settings,
  CheckCircle2,
  X,
  Clock,
  User,
  Shield,
} from 'lucide-react';
import { EmailNotification } from '../../types/gemba';
import { PLANT_STRUCTURE } from '../inspector/StartWalkView';

interface EmailAlertsViewProps {
  emails: EmailNotification[];
  onOpenSmtp: () => void;
}

export const EmailAlertsView: React.FC<EmailAlertsViewProps> = ({ emails, onOpenSmtp }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [subAreaFilter, setSubAreaFilter] = useState('All Sub-Areas');
  const [severityFilter, setSeverityFilter] = useState('All Severity');
  const [viewingEmail, setViewingEmail] = useState<EmailNotification | null>(null);

  const filteredEmails = emails.filter((e) => {
    if (areaFilter !== 'All Areas' && e.area !== areaFilter) return false;
    if (subAreaFilter !== 'All Sub-Areas' && e.subArea !== subAreaFilter) return false;
    if (severityFilter !== 'All Severity' && e.severity !== severityFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        e.recipientName.toLowerCase().includes(q) ||
        e.recipientEmail.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        e.subArea.toLowerCase().includes(q) ||
        e.findingId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Stat Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-reckitt-pink-light text-reckitt-pink flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                EmailJS Incident Alert Dispatches
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {emails.length} Dispatched
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated alerts delivered to question-specific assignees upon walk submission.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSmtp}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-reckitt-pink-light hover:bg-pink-100 text-reckitt-pink text-xs font-bold rounded-xl border border-reckitt-pink/20 transition shrink-0 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          EmailJS &amp; SMTP Setup
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by recipient, subject, area, or incident ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                setSubAreaFilter('All Sub-Areas');
              }}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option>All Areas</option>
              {Object.keys(PLANT_STRUCTURE).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={subAreaFilter}
              onChange={(e) => setSubAreaFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option>All Sub-Areas</option>
              {areaFilter !== 'All Areas' &&
                (PLANT_STRUCTURE[areaFilter] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option>All Severity</option>
              <option>Minor</option>
              <option>Major</option>
              <option>Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recipient &amp; Role</th>
                <th className="py-3 px-4">Area &amp; Sub-Area</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Subject / Finding</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmails.map((email) => {
                const dateFormatted = new Date(email.timestamp).toLocaleString();
                return (
                  <tr key={email.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {email.status || 'Delivered'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{email.recipientName}</strong>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {email.recipientEmail}
                      </span>
                      <span className="text-[10px] text-purple-700">{email.recipientRole}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{email.area}</strong>
                      <span className="text-[11px] text-slate-500">{email.subArea}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          email.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : email.severity === 'Major'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {email.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="font-semibold text-slate-900 block truncate" title={email.subject}>
                        {email.subject}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Incident: {email.findingId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingEmail(email)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 ml-auto"
                      >
                        View Email
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Email Full Modal */}
      {viewingEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">Email Dispatch Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Headers Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">TO:</span>
                <span className="font-mono text-slate-800">
                  {viewingEmail.recipientName} &lt;{viewingEmail.recipientEmail}&gt;
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">SUBJECT:</span>
                <strong className="text-slate-900">{viewingEmail.subject}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">INCIDENT:</span>
                <span className="font-mono font-bold text-purple-700">{viewingEmail.findingId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">DISPATCHED:</span>
                <span className="text-slate-600 font-mono">
                  {new Date(viewingEmail.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Message Body
              </span>
              <pre className="p-4 bg-slate-950 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 overflow-x-auto">
                {viewingEmail.body}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
