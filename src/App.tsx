/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StudentRegistry } from './pages/StudentRegistry';
import { SchoolManagement } from './pages/SchoolManagement';
import { UserProfile } from './pages/UserProfile';
import { LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-[#5A5A40] animate-spin" />
          <p className="font-serif italic text-[#5A5A40]">Initializing ADM Tracker...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border border-[#E5E5E5]"
        >
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-[#1A1A1A] mb-2">SDO Bohol</h1>
            <p className="text-[#5A5A40] font-medium tracking-wide uppercase text-xs">ADM Tracking System</p>
          </div>
          
          <div className="space-y-6">
            <p className="text-sm text-gray-600 leading-relaxed text-center">
              Welcome to the Alternative Delivery Mode (ADM) digital tracking registry. 
              Please sign in with your Department of Education account to continue.
            </p>
            
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#5A5A40] hover:bg-[#4A4A30] text-white rounded-full transition-all duration-300 font-medium"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#F0F0F0] text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Division of Bohol • Registry v1.0</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthGate>
          <Layout>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<StudentRegistry />} />
                <Route path="/schools" element={<SchoolManagement />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Layout>
        </AuthGate>
      </Router>
    </AuthProvider>
  );
}
