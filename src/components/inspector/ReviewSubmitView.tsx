import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  Eye,
  Building,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, Finding, Visit } from '../../types/gemba';
import { categorizeBreakdown } from '../../utils/gembaLogic';

interface ReviewSubmitViewProps {
  walkId: string;
  area: string;
  subArea: string;
  observer: string;
  dateTime: string;
  questions: Question[];
  answers: Record<string, 'Yes' | 'No' | 'N/A'>;
  findings: Record<string, Finding>;
  onBackToChecklist: (targetQuestionIndex?: number) => void;
  onSubmitWalk: (visit: Visit) => void;
  onGoToAdmin: () => void;
  onStartNewWalk: () => void;
}

export const ReviewSubmitView: React.FC<ReviewSubmitViewProps> = ({
  walkId,
  area,
  subArea,
  observer,
  dateTime,
  questions,
  answers,
  findings,
  onBackToChecklist,
  onSubmitWalk,
  onGoToAdmin,
  onStartNewWalk,
}) => {
  const [submitted, setSubmitted] = useState(false);

  // Unanswered questions
  const unansweredQuestions = questions.filter(
    (q) => answers[q.id] === undefined || answers[q.id] === null
  );

  // Check if findings have descriptions
  const findingsList = Object.values(findings);
  const incompleteFindings = findingsList.filter(
    (f) => !f.description || f.description.trim() === ''
  );

  const isComplete = unansweredQuestions.length === 0 && incompleteFindings.length === 0;
  const breakdown = categorizeBreakdown(questions, answers, findings);

  // Dynamically compute exact personnel to whom incident emails were forwarded
  const forwardedPersonnel = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string; role: string }>();
    findingsList.forEach((f) => {
      const q = questions.find((item) => item.id === f.questionId);
      const assignees = (q?.suggestedAssignees && q.suggestedAssignees.length > 0)
        ? q.suggestedAssignees
        : f.assignedTo
        ? [f.assignedTo]
        : [];

      assignees.forEach((a) => {
        if (a && a.email && !map.has(a.email.toLowerCase())) {
          map.set(a.email.toLowerCase(), {
            name: a.name,
            email: a.email,
            role: a.role,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [findingsList, questions]);

  const handleSubmit = () => {
    if (!isComplete) return;

    const newVisit: Visit = {
      id: walkId,
      area,
      subArea,
      observer,
      visitorName: observer,
      visitDate: dateTime,
      answers,
      findings,
      adHocFindings: [],
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    onSubmitWalk(newVisit);
    setSubmitted(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const formattedDate = new Date(dateTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top back bar & Walk ID */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onBackToChecklist()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Checklist
        </button>

        <div className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
          Walk ID: <span className="text-reckitt-pink">{walkId}</span>
        </div>
      </div>

      {/* Main Review Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-reckitt-pink mb-1">
              <Building className="w-4 h-4" />
              <span>{area}</span>
              <span>•</span>
              <span className="text-slate-800">{subArea}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Inspection Review &amp; Summary
            </h2>
          </div>

          <div>
            {unansweredQuestions.length > 0 ? (
              <span className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold rounded-full">
                {unansweredQuestions.length} Issue(s) Blocking
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All Questions Completed
              </span>
            )}
          </div>
        </div>

        {/* Observer & Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Observer
            </span>
            <span className="font-bold text-slate-900 text-sm">{observer}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Date &amp; Time
            </span>
            <span className="font-bold text-slate-900 text-sm">{formattedDate}</span>
          </div>
        </div>

        {/* Incomplete Blocking Banner */}
        {unansweredQuestions.length > 0 && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Inspection Incomplete</span>
            </div>
            <p className="text-xs text-rose-600">
              All checklist questions must be answered before submission.
            </p>

            <div className="space-y-2 mt-2">
              {unansweredQuestions.map((q) => {
                const qIndex = questions.findIndex((item) => item.id === q.id);
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between bg-white border border-rose-200 rounded-xl p-3 text-xs shadow-2xs"
                  >
                    <span className="font-medium text-slate-700">
                      Question <strong className="font-mono text-slate-900">{q.id}</strong> is unanswered.
                    </span>
                    <button
                      type="button"
                      onClick={() => onBackToChecklist(qIndex)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition"
                    >
                      Answer Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incomplete Finding Descriptions Banner */}
        {incompleteFindings.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900">
            <strong className="block font-bold mb-1">Observation Description Required</strong>
            {incompleteFindings.map((f) => (
              <div key={f.id} className="flex items-center justify-between mt-1.5">
                <span>Finding {f.id} needs a description.</span>
                <button
                  type="button"
                  onClick={() => {
                    const idx = questions.findIndex((q) => q.id === f.questionId);
                    onBackToChecklist(idx >= 0 ? idx : 0);
                  }}
                  className="px-2.5 py-0.5 bg-amber-600 text-white font-bold rounded text-xs"
                >
                  Edit Finding
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Category Breakdown */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
            Category Checklist Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {breakdown.map((item) => (
              <div
                key={item.category}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center"
              >
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  {item.category}
                </span>
                <div className="text-lg font-black text-slate-900">
                  {item.answered} / {item.total}
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${
                    item.findingsCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {item.findingsCount} Finding{item.findingsCount === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Findings Recorded Summary */}
        {findingsList.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Findings Recorded ({findingsList.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Email alerts will dispatch upon submit
              </span>
            </div>

            <div className="space-y-3">
              {findingsList.map((f) => (
                <div
                  key={f.id}
                  className="p-4 border border-slate-200 rounded-2xl bg-white space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-reckitt-pink bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                        {f.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{f.category}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          f.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : f.severity === 'Major'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {f.photos.length} photo(s) attached
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic">&quot;{f.questionText}&quot;</p>
                  <p className="text-xs font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {f.description || 'No description provided'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-6 border-t border-slate-100">
          <button
            type="button"
            disabled={!isComplete}
            onClick={handleSubmit}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm ${
              isComplete
                ? 'bg-reckitt-pink hover:bg-reckitt-pink-hover text-white shadow-pink-500/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit Gemba Walk &amp; Dispatch Real-Time Alerts
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {submitted && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Gemba Walk Submitted!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Walk <strong className="font-mono text-reckitt-pink">{walkId}</strong> for{' '}
              <strong>{area} {subArea ? `> ${subArea}` : ''}</strong> has been successfully recorded in the central register.
              {findingsList.length > 0
                ? ` ${findingsList.length} non-compliance finding(s) generated incident alerts.`
                : ' No non-compliances recorded.'}
            </p>

            {forwardedPersonnel.length > 0 && (
              <div className="mb-6 text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    📧 Alerts Forwarded To ({forwardedPersonnel.length}):
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    EmailJS Dispatched
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {forwardedPersonnel.map((person) => (
                    <div
                      key={person.email}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs hover:border-reckitt-pink/30 transition"
                    >
                      <div>
                        <strong className="text-slate-900 block font-bold">{person.name}</strong>
                        <span className="text-[11px] font-mono text-slate-500">{person.email}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-reckitt-navy bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0">
                        {person.role || 'Concern Lead'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onGoToAdmin}
                className="py-3 px-4 bg-reckitt-navy hover:bg-reckitt-navy-dark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View in Admin Console
              </button>
              <button
                type="button"
                onClick={onStartNewWalk}
                className="py-3 px-4 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Building className="w-4 h-4" />
                Start New Walk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
