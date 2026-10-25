import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  MapPin,
  Tag,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Visit, Finding, Assignee } from '../../types/gemba';

interface AnalyticsDashboardViewProps {
  visits: Visit[];
  findings: Finding[];
  onUpdateFindingStatus: (
    findingId: string,
    status: Finding['status'],
    assignedTo?: Assignee
  ) => void;
}

// Brand palette for charts
const CATEGORY_COLORS: Record<string, string> = {
  Safety: '#E0007E', // Reckitt Pink
  Quality: '#0B1736', // Deep Navy
  RPS: '#6366F1', // Indigo
  Housekeeping: '#0EA5E9', // Sky blue
  Maintenance: '#F59E0B', // Amber
  Environmental: '#10B981', // Emerald
  Compliance: '#8B5CF6', // Purple
  Other: '#64748B', // Slate
};

const AREA_BAR_COLOR = '#E0007E';

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  visits,
  findings,
  onUpdateFindingStatus,
}) => {
  // Date slicer states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Closed'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  // Quick preset helpers
  const handleSetQuickRange = (days: number | 'all' | 'mtd') => {
    if (days === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const endStr = end.toISOString().slice(0, 10);
    setEndDate(endStr);

    if (days === 'mtd') {
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      setStartDate(start.toISOString().slice(0, 10));
    } else {
      const start = new Date();
      start.setDate(end.getDate() - days);
      setStartDate(start.toISOString().slice(0, 10));
    }
  };

  // Filter visits based on date range
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const vDateStr = v.visitDate || v.createdAt;
      if (!vDateStr) return true;
      const vDate = new Date(vDateStr);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (vDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (vDate > end) return false;
      }
      return true;
    });
  }, [visits, startDate, endDate]);

  // Total responses submitted across filtered visits
  const totalResponsesSubmitted = useMemo(() => {
    return filteredVisits.reduce((acc, v) => {
      return acc + Object.keys(v.answers || {}).length;
    }, 0);
  }, [filteredVisits]);

  // Filter findings based on date range
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const fDateStr = f.createdAt;
      if (!fDateStr) return true;
      const fDate = new Date(fDateStr);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (fDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (fDate > end) return false;
      }
      return true;
    });
  }, [findings, startDate, endDate]);

  // Key KPI metrics
  const resolvedCount = filteredFindings.filter((f) => f.status === 'Closed').length;
  const pendingCount = filteredFindings.filter(
    (f) => f.status === 'Open' || f.status === 'In Progress'
  ).length;
  const totalFindings = filteredFindings.length;
  const resolutionRate =
    totalFindings > 0 ? Math.round((resolvedCount / totalFindings) * 100) : 100;

  // Chart Data: Findings by Category for Pie Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of filteredFindings) {
      const cat = f.category || 'Other';
      map[cat] = (map[cat] || 0) + 1;
    }
    const entries = Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
    return entries.sort((a, b) => b.value - a.value);
  }, [filteredFindings]);

  // Chart Data: Findings by Area for Bar Chart
  const areaData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of filteredFindings) {
      const area = f.area || 'Other';
      map[area] = (map[area] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        findings: count,
      }))
      .sort((a, b) => b.findings - a.findings);
  }, [filteredFindings]);

  // Filtered ledger for display
  const ledgerFindings = useMemo(() => {
    return filteredFindings.filter((f) => {
      if (statusFilter !== 'All' && f.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && f.category !== categoryFilter) return false;
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase();
        const match =
          f.id.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.area?.toLowerCase().includes(q) ||
          f.subArea?.toLowerCase().includes(q) ||
          f.questionText?.toLowerCase().includes(q) ||
          f.assignedTo?.name?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filteredFindings, statusFilter, categoryFilter, ledgerSearch]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    findings.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [findings]);

  return (
    <div className="space-y-6">
      {/* Date Filter & Slicer Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-reckitt-pink/10 text-reckitt-pink flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Analytics &amp; Tracking Date Slicer
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-reckitt-pink-light text-reckitt-pink border border-reckitt-pink/20 uppercase tracking-wider">
                  Dynamic Filter
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Filter walk responses, resolved/pending findings, and charts in real time.
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleSetQuickRange('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                !startDate && !endDate
                  ? 'bg-reckitt-pink text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickRange(7)}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickRange(30)}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickRange('mtd')}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Month to Date
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => handleSetQuickRange('all')}
                className="px-3 py-1.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 cursor-pointer"
                title="Reset date slicer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Start / End Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-reckitt-pink"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-reckitt-pink"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <div className="w-full p-2.5 bg-reckitt-pink-light border border-reckitt-pink/20 rounded-xl text-xs text-reckitt-navy font-medium flex items-center justify-between">
              <span>
                Active Slicer Window:{' '}
                <strong>
                  {startDate ? startDate : 'Earliest Recorded'} &rarr; {endDate ? endDate : 'Present'}
                </strong>
              </span>
              <span className="font-bold text-reckitt-pink">
                {filteredVisits.length} Inspection Walk{filteredVisits.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Responses */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Responses
            </span>
            <div className="w-9 h-9 rounded-xl bg-reckitt-navy/10 text-reckitt-navy flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {totalResponsesSubmitted.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span className="font-bold text-reckitt-navy bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredVisits.length} Walks
            </span>
            <span>in selected date window</span>
          </div>
        </div>

        {/* KPI 2: Resolved Findings (Closed) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resolved Findings
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {resolvedCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Closed Status
            </span>
            <span>{resolutionRate}% resolved</span>
          </div>
        </div>

        {/* KPI 3: Pending Findings (Open / In Progress) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Findings
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {pendingCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Open / In Progress
            </span>
            <span>Action required</span>
          </div>
        </div>

        {/* KPI 4: Reckitt Brand Resolution Index */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resolution Index
            </span>
            <div className="w-9 h-9 rounded-xl bg-reckitt-pink/10 text-reckitt-pink flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-reckitt-pink tracking-tight">
            {resolutionRate}%
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-reckitt-pink h-full rounded-full transition-all duration-300"
              style={{ width: `${resolutionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Visual Charts Section using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pie Chart - Findings by Category */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-reckitt-pink/10 text-reckitt-pink flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Findings by Category
                </h4>
                <p className="text-[11px] text-slate-500">Distribution across safety &amp; quality categories</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {categoryData.length} Categories
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
              No findings recorded in this date range.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CATEGORY_COLORS[entry.name] ||
                          Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} Finding(s)`, 'Count']}
                    contentStyle={{
                      backgroundColor: '#0B1736',
                      borderColor: '#1E2E5C',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Bar Chart - Findings by Area */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-reckitt-navy/10 text-reckitt-navy flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Findings by Plant Area
                </h4>
                <p className="text-[11px] text-slate-500">Incident count across manufacturing &amp; warehouse zones</p>
              </div>
            </div>
            <span className="text-xs font-bold text-reckitt-pink bg-reckitt-pink-light px-2.5 py-1 rounded-full border border-reckitt-pink/20">
              {totalFindings} Total
            </span>
          </div>

          {areaData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              No findings recorded in this date range.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val) => [`${val} Finding(s)`, 'Findings']}
                    contentStyle={{
                      backgroundColor: '#0B1736',
                      borderColor: '#1E2E5C',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar
                    dataKey="findings"
                    fill={AREA_BAR_COLOR}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Visual Tracked Ledger Table of Findings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Tracked Findings &amp; Resolution Ledger
              </h3>
              <span className="text-xs font-bold text-reckitt-pink bg-reckitt-pink-light px-2.5 py-0.5 rounded-full border border-reckitt-pink/20">
                {ledgerFindings.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete traceable record of every finding and its live resolution state.
            </p>
          </div>

          {/* Search & Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger by ID, area, text..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-reckitt-pink"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['All', 'Open', 'In Progress', 'Closed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {allCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-reckitt-pink"
              >
                <option value="All">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px] bg-slate-50/50">
                <th className="py-3 px-4">Finding ID</th>
                <th className="py-3 px-4">Area &amp; Sub-Area</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Description / Finding</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Resolution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledgerFindings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No findings match the current filter criteria.
                  </td>
                </tr>
              ) : (
                ledgerFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-reckitt-pink whitespace-nowrap">
                      {f.id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{f.area}</div>
                      <div className="text-[11px] text-slate-500">{f.subArea}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {f.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          f.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : f.severity === 'Major'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-2">
                        {f.description || f.questionText}
                      </p>
                      {f.suggestedAction && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Action: {f.suggestedAction}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {f.assignedTo ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{f.assignedTo.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {f.assignedTo.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={f.status}
                        onChange={(e) =>
                          onUpdateFindingStatus(f.id, e.target.value as Finding['status'])
                        }
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer transition ${
                          f.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : f.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
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
