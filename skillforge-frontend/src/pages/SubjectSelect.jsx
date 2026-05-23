import React, { useState } from 'react';
import { useStore } from '../store';
import { BookOpen, Cpu, GraduationCap, ChevronRight } from 'lucide-react';

export default function SubjectSelect({ onNavigate }) {
  const [name, setName] = useState('');
  const startSession = useStore((state) => state.startSession);
  const [loadingSubject, setLoadingSubject] = useState(null);

  const handleSelect = async (subject) => {
    if (!name.trim()) {
      alert("Please enter your student name first!");
      return;
    }
    setLoadingSubject(subject);
    await startSession(name, subject);
    setLoadingSubject(null);
    onNavigate('quiz');
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-3">
            <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
              <GraduationCap className="h-10 w-10 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-gradient">SkillForge AI</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Autonomous competency-based learning orchestrator. Diagnoses knowledge gaps and builds stateful curriculum maps in real-time.
          </p>
        </div>

        {/* Input Name Block */}
        <div className="max-w-md mx-auto mb-10 p-6 glass rounded-2xl glow-indigo">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Student Name</label>
          <input
            type="text"
            placeholder="Enter your name to begin..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-[#0d1527] border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all font-semibold"
          />
        </div>

        {/* Subject Grid Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* DSA Card */}
          <div 
            onClick={() => handleSelect('dsa')}
            className="glass p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:border-indigo-500/50 glow-indigo group flex flex-col justify-between h-72 border border-slate-800"
          >
            <div>
              <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 w-fit mb-6 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                <BookOpen className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-indigo-300 transition-colors">
                Data Structures & Algos
              </h2>
              <p className="text-slate-400 text-sm">
                Master core computing structures. Covers Arrays, Linked Lists, Stacks, Hierarchical Trees, and Network Graphs.
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60">
              <span className="text-slate-500 text-xs font-semibold tracking-wider uppercase group-hover:text-indigo-400 transition-colors">
                {loadingSubject === 'dsa' ? 'Initializing Quiz...' : 'Start Assessment'}
              </span>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Computer Fundamentals Card */}
          <div 
            onClick={() => handleSelect('computer_fundamentals')}
            className="glass p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:border-fuchsia-500/50 glow-indigo group flex flex-col justify-between h-72 border border-slate-800"
          >
            <div>
              <div className="bg-fuchsia-500/10 p-4 rounded-2xl border border-fuchsia-500/20 w-fit mb-6 group-hover:bg-fuchsia-500/20 group-hover:scale-105 transition-all">
                <Cpu className="h-8 w-8 text-fuchsia-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-fuchsia-300 transition-colors">
                Computer Fundamentals
              </h2>
              <p className="text-slate-400 text-sm">
                Understand core systems architecture. Review CPU Process Scheduling, DBMS Normalizations, B+ Indexes, and Network OSI Protocols.
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60">
              <span className="text-slate-500 text-xs font-semibold tracking-wider uppercase group-hover:text-fuchsia-400 transition-colors">
                {loadingSubject === 'computer_fundamentals' ? 'Initializing Quiz...' : 'Start Assessment'}
              </span>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
