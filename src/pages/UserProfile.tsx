import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Shield, AtSign, Building2, Calendar, Map } from 'lucide-react';
import { motion } from 'motion/react';

export const UserProfile: React.FC = () => {
  const { user, appUser } = useAuth();

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-[#E5E2DE] hover:bg-white transition-all group">
      <div className="w-10 h-10 rounded-xl bg-[#F5F2ED] flex items-center justify-center text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5A5A40] opacity-50 mb-0.5">{label}</p>
        <p className="font-medium text-[#1A1A1A]">{value || 'Not specified'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-10 rounded-[40px] border border-[#E5E2DE] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5F2ED] rounded-full -mr-32 -mt-32 opacity-50" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="w-32 h-32 rounded-[40px] bg-[#5A5A40] flex items-center justify-center text-white text-4xl font-serif shadow-xl shadow-[#5A5A40]/30">
            {user?.displayName?.[0] || user?.email?.[0]}
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-serif text-4xl mb-2">{user?.displayName || 'Administrator'}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100">
              <Shield className="w-3 h-3" />
              {appUser?.role || 'Pending Assignment'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow icon={AtSign} label="Email Address" value={user?.email} />
          <InfoRow icon={Building2} label="Station / School" value={appUser?.schoolId ? `School ID: ${appUser.schoolId}` : 'SDO Bohol Main'} />
          <InfoRow icon={Shield} label="Access Level" value={appUser?.role} />
          <InfoRow icon={Map} label="District Assignment" value={appUser?.district || 'Division Wide'} />
          <InfoRow icon={Calendar} label="Member Since" value={user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'} />
        </div>
      </div>

      <div className="p-8 bg-[#5A5A40] rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#5A5A40]/20">
        <div>
          <h3 className="font-serif text-2xl mb-2 italic">Official DepEd Registry</h3>
          <p className="text-sm opacity-80 max-w-md">Your account is authorized to manage sensitive student data within the Bohol Division. Please ensure data privacy guidelines are followed at all times.</p>
        </div>
        <button className="px-8 py-3 bg-white text-[#5A5A40] rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#F5F2ED] transition-colors">
          View Audit Logs
        </button>
      </div>
    </div>
  );
};
