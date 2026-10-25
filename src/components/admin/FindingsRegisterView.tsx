import React, { useState } from 'react';
import { Search, Image, ExternalLink, Filter } from 'lucide-react';
import { Finding, Assignee } from '../../types/gemba';

interface FindingsRegisterViewProps {
  findings: Finding[];
  onUpdateStatus: (findingId: string, status: Finding['status'], assignedTo?: Assignee) => void;
  peoples: Assignee[];
}

export const FindingsRegisterView: React.FC<FindingsRegisterViewProps> = ({
  findings,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedAssignee, setSelectedAssignee] = useState('All Assignees');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Extract unique filter options
  const uniqueAreas = Array.from(new Set(findings.map((f) => f.area).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(findings.map((f) => f.category).filter(Boolean)));
  const uniqueAssignees = Array.from(
    new Set(findings.map((f) => f.assignedTo?.name).filter(Boolean) as string[])
  );

  const filteredFindings = findings.filter((f) => {
    if (selectedArea !== 'All Areas' && f.area !== selectedArea) return false;
    if (selectedCategory !== 'All Categories' && f.category !== selectedCategory) return false;
    if (selectedStatus !== 'All Statuses' && f.status !== selectedStatus) return false;
    if (selectedAssignee !== 'All Assignees' && f.assignedTo?.name !== selectedAssignee) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        f.id.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.questionText?.toLowerCase().includes(q) ||
        f.area?.toLowerCase().includes(q) ||
        f.subArea?.toLowerCase().includes(q) ||
        f.assignedTo?.name?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search finding ID, description, area, question text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-reckitt-pink transition"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">AREA</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Areas</option>
              {uniqueAreas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">STATUS</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">ASSIGNEE</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-reckitt-pink"
            >
              <option>All Assignees</option>
              {uniqueAssignees.map((ass) => (
                <option key={ass} value={ass}>
                  {ass}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          No findings match the active search and filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const hasPhotos = finding.photos && finding.photos.length > 0;
            const photoCount = hasPhotos ? finding.photos.length : 0;
            const primaryPhoto = hasPhotos ? finding.photos[0] : null;

            return (
              <div
                key={finding.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {finding.id}
                    </span>
                    <span className="text-xs font-bold text-reckitt-pink">{finding.area}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-800">{finding.subArea}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-50 text-reckitt-pink border border-pink-200">
                      {finding.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        finding.severity === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : finding.severity === 'Major'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {finding.severity}
                    </span>

                    <select
                      value={finding.status}
                      onChange={(e) =>
                        onUpdateStatus(finding.id, e.target.value as Finding['status'])
                      }
                      className={`text-xs font-bold py-1 px-2.5 rounded-xl border focus:outline-none cursor-pointer ${
                        finding.status === 'Closed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : finding.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Question & Description */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <p className="text-xs text-slate-500 italic">
                      &quot;{finding.questionText}&quot;
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {finding.description || 'Observed defect/hazard'}
                    </p>

                    {finding.suggestedAction && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <strong className="text-slate-700">Suggested Action:</strong>{' '}
                        {finding.suggestedAction}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span>
                        Observer: <strong className="text-slate-800">Inspector</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Date:{' '}
                        <strong className="text-slate-800">
                          {new Date(finding.createdAt).toLocaleDateString()}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Assigned:{' '}
                        <strong className="text-slate-800">
                          {finding.assignedTo?.name || 'Central Plant Lead'}
                        </strong>{' '}
                        {finding.assignedTo?.email && (
                          <span className="text-slate-400">({finding.assignedTo.email})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Photos box */}
                  <div className="md:col-span-1 bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-slate-400" />
                        Photos
                      </span>
                      <span className="font-mono text-reckitt-pink">{photoCount}</span>
                    </div>

                    {primaryPhoto?.dataUrl ? (
                      <div
                        onClick={() => setSelectedPhoto(primaryPhoto.dataUrl || null)}
                        className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video cursor-pointer hover:opacity-90 transition bg-slate-900 group"
                      >
                        <img
                          src={primaryPhoto.dataUrl}
                          alt={primaryPhoto.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-[11px] text-reckitt-pink font-medium">
                        Photo Evidence Attached
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition z-10"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="Evidence"
              className="w-full max-h-[75vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
