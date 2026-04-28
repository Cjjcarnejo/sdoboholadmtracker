import React from 'react';
import { LayoutDashboard, Users, GraduationCap, AlertCircle, Plus, Search, Filter, Trash2, X, ChevronDown, Calendar, School, MapPin, LogOut, Key, Mail, Lock, User as UserIcon, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StudentRecord, Gender, Grade, ReasonForADM, AcademicStatus, Assessment, OperationType } from './types';
import { DISTRICTS, GRADES, REASONS, ACADEMIC_STATUSES, SCHOOLS_BY_DISTRICT, ASSESSMENTS, DISTRICTS_BY_CD } from './constants';
import { auth, signInWithGoogle, logOut, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, createUserProfile, getUserProfile, handleFirestoreError } from './lib/firebase';
import { getADMAssessmentRecommendation } from './services/geminiService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where, orderBy, serverTimestamp } from 'firebase/firestore';

// --- Components ---

const StatsCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [showSignup, setShowSignup] = React.useState(false);
  const [records, setRecords] = React.useState<StudentRecord[]>([]);
  const [appUsers, setAppUsers] = React.useState<any[]>([]);
  const [currentView, setCurrentView] = React.useState<'overview' | 'students' | 'districts' | 'schools' | 'registered-users'>('overview');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState<StudentRecord | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterDistrict, setFilterDistrict] = React.useState('');
  const [filterSchool, setFilterSchool] = React.useState('');
  const [selectedCD, setSelectedCD] = React.useState<string>('');
  const [filterGender, setFilterGender] = React.useState('');
  const [filterGrade, setFilterGrade] = React.useState('');
  const [isDistrictNavOpen, setIsDistrictNavOpen] = React.useState(false);
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const adminClickCount = React.useRef(0);

  // Hidden Admin Toggle
  React.useEffect(() => {
    if (window.location.search.includes('admin=true')) {
      setShowAdminLogin(true);
    }
  }, []);

  const handleLogoClick = () => {
    adminClickCount.current += 1;
    if (adminClickCount.current >= 5) {
      setShowAdminLogin(prev => !prev);
      adminClickCount.current = 0;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Auth Listener
  React.useEffect(() => {
    // Check if Firebase is actually initialized
    if (!auth || auth.isPlaceholder) {
      setAuthError('Firebase initialization failed (Invalid API Keys). Please ensure the project is properly configured via the setup tool.');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        let profile = await getUserProfile(currentUser.uid);
        
        // Force admin role for the system administrator email
        if (currentUser.email === 'cjjcarnejo@gmail.com') {
          if (profile) {
            profile.role = 'admin';
          } else {
            profile = {
              uid: currentUser.uid,
              email: currentUser.email,
              fullName: currentUser.displayName || 'System Administrator',
              role: 'admin',
              congressionalDistrict: '',
              district: '',
              school: '',
              createdAt: Date.now()
            };
          }
        }

        if (profile) {
          setUserProfile(profile);
        } else if (!showSignup) {
          // If logged in via Auth but no profile and NOT in signup flow, sign out
          await logOut();
          setAuthError('Account not found or has been disabled by the administrator.');
          setUser(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [showSignup]);

  const handleGoogleSignIn = async () => {
    if (!auth || auth.isPlaceholder) {
      setAuthError('Authentication service is not available (Setup Required).');
      return;
    }
    setIsAuthLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('A sign-in window is already open. Please check your browser tabs.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Do nothing, standard behavior
      } else {
        setAuthError(err.message || 'Authentication failed');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Data Listener
  React.useEffect(() => {
    if (!user || !userProfile || !db || db.isPlaceholder) {
      setRecords([]);
      return;
    }

    let q;
    if (userProfile.role === 'admin') {
      // Admins see all records
      q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    } else {
      // Regular users only see their own records
      q = query(
        collection(db, 'students'), 
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as StudentRecord[];
      setRecords(docs);
      setAuthError(''); // Clear any previous connectivity errors on success
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  // Users Listener
  React.useEffect(() => {
    if (!user || userProfile?.role !== 'admin') {
      setAppUsers([]);
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setAppUsers(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  const addRecord = async (newRecord: Omit<StudentRecord, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      const studentData = {
        ...newRecord,
        assessment: 'Pending',
        createdAt: Date.now(),
        createdBy: user.uid
      };
      await addDoc(collection(db, 'students'), studentData);
      setIsFormOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
    }
  };

  const updateRecord = async (id: string, updatedData: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'students', id), {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      setEditingRecord(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${id}`);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-deped-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-950 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {!showSignup ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg bg-white rounded-3xl p-10 shadow-2xl text-center"
            >
              <div className="flex justify-center mb-8">
                <button 
                  onClick={handleLogoClick}
                  className="bg-white p-2 rounded-full shadow-lg border-4 border-deped-yellow transition-transform active:scale-95"
                >
                  <img 
                    src="https://www.image2url.com/r2/default/images/1776821241074-086bda7a-d6fb-4686-b45d-57fc7d9cc86b.jpg" 
                    alt="ADM Logo" 
                    className="w-20 h-20 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">SDO Bohol - ADM Tracker</h1>
              
              <LoginForm 
                onSuccess={() => {}} 
                onToggleSignup={() => setShowSignup(true)} 
              />

              {authError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-deped-red mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-deped-red text-left">{authError}</p>
                </div>
              )}
              
              <AnimatePresence>
                {showAdminLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="my-8 h-px bg-slate-100 w-full" />
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={isAuthLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-95 group disabled:opacity-50"
                    >
                      <div className="w-6 h-6 flex items-center justify-center bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Key className="w-3.5 h-3.5 text-deped-blue" />
                      </div>
                      {isAuthLoading ? 'Please wait...' : 'Sign in with Administrator Account'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg bg-white rounded-3xl p-10 shadow-2xl"
            >
              <div className="flex justify-center mb-8">
                <div className="bg-white p-2 rounded-full shadow-lg border-4 border-deped-yellow">
                  <img 
                    src="https://www.image2url.com/r2/default/images/1776821241074-086bda7a-d6fb-4686-b45d-57fc7d9cc86b.jpg" 
                    alt="ADM Logo" 
                    className="w-20 h-20 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">Create Account</h1>
              </div>

              <SignupForm 
                onSuccess={() => setShowSignup(false)} 
                onCancel={() => setShowSignup(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.school.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = filterDistrict === '' 
      ? (selectedCD === '' || DISTRICTS_BY_CD[selectedCD]?.some(d => d.toUpperCase() === r.district.toUpperCase()))
      : r.district.toUpperCase() === filterDistrict.toUpperCase();
    const matchesSchool = filterSchool === '' || r.school === filterSchool;
    const matchesGender = filterGender === '' || r.gender === filterGender;
    return matchesSearch && matchesDistrict && matchesSchool && matchesGender;
  }).sort((a, b) => a.studentName.toLowerCase().localeCompare(b.studentName.toLowerCase()));

  const availableSchoolsForFilter = filterDistrict && SCHOOLS_BY_DISTRICT[filterDistrict.toUpperCase()] 
    ? SCHOOLS_BY_DISTRICT[filterDistrict.toUpperCase()] 
    : [];

  const operationalUsers = appUsers.filter(u => u.email !== 'cjjcarnejo@gmail.com');
  const totalStudents = records.length;
  const mostCommonReason = records.length > 0 
    ? records.reduce((acc, curr) => {
        acc[curr.reasonForADM] = (acc[curr.reasonForADM] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : null;
  const topReason = mostCommonReason && Object.keys(mostCommonReason).length > 0
    ? (Object.entries(mostCommonReason) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0] 
    : 'N/A';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-950 text-white flex-shrink-0 hidden lg:flex flex-col border-r border-brand-900 shadow-2xl">
        <div className="p-6 flex flex-col h-full">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-white p-1 rounded-full shadow-xl shadow-black/20 overflow-hidden w-[92px] h-[92px] flex items-center justify-center border-4 border-deped-yellow mb-4 transition-transform hover:rotate-3 active:scale-95">
              <img 
                src="https://www.image2url.com/r2/default/images/1776821241074-086bda7a-d6fb-4686-b45d-57fc7d9cc86b.jpg" 
                alt="ADM Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase">ADM Tracker</h1>
          </div>
          
          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="mb-4">
              <p className="text-[10px] font-black text-brand-100/40 uppercase tracking-widest px-4 mb-2">Main Menu</p>
              <button 
                onClick={() => {
                  setCurrentView('overview');
                  setFilterDistrict('');
                  setFilterSchool('');
                  setSelectedCD('');
                  setFilterGender('');
                  setIsDistrictNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  currentView === 'overview' && !filterDistrict ? 'bg-deped-yellow text-brand-950 shadow-lg shadow-deped-yellow/10' : 'text-brand-100/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                Overview
              </button>
              <button 
                onClick={() => {
                  setCurrentView('students');
                  setFilterDistrict('');
                  setFilterSchool('');
                  setSelectedCD('');
                  setFilterGender('');
                  setIsDistrictNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all mt-1 ${
                  currentView === 'students' && !filterDistrict ? 'bg-deped-yellow text-brand-950 shadow-lg shadow-deped-yellow/10' : 'text-brand-100/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                Students
              </button>

              {user?.email === 'cjjcarnejo@gmail.com' && (
                <>
                  <div className="mt-1">
                    <button 
                      onClick={() => setIsDistrictNavOpen(!isDistrictNavOpen)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        selectedCD || isDistrictNavOpen ? 'bg-white/10 text-white' : 'text-brand-100/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4.5 h-4.5" />
                        Districts
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDistrictNavOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isDistrictNavOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-black/20 rounded-lg mt-1"
                        >
                          <div className="p-2 space-y-1">
                            {['CD1', 'CD2', 'CD3'].map((cd) => (
                              <button
                                key={cd}
                                onClick={() => {
                                  setSelectedCD(cd);
                                  setFilterDistrict('');
                                  setFilterSchool('');
                                  setCurrentView('students');
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-2 ${
                                  selectedCD === cd 
                                    ? 'bg-deped-yellow text-brand-950 shadow-md' 
                                    : 'text-brand-100/50 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedCD === cd ? 'bg-brand-950' : 'bg-brand-100/20'}`} />
                                <span className="truncate">{cd}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={() => {
                      setCurrentView('registered-users');
                      setFilterDistrict('');
                      setFilterSchool('');
                      setSelectedCD('');
                      setFilterGender('');
                      setIsDistrictNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all mt-1 ${
                      currentView === 'registered-users' ? 'bg-deped-yellow text-brand-950 shadow-lg shadow-deped-yellow/10' : 'text-brand-100/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Key className="w-4.5 h-4.5" />
                    Registered Users
                  </button>
                </>
              )}
            </div>
          </nav>
          
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-brand-900 border border-white/10 flex items-center justify-center text-deped-yellow shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 py-1">
                <p className="text-[11px] font-black text-white uppercase whitespace-nowrap overflow-hidden mb-1">
                  {userProfile?.fullName || user?.displayName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[9px] font-bold text-brand-100/40 uppercase tracking-tighter break-all">
                  {user?.email}
                </p>
              </div>
              <button 
                onClick={logOut}
                className="p-1.5 text-brand-100/30 hover:text-deped-red hover:bg-red-500/10 rounded-lg transition-all active:scale-90 group"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 group-hover:rotate-12" />
              </button>
            </div>
            
            <p className="text-[9px] font-medium text-brand-100/20 uppercase tracking-[0.2em] text-center">
              © 2026SDOBohol
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 flex-shrink-0 min-h-[72px]">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
              <img 
                src="https://www.image2url.com/r2/default/images/1776821241074-086bda7a-d6fb-4686-b45d-57fc7d9cc86b.jpg" 
                alt="ADM Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                  {currentView === 'overview' ? 'Overview' : 'Administrative Console'}
                </h2>
                {filterDistrict && (
                  <span className="text-[10px] font-bold text-deped-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                    {filterDistrict}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                {currentView === 'overview' ? 'Dashboard' : (currentView === 'districts' || currentView === 'schools' || currentView === 'registered-users') ? '' : 'List of ADM Students'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {currentView === 'students' && userProfile?.role === 'admin' && user?.email !== 'cjjcarnejo@gmail.com' && (
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 bg-deped-blue hover:bg-brand-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-deped-blue/20 active:scale-95"
              >
                <Plus className="w-4.5 h-4.5" />
                Add Student
              </button>
            )}
            {currentView === 'students' && userProfile?.role !== 'admin' && (
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 bg-deped-blue hover:bg-brand-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-deped-blue/20 active:scale-95"
              >
                <Plus className="w-4.5 h-4.5" />
                Add Student
              </button>
            )}
          </div>
        </header>

        <div className="p-8 pb-12 overflow-y-auto w-full flex-1 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {currentView === 'overview' ? (
              /* Overview Content */
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div 
                    onClick={() => userProfile?.role === 'admin' && setCurrentView('students')}
                    className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 transition-all border-b-4 border-b-deped-blue group ${userProfile?.role === 'admin' ? 'cursor-pointer hover:shadow-xl hover:translate-y-[-4px]' : ''}`}
                  >
                    <div className="p-4 rounded-2xl bg-blue-50 text-deped-blue group-hover:rotate-6 transition-transform">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">ADM Students</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{totalStudents}</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => userProfile?.role === 'admin' && setCurrentView('districts')}
                    className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 transition-all border-b-4 border-b-deped-yellow group ${userProfile?.role === 'admin' ? 'cursor-pointer hover:shadow-xl hover:translate-y-[-4px]' : ''}`}
                  >
                    <div className="p-4 rounded-2xl bg-amber-50 text-deped-yellow group-hover:rotate-6 transition-transform">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Districts</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">
                        {new Set(operationalUsers.filter(u => u.district).map(u => u.district)).size || (userProfile?.district ? 1 : 0)}
                      </p>
                    </div>
                  </div>
                  <div 
                    onClick={() => userProfile?.role === 'admin' && setCurrentView('schools')}
                    className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 transition-all border-b-4 border-b-deped-red group ${userProfile?.role === 'admin' ? 'cursor-pointer hover:shadow-xl hover:translate-y-[-4px]' : ''}`}
                  >
                    <div className="p-4 rounded-2xl bg-red-50 text-deped-red group-hover:rotate-6 transition-transform">
                      <School className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Schools</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">
                        {new Set(operationalUsers.filter(u => u.school).map(u => u.school)).size || (userProfile?.school ? 1 : 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ADM Reason Chart */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">ADM Reasons Distribution</h3>
                      <p className="text-sm text-slate-500 font-medium tracking-tight">Overview of student distribution by ADM reason.</p>
                    </div>
                  </div>
                  <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(mostCommonReason || {}).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={140}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(mostCommonReason || {}).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0038A8', '#FBC300', '#ED1C24', '#1E293B', '#64748b'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                          formatter={(value: number) => {
                            const values = Object.values(mostCommonReason || {}) as number[];
                            const total = values.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return [`${value} student(s)`, `${percentage}%`];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : currentView === 'districts' ? (
              /* Districts View */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">List of Districts</h3>
                  </div>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    PRINT LIST
                  </button>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-6">District Name</th>
                        <th className="px-10 py-6">Registered Users</th>
                        <th className="px-10 py-6">Active Personnel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DISTRICTS.sort().map(district => {
                        const districtUsers = operationalUsers.filter(u => u.district === district);
                        if (districtUsers.length === 0) return null;
                        return (
                          <tr key={district} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-6 whitespace-nowrap">
                              <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{district}</span>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-deped-blue flex items-center justify-center font-black text-xs">
                                  {districtUsers.length}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <ul className="space-y-1.5">
                                {districtUsers.map(u => (
                                  <li key={u.id} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase">
                                    <div className="w-1 h-1 rounded-full bg-deped-blue" />
                                    {u.fullName}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : currentView === 'schools' ? (
              /* Schools View */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-10 py-8 border-b border-slate-100 space-y-6 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">REGISTERED SCHOOLS</h3>
                    </div>
                    <button 
                      onClick={handlePrint}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      PRINT LIST
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 no-print">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filter Grade Level</label>
                      <div className="relative">
                        <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                          className="pl-8 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-deped-blue/20 outline-none appearance-none cursor-pointer min-w-[200px]"
                          value={filterGrade}
                          onChange={(e) => setFilterGrade(e.target.value)}
                        >
                          <option value="">All Grade Levels</option>
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-6">School Name</th>
                        <th className="px-10 py-6">District</th>
                        <th className="px-10 py-6">ADM Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from(new Set(operationalUsers.filter(u => u.school).map(u => u.school))).sort().map(school => {
                        const schoolRecords = records.filter(r => r.school === school && (filterGrade === '' || r.grade === filterGrade));
                        const schoolUser = operationalUsers.find(u => u.school === school);
                        
                        // If filtering by grade and no records match, we still show the school if it fits other criteria,
                        // but maybe we only show schools that HAVE records for that grade? 
                        // The user said "list of the schools... add filter for grade level". 
                        // I'll interpret this as schools having students in that grade.
                        if (filterGrade !== '' && schoolRecords.length === 0) return null;

                        return (
                          <tr key={school} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-6 whitespace-nowrap">
                              <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{school}</span>
                            </td>
                            <td className="px-10 py-6 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                <MapPin className="w-3.5 h-3.5" />
                                {schoolUser?.district || 'Unassigned'}
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-deped-blue font-black text-[10px] uppercase">
                                  {schoolRecords.length} Active Records
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : currentView === 'registered-users' ? (
              /* Registered Users View */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">REGISTERED USERS</h3>
                  </div>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    PRINT LIST
                  </button>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-6">User Name</th>
                        <th className="px-10 py-6">Email Address</th>
                        <th className="px-10 py-6">Assigned District</th>
                        <th className="px-10 py-6">Station School</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...operationalUsers].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '')).map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-10 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">
                                {(user.fullName || 'User').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-black text-slate-900 tracking-tight">{user.fullName || 'Incomplete Profile'}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 whitespace-nowrap">
                            <span className="text-xs font-bold text-slate-500">{user.email}</span>
                          </td>
                          <td className="px-10 py-6 whitespace-nowrap">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{user.district || 'N/A'}</span>
                          </td>
                          <td className="px-10 py-6 whitespace-nowrap">
                            <span className="text-xs font-bold text-slate-500 uppercase">{user.school || 'N/A'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Students View Content */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                  <div className="flex-1 max-w-lg relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search students or schools..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-deped-blue/5 focus:border-deped-blue outline-none font-medium shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        className="pl-8 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue outline-none appearance-none cursor-pointer"
                        value={filterDistrict}
                        onChange={(e) => {
                          setFilterDistrict(e.target.value);
                          setFilterSchool('');
                        }}
                      >
                        <option value="">All Districts</option>
                        {(selectedCD ? DISTRICTS_BY_CD[selectedCD] : DISTRICTS).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <School className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        className="pl-8 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue outline-none appearance-none cursor-pointer max-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
                        value={filterSchool}
                        onChange={(e) => setFilterSchool(e.target.value)}
                        disabled={!filterDistrict}
                      >
                        <option value="">All Schools</option>
                        {availableSchoolsForFilter.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <Users className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        className="pl-8 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue outline-none appearance-none cursor-pointer"
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                      >
                        <option value="">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Information</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason for ADM</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Status</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ADM Duration</th>
                        {user?.email === 'cjjcarnejo@gmail.com' && (
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                        )}
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence mode="popLayout">
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((record) => (
                            <motion.tr 
                              key={record.id}
                              layout
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-blue-50 text-deped-blue flex items-center justify-center text-xs font-bold ring-2 ring-white ring-offset-2 ring-blue-50">
                                    {(record.lastName?.[0] || '') + (record.firstName?.[0] || '') || record.studentName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-deped-blue transition-colors">{record.studentName}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">{record.grade} • {record.gender}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-700">{record.school}</p>
                                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase flex-nowrap">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[120px]">{record.district}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200">
                                  {record.reasonForADM}
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex flex-col gap-1.5 min-w-[140px]">
                                  <span className={`text-[10px] font-bold uppercase tracking-tight ${
                                    record.academicStatus.includes('Outstanding') ? 'text-deped-blue font-black' : 
                                    record.academicStatus.includes('not meet') ? 'text-deped-red' : 'text-deped-yellow'
                                  }`}>
                                    {record.academicStatus.split(') ')[1]}
                                  </span>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div className={`h-full rounded-full transition-all duration-700 ${
                                      record.academicStatus.includes('Outstanding') ? 'w-full bg-deped-blue shadow-[0_0_8px_rgba(0,56,168,0.3)]' :
                                      record.academicStatus.includes('Very Satisfactory') ? 'w-4/5 bg-deped-blue/70' :
                                      record.academicStatus.includes('Satisfactory') ? 'w-3/5 bg-deped-yellow' :
                                      'w-2/5 bg-deped-red shadow-[0_0_8px_rgba(237,28,36,0.3)]'
                                    }`}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight border ${
                                  record.assessment === 'Back to Regular Class' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  record.assessment === 'Continue ADM' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>
                                  {record.assessment || 'Pending'}
                                </span>
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-700">{record.duration}</p>
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                                    {formatDate(record.startDate)} - {formatDate(record.endDate)}
                                  </p>
                                </div>
                              </td>
                              {user?.email === 'cjjcarnejo@gmail.com' && (
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <span className="text-[11px] font-bold text-slate-600">
                                    {appUsers.find((u: any) => u.uid === record.createdBy)?.fullName || 'System Admin'}
                                  </span>
                                </td>
                              )}
                              <td className="px-8 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {/* User can edit/delete their own. Admin can only view and delete any. */}
                                  {record.createdBy === user?.uid ? (
                                    <>
                                      <button 
                                        onClick={() => setEditingRecord(record)}
                                        className="px-3 py-1.5 text-xs font-bold text-deped-blue hover:bg-blue-50 rounded-lg transition-all border border-deped-blue/20"
                                        title="Edit Record"
                                      >
                                        Update
                                      </button>
                                      <button 
                                        onClick={() => deleteRecord(record.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete Record"
                                      >
                                        <Trash2 className="w-4.5 h-4.5" />
                                      </button>
                                    </>
                                  ) : (userProfile?.role === 'admin' || user?.email === 'cjjcarnejo@gmail.com') && (
                                    <button 
                                      onClick={() => deleteRecord(record.id)}
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                      title="Delete Record (Admin)"
                                    >
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-8 py-32 text-center text-slate-400">
                              <div className="max-w-xs mx-auto">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                  <Search className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-lg font-bold text-slate-900 mb-1 tracking-tight">System is clear</p>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed">Adjust your filters or add a new student entry to populate the database.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Section */}
      <AnimatePresence>
        {(isFormOpen || editingRecord) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFormOpen(false);
                setEditingRecord(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 h-full max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm transition-transform hover:scale-105 active:scale-95">
                    <img 
                      src="https://www.image2url.com/r2/default/images/1776821241074-086bda7a-d6fb-4686-b45d-57fc7d9cc86b.jpg" 
                      alt="ADM Logo" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase">
                      {editingRecord ? 'Update Student Record' : 'Add Student'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                  }} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto px-8 py-10">
                <RecordForm 
                  onSubmit={editingRecord ? (data) => updateRecord(editingRecord.id, data) : addRecord} 
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                  }} 
                  userProfile={userProfile}
                  initialData={editingRecord || undefined}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoginForm({ onSuccess, onToggleSignup }: { onSuccess: () => void; onToggleSignup: () => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-deped-blue/5 focus:border-deped-blue outline-none font-medium text-slate-900 placeholder:text-slate-400";
  const labelClasses = "block text-[11px] font-black uppercase text-slate-500 mb-1.5 ml-1 tracking-widest text-left";

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-deped-red mt-0.5 flex-shrink-0" />
          <p className="text-xs font-bold text-deped-red text-left">{error}</p>
        </div>
      )}
      
      <div>
        <label className={labelClasses}>Email Address</label>
        <div className="relative group">
          <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
          <input 
            type="email" 
            required
            className={inputClasses}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses}>Password</label>
        <div className="relative group">
          <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
          <input 
            type="password" 
            required
            className={inputClasses}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>
      
      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-deped-blue text-white py-4 rounded-xl font-bold transition-all hover:bg-brand-900 shadow-xl shadow-deped-blue/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
      >
        {loading ? 'Please wait...' : 'Sign In'}
      </button>

      <p className="text-sm font-medium text-slate-500">
        New user?{' '}
        <button 
          type="button" 
          onClick={onToggleSignup}
          className="text-deped-blue font-bold hover:underline"
        >
          Register here
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    congressionalDistrict: '',
    district: '',
    school: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.district) {
      setError("Please select a district");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await createUserProfile(userCredential.user, {
        fullName: formData.fullName,
        congressionalDistrict: formData.congressionalDistrict,
        district: formData.district,
        school: formData.school
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-deped-blue/5 focus:border-deped-blue outline-none font-medium text-slate-900 placeholder:text-slate-400";
  const labelClasses = "block text-[11px] font-black uppercase text-slate-500 mb-1.5 ml-1 tracking-widest";

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-deped-red mt-0.5 flex-shrink-0" />
          <p className="text-xs font-bold text-deped-red text-left">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Full Name</label>
          <div className="relative group">
            <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
            <input 
              type="text" 
              required
              className={inputClasses}
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={labelClasses}>Email Address</label>
          <div className="relative group">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
            <input 
              type="email" 
              required
              className={inputClasses}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Password</label>
        <div className="relative group">
          <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
          <input 
            type="password" 
            required
            className={inputClasses}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Congressional District</label>
          <div className="relative group">
            <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
            <select 
              required
              className={`${inputClasses} appearance-none pr-10 ${!formData.congressionalDistrict ? 'text-slate-400' : 'text-slate-900'}`}
              value={formData.congressionalDistrict}
              onChange={e => setFormData({ ...formData, congressionalDistrict: e.target.value, district: '', school: '' })}
            >
              <option value=""></option>
              <option value="CD1">CD1</option>
              <option value="CD2">CD2</option>
              <option value="CD3">CD3</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelClasses}>District</label>
          <div className="relative group">
            <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
            <select 
              required
              className={`${inputClasses} appearance-none pr-10 ${!formData.district ? 'text-slate-400' : 'text-slate-900'}`}
              value={formData.district}
              onChange={e => setFormData({ ...formData, district: e.target.value, school: '' })}
              disabled={!formData.congressionalDistrict}
            >
              <option value=""></option>
              {formData.congressionalDistrict && DISTRICTS_BY_CD[formData.congressionalDistrict]?.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Name of School</label>
        <div className="relative group">
          <Building className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-deped-blue transition-colors" />
          <select 
            required
            className={`${inputClasses} appearance-none pr-10 ${!formData.school ? 'text-slate-400' : 'text-slate-900'}`}
            value={formData.school}
            onChange={e => setFormData({ ...formData, school: e.target.value })}
            disabled={!formData.district}
          >
            <option value=""></option>
            {formData.district && SCHOOLS_BY_DISTRICT[formData.district.toUpperCase()]?.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-slate-100">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 px-6 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          BACK TO LOGIN
        </button>
        <button 
          type="submit"
          disabled={loading}
          className="flex-[2] bg-deped-blue text-white py-4 px-6 rounded-xl font-bold transition-all hover:bg-brand-900 shadow-xl shadow-deped-blue/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'REGISTER USER'}
        </button>
      </div>
    </form>
  );
}

function RecordForm({ onSubmit, onCancel, userProfile, initialData }: { onSubmit: (data: any) => void; onCancel: () => void; userProfile?: any; initialData?: any }) {
  const [formData, setFormData] = React.useState({
    congressionalDistrict: initialData?.congressionalDistrict || userProfile?.congressionalDistrict || '',
    district: initialData?.district || userProfile?.district || '',
    school: initialData?.school || userProfile?.school || '',
    studentName: initialData?.studentName || '',
    lastName: initialData?.lastName || '',
    firstName: initialData?.firstName || '',
    middleInitial: initialData?.middleInitial || '',
    suffix: initialData?.suffix || '',
    gender: (initialData?.gender as Gender) || '' as Gender,
    grade: (initialData?.grade as Grade) || '' as Grade,
    reasonForADM: (initialData?.reasonForADM as ReasonForADM) || '' as ReasonForADM,
    academicStatus: (initialData?.academicStatus as AcademicStatus) || '' as AcademicStatus,
    assessment: (initialData?.assessment as Assessment) || 'Pending' as Assessment,
    duration: initialData?.duration || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || ''
  });

  // Sync derived studentName
  React.useEffect(() => {
    const mi = formData.middleInitial ? ` ${formData.middleInitial}.` : '';
    const suf = formData.suffix ? ` ${formData.suffix}` : '';
    const derivedName = `${formData.lastName}, ${formData.firstName}${mi}${suf}`;
    if (formData.lastName || formData.firstName) {
      setFormData(prev => ({ ...prev, studentName: derivedName.trim() }));
    }
  }, [formData.lastName, formData.firstName, formData.middleInitial, formData.suffix]);

  // Predicted End Date Logic
  React.useEffect(() => {
    if (formData.startDate && formData.duration) {
      try {
        const date = new Date(formData.startDate);
        const match = formData.duration.match(/(\d+)\s*(day|week|month|year)s?/i);
        if (match) {
          const amount = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          
          if (unit.startsWith('day')) date.setDate(date.getDate() + amount);
          else if (unit.startsWith('week')) date.setDate(date.getDate() + amount * 7);
          else if (unit.startsWith('month')) date.setMonth(date.getMonth() + amount);
          else if (unit.startsWith('year')) date.setFullYear(date.getFullYear() + amount);
          
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          setFormData(prev => ({ ...prev, endDate: `${yyyy}-${mm}-${dd}` }));
        }
      } catch (e) {
        console.error("Date prediction failed", e);
      }
    }
  }, [formData.startDate, formData.duration]);

  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiRecommendation, setAiRecommendation] = React.useState<{ recommendation: Assessment; justification: string } | null>(null);

  const handleAiRecommendation = async () => {
    if (!formData.studentName || !formData.grade || !formData.reasonForADM || !formData.academicStatus) {
      alert('Please fill in student details and current status first.');
      return;
    }

    setIsAiLoading(true);
    const result = await getADMAssessmentRecommendation({
      studentName: formData.studentName,
      grade: formData.grade,
      reasonForADM: formData.reasonForADM,
      academicStatus: formData.academicStatus
    });

    if (result) {
      setAiRecommendation(result);
      if (confirm(`AI Recommendation: ${result.recommendation}\n\nJustification: ${result.justification}\n\nWould you like to apply this assessment?`)) {
        setFormData(prev => ({ ...prev, assessment: result.recommendation as Assessment }));
      }
    } else {
      alert('Failed to get AI recommendation. Please check your internet connection or API key.');
    }
    setIsAiLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.congressionalDistrict || !formData.district || !formData.school || !formData.studentName || !formData.grade || !formData.reasonForADM || !formData.academicStatus) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deped-blue/10 focus:border-deped-blue transition-all font-medium text-slate-900 placeholder:text-slate-400";
  const labelClasses = "block text-[12px] font-black uppercase text-slate-700 mb-2 tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {initialData ? (
        /* UPDATE MODE: Only Assessment and Progress Academic Report */
        <>
          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6">
            <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-4">Updating Progress for:</h4>
            <p className="text-lg font-bold text-slate-900">{formData.studentName}</p>
            <p className="text-xs text-slate-500">{formData.school} • {formData.grade}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Progress Academic Report</label>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10 ${!formData.academicStatus ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.academicStatus}
                  onChange={e => setFormData({ ...formData, academicStatus: e.target.value as AcademicStatus })}
                >
                  <option value=""></option>
                  {ACADEMIC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClasses}>Assessment</label>
                <button
                  type="button"
                  onClick={handleAiRecommendation}
                  disabled={isAiLoading}
                  className="text-[10px] font-bold text-deped-blue hover:text-brand-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {isAiLoading ? 'Analyzing...' : ''}
                </button>
              </div>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10`}
                  value={formData.assessment}
                  onChange={e => setFormData({ ...formData, assessment: e.target.value as Assessment })}
                >
                  {ASSESSMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </>
      ) : (
        /* SAVE MODE: Full Form */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>Congressional District</label>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10 ${!formData.congressionalDistrict ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.congressionalDistrict}
                  onChange={e => setFormData({ ...formData, congressionalDistrict: e.target.value, district: '', school: '' })}
                >
                  <option value=""></option>
                  <option value="CD1">CD1</option>
                  <option value="CD2">CD2</option>
                  <option value="CD3">CD3</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClasses}>District</label>
              <div className="relative">
                <select 
                  required
                  disabled={!formData.congressionalDistrict}
                  className={`${inputClasses} appearance-none pr-10 ${!formData.district ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value, school: '' })}
                >
                  <option value=""></option>
                  {formData.congressionalDistrict && DISTRICTS_BY_CD[formData.congressionalDistrict]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Name of School</label>
              <div className="relative">
                <select 
                  required
                  disabled={!formData.district}
                  className={`${inputClasses} appearance-none pr-10 ${!formData.school ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.school}
                  onChange={e => setFormData({ ...formData, school: e.target.value })}
                >
                  <option value=""></option>
                  {formData.district && SCHOOLS_BY_DISTRICT[formData.district.toUpperCase()]?.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Student Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Last Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Smith"
                  className={inputClasses}
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasses}>First Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. John"
                  className={inputClasses}
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Middle Initial</label>
                <input 
                  type="text" 
                  placeholder="e.g. O"
                  maxLength={1}
                  className={inputClasses}
                  value={formData.middleInitial}
                  onChange={e => setFormData({ ...formData, middleInitial: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className={labelClasses}>Suffix</label>
                <input 
                  type="text" 
                  placeholder="e.g. Jr., III"
                  className={inputClasses}
                  value={formData.suffix}
                  onChange={e => setFormData({ ...formData, suffix: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Gender</label>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10 ${!formData.gender ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                >
                  <option value=""></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Grade</label>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10 ${!formData.grade ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value as Grade })}
                >
                  <option value=""></option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Reason for ADM</label>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10 ${!formData.reasonForADM ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.reasonForADM}
                  onChange={e => setFormData({ ...formData, reasonForADM: e.target.value as ReasonForADM })}
                >
                  <option value=""></option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Academic Status</label>
              <div className="relative">
                <select 
                  required
                  className={`${inputClasses} appearance-none pr-10 ${!formData.academicStatus ? 'text-slate-400' : 'text-slate-900'}`}
                  value={formData.academicStatus}
                  onChange={e => setFormData({ ...formData, academicStatus: e.target.value as AcademicStatus })}
                >
                  <option value=""></option>
                  {ACADEMIC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg mb-6">
              <label className={labelClasses}>Assessment</label>
              <p className="text-xs font-semibold text-slate-400 italic">This will be available once you update the student's status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClasses}>ADM Duration</label>
              <input 
                required
                type="text" 
                placeholder="e.g. 3 months, 2 weeks, 2 days"
                className={inputClasses}
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Date of ADM Start</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  required
                  type="date" 
                  className={`${inputClasses} pl-10`}
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Date of ADM End</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  disabled
                  type="date" 
                  className={`${inputClasses} pl-10 bg-slate-100 cursor-not-allowed opacity-70`}
                  value={formData.endDate}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-4 pt-8 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all text-sm shadow-md shadow-rose-600/20 active:scale-95 uppercase"
        >
          CANCEL
        </button>
        <button 
          type="submit" 
          className="flex-[2] px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-sm shadow-md shadow-emerald-600/20 active:scale-95 uppercase"
        >
          {initialData ? 'UPDATE' : 'SAVE'}
        </button>
      </div>
    </form>
  );
}
