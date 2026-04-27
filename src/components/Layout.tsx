import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  School, 
  UserCircle, 
  LogOut, 
  Search,
  Plus,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/schools', label: 'Schools', icon: School },
  { path: '/profile', label: 'Profile', icon: UserCircle },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, user, appUser } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E5E2DE] flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-8 border-b border-[#E5E2DE]">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-[#5A5A40]" />
            <h1 className="font-serif text-xl tracking-tight">ADM Registry</h1>
          </div>
          <p className="text-[10px] text-[#5A5A40] opacity-60 uppercase tracking-[0.2em] font-medium">SDO BOHOL</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' 
                    : 'text-[#5A5A40] hover:bg-[#F0EEEA]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#AOAO80]'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#E5E2DE] bg-[#FAF9F7]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center text-white font-serif text-lg">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.displayName || 'Administrator'}</p>
              <p className="text-[10px] text-[#5A5A40] opacity-70 uppercase tracking-wider">{appUser?.role || 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5E2DE] text-[#5A5A40] hover:bg-white hover:text-red-600 hover:border-red-200 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header - Search/Actions */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#E5E2DE] px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="max-w-md w-full relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" />
            <input 
              type="text" 
              placeholder="Search LRN, name, or school..."
              className="w-full bg-[#F5F2ED] border-transparent focus:bg-white focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] rounded-full py-2.5 pl-11 pr-4 text-sm transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right mr-4">
              <p className="text-[10px] uppercase tracking-widest text-[#5A5A40] opacity-60">System Status</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">ONLINE</span>
              </div>
            </div>
            <Link 
              to="/students?action=new" 
              className="bg-[#5A5A40] hover:bg-[#4A4A30] text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium shadow-md shadow-[#5A5A40]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 pb-16">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
