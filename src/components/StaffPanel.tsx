import React, { useState } from 'react';
import { TouristDestination, SurveyQuestion, SurveyResponse, ActivityLog } from '../types';
import RatingStars from './RatingStars';
import { 
  UserCheck, ClipboardList, FileCheck, Plus, 
  HelpCircle, CheckCircle, Clock, ShieldCheck, 
  Search, Filter, Smile, HelpCircle as HelpIcon,
  ChevronRight
} from 'lucide-react';

interface StaffPanelProps {
  destinations: TouristDestination[];
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  activityLogs: ActivityLog[];
  onSubmitSurvey: (surveyData: Omit<SurveyResponse, 'id' | 'dateSubmitted' | 'overallRating'>) => Promise<SurveyResponse | null>;
}

export default function StaffPanel({ 
  destinations, 
  questions, 
  responses, 
  activityLogs, 
  onSubmitSurvey 
}: StaffPanelProps) {
  // Staff registration
  const [encoderName, setEncoderName] = useState('Tourism Assistant Maria');
  const [isEncoderLocked, setIsEncoderLocked] = useState(true);

  // Rapid Survey Form
  const [touristName, setTouristName] = useState('');
  const [touristEmail, setTouristEmail] = useState('');
  const [nationality, setNationality] = useState('Philippines');
  const [ageGroup, setAgeGroup] = useState('25-34');
  const [selectedDestId, setSelectedDestId] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [feedbackText, setFeedbackText] = useState('');

  const [activeTab, setActiveTab] = useState<'encode' | 'responses' | 'status'>('encode');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Filtering logs
  const [logFilterQuery, setLogFilterQuery] = useState('');

  const activeQuestions = questions.filter(q => q.isActive);

  // Predefined values
  const nationalities = ["Philippines", "Japan", "Australia", "USA", "Germany", "Canada", "U.K.", "Other"];
  const ageGroups = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];

  const handleStartEncoding = (destId: string) => {
    setSelectedDestId(destId);
    setSuccessMsg('');
    setFormError('');
    // Initialize default scores
    const initial: Record<string, any> = {};
    activeQuestions.forEach(q => {
      if (q.type === 'rating') initial[q.id] = 5;
      if (q.type === 'yes_no') initial[q.id] = true;
      if (q.type === 'text') initial[q.id] = '';
    });
    setAnswers(initial);
  };

  const handleRatingChange = (qId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleYesNoChange = (qId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleTextChange = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!encoderName.trim()) {
      setFormError('Please enter your Staff/Encoder credentials at the top card.');
      return;
    }
    if (!touristName.trim()) {
      setFormError('A tourist name or ID is required for verification.');
      return;
    }
    if (!selectedDestId) {
      setFormError('Please select which spot in Hinunangan is being evaluated.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onSubmitSurvey({
        touristName,
        touristEmail: touristEmail || '',
        nationality,
        ageGroup,
        destinationId: selectedDestId,
        answers,
        feedbackText,
        encodedBy: `Staff Assist: ${encoderName}`
      });

      if (response) {
        setSuccessMsg(`Successfully locked in walk-in response for ${touristName}! Database metrics synced.`);
        // Reset states
        setTouristName('');
        setTouristEmail('');
        setSelectedDestId('');
        setFeedbackText('');
      } else {
        setFormError('Failed to upload survey details to database.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error executing API storage');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Staff Logs
  const staffRelatedLogs = activityLogs.filter(log => {
    const isStaffAction = log.userRole === 'Staff';
    const matchesSearch = log.actorName.toLowerCase().includes(logFilterQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(logFilterQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(logFilterQuery.toLowerCase());
    return isStaffAction && matchesSearch;
  });

  const totalEncodedSurveys = responses.filter(r => r.encodedBy && r.encodedBy !== 'self').length;
  const totalAllSurveys = responses.length;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* STAFF BIO ENCODER IDENTITY CARD */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <UserCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-505/30">
                Staff Encoder Mode
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                ● Live Database Active
              </span>
            </div>
            
            {isEncoderLocked ? (
              <h1 className="text-lg font-extrabold flex items-center gap-2 mt-1">
                {encoderName}
                <button
                  onClick={() => setIsEncoderLocked(false)}
                  className="text-[10px] font-bold text-sky-400 hover:underline cursor-pointer bg-sky-500/10 px-20 py-0.5 rounded"
                >
                  Edit
                </button>
              </h1>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={encoderName}
                  onChange={(e) => setEncoderName(e.target.value)}
                  className="px-3 py-1 bg-slate-800 text-white rounded border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => setIsEncoderLocked(true)}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 rounded text-xs font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1 font-medium">Hinunangan Tourist Information & Survey Desk assistant center</p>
          </div>
        </div>

        {/* Staff Mini-Counters */}
        <div className="flex items-center gap-3 self-start md:self-auto uppercase">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-left min-w-[120px]">
            <span className="text-[9px] text-slate-400 block font-bold tracking-wider">Assisted Entries</span>
            <span className="text-2xl font-black text-sky-400">{totalEncodedSurveys}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-left min-w-[120px]">
            <span className="text-[9px] text-slate-400 block font-bold tracking-wider font-mono">System load</span>
            <span className="text-xl font-bold text-slate-300 block">{totalAllSurveys} Total</span>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs text-left">
          ⚠️ {formError}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold text-xs text-left animate-shake">
          ✓ {successMsg}
        </div>
      )}

      {/* STAFF MENU TABS */}
      <div className="border-b border-slate-200 flex items-center gap-1">
        <button
          onClick={() => { setActiveTab('encode'); setFormError(''); setSuccessMsg(''); }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'encode'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📝 Walk-In Survey Encoding
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'responses'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🌴 Hinunangan Attractions Overview
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'status'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⏳ Guided Entry Logs & Auditing
        </button>
      </div>

      {/* TAB 1: SURVEY ENCODER FORM */}
      {activeTab === 'encode' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-left">
          {/* Left panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-905 text-xs mb-1 uppercase tracking-wider">
                1. Pick Visited Location
              </h3>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Assisting walk-ins? Select which Southern Leyte wonder they visited.
              </p>

              <div className="space-y-2">
                {destinations.map(dest => {
                  const isSelected = selectedDestId === dest.id;
                  return (
                    <button
                      key={dest.id}
                      onClick={() => handleStartEncoding(dest.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                        isSelected 
                          ? 'border-sky-600 bg-sky-50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          dest.category === 'Island' ? 'bg-sky-100 text-sky-800' :
                          dest.category === 'Beach' ? 'bg-amber-100 text-amber-800' :
                          dest.category === 'Spring' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100'
                        }`}>
                          {dest.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{dest.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate w-56">{dest.location}</p>
                      </div>
                      <ChevronRight size={16} className={isSelected ? 'text-sky-650 font-bold' : 'text-slate-400'} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-3">
            {selectedDestId ? (
              <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">Active Form</span>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      Evaluating: <strong className="text-sky-600">{destinations.find(d => d.id === selectedDestId)?.name}</strong>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDestId('')}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tourist Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Respondent Name"
                      value={touristName}
                      onChange={(e) => setTouristName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="tourist@email.com (if available)"
                      value={touristEmail}
                      onChange={(e) => setTouristEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nationality</label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {nationalities.map(nat => (
                        <option key={nat} value={nat}>{nat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Age Group</label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {ageGroups.map(ag => (
                        <option key={ag} value={ag}>{ag}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-dashed border-slate-200 pb-2">
                    Questions Matrix
                  </h4>

                  {activeQuestions.map((q, qidx) => (
                    <div key={q.id} className="space-y-2 border-b border-slate-100 pb-3">
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                          Q{qidx + 1}
                        </span>
                        <span className="text-xs text-slate-800 font-semibold">{q.text}</span>
                      </div>

                      {q.type === 'rating' && (
                        <div className="pl-8 flex items-center gap-3">
                          <RatingStars
                            value={answers[q.id] || 5}
                            onChange={(rating) => handleRatingChange(q.id, rating)}
                            size={18}
                            interactive={true}
                          />
                          <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-bold">
                            {answers[q.id] || 5}/5
                          </span>
                        </div>
                      )}

                      {q.type === 'yes_no' && (
                        <div className="pl-8 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleYesNoChange(q.id, true)}
                            className={`px-3 py-1 border rounded text-[11px] font-semibold cursor-pointer ${
                              answers[q.id] === true ? 'bg-sky-600 border-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleYesNoChange(q.id, false)}
                            className={`px-3 py-1 border rounded text-[11px] font-semibold cursor-pointer ${
                              answers[q.id] === false ? 'bg-rose-600 border-rose-600 text-white shadow-xs' : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      )}

                      {q.type === 'text' && (
                        <div className="pl-8">
                          <input
                            type="text"
                            value={answers[q.id] || ''}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            placeholder="Type response notes..."
                            className="bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs w-full text-slate-800 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Remarks (Overall Experiences)</label>
                  <textarea
                    rows={2}
                    placeholder="Remarks, boatman code, or extra comments..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Writing to Database...'
                  ) : (
                    <>
                      <FileCheck size={16} /> Update & Encode Respondent Data
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-6 text-slate-400 shadow-xs">
                <ClipboardList size={36} className="mb-2 text-slate-300" />
                <h4 className="font-bold text-slate-700">Pending Selection</h4>
                <p className="text-xs max-w-xs mt-1 font-medium">
                  Click on any Hinunangan tourist site on the left bar to open the fast encoding survey form for that location.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTRACTIONS STATISTICS */}
      {activeTab === 'responses' && (
        <div className="space-y-6 text-left">
          <div className="max-w-xl">
            <h3 className="font-extrabold text-slate-800 text-lg">Hinunangan Tourist Places Ratings</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Live satisfaction numbers showing tourist perceptions across different natural and cultural landmarks in Hinunangan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map(dest => {
              const ratingPercent = (dest.averageRating / 5) * 100;
              return (
                <div key={dest.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                      {dest.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      📝 {dest.totalReviews} Reviews
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{dest.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{dest.location}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Satisfaction Index</span>
                      <span className="text-sky-600">{dest.averageRating.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          dest.averageRating >= 4.5 ? 'bg-emerald-500' :
                          dest.averageRating >= 4.0 ? 'bg-sky-500' :
                          dest.averageRating >= 3.5 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${ratingPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <RatingStars value={dest.averageRating} size={14} />
                    <span>Rating Gauge</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GUIDED ENTRY AUDITING LOGS */}
      {activeTab === 'status' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                <Clock size={18} className="text-sky-650" />
                Staff Activity Audit Trail
              </h3>
              <p className="text-xs text-slate-450 mt-0.5 font-medium">
                Verifiable logs documenting recent survey submissions, walk-in encodes, and records processed inside this terminal.
              </p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff activity..."
                value={logFilterQuery}
                onChange={(e) => setLogFilterQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {staffRelatedLogs.length > 0 ? (
              <div className="divide-y divide-slate-150 text-xs">
                {staffRelatedLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-550 px-2 py-0.5 font-bold rounded">
                          {log.actorName}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium leading-relaxed max-w-xl">{log.details}</p>
                    </div>

                    <div className="shrink-0 text-slate-450 text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-705 border border-sky-100 rounded text-[9px] uppercase tracking-wider font-bold">
                        STAFF
                      </span>
                      <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck size={28} className="mx-auto text-slate-300 mb-1" />
                <h4 className="font-bold text-slate-500">No staff logs found</h4>
                <p className="text-xs mt-0.5 font-medium">Start submitting walk-ins to record assisted audits in real time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
