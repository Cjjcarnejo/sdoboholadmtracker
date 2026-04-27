import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { School, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { School as SchoolIcon, MapPin, Mail, Phone, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const SchoolManagement: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schools'), (snapshot) => {
      setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'schools');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-3xl italic">Educational Institutions</h2>
          <p className="text-sm text-[#5A5A40]/60">Registered schools under SDO Bohol Division.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5A5A40] text-white rounded-full text-sm font-medium shadow-md">
          <Plus className="w-4 h-4" />
          Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-[32px] border border-[#E5E2DE] animate-pulse" />
          ))
        ) : schools.length > 0 ? (
          schools.map((school) => (
            <motion.div 
              key={school.id}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[32px] border border-[#E5E2DE] shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F2ED] flex items-center justify-center mb-6 group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                <SchoolIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-4">{school.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <MapPin className="w-4 h-4 text-[#5A5A40]" />
                  {school.district} District
                </div>
                {school.contactEmail && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <Mail className="w-4 h-4 text-[#5A5A40]" />
                    {school.contactEmail}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#F0F0F0] flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest">ID: {school.id}</span>
                <button className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest hover:underline underline-offset-4">Details</button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
            <SchoolIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No schools registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
