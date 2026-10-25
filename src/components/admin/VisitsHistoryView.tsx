import React, { useState } from 'react';
import { Eye, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { Visit } from '../../types/gemba';

interface VisitsHistoryViewProps {
  visits: Visit[];
}

export const VisitsHistoryView: React.FC<VisitsHistoryViewProps> = ({ visits }) => {
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  return (
    <div className="space-y-4">
      {visits.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No gemba walk inspection visits recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => {
            const findingsCount = Object.keys(visit.findings || {}).length;
            const answersCount = Object.keys(visit.answers || {}).length;
            const formattedDate = new Date(visit.visitDate || visit.createdAt).toLocaleString(
              'en-US',
              {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }
            );

            return (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {visit.id}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {visit.area} • {visit.subArea}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {visit.status || 'Submitted'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Observer:{' '}
                    <strong className="text-slate-800">
                      {visit.observer || visit.observerName || visit.visitorName || 'Inspector'}
                    </strong>{' '}
                    • <span>{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {findingsCount} Finding{findingsCount === 1 ? '' : 's'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {answersCount} Questions answered
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedVisit(visit)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-reckitt-pink bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                    {selectedVisit.id}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedVisit.area} &gt; {selectedVisit.subArea}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Recorded by{' '}
                  <strong>{selectedVisit.observer || selectedVisit.visitorName}</strong> on{' '}
                  {new Date(selectedVisit.visitDate).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 text-sm font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Findings breakdown in this visit */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Findings in this Walk ({Object.keys(selectedVisit.findings || {}).length})
              </h4>

              {Object.keys(selectedVisit.findings || {}).length === 0 ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No non-compliance findings recorded during this inspection walk.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {Object.values(selectedVisit.findings).map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{f.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">{f.description}</p>
                      <p className="text-slate-500 italic text-[11px]">&quot;{f.questionText}&quot;</p>
                      {f.photos && f.photos.length > 0 && (
                        <div className="flex gap-2 pt-2">
                          {f.photos.map((p) => (
                            <img
                              key={p.id}
                              src={p.dataUrl}
                              alt={p.name}
                              className="w-16 h-12 object-cover rounded-md border border-slate-300"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Answers List */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                All Recorded Answers ({Object.keys(selectedVisit.answers || {}).length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(selectedVisit.answers || {}).map(([qId, ans]) => (
                  <div
                    key={qId}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-700">{qId}</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                        ans === 'Yes'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ans === 'No'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ans}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
