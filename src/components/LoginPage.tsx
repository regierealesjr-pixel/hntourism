import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Waves, KeyRound, User as UserIcon, Globe, MapPin, Sparkles, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'tourist' | 'official'>('tourist');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDemoGuide, setShowDemoGuide] = useState(true);

  // Loaded database user accounts to allow dynamic login
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbUsers(data);
        }
      })
      .catch(err => console.error("Could not fetch user accounts list", err));
  }, []);

  // Tourist Registration States
  const [touristName, setTouristName] = useState('Explorer');
  const [touristEmail, setTouristEmail] = useState('');
  const [nationality, setNationality] = useState('Philippines');
  const [ageGroup, setAgeGroup] = useState('25-34');

  // Official Login States
  const [officialRole, setOfficialRole] = useState<'Staff' | 'Admin'>('Staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Dropdown lists
  const nationalities = [
    "Philippines", "Japan", "Australia", "USA", "Germany", 
    "Canada", "United Kingdom", "France", "South Korea", 
    "Singapore", "Taiwan", "Other"
  ];
  const ageGroups = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];

  // Handle Tourist Access
  const handleTouristSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!touristName.trim()) {
      setErrorMsg('Please specify a screen name or select Guest');
      return;
    }
    setErrorMsg('');
    const userObj: User = {
      id: `tourist_${Date.now()}`,
      name: touristName.trim(),
      email: touristEmail.trim() || undefined,
      role: 'Tourist',
      username: `guest_${touristName.toLowerCase().replace(/\s+/g, '_')}`,
      nationality,
      ageGroup
    };
    onLogin(userObj);
  };

  // Handle Official Login
  const handleOfficialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const uName = username.trim().toLowerCase();
    const uPass = password.trim();

    if (!uName || !uPass) {
      setErrorMsg('Please enter both your credentials');
      return;
    }

    // Match with database users first!
    const matchedUser = dbUsers.find(u => u.username.toLowerCase() === uName);
    if (matchedUser) {
      if (matchedUser.password === uPass) {
        if (matchedUser.role !== officialRole) {
          setErrorMsg(`This account resides under the ${matchedUser.role} registry, not ${officialRole}. Please toggle above.`);
          return;
        }
        onLogin({
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          username: matchedUser.username
        });
        return;
      } else {
        setErrorMsg('Invalid password credentials. Please verify your password.');
        return;
      }
    }

    // Static fallback if API is not loaded yet
    if (officialRole === 'Admin') {
      if (uName === 'admin' && uPass === 'admin123') {
        const userObj: User = {
          id: 'admin_01',
          name: 'Director Rose ann Sumacot',
          email: 'dir.roseann@leyte.gov.ph',
          role: 'Admin',
          username: 'admin'
        };
        onLogin(userObj);
      } else {
        setErrorMsg('Invalid Administrator credentials. Try: admin / admin123');
      }
    } else {
      if (uName === 'staff' && uPass === 'staff123') {
        const userObj: User = {
          id: 'staff_01',
          name: 'Staff Assist: Joven R.',
          email: 'staff.joven@leyte.gov.ph',
          role: 'Staff',
          username: 'staff'
        };
        onLogin(userObj);
      } else {
        setErrorMsg('Invalid Official Staff credentials. Try: staff / staff123');
      }
    }
  };

  const autofillOfficial = (roleType: 'Staff' | 'Admin') => {
    setErrorMsg('');
    setActiveTab('official');
    setOfficialRole(roleType);
    if (roleType === 'Admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('staff');
      setPassword('staff123');
    }
  };

  return (
    <div id="login-screen-view" className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased">
      
      {/* Top minimalistic header/brand */}
      <header className="py-6 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md">
              <Waves size={20} />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-slate-900 tracking-tight text-base block font-sans">HINUNANGAN PORTAL</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">Satisfaction & Policy Module</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SECURE ENTRY GATEWAY</span>
          </div>
        </div>
      </header>

      {/* Main Form content and background */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-10">
        
        {/* Left Side: Welcoming information about Southern Leyte / Hinunangan */}
        <div className="flex-1 text-left space-y-6 max-w-md hidden lg:block">
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 font-mono flex items-center gap-1.5">
              <Sparkles size={11} />
              Southern Leyte Eco-Sanctuaries
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              Empowering Hinunangan Tourism through Real Feedback.
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Welcome to the Tourist Satisfaction Survey & Smart Policy System. We gather genuine guest experiences to optimize beautiful spots like San Pedro, San Pablo islets, and local reserves.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
              <div className="h-40 overflow-hidden relative">
                <img 
                  src="/src/assets/images/hinunangan_paradise_1779325004774.png" 
                  alt="Beautiful Twin Islands of Hinunangan, Southern Leyte" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-[9px] text-white font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono">
                  📍 San Pedro & San Pablo Islets
                </span>
              </div>
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-slate-500 font-medium text-[11px] leading-relaxed">
                Hinunangan's pristine gem islets feature calm, shallow crystal channels, coconut-fringed shorelines, and peaceful outrigger fishing canoes.
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Globe size={16} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800">For Travelers</h4>
                <p className="text-[11px] text-slate-500 font-medium">Log in to safely upload your rating inputs, cleanliness reports, and local recommendations.</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <KeyRound size={16} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800">For Officers & Admin</h4>
                <p className="text-[11px] text-slate-500 font-medium">Verify satisfaction settings, manage survey questions, and synthesize actions with Google GenAI.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms Card Container */}
        <div className="w-full max-w-md">
          
          {/* Main Container Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            
            {/* Header Tabs switcher */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tourist');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'tourist' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserIcon size={14} />
                Tourist Portal
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setActiveTab('official');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'official' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound size={14} />
                Official Personnel
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 text-left">
              
              {/* BRAND CARD HEADER */}
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {activeTab === 'tourist' ? 'Traveler Satisfaction survey' : 'Authorized Access Gate'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {activeTab === 'tourist' 
                    ? 'Help Southern Leyte perfect its local eco-destinations.' 
                    : 'Log in with municipal credentials to check reports.'
                  }
                </p>
              </div>

              {/* ERROR DISPLAY */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. TOURIST FORM PATH */}
              {activeTab === 'tourist' && (
                <form onSubmit={handleTouristSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="tourist-name" className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Full Name / Screen Name</label>
                    <input
                      id="tourist-name"
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={touristName}
                      onChange={(e) => setTouristName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="tourist-email" className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Email Address (Optional)</label>
                    <input
                      id="tourist-email"
                      type="email"
                      placeholder="e.g. john@travels.com"
                      value={touristEmail}
                      onChange={(e) => setTouristEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div className="space-y-1">
                      <label htmlFor="tourist-nationality" className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Nationality</label>
                      <select
                        id="tourist-nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-705 focus:outline-none focus:ring-1 focus:ring-sky-500/20 cursor-pointer"
                      >
                        {nationalities.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="tourist-age" className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Age Bracket</label>
                      <select
                        id="tourist-age"
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-705 focus:outline-none focus:ring-1 focus:ring-sky-500/20 cursor-pointer"
                      >
                        {ageGroups.map(ag => (
                          <option key={ag} value={ag}>{ag} yrs</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs tracking-wide rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Globe size={14} className="shrink-0" />
                    Enter Tourist survey
                  </button>
                </form>
              )}

              {/* 2. OFFICIAL FORM PATH */}
              {activeTab === 'official' && (
                <form onSubmit={handleOfficialSubmit} className="space-y-4">
                  {/* Internal Sub-role toggle widget */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialRole('Staff');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        officialRole === 'Staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-505'
                      }`}
                    >
                      Municipal Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialRole('Admin');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        officialRole === 'Admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-505'
                      }`}
                    >
                      Tourism Director
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="official-user" className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Official Username</label>
                    <input
                      id="official-user"
                      type="text"
                      required
                      placeholder="e.g. staff or admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="space-y-1 pb-1">
                    <label htmlFor="official-pass" className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block">Security Password</label>
                    <input
                      id="official-pass"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wide rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound size={14} className="shrink-0" />
                    Authorized Portal Sign In
                  </button>
                </form>
              )}

            </div>
          </div>

          {/* Quick Demographics / Sandbox Credentials drawer */}
          {showDemoGuide && (
            <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800 flex items-center gap-1 font-mono uppercase tracking-wider text-[10px]">
                  <HelpCircle size={12} /> Sandbox Access Credentials
                </span>
                <button 
                  onClick={() => setShowDemoGuide(false)}
                  className="text-[10px] text-amber-600 hover:text-amber-800 font-bold underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[11px] text-amber-705 leading-relaxed">
                Use the quick buttons below of click to auto-fill sandbox accounts to examine director charts, logs, and simulated forms instantly:
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => autofillOfficial('Staff')}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-850 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  👤 Staff: staff / staff123
                </button>
                <button
                  type="button"
                  onClick={() => autofillOfficial('Admin')}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-850 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  🔑 Admin: admin / admin123
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 border-t border-slate-100 bg-white text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
        Hinunangan Office of Tourism & Eco-Management • Southern Leyte Government
      </footer>

    </div>
  );
}
