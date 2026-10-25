import React, { useState } from 'react';
import { Search, Download, Trash2, Shield, Filter } from 'lucide-react';
import { AuditLog } from '../../types/gemba';
import { convertToCsv } from '../../utils/gembaLogic';

interface SystemAuditLogViewProps {
  logs: AuditLog[];
  onClearLogs: () => void;
}

export const SystemAuditLogView: React.FC<SystemAuditLogViewProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'All Actions' && log.action !== actionFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetRef.toLowerCase().includes(q) ||
        log.eventDetails.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Actor / Observer', 'Action', 'Target Reference', 'Event Details', 'Client IP'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.actor,
      l.action,
      l.targetRef,
      l.eventDetails,
      l.clientIp || '',
    ]);
    const csvContent = convertToCsv(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'gemba_audit_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action, target ID, or event details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onClearLogs}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Logs
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Action Type:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option>All Actions ({logs.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-medium">
            Showing {filteredLogs.length} logged events
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor / Observer</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Reference</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Client / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No system audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.actor}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {log.targetRef}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md">{log.eventDetails}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.clientIp || '10.0.4.18'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
