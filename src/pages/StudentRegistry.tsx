import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, StudentStatus, ADMType, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Edit2, 
  ExternalLink, 
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StudentRegistry: React.FC = () => {
  const { appUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    lrn: '',
    firstName: '',
    lastName: '',
    middleName: '',
    gradeLevel: 'Grade 7',
    section: '',
    admType: ADMType.MODULAR_PRINT,
    status: StudentStatus.ACTIVE,
    remarks: ''
  });

  useEffect(() => {
    const studentsRef = collection(db, 'students');
    const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;

    try {
      const studentData = {
        ...formData,
        schoolId: appUser.schoolId || 'main-sdo',
        updatedAt: new Date().toISOString(),
        enrolledAt: editingStudent ? editingStudent.enrolledAt : new Date().toISOString()
      };

      if (editingStudent?.id) {
        await updateDoc(doc(db, 'students', editingStudent.id), studentData);
      } else {
        await addDoc(collection(db, 'students'), studentData);
      }

      setShowModal(false);
      setEditingStudent(null);
      setFormData({
        lrn: '',
        firstName: '',
        lastName: '',
        middleName: '',
        gradeLevel: 'Grade 7',
        section: '',
        admType: ADMType.MODULAR_PRINT,
        status: StudentStatus.ACTIVE,
        remarks: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'students');
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData(student);
    setShowModal(true);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.lrn.includes(search) || 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }: { status: StudentStatus }) => {
    const styles = {
      [StudentStatus.ACTIVE]: "bg-green-50 text-green-700 border-green-200",
      [StudentStatus.DROPPED]: "bg-red-50 text-red-700 border-red-200",
      [StudentStatus.TRANSFERRED]: "bg-amber-50 text-amber-700 border-amber-200",
      [StudentStatus.GRADUATED]: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl">Student Registry</h2>
          <p className="text-sm text-[#5A5A40]/60">Manage Alternative Delivery Mode enrollments and tracking.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2DE] rounded-xl text-sm font-medium hover:bg-[#F5F2ED] transition-colors">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button 
            onClick={() => { setEditingStudent(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-xl text-sm font-medium shadow-md hover:bg-[#4A4A30] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E2DE] flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by LRN or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F2ED] border-none rounded-xl text-sm focus:ring-1 focus:ring-[#5A5A40]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F5F2ED] border-none rounded-xl text-sm py-2 px-4 focus:ring-1 focus:ring-[#5A5A40]"
          >
            <option value="all">All Statuses</option>
            <option value={StudentStatus.ACTIVE}>Active</option>
            <option value={StudentStatus.DROPPED}>Dropped</option>
            <option value={StudentStatus.GRADUATED}>Graduated</option>
            <option value={StudentStatus.TRANSFERRED}>Transferred</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-[#E5E2DE] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F7] border-b border-[#E5E2DE]">
                <th className="px-6 py-4 font-serif italic text-xs uppercase tracking-wider text-[#5A5A40] opacity-60">LRN</th>
                <th className="px-6 py-4 font-serif italic text-xs uppercase tracking-wider text-[#5A5A40] opacity-60">Student Name</th>
                <th className="px-6 py-4 font-serif italic text-xs uppercase tracking-wider text-[#5A5A40] opacity-60">ADM Program</th>
                <th className="px-6 py-4 font-serif italic text-xs uppercase tracking-wider text-[#5A5A40] opacity-60">Grade & Section</th>
                <th className="px-6 py-4 font-serif italic text-xs uppercase tracking-wider text-[#5A5A40] opacity-60">Status</th>
                <th className="px-6 py-4 font-serif italic text-xs uppercase tracking-wider text-[#5A5A40] opacity-60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEEA]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#5A5A40] animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Synchronizing Data...</p>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F9F8F6] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-[#5A5A40]">{student.lrn}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[#1A1A1A]">{student.lastName}, {student.firstName}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{student.middleName || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[#5A5A40]">{student.admType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium">{student.gradeLevel}</p>
                      <p className="text-[10px] text-gray-400">{student.section}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEdit(student)}
                          className="p-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#5A5A40]/10 text-[#5A5A40] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No records found matching your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add/Edit Student */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-[#F0EEEA] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl">{editingStudent ? 'Edit Student Record' : 'Register New Student'}</h3>
                  <p className="text-xs text-[#5A5A40]/60 uppercase tracking-widest font-bold mt-1">ADM Registry Entry</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-[#F5F2ED] rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">12-Digit LRN</label>
                     <input 
                       required
                       maxLength={12}
                       pattern="[0-9]{12}"
                       placeholder="e.g. 118432342342"
                       className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40] font-mono"
                       value={formData.lrn}
                       onChange={e => setFormData({...formData, lrn: e.target.value})}
                     />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">First Name</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40]"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Last Name</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40]"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Grade Level</label>
                    <select 
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40]"
                      value={formData.gradeLevel}
                      onChange={e => setFormData({...formData, gradeLevel: e.target.value})}
                    >
                      {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">ADM Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40]"
                      value={formData.admType}
                      onChange={e => setFormData({...formData, admType: e.target.value as ADMType})}
                    >
                      {Object.values(ADMType).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Current Status</label>
                    <select 
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40]"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as StudentStatus})}
                    >
                      {Object.values(StudentStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Section</label>
                    <input 
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40]"
                      value={formData.section}
                      onChange={e => setFormData({...formData, section: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Remarks / Notes</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-[#F5F2ED] border-none rounded-2xl focus:ring-2 focus:ring-[#5A5A40] resize-none"
                      value={formData.remarks}
                      onChange={e => setFormData({...formData, remarks: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 px-6 rounded-2xl border border-[#E5E2DE] text-[#5A5A40] font-bold text-xs uppercase tracking-widest hover:bg-[#F5F2ED] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 px-6 rounded-2xl bg-[#5A5A40] text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#5A5A40]/30 hover:bg-[#4A4A30] transition-all"
                  >
                    {editingStudent ? 'Update Record' : 'Create Registry Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
