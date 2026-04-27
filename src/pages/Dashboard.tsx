import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  GraduationCap, 
  AlertCircle,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, StudentStatus } from '../types';
import { motion } from 'motion/react';

const MOCK_CHART_DATA = [
  { month: 'Jan', count: 450 },
  { month: 'Feb', count: 520 },
  { month: 'Mar', count: 480 },
  { month: 'Apr', count: 610 },
  { month: 'May', count: 590 },
  { month: 'Jun', count: 720 },
];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    graduated: 0,
    dropped: 0
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const studentsRef = collection(db, 'students');
        const snapshot = await getDocs(studentsRef);
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        
        setStats({
          total: students.length,
          active: students.filter(s => s.status === StudentStatus.ACTIVE).length,
          graduated: students.filter(s => s.status === StudentStatus.GRADUATED).length,
          dropped: students.filter(s => s.status === StudentStatus.DROPPED).length
        });

        // Recent students
        const q = query(studentsRef, orderBy('updatedAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(q);
        setRecentStudents(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-[24px] border border-[#E5E2DE] relative overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-md">
       <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-125`} style={{ backgroundColor: color }} />
       <div className="flex justify-between items-start mb-4">
         <div className={`p-3 rounded-2xl`} style={{ backgroundColor: `${color}15`, color }}>
           <Icon className="w-6 h-6" />
         </div>
         {trend && (
           <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
             <TrendingUp className="w-3 h-3" />
             {trend}
           </span>
         )}
       </div>
       <div>
         <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">{title}</h3>
         <p className="text-3xl font-serif text-[#1A1A1A]">{value}</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[#5A5A40] font-bold text-xs uppercase tracking-[0.3em] mb-2">Registry Overview</p>
          <h2 className="font-serif text-4xl text-[#1A1A1A]">Welcome to ADM Tracker</h2>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-[#E5E2DE] flex items-center gap-3 text-xs font-medium text-[#5A5A40]">
           <Calendar className="w-4 h-4" />
           {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registry" value={stats.total} icon={Users} color="#5A5A40" trend="+12%" />
        <StatCard title="Active ADM" value={stats.active} icon={TrendingUp} color="#10B981" />
        <StatCard title="Graduated" value={stats.graduated} icon={GraduationCap} color="#6366F1" />
        <StatCard title="Review Required" value={stats.dropped} icon={AlertCircle} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart View */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-[#E5E2DE] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-xl">Enrollment Growth</h3>
            <select className="text-xs font-medium bg-[#F5F2ED] border-none rounded-lg focus:ring-0">
               <option>SY 2023-2024</option>
               <option>SY 2024-2025</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#999' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#999' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#5A5A40" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-[32px] border border-[#E5E2DE] shadow-sm">
          <h3 className="font-serif text-xl mb-6">Recent Records</h3>
          <div className="space-y-6">
            {recentStudents.length > 0 ? (
              recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs">
                      {student.lastName[0]}{student.firstName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold group-hover:text-[#5A5A40] transition-colors">{student.lastName}, {student.firstName}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{student.admType} • {student.gradeLevel}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#5A5A40] transition-all" />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-100 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No recent activity found</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-xs font-bold uppercase tracking-widest text-[#5A5A40] border-t border-[#F0F0F0] hover:text-[#4A4A30] transition-colors">
            View All Records
          </button>
        </div>
      </div>
    </div>
  );
};
