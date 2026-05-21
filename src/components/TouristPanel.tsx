import React, { useState } from 'react';
import { User, TouristDestination, SurveyQuestion, SurveyResponse } from '../types';
import RatingStars from './RatingStars';
import { 
  Compass, MapPin, Send, HelpCircle, 
  Smile, User as UserIcon, CheckCircle, Ship, Award, 
  ChevronRight, Calendar, MessageSquare, Sparkles 
} from 'lucide-react';
import hinunanganParadiseImg from '../assets/images/hinunangan_paradise_1779325004774.png';

interface TouristPanelProps {
  currentUser?: User | null;
  destinations: TouristDestination[];
  questions: SurveyQuestion[];
  onSubmitSurvey: (surveyData: Omit<SurveyResponse, 'id' | 'dateSubmitted' | 'overallRating'>) => Promise<SurveyResponse | null>;
  submittedResponses: SurveyResponse[];
}

export default function TouristPanel({ 
  currentUser,
  destinations, 
  questions, 
  onSubmitSurvey, 
  submittedResponses 
}: TouristPanelProps) {
  // Survey steps: 'registration' | 'destination' | 'feedback' | 'success'
  const [step, setStep] = useState<'registration' | 'destination' | 'feedback' | 'success'>(() => {
    return currentUser ? 'destination' : 'registration';
  });
  
  // Registration forms
  const [touristName, setTouristName] = useState(currentUser?.name || '');
  const [touristEmail, setTouristEmail] = useState(currentUser?.email || '');
  const [nationality, setNationality] = useState(currentUser?.nationality || 'Philippines');
  const [ageGroup, setAgeGroup] = useState(currentUser?.ageGroup || '25-34');
  
  // Custom destinations or selected destination
  const [selectedDestId, setSelectedDestId] = useState('');
  
  // Answers state: questionId -> value
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [feedbackText, setFeedbackText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [lastSubmittedResponse, setLastSubmittedResponse] = useState<SurveyResponse | null>(null);

  // Common nationality defaults
  const nationalities = [
    "Philippines", "Japan", "Australia", "USA", "Germany", 
    "Canada", "United Kingdom", "France", "South Korea", 
    "Singapore", "Taiwan", "Other"
  ];

  // Age group defaults
  const ageGroups = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];

  const handleStartRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!touristName.trim()) {
      setAlertError('Please input your name to begin the survey');
      return;
    }
    setAlertError('');
    setStep('destination');
  };

  const handleSelectDestination = (destId: string) => {
    setSelectedDestId(destId);
    
    // Initialize questions answers with empty/defaults
    const initialAnswers: Record<string, any> = {};
    questions.forEach(q => {
      if (q.isActive) {
        if (q.type === 'rating') initialAnswers[q.id] = 5; // default 5 star
        if (q.type === 'yes_no') initialAnswers[q.id] = true; // default yes
        if (q.type === 'text') initialAnswers[q.id] = '';
      }
    });
    setAnswers(initialAnswers);
    setStep('feedback');
  };

  const handleRatingChange = (qId: string, rating: number) => {
    setAnswers(prev => ({ ...prev, [qId]: rating }));
  };

  const handleYesNoChange = (qId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleTextAnswerChange = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const activeQuestions = questions.filter(q => q.isActive);

  const handleFormSubmission = async () => {
    setIsSubmitting(true);
    setAlertError('');
    try {
      const response = await onSubmitSurvey({
        touristName,
        touristEmail,
        nationality,
        ageGroup,
        destinationId: selectedDestId,
        answers,
        feedbackText,
        encodedBy: 'self'
      });

      if (response) {
        setLastSubmittedResponse(response);
        setStep('success');
        // Reset feedback form for next survey
        setSelectedDestId('');
        setFeedbackText('');
      } else {
        setAlertError('Submission issue, please verify connection.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Failed to submit the survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDestination = destinations.find(d => d.id === selectedDestId);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Dynamic Step Header with beautiful background image */}
      <div className="bg-sky-950 text-white rounded-2xl p-8 crisp-shadow relative overflow-hidden min-h-[16rem] flex flex-col justify-end">
        {/* Real Hinunangan background image cover */}
        <img 
          src={hinunanganParadiseImg} 
          alt="Hinunangan twins island panorama" 
          className="absolute inset-0 w-full h-full object-cover opacity-25 select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-sky-950/80 to-sky-950/20" />

        <div className="absolute top-0 right-0 p-8 opacity-10 hidden sm:block">
          <Compass size={160} />
        </div>
        
        <div className="relative z-10 space-y-3 max-w-2xl text-left">
          <span className="inline-block px-3 py-1 bg-sky-900 border border-sky-850/80 rounded-full text-[10px] uppercase font-bold tracking-widest text-sky-200">
            ☀️ Southern Leyte Eco-Sanctuary • Visitor Feedback
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
            Hinunangan Eco-Tourism Survey
          </h1>
          <p className="text-sky-200/90 text-xs sm:text-sm font-medium leading-relaxed drop-shadow-sm">
            Your honest feedback enables the Southern Leyte Tourism Office to protect our marine sanctuaries, elevate hospitality services, and preserve the natural allure of our twin islands.
          </p>
        </div>

        {/* Step Indicator dots */}
        <div className="relative z-10 flex items-center gap-2 mt-6">
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 'registration' ? 'bg-sky-400 w-8' : 'bg-white/20 w-2'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 'destination' ? 'bg-sky-400 w-8' : 'bg-white/20 w-2'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 'feedback' ? 'bg-sky-400 w-8' : 'bg-white/20 w-2'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 'success' ? 'bg-sky-400 w-8' : 'bg-white/20 w-2'}`} />
        </div>
      </div>

      {alertError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center font-bold text-xs shrink-0">!</div>
          <p className="text-sm font-semibold">{alertError}</p>
        </div>
      )}

      {/* STEP 1: TOURIST REGISTRATION */}
      {step === 'registration' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Identify Yourself</h2>
              <p className="text-xs text-slate-500">Register as a feedback respondent</p>
            </div>
          </div>
          
          <form onSubmit={handleStartRegistration} className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
              <input
                type="text"
                placeholder="Juan Cruz / Jane Doe"
                required
                value={touristName}
                onChange={(e) => setTouristName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address <span className="text-xs font-normal normal-case text-slate-400">(Optional)</span></label>
              <input
                type="email"
                placeholder="respondent@example.com"
                value={touristEmail}
                onChange={(e) => setTouristEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Nationality</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 text-sm"
                >
                  {nationalities.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Age Bracket</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 text-sm"
                >
                  {ageGroups.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.99] mt-2 group cursor-pointer"
            >
              Begin Satisfaction Survey
              <Compass size={16} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: DESTINATION SELECTION */}
      {step === 'destination' && (
        <div className="space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Which site did you explore?</h2>
            <p className="text-xs text-slate-500">
              Select the Hinunangan destination you recently visited to deliver targeted feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                onClick={() => handleSelectDestination(dest.id)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-400 transition-all duration-200 cursor-pointer flex flex-col justify-between group text-left relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      dest.category === 'Island' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      dest.category === 'Beach' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      dest.category === 'Spring' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                      'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                      {dest.category}
                    </span>
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded text-amber-700 text-xs font-bold">
                      ★ {dest.averageRating || 'N/A'}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-sky-600 transition-colors">
                    {dest.name}
                  </h3>
                  
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 font-medium">
                    {dest.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-medium">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{dest.location}</span>
                  </div>
                  <span className="font-semibold text-sky-600 group-hover:underline flex items-center gap-1">
                    Survey <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => setStep('registration')}
              className="px-5 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl transition-all font-medium text-xs cursor-pointer"
            >
              ← Edit Profile Details
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SURVEY QUESTIONS FEEDBACK */}
      {step === 'feedback' && selectedDestination && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Ship size={22} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">{selectedDestination.category} Assessment</span>
                <h2 className="font-extrabold text-lg text-slate-900">{selectedDestination.name}</h2>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} /> {selectedDestination.location}
                </span>
              </div>
            </div>
            
            <div className="self-start sm:self-center bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-600 font-semibold">
              Respondent: <strong className="text-slate-900">{touristName}</strong>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-150 text-xs text-sky-800 flex gap-2">
              <Sparkles size={16} className="shrink-0 text-sky-600 animate-pulse" />
              <p className="font-medium">Your review takes less than 60 seconds. Simply answer the standard metrics below and press submit!</p>
            </div>

            {activeQuestions.map((q, idx) => (
              <div key={q.id} className="p-5 bg-slate-50 rounded-xl border border-slate-205 space-y-3 text-left">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 font-bold text-xs text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">{q.category}</span>
                    <h3 className="font-semibold text-slate-905 text-xs mt-0.5 leading-relaxed">{q.text}</h3>
                  </div>
                </div>

                {/* Rating scale */}
                {q.type === 'rating' && (
                  <div className="pl-8 pt-1 flex items-center gap-4">
                    <RatingStars
                      value={answers[q.id] || 5}
                      onChange={(rating) => handleRatingChange(q.id, rating)}
                      size={24}
                      interactive={true}
                    />
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md">
                      {answers[q.id] === 5 ? 'Excellent' :
                       answers[q.id] === 4 ? 'Very Good' :
                       answers[q.id] === 3 ? 'Good' :
                       answers[q.id] === 2 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                )}

                {/* Yes No checkboxes */}
                {q.type === 'yes_no' && (
                  <div className="pl-8 pt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleYesNoChange(q.id, true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        answers[q.id] === true 
                          ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Yes, absolutely
                    </button>
                    <button
                      type="button"
                      onClick={() => handleYesNoChange(q.id, false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        answers[q.id] === false
                          ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      No, not really
                    </button>
                  </div>
                )}

                {/* Question-specific text feedback */}
                {q.type === 'text' && (
                  <div className="pl-8 pt-1">
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                      placeholder="Type details (optional)..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* General optional reviews */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare size={16} className="text-sky-600" />
                Overall Experience Statement
              </label>
              <textarea
                rows={3}
                placeholder="Share any special highlight, local memory, or quick message about people or food..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-850 placeholder-slate-400 text-xs"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setStep('destination')}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-xs cursor-pointer"
              >
                ← Back to Sites
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFormSubmission}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Submitting Review...</>
                ) : (
                  <>
                    Submit Satisfaction Survey
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS ACKNOWLEDGEMENT */}
      {step === 'success' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full px-2 py-0.5">
              Feedback Locked In
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Salamat Kaayo, {touristName}!
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-medium">
              Your evaluation of <strong className="text-slate-800">{destinations.find(d => d.id === lastSubmittedResponse?.destinationId)?.name || 'Hinunangan'}</strong> is saved inside the Hinunangan Municipal Tourism Office system.
            </p>
          </div>

          {lastSubmittedResponse && (
            <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-201 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>REPLY ID: {lastSubmittedResponse.id.substring(0, 10).toUpperCase()}</span>
                <span>{new Date(lastSubmittedResponse.dateSubmitted).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Rated Satisfaction:</span>
                <RatingStars value={lastSubmittedResponse.overallRating} size={15} />
                <span className="text-xs font-bold text-slate-800">({lastSubmittedResponse.overallRating}/5)</span>
              </div>
              {lastSubmittedResponse.feedbackText && (
                <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                  "{lastSubmittedResponse.feedbackText}"
                </p>
              )}
            </div>
          )}

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 space-y-3 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-sky-800 flex items-center gap-1.5">
              <Award size={14} /> Tourist Advisory & Support Contacts
            </h4>
            <p className="text-xs text-sky-700 leading-relaxed font-medium">
              If you require emergency assistance, municipal boat bookings, or certified surf guides at Tahusan Beach, contact the Municipal Office:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] bg-white/70 p-3 rounded-lg text-slate-600 font-semibold font-mono">
              <div>📍 Tourism Desk: Poblacion Plaza</div>
              <div>📞 Helpline: +63 917 890 1234</div>
              <div>🚤 Port Authority: Brgy. San Pedro</div>
              <div>✉️ Email: info@hinunangan.gov</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setSelectedDestId('');
                setStep('destination');
              }}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-sm transition-all text-xs cursor-pointer"
            >
              Submit Another Site Survey
            </button>
            <button
              onClick={() => {
                setTouristName('');
                setTouristEmail('');
                setStep('registration');
              }}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition-all text-xs cursor-pointer"
            >
              Exit Profile
            </button>
          </div>
        </div>
      )}

      {/* SESSION FEEDBACK HISTORY */}
      {submittedResponses.length > 0 && (
        <div className="border-t border-slate-200 pt-8 mt-12 text-left">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1 px-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-full">
              {submittedResponses.length}
            </div>
            <h3 className="font-extrabold text-base text-slate-905">Your Submitted Feedback (This Session)</h3>
          </div>

          <div className="space-y-4">
            {submittedResponses.map((resp) => {
              const destObj = destinations.find(d => d.id === resp.destinationId);
              return (
                <div key={resp.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{destObj?.name || 'Hinunangan Spot'}</h4>
                      <span className="text-[10px] bg-slate-50 text-slate-500 font-bold border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
                        {destObj?.category || 'Nature'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <RatingStars value={resp.overallRating} size={14} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(resp.dateSubmitted).toLocaleString()}
                      </span>
                    </div>

                    {resp.feedbackText && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg max-w-xl font-medium">
                        "{resp.feedbackText}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end justify-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">STATUS</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <Smile size={14} /> Registered in DB
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
