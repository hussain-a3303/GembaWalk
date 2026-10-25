import React, { useState, useRef } from 'react';
import {
  Search,
  Download,
  Upload,
  UserPlus,
  Building,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Edit2,
  FileSpreadsheet,
  Check,
  Layers,
  Shield,
  Briefcase,
  MapPin,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Person } from '../../types/gemba';
import { PLANT_STRUCTURE } from '../inspector/StartWalkView';
import { generatePersonId } from '../../utils/gembaLogic';

interface PeoplesViewProps {
  peoples: Person[];
  onAddPerson: (person: Person) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
  onImportPeoples: (peoples: Person[]) => void;
  onBulkDeletePeoples?: (ids: string[]) => void;
}

const DEFAULT_DEPARTMENTS = [
  'Warehouse Operations',
  'Manufacturing',
  'Quality Assurance / QC',
  'EHS & Safety',
  'Engineering & Utilities',
  'Supply Chain & Logistics',
];

export const PeoplesView: React.FC<PeoplesViewProps> = ({
  peoples,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onImportPeoples,
  onBulkDeletePeoples,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'directory' | 'verified'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('All Areas');

  // Selected item IDs for bulk operations in directory
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [assignModalData, setAssignModalData] = useState<{
    area: string;
    subArea?: string;
  } | null>(null);

  // Form states for Add / Edit Person with Multi-Department & Multi-Zone
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Area Concern Lead');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['Warehouse Operations']);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Warehouse']);
  const [selectedSubAreas, setSelectedSubAreas] = useState<string[]>(['Household Warehouse']);
  const [isLead, setIsLead] = useState(true);

  // Hidden file input ref & notifications
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Open modal for new person
  const openAddModal = () => {
    setEditingPerson(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Area Concern Lead');
    setSelectedDepts(['Warehouse Operations']);
    setSelectedAreas(['Warehouse']);
    setSelectedSubAreas(['Household Warehouse']);
    setIsLead(true);
    setIsModalOpen(true);
  };

  // Open modal for editing existing person
  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setFormName(person.name);
    setFormEmail(person.email);
    setFormRole(person.role || 'Area Concern Lead');

    // Normalize departments
    const depts = person.departments && person.departments.length > 0
      ? person.departments
      : person.department
      ? person.department.split(',').map((d) => d.trim()).filter(Boolean)
      : ['Warehouse Operations'];
    setSelectedDepts(depts);

    // Normalize areas
    const areas = person.areas && person.areas.length > 0
      ? person.areas
      : person.area
      ? [person.area]
      : ['Warehouse'];
    setSelectedAreas(areas);

    // Normalize sub-areas
    const subAreas = person.subAreas && person.subAreas.length > 0
      ? person.subAreas
      : person.subArea
      ? [person.subArea]
      : [];
    setSelectedSubAreas(subAreas);

    setIsLead(person.isLead !== false);
    setIsModalOpen(true);
  };

  // Toggle department checkbox
  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  // Toggle area checkbox
  const toggleArea = (area: string) => {
    setSelectedAreas((prev) => {
      const exists = prev.includes(area);
      const next = exists ? prev.filter((a) => a !== area) : [...prev, area];
      // If adding area, auto-select its first sub-area if none selected
      if (!exists && PLANT_STRUCTURE[area]?.[0]) {
        setSelectedSubAreas((curr) => Array.from(new Set([...curr, PLANT_STRUCTURE[area][0]])));
      }
      return next;
    });
  };

  // Toggle sub-area checkbox
  const toggleSubArea = (subArea: string) => {
    setSelectedSubAreas((prev) =>
      prev.includes(subArea) ? prev.filter((s) => s !== subArea) : [...prev, subArea]
    );
  };

  // Save Person (Add or Update)
  const handleSavePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const primaryArea = selectedAreas[0] || 'Warehouse';
    const primarySubArea = selectedSubAreas[0] || '';
    const primaryDept = selectedDepts.join(', ') || 'Operations';

    if (editingPerson) {
      const updated: Person = {
        ...editingPerson,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole.trim(),
        department: primaryDept,
        departments: selectedDepts,
        area: primaryArea,
        areas: selectedAreas,
        subArea: primarySubArea,
        subAreas: selectedSubAreas,
        isLead,
      };
      onUpdatePerson(updated);
    } else {
      const newPerson: Person = {
        id: generatePersonId(peoples),
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole.trim(),
        department: primaryDept,
        departments: selectedDepts,
        area: primaryArea,
        areas: selectedAreas,
        subArea: primarySubArea,
        subAreas: selectedSubAreas,
        isLead,
      };
      onAddPerson(newPerson);
    }

    setIsModalOpen(false);
    setEditingPerson(null);
  };

  // Template Download for Peoples
  const handleDownloadTemplate = () => {
    const templateData = [
      ['ID', 'NAME', 'EMAIL', 'ROLE', 'DEPARTMENTS', 'AREAS', 'SUB-AREAS', 'IS_LEAD'],
      [
        'PER-001',
        'Jane Doe',
        'jane.doe@company.com',
        'Household Warehouse Lead',
        'Warehouse Operations, Supply Chain & Logistics',
        'Warehouse',
        'Household Warehouse, Healthcare Warehouse',
        'Yes',
      ],
      [
        'PER-002',
        'Alex Rivera',
        'alex.rivera@company.com',
        'Safety & Compliance Officer',
        'EHS & Safety, Manufacturing',
        'Warehouse, Production',
        'Household Warehouse, Household Healthcare',
        'Yes',
      ],
      [
        'PER-003',
        'Sarah Khan',
        'sarah.khan@company.com',
        'Quality Assurance Specialist',
        'Quality Assurance / QC',
        'Labs, Production',
        'QC Chemistry, Household Healthcare',
        'Yes',
      ],
      [
        'PER-004',
        'Michael Chang',
        'michael.chang@company.com',
        'Plant Engineering Lead',
        'Engineering & Utilities',
        'Utilities',
        'Boilers, HVAC & Water Treatment',
        'Yes',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personnel_Template');
    XLSX.writeFile(wb, 'Reckitt_Personnel_Upload_Template.xlsx');
  };

  // Export All Personnel to Excel
  const handleExportAllPeoples = () => {
    const exportData = peoples.map((p) => {
      const depts = p.departments?.length ? p.departments.join(', ') : p.department;
      const areas = p.areas?.length ? p.areas.join(', ') : p.area || '';
      const subAreas = p.subAreas?.length ? p.subAreas.join(', ') : p.subArea || '';

      return {
        'Person ID': p.id,
        'Full Name': p.name,
        'Email Address': p.email,
        'Role Title': p.role,
        'Assigned Departments': depts,
        'Assigned Areas': areas,
        'Assigned Sub-Areas': subAreas,
        'Lead Status': p.isLead !== false ? 'Yes' : 'No',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personnel');
    XLSX.writeFile(
      wb,
      `Reckitt_Personnel_Directory_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Upload Spreadsheet (Supports multi-department and multi-area columns)
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
        const nameCol = headerRow.findIndex((h) => h.includes('NAME'));
        const emailCol = headerRow.findIndex((h) => h.includes('EMAIL'));
        const roleCol = headerRow.findIndex((h) => h.includes('ROLE'));
        const deptCol = headerRow.findIndex((h) => h.includes('DEPT'));
        const areaCol = headerRow.findIndex((h) => h === 'AREA' || h.includes('AREA'));
        const subAreaCol = headerRow.findIndex((h) => h.includes('SUB'));
        const leadCol = headerRow.findIndex((h) => h.includes('LEAD'));

        const imported: Person[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Simple 2-column or 3-column fallback format
          if (row.length === 2 && !headerRow.some((h) => h.includes('ROLE'))) {
            const area = String(row[0] || '').trim();
            const emails = String(row[1] || '').split(/[,;]/);
            for (const email of emails) {
              const cleanEmail = email.trim();
              if (cleanEmail && cleanEmail.includes('@')) {
                imported.push({
                  id: generatePersonId([...peoples, ...imported]),
                  name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
                  email: cleanEmail,
                  role: `${area} Concern Lead`,
                  department: area,
                  departments: [area],
                  area,
                  areas: [area],
                  subArea: PLANT_STRUCTURE[area]?.[0] || '',
                  subAreas: PLANT_STRUCTURE[area] ? [PLANT_STRUCTURE[area][0]] : [],
                  isLead: true,
                });
              }
            }
          } else {
            const email = emailCol >= 0 ? String(row[emailCol] || '').trim() : String(row[2] || '').trim();
            if (!email || !email.includes('@')) continue;

            const name = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : email.split('@')[0].replace(/[._]/g, ' ');
            const role = roleCol >= 0 && row[roleCol] ? String(row[roleCol]).trim() : 'Area Concern Lead';
            const rawDepts = deptCol >= 0 && row[deptCol] ? String(row[deptCol]).trim() : 'Operations';
            const rawAreas = areaCol >= 0 && row[areaCol] ? String(row[areaCol]).trim() : 'Warehouse';
            const rawSubAreas = subAreaCol >= 0 && row[subAreaCol] ? String(row[subAreaCol]).trim() : '';
            const isLeadVal = leadCol >= 0 && row[leadCol] ? String(row[leadCol]).trim().toLowerCase() !== 'no' : true;

            const parsedDepts = rawDepts.split(/[,;]/).map((d) => d.trim()).filter(Boolean);
            const parsedAreas = rawAreas.split(/[,;]/).map((a) => a.trim()).filter(Boolean);
            const parsedSubAreas = rawSubAreas.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

            const assignedId = idCol >= 0 && row[idCol] && !peoples.some(p => p.id === String(row[idCol]).trim())
              ? String(row[idCol]).trim()
              : generatePersonId([...peoples, ...imported]);

            imported.push({
              id: assignedId,
              name,
              email,
              role,
              department: rawDepts,
              departments: parsedDepts.length ? parsedDepts : [rawDepts],
              area: parsedAreas[0] || 'Warehouse',
              areas: parsedAreas.length ? parsedAreas : ['Warehouse'],
              subArea: parsedSubAreas[0] || '',
              subAreas: parsedSubAreas,
              isLead: isLeadVal,
            });
          }
        }

        if (imported.length > 0) {
          onImportPeoples(imported);
          setImportNotification(`Successfully imported ${imported.length} personnel record(s) with multi-zone routing.`);
          setTimeout(() => setImportNotification(null), 5000);
        } else {
          alert('No valid personnel records found in file.');
        }
      } catch (err) {
        console.error('Failed to parse personnel spreadsheet', err);
        alert('Could not parse Excel/CSV file. Please check file format.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered personnel for Directory table
  const filteredPeoples = peoples.filter((p) => {
    if (selectedAreaFilter !== 'All Areas') {
      const inAreas = p.areas && p.areas.includes(selectedAreaFilter);
      const inArea = p.area === selectedAreaFilter;
      if (!inAreas && !inArea) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.departments?.some((d) => d.toLowerCase().includes(q)) ||
        (p.area && p.area.toLowerCase().includes(q)) ||
        p.areas?.some((a) => a.toLowerCase().includes(q)) ||
        (p.subArea && p.subArea.toLowerCase().includes(q)) ||
        p.subAreas?.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Bulk Selection Handlers for Directory
  const isAllSelected =
    filteredPeoples.length > 0 && filteredPeoples.every((p) => selectedIds.has(p.id));
  const isPartiallySelected =
    filteredPeoples.length > 0 &&
    filteredPeoples.some((p) => selectedIds.has(p.id)) &&
    !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredPeoples.forEach((p) => next.add(p.id));
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
        `Are you sure you want to delete ${selectedIds.size} selected personnel record(s)? This action cannot be undone.`
      )
    ) {
      const ids = Array.from(selectedIds);
      if (onBulkDeletePeoples) {
        onBulkDeletePeoples(ids);
      } else {
        ids.forEach((id) => onDeletePerson(id));
      }
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-5">
      {/* Hidden file input for bulk upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
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

      {/* Action Bar & Subtabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Personnel &amp; Multi-Zone Assignment Directory
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-reckitt-pink-light text-reckitt-pink border border-reckitt-pink/20 uppercase tracking-wider">
                Multi-Department Enabled
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Assign single personnel to multiple plant zones, manufacturing lines, and operations departments simultaneously.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Template
            </button>

            <button
              type="button"
              onClick={handleExportAllPeoples}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Export all personnel to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export All
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Import spreadsheet with multi-zone columns"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Bulk
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="px-3.5 py-1.5 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Person
            </button>
          </div>
        </div>

        {/* Subtabs switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 pt-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'matrix'
                ? 'border-reckitt-pink text-reckitt-pink'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sub-Area Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'directory'
                ? 'border-reckitt-pink text-reckitt-pink'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Personnel Directory ({peoples.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('verified')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'verified'
                ? 'border-reckitt-pink text-reckitt-pink'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Verified Compliance Roster
          </button>
        </div>
      </div>

      {/* Floating Action Bar when items are selected in directory */}
      {selectedIds.size > 0 && activeSubTab === 'directory' && (
        <div className="sticky top-4 z-30 bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-reckitt-pink text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100">
              {selectedIds.size} personnel record{selectedIds.size === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
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

      {/* Directory Search & Filters */}
      {activeSubTab === 'directory' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search personnel by name, email, department, or assigned zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-reckitt-pink transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Filter Area:</span>
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Areas</option>
              {Object.keys(PLANT_STRUCTURE).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Subtab 1: Plant Sub-Area Matrix with Multi-Zone Assignment Support */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {Object.entries(PLANT_STRUCTURE).map(([area, subAreas]) => {
            // Find all people that match this area in their single area or areas array
            const areaPeoples = peoples.filter(
              (p) => p.area === area || (Array.isArray(p.areas) && p.areas.includes(area))
            );

            return (
              <div
                key={area}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-reckitt-pink-light text-reckitt-pink flex items-center justify-center font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{area} Plant Zone</h4>
                      <span className="text-xs text-slate-500">{subAreas.length} Sub-Areas</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-reckitt-navy bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {areaPeoples.length} Active Concern Lead{areaPeoples.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subAreas.map((sub) => {
                    // Check if person matches this sub-area in subAreas array, subArea string, or area level
                    const subLeads = peoples.filter((p) => {
                      const matchesSub =
                        p.subArea === sub ||
                        (Array.isArray(p.subAreas) && p.subAreas.includes(sub));
                      const matchesAreaOnly =
                        (p.area === area || (Array.isArray(p.areas) && p.areas.includes(area))) &&
                        (!p.subArea && (!p.subAreas || p.subAreas.length === 0));
                      return matchesSub || matchesAreaOnly;
                    });

                    return (
                      <div
                        key={sub}
                        className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800">{sub}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {subLeads.length} Lead{subLeads.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {subLeads.length === 0 ? (
                            <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              <span>No designated lead assigned</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {subLeads.map((lead) => (
                                <div
                                  key={lead.id}
                                  className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs hover:border-reckitt-pink/30 transition"
                                >
                                  <div>
                                    <strong className="text-slate-900 block font-semibold">
                                      {lead.name}
                                    </strong>
                                    <span className="text-[10px] text-slate-500 font-mono block">
                                      {lead.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(lead)}
                                      className="text-slate-400 hover:text-reckitt-navy p-1 transition"
                                      title="Edit assignments"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeletePerson(lead.id)}
                                      className="text-slate-300 hover:text-rose-500 p-1 transition"
                                      title="Unassign lead"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setAssignModalData({ area, subArea: sub })}
                          className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-reckitt-pink flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Assign Concern Lead
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab 2: Personnel Directory Table with Multi-Department & Multi-Area Badges */}
      {activeSubTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900">
              Registered Personnel Directory ({filteredPeoples.length})
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Click &ldquo;Edit&rdquo; to modify multi-department or multi-area assignments.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
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
                  <th className="py-3 px-3">Person ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Departments</th>
                  <th className="py-3 px-4">Plant Areas</th>
                  <th className="py-3 px-4">Sub-Areas</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPeoples.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No personnel records match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredPeoples.map((person) => {
                    const isSelected = selectedIds.has(person.id);
                    const depts = person.departments?.length
                      ? person.departments
                      : person.department
                      ? [person.department]
                      : ['Operations'];
                    const areas = person.areas?.length
                      ? person.areas
                      : person.area
                      ? [person.area]
                      : [];
                    const subAreas = person.subAreas?.length
                      ? person.subAreas
                      : person.subArea
                      ? [person.subArea]
                      : [];

                    return (
                      <tr
                        key={person.id}
                        className={`transition ${
                          isSelected ? 'bg-reckitt-pink-light/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRow(person.id)}
                            className="p-1 text-slate-400 hover:text-reckitt-pink transition cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-reckitt-pink" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-reckitt-pink">
                          {person.id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{person.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{person.email}</td>
                        <td className="py-3.5 px-4">{person.role}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {depts.map((d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {areas.map((a) => (
                              <span
                                key={a}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-reckitt-pink-light text-reckitt-pink border border-reckitt-pink/20"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {subAreas.length > 0 ? (
                              subAreas.map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">All Sub-Areas</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(person)}
                              className="p-1.5 text-slate-400 hover:text-reckitt-navy hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Personnel Assignments"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePerson(person.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Person"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Verified Roster */}
      {activeSubTab === 'verified' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Verified Compliance Roster
              </h3>
              <p className="text-xs text-slate-500">
                Pre-approved personnel accounts for automated multi-recipient EmailJS incident routing.
              </p>
            </div>
            <span className="text-xs font-bold text-reckitt-pink bg-reckitt-pink-light px-3 py-1 rounded-full border border-reckitt-pink/20">
              Verified Accounts Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                name: 'Operations Lead',
                email: 'operations.lead@company.com',
                depts: ['Warehouse Operations', 'Supply Chain & Logistics'],
                areas: ['Warehouse'],
                subAreas: ['Household Warehouse', 'Healthcare Warehouse'],
              },
              {
                name: 'Sarah Khan',
                email: 'sarah.khan@company.com',
                depts: ['Warehouse Operations'],
                areas: ['Warehouse'],
                subAreas: ['Healthcare Warehouse'],
              },
              {
                name: 'Safety Officer',
                email: 'safety.officer@company.com',
                depts: ['EHS & Safety'],
                areas: ['Warehouse', 'Production', 'Labs', 'Utilities'],
                subAreas: ['Household Warehouse', 'Healthcare Warehouse', 'Household Healthcare'],
              },
              {
                name: 'Production Lead',
                email: 'production.lead@company.com',
                depts: ['Manufacturing'],
                areas: ['Production'],
                subAreas: ['Household Healthcare', 'Aerosols'],
              },
              {
                name: 'Logistics Supervisor',
                email: 'logistics.lead@company.com',
                depts: ['Supply Chain & Logistics'],
                areas: ['Warehouse'],
                subAreas: ['DGRM Warehouse'],
              },
              {
                name: 'Quality Manager',
                email: 'quality.lead@company.com',
                depts: ['Quality Assurance / QC'],
                areas: ['Labs', 'Production'],
                subAreas: ['QC Chemistry', 'Household Healthcare'],
              },
            ].map((usr, i) => (
              <div
                key={i}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-reckitt-pink/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <strong className="text-xs font-bold text-slate-900">{usr.name}</strong>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block">{usr.email}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {usr.depts.map((d) => (
                      <span key={d} className="text-[9px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onAddPerson({
                      id: generatePersonId(peoples),
                      name: usr.name,
                      email: usr.email,
                      role: 'Designated Concern Lead',
                      department: usr.depts.join(', '),
                      departments: usr.depts,
                      area: usr.areas[0] || 'Warehouse',
                      areas: usr.areas,
                      subArea: usr.subAreas[0] || '',
                      subAreas: usr.subAreas,
                      isLead: true,
                    });
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-reckitt-pink-light border border-slate-200 hover:border-reckitt-pink/30 text-reckitt-pink font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs shrink-0"
                >
                  Set Lead
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirement 3 Modal: Add / Edit Person with Multi-Select Checkboxes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingPerson ? `Edit Personnel: ${editingPerson.id}` : 'Add New Personnel'}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign multiple departments, plant areas, and sub-areas for multi-zone alert routing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPerson(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-reckitt-pink font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane.doe@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-reckitt-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Area Concern Lead / EHS Specialist"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-reckitt-pink font-medium"
                />
              </div>

              {/* Multi-Select Checkboxes: Assigned Departments */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    Assigned Departments (Multi-Select Checkboxes) *
                  </label>
                  <span className="text-[11px] font-bold text-reckitt-pink">
                    {selectedDepts.length} Selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_DEPARTMENTS.map((dept) => {
                    const checked = selectedDepts.includes(dept);
                    return (
                      <label
                        key={dept}
                        onClick={() => toggleDept(dept)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                          checked
                            ? 'bg-white border-reckitt-pink text-reckitt-navy shadow-2xs font-bold'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                            checked
                              ? 'bg-reckitt-pink border-reckitt-pink text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Select Checkboxes: Plant Areas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    Assigned Plant Areas (Multi-Select Checkboxes) *
                  </label>
                  <span className="text-[11px] font-bold text-reckitt-pink">
                    {selectedAreas.length} Selected
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.keys(PLANT_STRUCTURE).map((area) => {
                    const checked = selectedAreas.includes(area);
                    return (
                      <label
                        key={area}
                        onClick={() => toggleArea(area)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition select-none ${
                          checked
                            ? 'bg-white border-reckitt-pink text-reckitt-navy shadow-2xs font-bold'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                            checked
                              ? 'bg-reckitt-pink border-reckitt-pink text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{area}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Select Checkboxes: Sub-Areas across selected areas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    Assigned Sub-Areas (Multi-Select Checkboxes)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {selectedSubAreas.length} Active Zones
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select which specific rooms, production lines, or warehouses this person manages:
                </p>

                <div className="space-y-3 pt-1">
                  {selectedAreas.map((area) => {
                    const subList = PLANT_STRUCTURE[area] || [];
                    return (
                      <div key={area} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">
                          {area} Sub-Areas:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {subList.map((sub) => {
                            const checked = selectedSubAreas.includes(sub);
                            return (
                              <label
                                key={sub}
                                onClick={() => toggleSubArea(sub)}
                                className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition select-none ${
                                  checked
                                    ? 'bg-emerald-50/70 border-emerald-400 text-emerald-900 font-semibold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition shrink-0 ${
                                    checked
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="truncate">{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Is Lead Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isLead}
                  onChange={(e) => setIsLead(e.target.checked)}
                  className="rounded text-reckitt-pink focus:ring-reckitt-pink"
                />
                <span className="font-bold text-slate-700">
                  Designate as Primary Concern Lead (Receives priority incident notifications)
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPerson(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingPerson ? 'Update Personnel' : 'Save Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Assign Concern Lead to Area / Sub-area from Matrix */}
      {assignModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Assign Lead for {assignModalData.subArea || assignModalData.area}
                </h3>
                <span className="text-xs text-slate-500">
                  Select registered personnel to link to this zone
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {peoples.map((person) => {
                  const alreadyAssigned =
                    (person.subAreas && person.subAreas.includes(assignModalData.subArea || '')) ||
                    person.subArea === assignModalData.subArea;

                  return (
                    <div
                      key={person.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100 transition"
                    >
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          {person.name}
                        </strong>
                        <span className="text-[11px] font-mono text-slate-500 block">
                          {person.email}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {person.departments?.join(', ') || person.department}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const existingSubAreas = person.subAreas || (person.subArea ? [person.subArea] : []);
                          const existingAreas = person.areas || (person.area ? [person.area] : []);
                          const targetSub = assignModalData.subArea;
                          const targetArea = assignModalData.area;

                          const updatedSubAreas = targetSub && !existingSubAreas.includes(targetSub)
                            ? [...existingSubAreas, targetSub]
                            : existingSubAreas;
                          const updatedAreas = targetArea && !existingAreas.includes(targetArea)
                            ? [...existingAreas, targetArea]
                            : existingAreas;

                          onUpdatePerson({
                            ...person,
                            areas: updatedAreas,
                            area: updatedAreas[0] || person.area,
                            subAreas: updatedSubAreas,
                            subArea: updatedSubAreas[0] || person.subArea,
                            isLead: true,
                          });
                          setAssignModalData(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                          alreadyAssigned
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-reckitt-pink hover:bg-reckitt-pink-hover text-white'
                        }`}
                      >
                        {alreadyAssigned ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAssignModalData(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
