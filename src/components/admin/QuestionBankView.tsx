import React, { useState, useRef } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Power,
  PowerOff,
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  Mail,
  UserPlus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionCategory, Assignee, Person } from '../../types/gemba';
import { PLANT_STRUCTURE } from '../inspector/StartWalkView';
import { generateQuestionId } from '../../utils/gembaLogic';

interface QuestionBankViewProps {
  questions: Question[];
  peoples?: Person[];
  onToggleActive: (id: string) => void;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onBulkDeleteQuestions?: (ids: string[]) => void;
  onBulkSetQuestionsActive?: (ids: string[], active: boolean) => void;
  onImportQuestions?: (newQuestions: Question[]) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  peoples = [],
  onToggleActive,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onBulkDeleteQuestions,
  onBulkSetQuestionsActive,
  onImportQuestions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Selected item IDs for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal for add / edit
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [qText, setQText] = useState('');
  const [qCategory, setQCategory] = useState<QuestionCategory>('Safety');
  const [qArea, setQArea] = useState('Warehouse');
  const [qSubArea, setQSubArea] = useState('Household Warehouse');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Import file ref & banner
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Available unique assignees from peoples + existing questions
  const availableAssignees = React.useMemo(() => {
    const map = new Map<string, Assignee>();
    // Add all registered personnel
    for (const p of peoples) {
      if (p.email && !map.has(p.email.toLowerCase())) {
        map.set(p.email.toLowerCase(), {
          name: p.name,
          email: p.email,
          role: p.role || 'Area Concern Lead',
          department: p.department || p.area || 'Operations',
        });
      }
    }
    // Add any suggested assignees already on questions
    for (const q of questions) {
      if (q.suggestedAssignees) {
        for (const a of q.suggestedAssignees) {
          if (a.email && !map.has(a.email.toLowerCase())) {
            map.set(a.email.toLowerCase(), a);
          }
        }
      }
    }
    return Array.from(map.values());
  }, [peoples, questions]);

  const filtered = questions.filter((q) => {
    if (areaFilter !== 'All Areas' && q.area !== areaFilter) return false;
    if (categoryFilter !== 'All Categories' && q.category !== categoryFilter) return false;
    if (statusFilter === 'Active' && !q.active) return false;
    if (statusFilter === 'Inactive' && q.active) return false;

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const match =
        q.id.toLowerCase().includes(s) ||
        q.questionText.toLowerCase().includes(s) ||
        q.area.toLowerCase().includes(s) ||
        q.subArea.toLowerCase().includes(s) ||
        q.category.toLowerCase().includes(s) ||
        q.suggestedAssignees?.some(
          (a) =>
            a.email.toLowerCase().includes(s) ||
            a.name.toLowerCase().includes(s)
        );
      if (!match) return false;
    }
    return true;
  });

  // Bulk Selection Handlers
  const isAllSelected = filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));
  const isPartiallySelected =
    filtered.length > 0 &&
    filtered.some((q) => selectedIds.has(q.id)) &&
    !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filtered.forEach((q) => next.add(q.id));
      setSelectedIds(next);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.size} selected question(s)? This action cannot be undone.`
      )
    ) {
      const ids = Array.from(selectedIds);
      if (onBulkDeleteQuestions) {
        onBulkDeleteQuestions(ids);
      } else {
        ids.forEach((id) => onDeleteQuestion(id));
      }
      setSelectedIds(new Set());
    }
  };

  const handleBulkActivate = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (onBulkSetQuestionsActive) {
      onBulkSetQuestionsActive(ids, true);
    } else {
      ids.forEach((id) => {
        const q = questions.find((item) => item.id === id);
        if (q && !q.active) onToggleActive(id);
      });
    }
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (onBulkSetQuestionsActive) {
      onBulkSetQuestionsActive(ids, false);
    } else {
      ids.forEach((id) => {
        const q = questions.find((item) => item.id === id);
        if (q && q.active) onToggleActive(id);
      });
    }
    setSelectedIds(new Set());
  };

  // Open Edit modal
  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setQText(q.questionText);
    setQCategory(q.category);
    setQArea(q.area);
    setQSubArea(q.subArea);
    setAssignees(q.suggestedAssignees ? [...q.suggestedAssignees] : []);
    setAssigneeSearch('');
    setShowAssigneeDropdown(false);
  };

  // Open Add modal
  const openAdd = () => {
    setEditingQuestion(null);
    setQText('');
    setQCategory('Safety');
    setQArea('Warehouse');
    setQSubArea('Household Warehouse');
    // Pre-populate with area leads for this initial area/subArea if available
    const initialLeads = peoples
      .filter((p) => (p.subArea === 'Household Warehouse' || p.area === 'Warehouse') && p.email)
      .map((p) => ({
        name: p.name,
        email: p.email,
        role: p.role,
        department: p.department || 'Warehouse',
      }));
    setAssignees(initialLeads);
    setAssigneeSearch('');
    setShowAssigneeDropdown(false);
    setIsAddOpen(true);
  };

  // Add assignee chip
  const handleAddAssignee = (assignee: Assignee) => {
    if (!assignee.email) return;
    const exists = assignees.some(
      (a) => a.email.toLowerCase() === assignee.email.toLowerCase()
    );
    if (!exists) {
      setAssignees([...assignees, assignee]);
    }
    setAssigneeSearch('');
    setShowAssigneeDropdown(false);
  };

  // Remove assignee chip
  const handleRemoveAssignee = (emailToRemove: string) => {
    setAssignees(
      assignees.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase())
    );
  };

  // Add custom typed email
  const handleAddCustomEmail = () => {
    const trimmed = assigneeSearch.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    const namePart = trimmed.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    handleAddAssignee({
      name: formattedName || 'Concern Lead',
      email: trimmed,
      role: 'Designated Concern Lead',
      department: qArea,
    });
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    if (editingQuestion) {
      onUpdateQuestion({
        ...editingQuestion,
        questionText: qText,
        category: qCategory,
        area: qArea,
        subArea: qSubArea,
        heading: qCategory,
        suggestedAssignees: assignees,
      });
      setEditingQuestion(null);
    } else {
      const newQ: Question = {
        id: generateQuestionId(questions),
        seq: questions.length + 1,
        area: qArea,
        subArea: qSubArea,
        category: qCategory,
        heading: qCategory,
        questionText: qText,
        findingAnswer: 'No',
        findingTrigger: 'Answer : No',
        active: true,
        version: 'v1.0',
        helpText: `Verify ${qCategory} compliance in ${qArea} > ${qSubArea}.`,
        suggestedAssignees: assignees,
      };
      onAddQuestion(newQ);
      setIsAddOpen(false);
    }
    setQText('');
    setAssignees([]);
  };

  // Template Download for Questions
  const handleDownloadTemplate = () => {
    const templateData = [
      [
        'ID',
        'AREA',
        'SUB-AREA',
        'CATEGORY',
        'HEADING',
        'QUESTION_TEXT',
        'FINDING_TRIGGER',
        'SUGGESTED_ASSIGNEE_EMAILS',
        'ACTIVE',
      ],
      [
        'IMP-Q-001',
        'Warehouse',
        'Household Warehouse',
        'Safety',
        'Safety',
        'Is the staff wearing required PPEs as per the PPE Matrix? (safety shoes, helmets, safety vest)',
        'No',
        'operations.lead@company.com, safety.officer@company.com',
        'Yes',
      ],
      [
        'IMP-Q-002',
        'Warehouse',
        'Healthcare Warehouse',
        'Safety',
        'Safety',
        'Are pedestrian walkways and forklift pathways clear of physical obstructions?',
        'No',
        'warehouse.health@company.com',
        'Yes',
      ],
      [
        'IMP-Q-003',
        'Production',
        'Household Healthcare',
        'Quality',
        'Quality',
        'Are batch line clearance checklists signed and verified prior to production startup?',
        'No',
        'quality.lead@company.com, production.lead@company.com',
        'Yes',
      ],
      [
        'IMP-Q-004',
        'Labs',
        'QC Chemistry',
        '5S',
        '5S',
        'Are chemical reagents stored strictly in designated flammables and acid cabinets?',
        'No',
        'qc.chemist@company.com',
        'Yes',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Question_Template');
    XLSX.writeFile(wb, 'Reckitt_Question_Bank_Upload_Template.xlsx');
  };

  // Export All Questions to Excel
  const handleExportAllQuestions = () => {
    const exportRows = questions.map((q) => ({
      'Question ID': q.id,
      'Seq #': q.seq,
      Area: q.area,
      'Sub-Area': q.subArea,
      Category: q.category,
      Heading: q.heading || q.category,
      'Question Text': q.questionText,
      'Finding Trigger': q.findingTrigger || `Answer : ${q.findingAnswer || 'No'}`,
      'Linked Assignees Count': q.suggestedAssignees?.length || 0,
      'Linked Assignee Emails': (q.suggestedAssignees || []).map((a) => a.email).join(', '),
      Status: q.active ? 'Active' : 'Inactive',
      Version: q.version || 'v1.0',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(
      wb,
      `Reckitt_Question_Bank_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Bulk Import Questions from Excel/CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (rows.length <= 1) {
          alert('Spreadsheet is empty or missing data rows.');
          return;
        }

        const headerRow = rows[0].map((h) => String(h || '').trim().toUpperCase());
        const idCol = headerRow.findIndex((h) => h.includes('ID'));
        const areaCol = headerRow.findIndex((h) => h === 'AREA' || h.includes('AREA'));
        const subAreaCol = headerRow.findIndex((h) => h.includes('SUB'));
        const catCol = headerRow.findIndex((h) => h.includes('CAT'));
        const textCol = headerRow.findIndex((h) => h.includes('TEXT') || h.includes('QUESTION'));
        const triggerCol = headerRow.findIndex((h) => h.includes('TRIGGER') || h.includes('ANSWER'));
        const emailCol = headerRow.findIndex((h) => h.includes('EMAIL') || h.includes('ASSIGNEE'));
        const activeCol = headerRow.findIndex((h) => h.includes('ACTIVE') || h.includes('STATUS'));

        const importedQuestions: Question[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const questionText = textCol >= 0 ? String(row[textCol] || '').trim() : String(row[5] || row[1] || '').trim();
          if (!questionText) continue;

          const area = areaCol >= 0 && row[areaCol] ? String(row[areaCol]).trim() : 'Warehouse';
          const subArea = subAreaCol >= 0 && row[subAreaCol] ? String(row[subAreaCol]).trim() : 'Household Warehouse';
          const category = (catCol >= 0 && row[catCol] ? String(row[catCol]).trim() : 'Safety') as QuestionCategory;
          const assignedId = idCol >= 0 && row[idCol] && !questions.some((q) => q.id === String(row[idCol]).trim())
            ? String(row[idCol]).trim()
            : generateQuestionId([...questions, ...importedQuestions]);
          const id = assignedId;
          const trigger = triggerCol >= 0 && row[triggerCol] ? String(row[triggerCol]).trim() : 'Answer : No';
          const activeStr = activeCol >= 0 && row[activeCol] ? String(row[activeCol]).trim().toLowerCase() : 'yes';
          const active = activeStr === 'yes' || activeStr === 'true' || activeStr === '1' || activeStr === 'active';

          // Parse suggested assignees
          const rawEmails = emailCol >= 0 && row[emailCol] ? String(row[emailCol]).split(/[,;]/) : [];
          const parsedAssignees: Assignee[] = [];
          for (const raw of rawEmails) {
            const clean = raw.trim();
            if (clean && clean.includes('@')) {
              const matchedPerson = peoples.find((p) => p.email.toLowerCase() === clean.toLowerCase());
              parsedAssignees.push({
                name: matchedPerson ? matchedPerson.name : clean.split('@')[0].replace(/[._]/g, ' '),
                email: clean,
                role: matchedPerson ? matchedPerson.role : 'Area Concern Lead',
                department: matchedPerson ? matchedPerson.department : area,
              });
            }
          }

          importedQuestions.push({
            id,
            seq: questions.length + importedQuestions.length + 1,
            area,
            subArea,
            category,
            heading: category,
            questionText,
            findingAnswer: 'No',
            findingTrigger: trigger,
            active,
            version: 'v1.0',
            helpText: `Verify ${category} compliance in ${area} > ${subArea}.`,
            suggestedAssignees: parsedAssignees,
          });
        }

        if (importedQuestions.length > 0) {
          if (onImportQuestions) {
            onImportQuestions(importedQuestions);
          } else {
            importedQuestions.forEach((q) => onAddQuestion(q));
          }
          setImportNotification(`Successfully imported ${importedQuestions.length} question(s) with linked assignees.`);
          setTimeout(() => setImportNotification(null), 5000);
        } else {
          alert('No valid questions found in file.');
        }
      } catch (err) {
        console.error('Failed to parse question file:', err);
        alert('Could not parse Excel/CSV file. Please ensure columns match template format.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered assignee suggestions for tag input dropdown
  const filteredAssigneeSuggestions = availableAssignees.filter((a) => {
    if (!assigneeSearch.trim()) return true;
    const q = assigneeSearch.toLowerCase();
    return a.email.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Hidden file input for bulk upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Import Success Banner */}
      {importNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportNotification(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Bar: Template, Export, Import, Add */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-reckitt-pink-light text-reckitt-pink flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Checklist Question Bank &amp; Multi-Recipient Routing
            </h3>
            <p className="text-xs text-slate-500">
              {questions.length} total inspection questions across {Object.keys(PLANT_STRUCTURE).length} plant zones.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Download clean Excel template with exact headers"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download Template
          </button>

          <button
            type="button"
            onClick={handleExportAllQuestions}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Export all questions with linked assignees to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export All
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Import Excel or CSV question sheet"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Bulk
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="px-3.5 py-1.5 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {/* Floating Action Bar when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-reckitt-pink text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100">
              {selectedIds.size} question{selectedIds.size === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleBulkActivate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              Activate Selected
            </button>

            <button
              type="button"
              onClick={handleBulkDeactivate}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5" />
              Deactivate Selected
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search question ID, question text, linked email address, category, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-reckitt-pink transition"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Filter:</span>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Areas</option>
              {Object.keys(PLANT_STRUCTURE).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Categories</option>
              <option>Safety</option>
              <option>Quality</option>
              <option>5S</option>
              <option>RPS</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <span className="text-slate-500 font-medium">
            Showing {filtered.length} of {questions.length} questions
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 text-slate-500 hover:text-reckitt-pink transition cursor-pointer"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-reckitt-pink" />
                    ) : isPartiallySelected ? (
                      <MinusSquare className="w-4 h-4 text-reckitt-pink" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">ID &amp; SEQ</th>
                <th className="py-3 px-3">Area &amp; Sub-Area</th>
                <th className="py-3 px-3">Heading</th>
                <th className="py-3 px-4">Inspection Question Text</th>
                <th className="py-3 px-3">Linked Email Routing</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3">Active</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((q) => {
                const isSelected = selectedIds.has(q.id);
                const hasAssignees = q.suggestedAssignees && q.suggestedAssignees.length > 0;

                return (
                  <tr
                    key={q.id}
                    className={`transition ${
                      isSelected ? 'bg-reckitt-pink-light/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRow(q.id)}
                        className="p-1 text-slate-400 hover:text-reckitt-pink transition cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-reckitt-pink" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      <strong className="text-slate-900 block">{q.id}</strong>
                      <span className="text-[10px] text-slate-400">Seq #{q.seq || 1}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <strong className="text-slate-900 block">{q.area}</strong>
                      <span className="text-[11px] text-slate-500">{q.subArea}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-reckitt-navy/10 text-reckitt-navy border border-reckitt-navy/20">
                        {q.heading || q.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="font-medium text-slate-900 block leading-snug">{q.questionText}</span>
                      {q.helpText && (
                        <span className="text-[10px] text-amber-700 italic flex items-center gap-1 mt-0.5">
                          <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                          {q.helpText}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {hasAssignees ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-reckitt-pink-light text-reckitt-pink border border-reckitt-pink/20">
                            <Mail className="w-3 h-3" />
                            {q.suggestedAssignees!.length} Linked
                          </span>
                          <div className="text-[10px] text-slate-500 max-w-[150px] truncate" title={q.suggestedAssignees!.map(a => a.email).join(', ')}>
                            {q.suggestedAssignees![0]?.email}
                            {q.suggestedAssignees!.length > 1 && ` +${q.suggestedAssignees!.length - 1} more`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Default Area Lead
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {q.findingAnswer || 'No'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => onToggleActive(q.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                          q.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {q.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(q)}
                          className="p-1.5 text-slate-400 hover:text-reckitt-navy hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit Question & Assignees"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Question Modal with Multi-Email Tag-Input Linker */}
      {(isAddOpen || editingQuestion) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingQuestion ? `Edit Question: ${editingQuestion.id}` : 'Create New Checklist Question'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure question details, area zone, and multi-recipient email alert routing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingQuestion(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Is PPE compliant and properly worn by operators in this work area?"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-reckitt-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category &amp; Heading</label>
                  <select
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value as QuestionCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-reckitt-pink"
                  >
                    <option value="Safety">Safety</option>
                    <option value="Quality">Quality</option>
                    <option value="5S">5S</option>
                    <option value="RPS">RPS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plant Area</label>
                  <select
                    value={qArea}
                    onChange={(e) => {
                      setQArea(e.target.value);
                      const subs = PLANT_STRUCTURE[e.target.value] || [];
                      if (subs.length > 0) setQSubArea(subs[0]);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-reckitt-pink"
                  >
                    {Object.keys(PLANT_STRUCTURE).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Sub-Area</label>
                <select
                  value={qSubArea}
                  onChange={(e) => setQSubArea(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-reckitt-pink"
                >
                  {(PLANT_STRUCTURE[qArea] || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requirement 2: Link Emails Directly to suggestedAssignees */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-reckitt-pink" />
                    <label className="font-bold text-slate-800 text-xs">
                      Linked Assignees &amp; Email Alert Recipients
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-reckitt-pink bg-reckitt-pink-light px-2 py-0.5 rounded-full border border-reckitt-pink/20">
                    {assignees.length} Recipient{assignees.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Every linked recipient will individually receive an EmailJS incident dispatch whenever an inspector records a non-compliance (&ldquo;No&rdquo;).
                </p>

                {/* Active Assignee Tags / Chips */}
                {assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {assignees.map((a) => (
                      <span
                        key={a.email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-white border border-slate-300 text-slate-800 shadow-2xs"
                      >
                        <span className="font-semibold">{a.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">({a.email})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(a.email)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Remove recipient"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>No specific assignees linked yet. If left empty, alerts will route to the default Area Lead.</span>
                  </div>
                )}

                {/* Search & Tag-Input Dropdown */}
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search personnel directory or type custom email..."
                        value={assigneeSearch}
                        onFocus={() => setShowAssigneeDropdown(true)}
                        onChange={(e) => {
                          setAssigneeSearch(e.target.value);
                          setShowAssigneeDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomEmail();
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono placeholder:font-sans focus:outline-none focus:border-reckitt-pink"
                      />
                    </div>
                    {assigneeSearch.includes('@') && (
                      <button
                        type="button"
                        onClick={handleAddCustomEmail}
                        className="px-3 py-2 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Email
                      </button>
                    )}
                  </div>

                  {/* Suggestion Dropdown */}
                  {showAssigneeDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {filteredAssigneeSuggestions.length > 0 ? (
                        filteredAssigneeSuggestions.map((a) => {
                          const isAlreadyLinked = assignees.some(
                            (linked) => linked.email.toLowerCase() === a.email.toLowerCase()
                          );
                          return (
                            <button
                              key={a.email}
                              type="button"
                              onClick={() => handleAddAssignee(a)}
                              disabled={isAlreadyLinked}
                              className={`w-full text-left p-2.5 flex items-center justify-between transition cursor-pointer ${
                                isAlreadyLinked
                                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                                  : 'hover:bg-reckitt-pink-light/50 text-slate-800'
                              }`}
                            >
                              <div>
                                <strong className="block text-slate-900">{a.name}</strong>
                                <span className="font-mono text-[11px] text-slate-500">{a.email}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">
                                {isAlreadyLinked ? 'Linked' : a.role || a.department}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-slate-400">
                          {assigneeSearch.includes('@') ? (
                            <button
                              type="button"
                              onClick={handleAddCustomEmail}
                              className="text-reckitt-pink font-bold hover:underline"
                            >
                              Press Enter or click &quot;Add Email&quot; to link &quot;{assigneeSearch}&quot;
                            </button>
                          ) : (
                            'No matching personnel found in directory.'
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingQuestion ? 'Update Question & Routing' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
