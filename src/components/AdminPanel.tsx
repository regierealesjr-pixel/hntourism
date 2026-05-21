import React, { useState, useEffect } from 'react';
import { TouristDestination, SurveyQuestion, SurveyResponse, ActivityLog, GeminiResponseAnalysis } from '../types';
import RatingStars from './RatingStars';
import { 
  Settings, Sliders, Database, Users, ShieldAlert, 
  Trash2, Edit, Plus, RefreshCw, BarChart2, Star, 
  Sparkles, FileText, Globe, CheckCircle2, AlertCircle, 
  HelpCircle, MessageSquare, MapPin, X, Trash 
} from 'lucide-react';

interface AdminPanelProps {
  destinations: TouristDestination[];
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  activityLogs: ActivityLog[];
  aiReport: GeminiResponseAnalysis | null;
  onUpdateQuestion: (id: string, fields: Partial<SurveyQuestion>) => Promise<boolean>;
  onCreateQuestion: (q: Omit<SurveyQuestion, 'id' | 'isActive'>) => Promise<boolean>;
  onDeleteQuestion: (id: string) => Promise<boolean>;
  onUpdateDestination: (id: string, fields: Partial<TouristDestination>) => Promise<boolean>;
  onCreateDestination: (dest: Omit<TouristDestination, 'id' | 'averageRating' | 'totalReviews'>) => Promise<boolean>;
  onDeleteDestination: (id: string) => Promise<boolean>;
  onGenerateAIReport: () => Promise<{ report: GeminiResponseAnalysis; isDemo: boolean; message?: string } | null>;
  onResetDB: () => Promise<boolean>;
}

export default function AdminPanel({
  destinations,
  questions,
  responses,
  activityLogs,
  aiReport,
  onUpdateQuestion,
  onCreateQuestion,
  onDeleteQuestion,
  onUpdateDestination,
  onCreateDestination,
  onDeleteDestination,
  onGenerateAIReport,
  onResetDB
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'destinations' | 'responses' | 'ai' | 'logs' | 'accounts'>('dashboard');

  // User accounts states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'Staff' | 'Admin'>('Staff');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const [mysqlStatus, setMysqlStatus] = useState<any>({
    configured: false,
    status: 'Checking...',
    hostInfo: '',
    error: null,
    ssl: false
  });

  const fetchMysqlStatus = async () => {
    try {
      const res = await fetch('/api/mysql-status');
      if (res.ok) {
        const data = await res.json();
        setMysqlStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch MySQL status:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts list:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMysqlStatus();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!nameInput.trim() || !usernameInput.trim() || !passwordInput.trim()) {
      setUserError('Name, username, and password are required.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          email: emailInput.trim(),
          role: roleInput,
          username: usernameInput.trim().toLowerCase(),
          password: passwordInput.trim()
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setUserError(errData.error || 'Failed to create user account.');
        return;
      }

      setUserSuccess(`Successfully registered ${roleInput} account!`);
      // Reset inputs
      setNameInput('');
      setEmailInput('');
      setUsernameInput('');
      setPasswordInput('');
      setIsAddingUser(false);
      // Reload list
      fetchUsers();
    } catch (err: any) {
      setUserError(err.message || 'Network error creating account.');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === 'admin') {
      alert("The primary administrator account cannot be deleted.");
      return;
    }
    const yes = window.confirm(`Are you sure you want to delete account "${username}"?`);
    if (!yes) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUserSuccess('Account removed successfully.');
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete account.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Question Form states
  const [isAddingQ, setIsAddingQ] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQCategory, setNewQCategory] = useState<SurveyQuestion['category']>('Cleanliness');
  const [newQType, setNewQType] = useState<SurveyQuestion['type']>('rating');

  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQCategory, setEditQCategory] = useState<SurveyQuestion['category']>('Cleanliness');
  const [editQType, setEditQType] = useState<SurveyQuestion['type']>('rating');

  // Destination Form states
  const [isAddingDest, setIsAddingDest] = useState(false);
  const [newDestName, setNewDestName] = useState('');
  const [newDestCategory, setNewDestCategory] = useState<TouristDestination['category']>('Beach');
  const [newDestDesc, setNewDestDesc] = useState('');
  const [newDestLoc, setNewDestLoc] = useState('');

  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [editDestName, setEditDestName] = useState('');
  const [editDestCategory, setEditDestCategory] = useState<TouristDestination['category']>('Beach');
  const [editDestDesc, setEditDestDesc] = useState('');
  const [editDestLoc, setEditDestLoc] = useState('');

  // AI Generation triggers
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotification, setAiNotification] = useState('');

  // Responses Query parameters
  const [selectedDestFilter, setSelectedDestFilter] = useState('');
  const [selectedArgFilter, setSelectedArgFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedResponse, setFocusedResponse] = useState<SurveyResponse | null>(null);

  // Dashboard filter & Destination management states
  const [dashboardDestId, setDashboardDestId] = useState('');
  const [destSearchQuery, setDestSearchQuery] = useState('');

  // Stats Counters
  const dashboardResponses = dashboardDestId 
    ? responses.filter(r => r.destinationId === dashboardDestId) 
    : responses;

  const totalReviewsCount = dashboardResponses.length;
  const averageCleanlinessScore = calculateAvgScoreByCategory('Cleanliness', dashboardDestId);
  const averageHospitalityScore = calculateAvgScoreByCategory('Hospitality', dashboardDestId);
  const averageSafetyScore = calculateAvgScoreByCategory('Safety', dashboardDestId);

  function calculateAvgScoreByCategory(category: string, destId?: string) {
    // Find questions corresponding to category
    const matchingQs = questions.filter(q => q.category === category);
    if (matchingQs.length === 0) return 0;

    let totalRatingSum = 0;
    let counts = 0;

    responses.forEach(r => {
      if (destId && r.destinationId !== destId) return;
      matchingQs.forEach(q => {
        if (r.answers[q.id] !== undefined && typeof r.answers[q.id] === 'number') {
          totalRatingSum += r.answers[q.id];
          counts++;
        }
      });
    });

    return counts > 0 ? parseFloat((totalRatingSum / counts).toFixed(1)) : 0;
  }

  // Triggering Question Creation
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return;
    const success = await onCreateQuestion({
      text: newQText,
      category: newQCategory,
      type: newQType
    });
    if (success) {
      setNewQText('');
      setIsAddingQ(false);
    }
  };

  // Triggering Question Save
  const handleSaveQuestionEdit = async (id: string) => {
    if (!editQText.trim()) return;
    const success = await onUpdateQuestion(id, {
      text: editQText,
      category: editQCategory,
      type: editQType
    });
    if (success) {
      setEditingQId(null);
    }
  };

  // Triggering Destination Creation
  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestName.trim() || !newDestLoc.trim()) return;
    const success = await onCreateDestination({
      name: newDestName,
      category: newDestCategory,
      description: newDestDesc,
      location: newDestLoc
    });
    if (success) {
      setNewDestName('');
      setNewDestDesc('');
      setNewDestLoc('');
      setIsAddingDest(false);
    }
  };

  // Triggering Destination Update
  const handleSaveDestinationEdit = async (id: string) => {
    if (!editDestName.trim() || !editDestLoc.trim()) return;
    const success = await onUpdateDestination(id, {
      name: editDestName,
      category: editDestCategory,
      description: editDestDesc,
      location: editDestLoc
    });
    if (success) {
      setEditingDestId(null);
    }
  };

  // Trigger AI analysis
  const triggerAIAdvisorReport = async () => {
    setAiLoading(true);
    setAiNotification('');
    try {
      const res = await onGenerateAIReport();
      if (res) {
        if (res.isDemo && res.message) {
          setAiNotification(res.message);
        } else {
          setAiNotification('Live feedback analysis computed safely with Gemini AI!');
        }
      }
    } catch (e: any) {
      setAiNotification('Failed to generate. Error details: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Filtered survey responses
  const filteredResponses = responses.filter(r => {
    const destMatches = selectedDestFilter ? r.destinationId === selectedDestFilter : true;
    const ageMatches = selectedArgFilter ? r.ageGroup === selectedArgFilter : true;
    const searchMatches = searchQuery 
      ? r.touristName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.feedbackText && r.feedbackText.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return destMatches && ageMatches && searchMatches;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* ADMIN CONTROL PANEL HERO HEADER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow border border-slate-800 relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-sky-500/10 rounded-full filter blur-xl opacity-20" />
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Settings size={180} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-sky-350">
              Tourism Management Desk
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">Hinunangan Tourism Director</h1>
            <p className="text-slate-400 text-xs max-w-xl font-medium">
              System manager console. Modify survey metrics, manage landmarks, audit feedback logs, and trigger municipal strategic recommendations powered by Google Gemini.
            </p>
          </div>

          <div className="flex gap-2 self-start md:self-center shrink-0">
            <button
              onClick={async () => {
                const yes = window.confirm("Reset database back to factory demo defaults?");
                if (yes) {
                  const done = await onResetDB();
                  if (done) alert("Database cleared and seed questions reloaded.");
                }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Run DB Reset
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN TAB NAVIGATION BAR */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-left">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📊 Dashboard & Statistics
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'questions' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🙋 Survey Question Matrix
        </button>
        <button
          onClick={() => setActiveTab('destinations')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'destinations' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📍 Destination Management
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'responses' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📝 Submissions Database ({responses.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ai' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ✨ Gemini Strategic Advisor
          <span className="bg-sky-100 text-sky-700 border border-sky-200 font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded-full">AI</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'logs' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⚙️ Live Audit Trail
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'accounts' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👤 Personnel Accounts
        </button>
      </div>

      {/* TAB 1: DASHBOARD STATS OVERVIEWS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 text-left">
          
          {/* DASHBOARD DESTINATION FILTER BAR */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin size={16} className="text-sky-600" />
                <span>Strategic Performance Dashboard</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Analyze satisfaction levels, travel patterns, and demographics per monitored spot.
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label htmlFor="dashboard-dest-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Focus Spot:
              </label>
              <select
                id="dashboard-dest-select"
                value={dashboardDestId}
                onChange={(e) => setDashboardDestId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">🗺️ All Destinations</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MYSQL CLOUD DATABASE STATUS BANNER */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
            mysqlStatus.configured 
              ? 'bg-emerald-50/55 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/40 border-amber-150 text-amber-900'
          }`}>
            <div className="flex items-start gap-3 text-left">
              <div className={`p-2.5 rounded-lg shrink-0 ${
                mysqlStatus.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <Database size={18} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap text-left">
                  <h4 className="font-extrabold text-xs tracking-wide uppercase">
                    {mysqlStatus.configured ? 'Aiven Cloud MySQL Database Connected' : 'Local JSON Disk Mode Active'}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                    mysqlStatus.configured ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-650'
                  }`}>
                    {mysqlStatus.status}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-normal text-left">
                  {mysqlStatus.configured 
                    ? `Live synchronization enabled. Data commits are being written securely to Aiven Cloud hosting: ${mysqlStatus.hostInfo}`
                    : `Your data is backed up to local file system node storage. Register your MYSQL_URL or direct MySQL hosts in AI Studio Secrets to sync with your Aiven MySQL Cluster.`
                  }
                </p>
                {mysqlStatus.error && (
                  <p className="text-[10px] text-rose-600 font-mono mt-1 text-left">
                    Error Log: {mysqlStatus.error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[9.5px] font-bold text-slate-500 bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-150 self-start sm:self-auto shrink-0">
              <span className={`w-2 h-2 rounded-full ${mysqlStatus.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>SSL: {mysqlStatus.ssl ? 'ENABLED' : 'INACTIVE'}</span>
            </div>
          </div>
          
          {/* TOP CARDS METRICS BOX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Submissions</span>
                <span className="text-3xl font-extrabold text-slate-900">{totalReviewsCount}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">✓ Live Active DB</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Database size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Cleanliness index</span>
                <span className="text-3xl font-extrabold text-emerald-600 font-mono">{averageCleanlinessScore || '0.0'}<span className="text-sm font-semibold text-slate-400">/5</span></span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1 font-mono">Waste & preserves index</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Star size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Hospitality Score</span>
                <span className="text-3xl font-extrabold text-cyan-600 font-mono">{averageHospitalityScore || '0.0'}<span className="text-sm font-semibold text-slate-400">/5</span></span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1 font-mono">Community assistance</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Safety Index</span>
                <span className="text-3xl font-extrabold text-sky-600 font-mono">{averageSafetyScore || '0.0'}<span className="text-sm font-semibold text-slate-400">/5</span></span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1 font-mono">Assistance & rescue units</span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>

          {/* TWO COLUMN CHARTING GAUGE */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* DESTINATION STATS RANKS BAR */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Attractions Feedback Breakdown</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Comparing the overall review counts and average tourist scores for each destination.</p>
              </div>

              <div className="space-y-5">
                {destinations.map(dest => {
                  const pct = (dest.averageRating / 5) * 100;
                  return (
                    <div key={dest.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{dest.name}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            {dest.category}
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-600 font-mono">
                          {dest.averageRating.toFixed(1)} / 5.0 ({dest.totalReviews} votes)
                        </span>
                      </div>
                      
                      {/* SVG styled Custom bar charts */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            dest.averageRating >= 4.5 ? 'bg-sky-600' :
                            dest.averageRating >= 4.0 ? 'bg-sky-500' :
                            dest.averageRating >= 3.5 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DEMOGRAPHICS GAUGE: NATIONALITY & AGE */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* NATIONALITY STATISTICS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Globe size={16} className="text-sky-600" />
                  Visitor Origin Statistics
                </h4>

                <div className="space-y-3 font-mono">
                  {Array.from(new Set(dashboardResponses.map(r => r.nationality))).slice(0, 4).map(nat => {
                     const natCount = dashboardResponses.filter(r => r.nationality === nat).length;
                     const pctOfTotal = totalReviewsCount > 0 ? (natCount / totalReviewsCount) * 100 : 0;
                     return (
                       <div key={nat} className="space-y-1 text-xs">
                         <div className="flex justify-between font-bold text-slate-705">
                           <span className="font-sans font-semibold">{nat}</span>
                           <span>{natCount} ({pctOfTotal.toFixed(0)}%)</span>
                         </div>
                         <div className="h-1.5 bg-slate-100 rounded-full">
                           <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pctOfTotal}%` }} />
                         </div>
                       </div>
                     );
                  })}
                  {dashboardResponses.length === 0 && <p className="text-xs text-slate-400 font-sans italic font-medium">No tourist demographic logs yet.</p>}
                </div>
              </div>

              {/* AGE STATISTICS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users size={16} className="text-cyan-600" />
                  Age Demographics
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                  {['18-24', '25-34', '35-44', '45-54'].map(bracket => {
                    const bracketCount = dashboardResponses.filter(r => r.ageGroup === bracket).length;
                    return (
                      <div key={bracket} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="block text-slate-400 text-[10px] uppercase font-bold font-mono">{bracket} yrs</span>
                        <strong className="text-lg text-slate-800 block mt-1 font-mono">{bracketCount} <span className="text-[10px] text-slate-400 font-sans font-medium block">respondents</span></strong>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION MATRIX (CRUD) */}
      {activeTab === 'questions' && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Satisfaction Metric Settings</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Configure active evaluation metrics. Edits appear instantly inside tourist & staff survey interfaces.</p>
            </div>
            
            <button
              onClick={() => setIsAddingQ(!isAddingQ)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              {isAddingQ ? <X size={14} /> : <Plus size={14} />}
              {isAddingQ ? 'Cancel' : 'Add Evaluation Question'}
            </button>
          </div>

          {/* ADD QUESTION FORM */}
          {isAddingQ && (
            <form onSubmit={handleCreateQuestion} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 max-w-xl animate-fade-in">
              <h4 className="font-bold text-slate-800 text-sm">Add New Survey Question</h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-450 uppercase block">Question Verbal Query</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., How clean were the floating cottages at San Pedro?"
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Category Theme</label>
                  <select
                    value={newQCategory}
                    onChange={(e) => setNewQCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="Cleanliness">Cleanliness & Waste</option>
                    <option value="Hospitality">Hospitality & Guides</option>
                    <option value="Safety">Safety & Rescue responders</option>
                    <option value="Accessibility">Accessibility & Roads</option>
                    <option value="Accommodation">Accommodation & Stores</option>
                    <option value="Attraction Quality">Attraction Splendor & Rating</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Answer Format</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="rating">1-5 Rating Star Scale</option>
                    <option value="yes_no">Yes / No Selection</option>
                    <option value="text">Custom Comments Input</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Save Metric Question
              </button>
            </form>
          )}

          {/* LIST MATRIX QUESTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map((q, idx) => {
              const isEditing = editingQId === q.id;
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between gap-4">
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Edit Question Text</label>
                        <textarea
                          rows={2}
                          value={editQText}
                          onChange={(e) => setEditQText(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Category</label>
                          <select
                            value={editQCategory}
                            onChange={(e) => setEditQCategory(e.target.value as any)}
                            className="p-1.5 border border-slate-200 rounded-md text-xs w-full bg-white font-semibold text-slate-700"
                          >
                            <option value="Cleanliness">Cleanliness</option>
                            <option value="Hospitality">Hospitality</option>
                            <option value="Safety">Safety</option>
                            <option value="Accessibility">Accessibility</option>
                            <option value="Accommodation">Accommodation</option>
                            <option value="Attraction Quality">Attraction Quality</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Type</label>
                          <select
                            value={editQType}
                            onChange={(e) => setEditQType(e.target.value as any)}
                            className="p-1.5 border border-slate-200 rounded-md text-xs w-full bg-white font-semibold text-slate-700"
                          >
                            <option value="rating">Rating</option>
                            <option value="yes_no">Yes/No</option>
                            <option value="text">Text Comments</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveQuestionEdit(q.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingQId(null)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {q.category}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* Toggle Active status */}
                          <button
                            onClick={() => onUpdateQuestion(q.id, { isActive: !q.isActive })}
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              q.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-150 bg-slate-100 text-slate-500'
                            }`}
                          >
                            {q.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm leading-relaxed">
                        Q{idx+1}: {q.text}
                      </h4>
                      
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">
                        Answer Layout: <strong className="text-slate-650">{q.type}</strong>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50 justify-end">
                      <button
                        onClick={() => {
                          setEditingQId(q.id);
                          setEditQText(q.text);
                          setEditQCategory(q.category);
                          setEditQType(q.type);
                        }}
                        className="p-1 px-2.5 bg-slate-50 border border-slate-100 hover:border-sky-305 rounded text-xs text-slate-650 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit size={12} /> Edit Text
                      </button>
                      <button
                        onClick={async () => {
                          const yes = window.confirm("Are you sure you want to delete this question? This resets stored answers for this index.");
                          if (yes) await onDeleteQuestion(q.id);
                        }}
                        className="p-1 px-2 bg-slate-50 border border-slate-100 hover:border-rose-400 rounded text-xs text-rose-600 cursor-pointer transition-colors"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DESTINATION PLACES MANAGEMENT */}
      {activeTab === 'destinations' && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-850 text-base">Hinunangan Monitored Destinations</h3>
              <p className="text-xs text-slate-400 mt-1">Configure Southern Leyte destination nodes surveyed inside the local satisfaction module.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search destinations..."
                value={destSearchQuery}
                onChange={(e) => setDestSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs w-full sm:w-48 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              
              <button
                onClick={() => setIsAddingDest(!isAddingDest)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                {isAddingDest ? <X size={14} /> : <Plus size={14} />}
                {isAddingDest ? 'Cancel' : 'Add New Destination'}
              </button>
            </div>
          </div>

          {/* ADD DESTINATION FORM */}
          {isAddingDest && (
            <form onSubmit={handleCreateDestination} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 max-w-xl animate-fade-in">
              <h4 className="font-bold text-slate-800 text-sm">Register Monitored Tourism Destination</h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-450 uppercase block">Destination Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pong Gamay Snorkeling Sanctuary"
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Category Node</label>
                  <select
                    value={newDestCategory}
                    onChange={(e) => setNewDestCategory(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="Island">Island Paradise</option>
                    <option value="Beach">Surfing & Sand Beach</option>
                    <option value="Spring">Cold Spring Oasis</option>
                    <option value="Heritage">Heritage Plaza & Ruins</option>
                    <option value="Adventure">Active Canopy / Diving</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Barangay Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brgy. San Pablo, Hinunangan"
                    value={newDestLoc}
                    onChange={(e) => setNewDestLoc(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-450 uppercase block font-bold">Brief Narrative Description</label>
                <textarea
                  rows={2}
                  placeholder="Summarize coordinates or key spots..."
                  value={newDestDesc}
                  onChange={(e) => setNewDestDesc(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-all cursor-pointer"
              >
                Create Destination Node
              </button>
            </form>
          )}

          {/* LIST DESTINATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations
              .filter(dest => 
                dest.name.toLowerCase().includes(destSearchQuery.toLowerCase()) ||
                dest.location.toLowerCase().includes(destSearchQuery.toLowerCase()) ||
                dest.category.toLowerCase().includes(destSearchQuery.toLowerCase())
              )
              .map((dest) => {
              const isEditing = editingDestId === dest.id;
              return (
                <div key={dest.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between gap-4">
                  {isEditing ? (
                    <div className="space-y-3 font-semibold text-xs">
                      <div>
                        <label className="block mb-0.5">Name</label>
                        <input
                          type="text"
                          value={editDestName}
                          onChange={(e) => setEditDestName(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg w-full text-slate-800"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block mb-0.5">Category</label>
                          <select
                            value={editDestCategory}
                            onChange={(e) => setEditDestCategory(e.target.value as any)}
                            className="p-2 border border-slate-200 rounded-lg w-full bg-white text-slate-705"
                          >
                            <option value="Island">Island</option>
                            <option value="Beach">Beach</option>
                            <option value="Spring">Spring</option>
                            <option value="Heritage">Heritage</option>
                            <option value="Adventure">Adventure</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-0.5">Barangay</label>
                          <input
                            type="text"
                            value={editDestLoc}
                            onChange={(e) => setEditDestLoc(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg w-full text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block mb-0.5">Description</label>
                        <textarea
                          rows={2}
                          value={editDestDesc}
                          onChange={(e) => setEditDestDesc(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg w-full text-slate-800 text-[11px]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveDestinationEdit(dest.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDestId(null)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          dest.category === 'Island' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          dest.category === 'Beach' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-cyan-50 text-cyan-700 border border-cyan-100'
                        }`}>
                          {dest.category}
                        </span>

                        <span className="flex items-center gap-1 font-bold text-amber-500 text-xs">
                          ★ {dest.averageRating.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal font-mono">({dest.totalReviews})</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{dest.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                          <MapPin size={10} /> {dest.location}
                        </span>
                      </div>

                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                        {dest.description || 'No descriptive narrative created.'}
                      </p>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setEditingDestId(dest.id);
                          setEditDestName(dest.name);
                          setEditDestCategory(dest.category);
                          setEditDestDesc(dest.description);
                          setEditDestLoc(dest.location);
                        }}
                        className="p-1 px-2.5 bg-slate-50 border border-slate-100 hover:border-sky-305 rounded text-xs text-slate-650 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit size={12} /> Edit Nodes
                      </button>
                      <button
                        onClick={async () => {
                          const yes = window.confirm(`Really delete "${dest.name}" attraction? Surveys corresponding to this spot will lose pointer.`);
                          if (yes) await onDeleteDestination(dest.id);
                        }}
                        className="p-1 px-2 bg-slate-50 border border-slate-100 hover:border-rose-450 rounded text-xs text-rose-600 cursor-pointer transition-colors"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RESPONSES SEARCH DATABASE */}
      {activeTab === 'responses' && (
        <div className="space-y-6 text-left">
          
          <div className="max-w-xl">
            <h3 className="font-extrabold text-slate-850 text-base">Survey Submissions Database</h3>
            <p className="text-xs text-slate-400 mt-1">In-depth feedback log. Review scores, remarks, user origins, and assistant encoders details.</p>
          </div>

          {/* ADVANCED FILTER UTILITY BAR */}
          <div className="bg-slate-50 p-4 border border-slate-250/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
              {/* Search text input */}
              <input
                type="text"
                placeholder="Search name/comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs w-full sm:w-48 font-medium focus:outline-none"
              />

              {/* Destination Filter */}
              <select
                value={selectedDestFilter}
                onChange={(e) => setSelectedDestFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="">All Destinations</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Age Bracket Filter */}
              <select
                value={selectedArgFilter}
                onChange={(e) => setSelectedArgFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="">All Age Brackets</option>
                <option value="Under 18">Under 18</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-400">
              Filtering <strong className="text-slate-700">{filteredResponses.length}</strong> of {responses.length} Submissions
            </div>
          </div>

          {/* GRID OF SURVEY RESPONSES */}
          <div className="space-y-4">
            {filteredResponses.map((resp) => {
              const site = destinations.find(d => d.id === resp.destinationId);
              return (
                <div 
                  key={resp.id} 
                  className="bg-white border border-slate-200 p-5 rounded-2xl hover:border-sky-305 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-800 text-sm">{resp.touristName}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">• {resp.nationality}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">• age: {resp.ageGroup}</span>
                      {resp.encodedBy && resp.encodedBy !== 'self' && (
                        <span className="text-[9px] bg-sky-50 border border-sky-100 text-sky-700 px-2 py-0.5 font-bold rounded uppercase">
                          Enc: {resp.encodedBy.replace("Staff Assist: Staff Member ", "").replace("Staff Assist: ", "")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                        {site?.name || 'Landmark'}
                      </span>
                      <RatingStars value={resp.overallRating} size={13} />
                      <span className="font-bold text-slate-500">({resp.overallRating}/5)</span>
                    </div>

                    {resp.feedbackText && (
                      <p className="text-xs text-slate-500 italic max-w-2xl bg-slate-50/50 p-2 rounded-lg mt-1 border border-slate-100">
                        "{resp.feedbackText}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setFocusedResponse(resp)}
                      className="px-3.5 py-1.5 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Inspect Sheet
                    </button>
                    <button
                      onClick={async () => {
                        alert("Response deleting is protected. Reset database under header options if clearing stats.");
                      }}
                      className="p-1.5 border border-slate-200 hover:border-rose-400 rounded-xl text-rose-600 text-xs"
                    >
                      🔒 Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredResponses.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Sliders size={35} className="mx-auto mb-2 text-slate-350" />
                <h4 className="font-bold text-slate-500">No matching reviews</h4>
                <p className="text-xs mt-0.5">Please check filter keyword configurations.</p>
              </div>
            )}
          </div>

          {/* SHEET DETAILS MODAL POPUP */}
          {focusedResponse && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 animate-scale-up">
                
                <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Full Survey Evaluation Sheet</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Surveys Submission ID: {focusedResponse.id.substring(0, 12)}</p>
                  </div>
                  
                  <button 
                    onClick={() => setFocusedResponse(null)}
                    className="p-1 px-2 text-slate-400 hover:text-slate-800 font-extrabold text-sm"
                  >
                    Close [X]
                  </button>
                </div>

                <div className="p-6 space-y-5 text-xs text-left">
                  
                  {/* Respondent specs */}
                  <div className="grid grid-cols-2 gap-3 text-slate-600 font-medium">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Respondent</span>
                      <strong className="text-slate-800 text-sm block mt-0.5">{focusedResponse.touristName}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Nationality</span>
                      <strong className="text-slate-800 block mt-0.5">{focusedResponse.nationality}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Age bracket</span>
                      <strong className="text-slate-800 block mt-0.5">{focusedResponse.ageGroup}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Overall rating</span>
                      <strong className="text-teal-600 block mt-0.5 font-black text-sm">★ {focusedResponse.overallRating} / 5.0</strong>
                    </div>
                  </div>

                  {/* Questionnaire answers details */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b pb-1.5">Submitted answers</h4>

                    {questions.map((q) => {
                      const ansVal = focusedResponse.answers[q.id];
                      if (ansVal === undefined) return null;

                      return (
                        <div key={q.id} className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                          <p className="text-slate-800 font-medium">{q.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {q.type === 'rating' && <RatingStars value={ansVal} size={12} />}
                            {q.type === 'yes_no' && (
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ansVal === true ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {ansVal === true ? 'Yes' : 'No'}
                              </span>
                            )}
                            {q.type === 'text' && <span className="text-sky-700 font-semibold italic">"{ansVal || 'No comment'}"</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {focusedResponse.feedbackText && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall experience Remarks</span>
                      <p className="p-3 bg-sky-50 text-sky-900 rounded-xl max-w-full italic text-xs leading-relaxed border border-sky-100">
                        "{focusedResponse.feedbackText}"
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-405 font-medium text-slate-400">
                    <span>Date: {new Date(focusedResponse.dateSubmitted).toLocaleString()}</span>
                    <span>Encoded: {focusedResponse.encodedBy || 'self'}</span>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 5: GEMINI ECOTOURISM STRATEGIC ADVISER */}
      {activeTab === 'ai' && (
        <div className="space-y-8 text-left max-w-4xl mx-auto">
          
          {/* TRIGGER HEADER ROW */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-5 flex items-center pr-8 pointer-events-none">
              <Sparkles size={200} />
            </div>

            <div className="space-y-2 z-10">
              <span className="bg-white/10 px-3 py-1 rounded-full text-[9px] uppercase font-bold tracking-wider">
                Google GenAI Cognitive Module
              </span>
              <h2 className="text-2xl font-black">Ecotourism Advisor (SWOT & Action Matrix)</h2>
              <p className="text-slate-350 text-xs max-w-xl font-medium">
                Synthesize recent survey responses. Gemini crawls metrics, computes SWOT items for Hinunangan, and drafts municipal guidelines.
              </p>
            </div>

            <button
              onClick={triggerAIAdvisorReport}
              disabled={aiLoading}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 z-10"
            >
              <Sparkles className="text-sky-600 shrink-0" size={14} />
              {aiLoading ? 'Synthesizing...' : 'Saturate Data & Synthesize'}
            </button>
          </div>

          {aiNotification && (
            <div className="p-4 bg-sky-50 border border-sky-100 text-sky-850 text-xs rounded-xl flex items-start gap-2 max-w-full italic font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{aiNotification}</span>
            </div>
          )}

          {/* STRATEGIC PRINT REPORT LAYOUT */}
          {aiReport ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 real-report relative">
              
              {/* Formal municipal letterhead header */}
              <div className="border-b-2 border-double border-slate-350 pb-6 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700">Official Municipal Strategy briefing</span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">MUNICIPAL TOURISM ADVISORY REPORT</h2>
                <h3 className="text-xs font-bold text-slate-500">HINUNANGAN OFFICE OF TOURISM & HERITAGE SERVICES, SOUTHERN LEYTE</h3>
                <div className="text-[10px] text-slate-400 font-bold mt-2">
                  GENERATED COGNITIVELY ON: {new Date(aiReport.generatedAt).toLocaleString()} • PLATFORM: GEMINI-3.5-FLASH
                </div>
              </div>

              {/* OVERALL SATISFACTION INDEX EXECUTIVE BRIEF */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 block">1. Executive Overview Assessment</span>
                <p className="text-sm font-semibold leading-relaxed text-slate-800 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  📌 {aiReport.overallSatisfaction}
                </p>
              </div>

              {/* SWOT ANALYTICAL GRID */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 block">2. Strategic SWOT Matrix (Hinunangan Eco-System)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* STRENGTHS */}
                  <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                    <h4 className="font-extrabold text-emerald-800 text-xs uppercase tracking-wide flex items-center gap-1">
                      💪 Strengths (Lakas)
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-950 font-medium leading-relaxed">
                      {aiReport.swotAnalysis.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* WEAKNESSES */}
                  <div className="p-5 bg-rose-50/30 border border-rose-100 rounded-2xl space-y-2">
                    <h4 className="font-extrabold text-rose-800 text-xs uppercase tracking-wide flex items-center gap-1">
                      ⚠️ Weaknesses (Kahinahan)
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-rose-950 font-medium leading-relaxed">
                      {aiReport.swotAnalysis.weaknesses.map((wk, idx) => (
                        <li key={idx}>{wk}</li>
                      ))}
                    </ul>
                  </div>

                  {/* OPPORTUNITIES */}
                  <div className="p-5 bg-cyan-50/30 border border-cyan-100 rounded-2xl space-y-2">
                    <h4 className="font-extrabold text-cyan-800 text-xs uppercase tracking-wide flex items-center gap-1">
                      🚀 Opportunities (Oportunidad)
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-cyan-950 font-medium leading-relaxed">
                      {aiReport.swotAnalysis.opportunities.map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* THREATS */}
                  <div className="p-5 bg-amber-50/30 border border-amber-100 rounded-2xl space-y-2">
                    <h4 className="font-extrabold text-amber-800 text-xs uppercase tracking-wide flex items-center gap-1">
                      🛑 Threats (Banta)
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-amber-950 font-medium leading-relaxed">
                      {aiReport.swotAnalysis.threats.map((thr, idx) => (
                        <li key={idx}>{thr}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* SPECIFIC DESTINATION ACTIONS */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 block">3. Destination Area Spot-Repairs & Observations</span>
                
                <div className="space-y-3.5">
                  {aiReport.destinationInsights.map((ins, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {ins.destinationName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 font-medium leading-relaxed mt-1">
                        <strong>Observer Insight:</strong> {ins.insight}
                      </p>
                      <p className="text-xs text-sky-850 bg-sky-50/40 p-2 border border-sky-100/30 rounded-lg font-medium leading-relaxed flex gap-1.5">
                        <strong className="shrink-0 text-sky-700 leading-tight">🔧 Directive:</strong>
                        <span>{ins.recommendation}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION RECOMMENDATIONS */}
              <div className="space-y-3.5 pt-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 block">4. Municipal Director's Strategic Mandates</span>
                
                <div className="space-y-2 text-xs font-semibold">
                  {aiReport.strategicRecommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm font-semibold flex items-start gap-2 text-slate-705">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        {rIdx+1}
                      </span>
                      <p className="leading-relaxed pt-0.5">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign stamp */}
              <div className="pt-8 border-t border-slate-100 flex flex-col items-end mr-6 space-y-1">
                <div className="w-24 h-0.5 bg-slate-350" />
                <span className="text-[11px] font-bold text-slate-800">Hinunangan Advisory Board</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">Southern Leyte Philippines</span>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <FileText size={45} className="mx-auto text-slate-300 mb-2" />
              <h4 className="font-extrabold text-slate-600">Pending Review Analysis</h4>
              <p className="text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                Click on the "Saturate Data & Synthesize" button above to execute server-side cognitive evaluations. Fits metrics and comments into a strategic SWOT directive.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 6: SECURITY AUDIT LOGGER */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-left space-y-5 shadow-xs">
          <div>
            <h3 className="font-extrabold text-slate-850 text-base">Full System Audit Security Trail</h3>
            <p className="text-xs text-slate-400 mt-1">Audit trail mapping actions initiated by the Director, Assistant Encoders, or Respondent self-submits.</p>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100 text-xs">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">• {log.actorName}</span>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-xl">{log.details}</p>
                </div>

                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-2 font-mono">
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold text-center border ${
                    log.userRole === 'Admin' ? 'bg-slate-900 text-white border-slate-950 font-sans' :
                    log.userRole === 'Staff' ? 'bg-sky-50 text-sky-700 border-sky-100 font-sans' :
                    'bg-slate-50 text-slate-600 border-slate-200 font-sans'
                  }`}>
                    {log.userRole}
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}

            {activityLogs.length === 0 && <p className="p-6 text-center text-slate-400 italic">No logs recorded.</p>}
          </div>
        </div>
      )}

      {/* TAB 7: USER ACCOUNTS PERSONNEL SYSTEM */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-850 text-base">Municipal Personnel Access Accounts</h3>
              <p className="text-xs text-slate-400 mt-1">Configure and inspect authorized staff/directorship account keys for Hinunangan Tourism administration.</p>
            </div>
            
            <button
              onClick={() => {
                setIsAddingUser(!isAddingUser);
                setUserError('');
                setUserSuccess('');
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              {isAddingUser ? <X size={14} /> : <Plus size={14} />}
              {isAddingUser ? 'Cancel Registration' : 'Register New Account'}
            </button>
          </div>

          {/* ADD ACCOUNT FORM */}
          {isAddingUser && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 max-w-xl animate-fade-in">
              <h4 className="font-bold text-slate-800 text-sm">Register Authorized Tourism Operator</h4>
              
              {userError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{userSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Full Officer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 text-slate-805 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Office Email</label>
                  <input
                    type="email"
                    placeholder="e.g. m.clara@leyte.gov.ph"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 text-slate-805 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Unique Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. maria_clara"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 text-slate-805 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-450 uppercase block">Registry Password</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. securePass123"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 text-slate-805 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-450 uppercase block">Authorized Security Role</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit">
                  <button
                    type="button"
                    onClick={() => setRoleInput('Staff')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleInput === 'Staff' ? 'bg-sky-50 text-sky-850 font-extrabold border border-sky-100' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Municipal Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleInput('Admin')}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      roleInput === 'Admin' ? 'bg-slate-900 text-white font-extrabold border border-slate-950' : 'text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    Tourism Director
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-all cursor-pointer shadow-sm"
              >
                Register Security Key
              </button>
            </form>
          )}

          {/* ACTIVE ACCOUNTS LIST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usersList.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Role badge */}
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] uppercase font-bold border ${
                      user.role === 'Admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-750' : 'bg-sky-50 border-sky-100 text-sky-800'
                    }`}>
                      {user.role} Member
                    </span>

                    {/* Deletion protection indicator */}
                    {user.username === 'admin' ? (
                      <span className="text-[10px] text-slate-405 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">🛡️ SYSTEM OWNER</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="p-1 px-2 border border-rose-100 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        title="Revoke Account Access"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-850 text-sm">{user.name}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold break-all leading-normal">{user.email || 'No email registered'}</p>
                    </div>
                  </div>
                </div>

                {/* Technical credentials info */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 font-mono text-[10.5px]">
                  <div className="flex justify-between items-center text-slate-705">
                    <span className="font-sans font-bold text-[9.5px] uppercase tracking-wider text-slate-400">Username:</span>
                    <span className="font-bold text-slate-800 bg-white border border-slate-200/60 px-2 py-0.5 rounded">{user.username}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-705 mt-2">
                    <span className="font-sans font-bold text-[9.5px] uppercase tracking-wider text-slate-400">Password:</span>
                    <span className="font-bold text-slate-750 bg-white border border-slate-200/60 px-2 py-0.5 rounded">{user.password || '••••••••'}</span>
                  </div>
                </div>
              </div>
            ))}

            {usersList.length === 0 && (
              <p className="text-sm text-slate-400 italic py-6 col-span-3 text-center">Loading accounts records...</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
