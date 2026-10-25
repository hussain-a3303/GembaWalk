import React, { useState } from 'react';
import { MapPin, Building, Building2, User, ArrowRight, Check } from 'lucide-react';
import { Person } from '../../types/gemba';

interface StartWalkViewProps {
  observerName: string;
  onStartWalk: (area: string, subArea: string, observer: string, date: string) => void;
  peoples: Person[];
}

export const PLANT_STRUCTURE: Record<string, string[]> = {
  Warehouse: ['Household Warehouse', 'Healthcare Warehouse', 'DGRM Warehouse'],
  Production: ['Household', 'Healthcare'],
  Labs: ['Household Lab', 'Healthcare Lab', 'Micro Lab'],
  Utilities: [],
  Rooftops: ['Household Rooftop', 'Healthcare Rooftop', 'Engineering Rooftop', 'F-14 Rooftop'],
  'Other Areas': ['Outskirts', 'Engineering Store', 'EHS Store', 'Projects Store'],
};

export const StartWalkView: React.FC<StartWalkViewProps> = ({
  observerName,
  onStartWalk,
  peoples,
}) => {
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedSubArea, setSelectedSubArea] = useState<string>('');
  const [name, setName] = useState<string>(observerName || 'Jane Doe (Inspector)');
  const [dateTime, setDateTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const isUtilities = selectedArea === 'Utilities';
  const subAreas = selectedArea ? PLANT_STRUCTURE[selectedArea] || [] : [];

  // Nominated leads for selected subArea / area
  const nominatedLeads = selectedArea
    ? peoples.filter((p) => {
        if (isUtilities) {
          return p.area === 'Utilities' || (Array.isArray(p.areas) && p.areas.includes('Utilities'));
        }
        if (!selectedSubArea) return false;
        const matchesSub =
          p.subArea === selectedSubArea ||
          (Array.isArray(p.subAreas) && p.subAreas.includes(selectedSubArea));
        const matchesArea =
          p.area === selectedArea ||
          (Array.isArray(p.areas) && p.areas.includes(selectedArea));
        return matchesSub || matchesArea;
      })
    : [];

  const canBegin = Boolean(selectedArea && (isUtilities || selectedSubArea) && name.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBegin) return;
    onStartWalk(selectedArea, isUtilities ? '' : selectedSubArea, name, dateTime);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Card Title with Reckitt Pink accent */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Start Gemba Walk
            </h2>
            <span className="px-3 py-1 bg-reckitt-pink/10 text-reckitt-pink text-xs font-bold rounded-full border border-reckitt-pink/20">
              Floor Inspection
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-reckitt-pink/10 text-reckitt-pink flex items-center justify-center border border-reckitt-pink/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* Step 1: Select Plant Area */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-reckitt-pink text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <MapPin className="w-4 h-4 text-reckitt-pink" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Select Plant Area
                </span>
              </div>
              {selectedArea && (
                <span className="text-xs font-bold text-reckitt-pink bg-reckitt-pink-light px-2.5 py-0.5 rounded-full border border-reckitt-pink/20">
                  {selectedArea} Selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(PLANT_STRUCTURE).map((area) => {
                const isSelected = selectedArea === area;
                const subCount = PLANT_STRUCTURE[area].length;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setSelectedArea(area);
                      setSelectedSubArea('');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-reckitt-pink bg-reckitt-pink-light shadow-sm ring-2 ring-reckitt-pink/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{area}</span>
                      {isSelected && <Check className="w-4 h-4 text-reckitt-pink stroke-[3]" />}
                    </div>
                    <span className="text-xs text-slate-500">{subCount} Sub-areas</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Sub-Area */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <Building className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Select Sub-Area {selectedArea ? `in ${selectedArea}` : ''}
                </span>
              </div>
              {selectedSubArea && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {selectedSubArea}
                </span>
              )}
            </div>

            {!selectedArea ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                Select a Plant Area above to view Sub-Areas
              </div>
            ) : isUtilities ? (
              <div className="p-4 rounded-2xl bg-reckitt-pink-light/40 border border-reckitt-pink/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-reckitt-navy block">
                    Utilities Inspection (Plant-Wide)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Utilities has NO sub-divisions. All inspection questions trigger immediately.
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-white text-reckitt-pink text-xs font-black rounded-lg border border-reckitt-pink/30 shadow-2xs">
                  Immediate Trigger
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {subAreas.map((sub) => {
                  const isSelected = selectedSubArea === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubArea(sub)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-reckitt-pink bg-reckitt-pink-light text-reckitt-navy font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{sub}</span>
                      {isSelected && <Check className="w-4 h-4 text-reckitt-pink shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Nominated Personnel */}
          {(selectedSubArea || isUtilities) && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Nominated Personnel for {isUtilities ? 'Utilities' : selectedSubArea}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {nominatedLeads.length} Nominated Alert Leads
                </span>
              </div>

              {nominatedLeads.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {nominatedLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-reckitt-pink"></span>
                      <strong className="text-slate-800">{lead.name}</strong>
                      <span className="text-slate-400">({lead.email})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Reckitt Plant Operations Administrator will receive real-time alerts for this location.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Observer Details */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-xs font-black flex items-center justify-center">
                4
              </span>
              <User className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Observer Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observer Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Observer name"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-reckitt-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-reckitt-pink font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={!canBegin}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer ${
                canBegin
                  ? 'bg-reckitt-pink hover:bg-reckitt-pink-hover text-white shadow-reckitt-pink/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {canBegin ? (
                <>
                  Begin Gemba Walk in {selectedArea} &gt; {selectedSubArea}
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Select Area & Sub-Area to Begin Walk'
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
              Single-question touch mode • Real-time notifications on &quot;NO&quot; responses dispatched to assignees.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
