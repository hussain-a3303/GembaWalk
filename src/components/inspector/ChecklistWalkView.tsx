import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Check,
  X,
  MinusCircle,
  Camera,
  Upload,
  ArrowLeft,
  ArrowRight,
  Save,
  Trash2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { Question, Finding, EvidencePhoto, FindingSeverity, Assignee } from '../../types/gemba';
import { generateFindingId, generatePhotoId } from '../../utils/gembaLogic';

interface ChecklistWalkViewProps {
  questions: Question[];
  area: string;
  subArea: string;
  observer: string;
  answers: Record<string, 'Yes' | 'No' | 'N/A'>;
  findings: Record<string, Finding>;
  onAnswer: (questionId: string, answer: 'Yes' | 'No' | 'N/A') => void;
  onUpdateFinding: (questionId: string, finding: Finding) => void;
  onSaveDraft: () => void;
  onCompleteWalk: () => void;
  suggestedAssignees?: Assignee[];
}

export const ChecklistWalkView: React.FC<ChecklistWalkViewProps> = ({
  questions,
  area,
  subArea,
  observer,
  answers,
  findings,
  onAnswer,
  onUpdateFinding,
  onSaveDraft,
  onCompleteWalk,
  suggestedAssignees = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCameraSimulation, setShowCameraSimulation] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  if (!currentQ) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-slate-500">
        No inspection questions configured for {area} &gt; {subArea}.
      </div>
    );
  }

  const currentAnswer = answers[currentQ.id];
  const currentFinding = findings[currentQ.id];

  // Count answered questions
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;
  const findingCount = Object.keys(findings).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Handle choice selection with 300ms auto-advance on "Yes"
  const handleSelectAnswer = (choice: 'Yes' | 'No' | 'N/A') => {
    // Clear any previous pending timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
      setIsAutoAdvancing(false);
    }

    onAnswer(currentQ.id, choice);

    if (choice === 'No') {
      if (!currentFinding) {
        const newFinding: Finding = {
          id: generateFindingId(),
          questionId: currentQ.id,
          questionText: currentQ.questionText,
          area,
          subArea,
          category: currentQ.category || 'Safety',
          severity: 'Major',
          status: 'Open',
          description: '',
          suggestedAction: '',
          photos: [],
          assignedTo: currentQ.suggestedAssignees?.[0] || suggestedAssignees[0],
          createdAt: new Date().toISOString(),
        };
        onUpdateFinding(currentQ.id, newFinding);
      }
    } else if (choice === 'Yes' || choice === 'N/A') {
      // Auto-advance to next question without manual next click (300ms smooth visual delay)
      setIsAutoAdvancing(true);
      autoAdvanceTimerRef.current = setTimeout(() => {
        setIsAutoAdvancing(false);
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onCompleteWalk();
        }
      }, 300);
    }
  };

  // Handle finding updates
  const updateFindingField = <K extends keyof Finding>(field: K, val: Finding[K]) => {
    if (!currentFinding) return;
    const updated = { ...currentFinding, [field]: val };
    onUpdateFinding(currentQ.id, updated);
  };

  // Add evidence photo (file upload or camera)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentFinding) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const photo: EvidencePhoto = {
        id: generatePhotoId(),
        name: file.name,
        sizeBytes: file.size,
        timestamp: new Date().toISOString(),
        uploadStatus: 'uploaded',
        dataUrl: reader.result as string,
      };
      updateFindingField('photos', [...currentFinding.photos, photo]);
    };
    reader.readAsDataURL(file);
  };

  // Add simulated photo (for rapid testing / demo)
  const handleAddSamplePhoto = (sampleType: 'machinery' | 'leak' | 'hazard') => {
    if (!currentFinding) return;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 400;
    sampleCanvas.height = 300;
    const ctx = sampleCanvas.getContext('2d');
    if (ctx) {
      // Draw simulated inspection evidence banner
      ctx.fillStyle = sampleType === 'leak' ? '#0284c7' : sampleType === 'machinery' ? '#475569' : '#dc2626';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`GEMBA INSPECTION EVIDENCE`, 20, 50);
      ctx.font = '14px sans-serif';
      ctx.fillText(`Location: ${area} - ${subArea}`, 20, 90);
      ctx.fillText(`Observation: ${currentFinding.id}`, 20, 120);
      ctx.fillText(`Timestamp: ${new Date().toLocaleTimeString()}`, 20, 150);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 180, 360, 90);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`NON-COMPLIANCE DEFECT IDENTIFIED`, 40, 230);
    }
    const dataUrl = sampleCanvas.toDataURL('image/jpeg');
    const photo: EvidencePhoto = {
      id: generatePhotoId(),
      name: `gemba_evidence_${Date.now()}.jpg`,
      sizeBytes: 42500,
      timestamp: new Date().toISOString(),
      uploadStatus: 'uploaded',
      dataUrl,
    };
    updateFindingField('photos', [...currentFinding.photos, photo]);
    setShowCameraSimulation(false);
  };

  const removePhoto = (photoId: string) => {
    if (!currentFinding) return;
    updateFindingField(
      'photos',
      currentFinding.photos.filter((p) => p.id !== photoId)
    );
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasNoWithoutPhoto = currentAnswer === 'No' && (!currentFinding || currentFinding.photos.length === 0);

  const handleNext = () => {
    if (hasNoWithoutPhoto) {
      return;
    }
    if (isLastQuestion) {
      onCompleteWalk();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top summary card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-reckitt-pink">
              <span>{area}</span>
              <span>•</span>
              <span className="text-slate-800">{subArea}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Observer: <strong className="text-slate-800">{observer}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {answeredCount}/{totalQuestions} Answered
            </span>
            {findingCount > 0 && (
              <span className="text-xs font-bold text-reckitt-pink bg-reckitt-pink-light px-3 py-1 rounded-full border border-reckitt-pink/20 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-reckitt-pink" />
                {findingCount} Finding{findingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-reckitt-pink h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Question Numbers bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const ans = answers[q.id];
            const hasFinding = ans === 'No';

            let btnClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
            if (isCurrent) {
              btnClass = 'bg-reckitt-pink text-white font-black shadow-sm ring-2 ring-reckitt-pink/40 border-reckitt-pink';
            } else if (hasFinding) {
              btnClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
            } else if (ans) {
              btnClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-full border text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${btnClass}`}
                title={`Question ${idx + 1}: ${q.category}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Category Header Banner */}
        <div className="p-4 sm:p-6 bg-linear-to-r from-rose-50/60 to-orange-50/40 border-b border-rose-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                  QUESTION HEADING
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentQ.category || 'Safety'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200 px-3 py-1 rounded-full">
                {area} &gt; {subArea}
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-3 py-1 rounded-full">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              INSPECTION QUESTION: <span className="text-slate-600">{currentQ.id}</span>
            </span>
            {currentQ.version && (
              <span className="text-[10px] font-mono text-slate-400">{currentQ.version}</span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {currentQ.questionText}
          </h2>

          {/* Touch Action Buttons: YES / NO / N/A */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSelectAnswer('Yes')}
              className={`py-5 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative ${
                currentAnswer === 'Yes'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
              } ${isAutoAdvancing ? 'ring-4 ring-emerald-400 scale-[0.98]' : ''}`}
            >
              <Check className={`w-6 h-6 stroke-[3] ${isAutoAdvancing ? 'scale-110' : ''}`} />
              <span className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                YES
                {isAutoAdvancing && (
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full animate-pulse">
                    Next &rarr;
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectAnswer('No')}
              className={`py-5 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                currentAnswer === 'No'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <X className="w-6 h-6 stroke-[3]" />
              <span className="font-extrabold text-sm sm:text-base tracking-wide">NO</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectAnswer('N/A')}
              className={`py-5 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                currentAnswer === 'N/A'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <MinusCircle className="w-6 h-6" />
              <span className="font-extrabold text-sm sm:text-base tracking-wide">N/A</span>
            </button>
          </div>

          {/* Finding Evidence Form when NO is selected */}
          {currentAnswer === 'No' && currentFinding && (
            <div className="mt-6 rounded-2xl border-2 border-amber-400 bg-amber-50/40 p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Finding header & severity toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    ACTIVE FINDING EVIDENCE
                  </span>
                  <span className="font-mono text-xs font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    ID: {currentFinding.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Severity:</span>
                  {(['Minor', 'Major', 'Critical'] as FindingSeverity[]).map((sev) => {
                    const isSelected = currentFinding.severity === sev;
                    let color = 'bg-white text-slate-600 border-slate-200';
                    if (isSelected) {
                      if (sev === 'Minor') color = 'bg-amber-500 text-white border-amber-500 shadow-xs';
                      if (sev === 'Major') color = 'bg-orange-600 text-white border-orange-600 shadow-xs';
                      if (sev === 'Critical') color = 'bg-rose-600 text-white border-rose-600 shadow-xs';
                    }
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => updateFindingField('severity', sev)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${color}`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prominent Alert Routing Display */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                      ⚠️ Alert will be routed to:
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                      EmailJS Alert Routing
                    </span>
                  </div>
                  {currentQ.suggestedAssignees && currentQ.suggestedAssignees.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentQ.suggestedAssignees.map((assignee, aIdx) => (
                        <div
                          key={`${assignee.email}-${aIdx}`}
                          className="px-2.5 py-1 bg-white border border-rose-200 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-reckitt-pink shrink-0"></span>
                          <strong className="text-slate-900 font-bold">{assignee.name}</strong>
                          <span className="text-[11px] font-mono text-slate-500">({assignee.email})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">
                      Central Plant Operations &amp; Safety Administrator
                    </span>
                  )}
                </div>
              </div>

              {/* Observation & Hazard Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    Finding Observation &amp; Hazard Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-rose-600">Required before submit</span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe exactly what was observed (exact location, equipment tag, condition, safety/quality risk)..."
                  value={currentFinding.description}
                  onChange={(e) => updateFindingField('description', e.target.value)}
                  className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                ></textarea>
              </div>

              {/* Inspection Evidence Photos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Inspection Evidence Photos <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {currentFinding.photos.length} photo(s) attached
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Take Photo */}
                  <button
                    type="button"
                    onClick={() => setShowCameraSimulation(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-reckitt-pink" />
                    Take Photo (Camera)
                  </button>

                  {/* Upload from Gallery */}
                  <label className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-reckitt-navy" />
                    Upload from Gallery
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {currentFinding.photos.length === 0 && (
                    <span className="text-xs text-amber-800 font-medium italic">
                      At least 1 photo required
                    </span>
                  )}
                </div>

                {/* Photo Previews */}
                {currentFinding.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {currentFinding.photos.map((p) => (
                      <div
                        key={p.id}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video shadow-xs"
                      >
                        <img
                          src={p.dataUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 p-1 text-[9px] text-white truncate text-center">
                          {p.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Action */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Suggested Action (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule maintenance repair, replace worn gasket, replace pallet..."
                  value={currentFinding.suggestedAction || ''}
                  onChange={(e) => updateFindingField('suggestedAction', e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Status info & quick next */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              {currentAnswer ? (
                <>
                  Answered: <strong className="text-slate-900">{currentAnswer}</strong>
                </>
              ) : (
                'Select YES, NO or N/A above'
              )}
            </span>

            {!isLastQuestion && (
              <button
                type="button"
                onClick={handleNext}
                disabled={hasNoWithoutPhoto}
                className={`font-bold flex items-center gap-1 transition ${
                  hasNoWithoutPhoto
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-reckitt-pink hover:text-reckitt-pink-hover cursor-pointer'
                }`}
                title={hasNoWithoutPhoto ? 'Attach at least 1 photo before proceeding' : ''}
              >
                Next (Q{currentIndex + 2})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-2.5 rounded-xl border transition ${
              currentIndex === 0
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            Save
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={hasNoWithoutPhoto}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition shadow-xs ${
              hasNoWithoutPhoto
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-reckitt-pink hover:bg-reckitt-pink-hover text-white cursor-pointer'
            }`}
            title={hasNoWithoutPhoto ? 'Photo upload is strictly mandatory when answering No' : ''}
          >
            {isLastQuestion ? 'Review & Submit' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Camera Capture Simulation Modal */}
      {showCameraSimulation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-reckitt-pink" />
                <h3 className="font-bold text-slate-900 text-base">Capture Inspection Evidence</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraSimulation(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Select or capture inspection photo evidence for <strong>{currentFinding?.id}</strong>:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleAddSamplePhoto('machinery')}
                className="p-3 rounded-xl border border-slate-200 hover:border-reckitt-pink hover:bg-pink-50/50 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition"
              >
                <span>Machinery / Equipment Guarding Issue</span>
                <span className="text-[10px] text-reckitt-pink font-mono">Capture</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddSamplePhoto('leak')}
                className="p-3 rounded-xl border border-slate-200 hover:border-reckitt-pink hover:bg-pink-50/50 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition"
              >
                <span>Chemical / Fluid Spill or Slip Hazard</span>
                <span className="text-[10px] text-reckitt-pink font-mono">Capture</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddSamplePhoto('hazard')}
                className="p-3 rounded-xl border border-slate-200 hover:border-reckitt-pink hover:bg-pink-50/50 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition"
              >
                <span>Blocked Fire Exit / Walkway Hazard</span>
                <span className="text-[10px] text-reckitt-pink font-mono">Capture</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowCameraSimulation(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
