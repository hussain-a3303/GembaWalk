import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  RotateCcw,
  Edit2,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question } from '../../types/gemba';

interface WorkbookSourceViewProps {
  questions: Question[];
  onImportQuestions: (questions: Question[]) => void;
  onResetToSeed: () => void;
}

export const WorkbookSourceView: React.FC<WorkbookSourceViewProps> = ({
  questions,
  onImportQuestions,
  onResetToSeed,
}) => {
  const [selectedSheetFilter, setSelectedSheetFilter] = useState('All Sheets');

  // Stats
  const totalQuestions = questions.length;
  const uniqueAreas = Array.from(new Set(questions.map((q) => q.area))).length;
  const uniqueSubAreas = Array.from(new Set(questions.map((q) => q.subArea))).length;

  const safetyCount = questions.filter((q) => q.category === 'Safety').length;
  const qualityCount = questions.filter((q) => q.category === 'Quality').length;
  const fiveSCount = questions.filter((q) => q.category === '5S').length;
  const rpsCount = questions.filter((q) => q.category === 'RPS').length;

  // Sheets
  const sheetNames = Array.from(
    new Set(questions.map((q) => q.sourceSheet || 'Questionnaire (2)'))
  );

  const filteredQuestions = questions.filter((q) => {
    if (selectedSheetFilter !== 'All Sheets') {
      const sheet = q.sourceSheet || 'Questionnaire (2)';
      if (sheet !== selectedSheetFilter) return false;
    }
    return true;
  });

  const handleDownloadTemplate = (mode: 'questions' | 'combined') => {
    const wsData = [
      ['ID', 'Area', 'Sub-Area', 'Category', 'Heading', 'Question Text', 'Finding Answer', 'Suggested Assignees'],
      ['IMP-Q-1', 'Warehouse', 'Household Warehouse', 'Safety', 'Safety', 'Is the staff wearing required PPEs?', 'No', 'syed.sameeruddin@reckitt.com'],
      ['IMP-Q-2', 'Production', 'Household Healthcare', 'Quality', 'Quality', 'Are calibration records verified?', 'No', 'hamid.mehmood@reckitt.com'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, mode === 'combined' ? 'gemba_peoples_and_questions.xlsx' : 'gemba_questions_template.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length > 1) {
          const imported: Question[] = [];
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 4) continue;
            imported.push({
              id: String(r[0] || `IMP-Q-${i}`),
              seq: i,
              area: String(r[1] || 'Warehouse'),
              subArea: String(r[2] || 'Household Warehouse'),
              category: (r[3] as Question['category']) || 'Safety',
              heading: String(r[4] || r[3] || 'Safety'),
              questionText: String(r[5] || 'Inspection question text'),
              findingAnswer: 'No',
              findingTrigger: 'Answer : No',
              active: true,
              sourceRow: i + 1,
              sourceSheet: sheetName,
            });
          }
          if (imported.length > 0) {
            onImportQuestions(imported);
          }
        }
      } catch (err) {
        console.error('Failed to import Excel questions', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Workbook Master Checklists
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Source of Truth
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Preserved workbook sheet and row references, finding trigger answers, and suggested assignees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import Excel (.xlsx)
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => handleDownloadTemplate('combined')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Peoples &amp; Questions Template
            </button>

            <button
              type="button"
              onClick={() => handleDownloadTemplate('questions')}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Questions Template
            </button>

            <button
              type="button"
              onClick={onResetToSeed}
              className="px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition"
              title="Reset all questions and visits to original workbook seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* 4 Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Total Questions</span>
            <div className="text-2xl font-black text-slate-900">{totalQuestions}</div>
            <span className="text-[10px] text-blue-600 font-semibold">Preserved row refs</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Primary Areas</span>
            <div className="text-2xl font-black text-slate-900">{uniqueAreas}</div>
            <span className="text-[10px] text-purple-600 font-semibold">
              {uniqueSubAreas} Sub-areas mapped
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Finding Triggers</span>
            <div className="text-base sm:text-lg font-black text-slate-900">
              <span className="text-rose-600">{totalQuestions} &apos;No&apos;</span> •{' '}
              <span className="text-slate-500">0 &apos;Yes&apos;</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">Configurable triggers</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Categories</span>
            <div className="text-xs font-bold text-slate-800">
              Safety({safetyCount}), 5S({fiveSCount})
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">
              Quality({qualityCount}), RPS({rpsCount})
            </span>
          </div>
        </div>

        {/* Sheet breakdown row */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Workbook Sheet Breakdown:</span>
          <div className="flex flex-wrap items-center gap-2">
            {sheetNames.map((name) => (
              <div
                key={name}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center gap-2"
              >
                <span>{name}</span>
                <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {questions.filter((q) => (q.sourceSheet || 'Questionnaire (2)') === name).length} Qs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Imported Questions Table
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filter Sheet:</span>
            <select
              value={selectedSheetFilter}
              onChange={(e) => setSelectedSheetFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option>All Sheets ({questions.length})</option>
              {sheetNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">ID / REF</th>
                <th className="py-3 px-4">Sheet</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Question Text</th>
                <th className="py-3 px-4">Finding Trigger</th>
                <th className="py-3 px-4">Suggested Assignees</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredQuestions.slice(0, 100).map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono">
                    <strong className="text-slate-900 block">{q.id}</strong>
                    <span className="text-[10px] text-slate-400">Row {q.sourceRow || q.seq}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {q.sourceSheet || 'Questionnaire (2)'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {q.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-sm font-medium text-slate-900">
                    {q.questionText}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      Answer : {q.findingAnswer || 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[11px]">
                    {q.suggestedAssignees && q.suggestedAssignees.length > 0 ? (
                      <div className="space-y-0.5">
                        {q.suggestedAssignees.slice(0, 3).map((a, i) => (
                          <div key={i} className="truncate">
                            <strong className="text-slate-800">{a.name}</strong>{' '}
                            <span className="text-slate-400">({a.email})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Central Administrator</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                      title="Edit reference"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
