import React, { useState, useEffect } from 'react';
import { User, UserRole, TouristDestination, SurveyQuestion, SurveyResponse, ActivityLog, GeminiResponseAnalysis } from './types';
import TouristPanel from './components/TouristPanel';
import StaffPanel from './components/StaffPanel';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import { HelpCircle, RefreshCw, Compass, Users, Settings, Waves, Anchor, LogOut, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hinunangan_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('hinunangan_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.role;
      } catch (e) {
        return 'Tourist';
      }
    }
    return 'Tourist';
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setRole(user.role);
    localStorage.setItem('hinunangan_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRole('Tourist');
    localStorage.removeItem('hinunangan_user');
  };

  // Database States
  const [destinations, setDestinations] = useState<TouristDestination[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [aiReport, setAiReport] = useState<GeminiResponseAnalysis | null>(null);

  // Session-based responses submitted by the current tourist in this browser window
  const [touristSessionResponses, setTouristSessionResponses] = useState<SurveyResponse[]>([]);

  // Loading/Sync States
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Standby');

  // Fetch all database records
  const loadDatabase = async () => {
    setLoading(true);
    setSyncStatus('Fetching data...');
    try {
      const [destRes, qRes, respRes, logsRes, aiRes] = await Promise.all([
        fetch('/api/destinations'),
        fetch('/api/questions'),
        fetch('/api/responses'),
        fetch('/api/logs'),
        fetch('/api/ai-report')
      ]);

      const [destData, qData, respData, logsData, aiData] = await Promise.all([
        destRes.json(),
        qRes.json(),
        respRes.json(),
        logsRes.json(),
        aiRes.json()
      ]);

      setDestinations(destData || []);
      setQuestions(qData || []);
      setResponses(respData || []);
      setActivityLogs(logsData || []);
      setAiReport(aiData || null);
      
      setSyncStatus('Database Synced');
    } catch (e) {
      console.error("Failed to load local survey database: ", e);
      setSyncStatus('Sync Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // 1. Submit Survey Response
  const handleSubmitSurvey = async (surveyData: Omit<SurveyResponse, 'id' | 'dateSubmitted' | 'overallRating'>): Promise<SurveyResponse | null> => {
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData)
      });
      if (res.ok) {
        const newResponse: SurveyResponse = await res.json();
        
        // Append locally
        setResponses(prev => [newResponse, ...prev]);
        
        // Track local session replies if submitted as Tourist
        if (role === 'Tourist') {
          setTouristSessionResponses(prev => [newResponse, ...prev]);
        }

        // Trigger background reload to fetch logs and updated destination scores
        loadDatabase();
        return newResponse;
      }
    } catch (err) {
      console.error("Submission backend issue: ", err);
    }
    return null;
  };

  // 2. Question Matrix Handlers (CRUD)
  const handleUpdateQuestion = async (id: string, fields: Partial<SurveyQuestion>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        // Sync states
        loadDatabase();
        return true;
      }
    } catch (err) {
      console.error("Error updating survey index: ", err);
    }
    return false;
  };

  const handleCreateQuestion = async (newQ: Omit<SurveyQuestion, 'id' | 'isActive'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      });
      if (res.ok) {
        loadDatabase();
        return true;
      }
    } catch (err) {
      console.error("Error creating survey question: ", err);
    }
    return false;
  };

  const handleDeleteQuestion = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadDatabase();
        return true;
      }
    } catch (err) {
      console.error("Error deleting survey question: ", err);
    }
    return false;
  };

  // 3. Destination Landmark Handlers (CRUD)
  const handleUpdateDestination = async (id: string, fields: Partial<TouristDestination>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        loadDatabase();
        return true;
      }
    } catch (err) {
      console.error("Error updating destination: ", err);
    }
    return false;
  };

  const handleCreateDestination = async (newDest: Omit<TouristDestination, 'id' | 'averageRating' | 'totalReviews'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDest)
      });
      if (res.ok) {
        loadDatabase();
        return true;
      }
    } catch (err) {
      console.error("Error registering destination: ", err);
    }
    return false;
  };

  const handleDeleteDestination = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/destinations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadDatabase();
        return true;
      }
    } catch (err) {
      console.error("Error deleting landmark area: ", err);
    }
    return false;
  };

  // 4. Gemini AI advisory report generation trigger
  const handleGenerateAIReport = async (): Promise<{ report: GeminiResponseAnalysis; isDemo: boolean; message?: string } | null> => {
    try {
      const res = await fetch('/api/ai-report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const result = await res.json();
        setAiReport(result.report);
        return result;
      }
    } catch (e) {
      console.error("AI strategy generation issue: ", e);
    }
    return null;
  };

  // 5. Database reset
  const handleResetDB = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/reset-db', { method: 'POST' });
      if (res.ok) {
        setTouristSessionResponses([]);
        loadDatabase();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
      
      {/* GLOBAL SYSTEM NAVIGATION BAR */}
      <nav className="sticky top-0 bg-white border-b border-slate-200 z-40 transition-all shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand area */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <Waves size={20} />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 tracking-tight text-base block">HINUNANGAN PORTAL</span>
              <span className="block text-[10px] uppercase font-bold tracking-wide text-slate-500">Tourism Satisfaction System</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active User Badging */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl text-left">
              <div className="w-7 h-7 rounded-full bg-sky-100 border border-sky-250 flex items-center justify-center text-sky-700 font-bold text-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    currentUser.role === 'Admin' ? 'bg-indigo-550' : 
                    currentUser.role === 'Staff' ? 'bg-sky-505' : 'bg-emerald-500'
                  }`} />
                  <p className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">
                    {currentUser.role} {currentUser.nationality ? `(${currentUser.nationality})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Database Status badge */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'Database Synced' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span>{syncStatus}</span>
              </div>
              
              <button
                onClick={() => loadDatabase()}
                className="p-2 border border-slate-205 hover:bg-slate-50 text-slate-605 rounded-lg transition-all cursor-pointer"
                title="Refresh local database"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-650 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Sign Out Session"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </nav>

      {/* ACTIVE ACCOUNT SUB-BAR NOTIFICATION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full text-left">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 block">AUTHENTICATED SECTOR ACCESS</span>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {role === 'Admin' ? '👑 Executive Tourism Strategy Control Console' :
                 role === 'Staff' ? '📋 Municipal Tourism Assessment Encoder desk' :
                 '🗺️ Traveler Satisfaction Survey Questionnaire'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {role === 'Admin' ? 'Authorized as Administrator. You have permissions to configure metrics and run Gemini AI reports.' :
               role === 'Staff' ? 'Authorized as Staff Encoder. You possess rights to submit surveys on behalf of tourists and log operations.' :
               `Welcome to beautiful Southern Leyte, ${currentUser.name}! Fill out the questionnaires to aid our municipality.`}
            </p>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE APPLICATION VIEWS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {loading && (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Synchronizing database...</span>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            
            {/* 1. TOURIST INTERFACE */}
            {role === 'Tourist' && (
              <TouristPanel
                currentUser={currentUser}
                destinations={destinations}
                questions={questions}
                onSubmitSurvey={handleSubmitSurvey}
                submittedResponses={touristSessionResponses}
              />
            )}

            {/* 2. ENCODER STAFF INTERFACE */}
            {role === 'Staff' && (
              <StaffPanel
                destinations={destinations}
                questions={questions}
                responses={responses}
                activityLogs={activityLogs}
                onSubmitSurvey={handleSubmitSurvey}
              />
            )}

            {/* 3. TOURISM DIRECTOR CONSOLE */}
            {role === 'Admin' && (
              <AdminPanel
                destinations={destinations}
                questions={questions}
                responses={responses}
                activityLogs={activityLogs}
                aiReport={aiReport}
                onUpdateQuestion={handleUpdateQuestion}
                onCreateQuestion={handleCreateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onUpdateDestination={handleUpdateDestination}
                onCreateDestination={handleCreateDestination}
                onDeleteDestination={handleDeleteDestination}
                onGenerateAIReport={handleGenerateAIReport}
                onResetDB={handleResetDB}
              />
            )}

          </div>
        )}

      </main>

      {/* APPLICATION FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-semibold text-slate-700">System Operational</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-400 italic font-normal">Hinunangan, Southern Leyte Philippines</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
            <span>Survey Engine v2.4.1</span>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium">Build 0524</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
