import React, { useEffect } from 'react';
import { useStore } from '../store';
import DAGCanvas from '../components/DAGCanvas';
import CompetencyHeatmap from '../components/CompetencyHeatmap';
import { GraduationCap, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

export default function LearningPath({ onNavigate }) {
  const studentName = useStore((state) => state.studentName);
  const subject = useStore((state) => state.subject);
  const pathNodes = useStore((state) => state.pathNodes);
  const pathEdges = useStore((state) => state.pathEdges);
  const competencyVector = useStore((state) => state.competencyVector);
  const pathLoading = useStore((state) => state.pathLoading);
  const fetchLearningPath = useStore((state) => state.fetchLearningPath);
  const fetchCurrentNode = useStore((state) => state.fetchCurrentNode);
  const aiNudge = useStore((state) => state.aiNudge);
  const clearNudge = useStore((state) => state.clearNudge);

  useEffect(() => {
    // If state doesn't have path nodes, fetch them
    if (pathNodes.length === 0) {
      fetchLearningPath();
    }
  }, [pathNodes, fetchLearningPath]);

  const handleNodeClick = async (node) => {
    // Navigate to Study Room for active study node
    await fetchCurrentNode();
    onNavigate('study');
  };

  const getSubjectTitle = () => {
    return subject === 'dsa' ? 'Data Structures & Algorithms' : 'Computer Fundamentals';
  };

  const getActiveNode = () => {
    return pathNodes.find(n => n.status === 'current');
  };

  const getMasteryCount = () => {
    return pathNodes.filter(n => n.status === 'mastered').length;
  };

  if (pathLoading && pathNodes.length === 0) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Assembling dynamic learning pathways...</p>
        </div>
      </div>
    );
  }

  const activeNode = getActiveNode();
  const masteredCount = getMasteryCount();

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto z-10 relative">
        
        {/* Top Navigation Bar */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-800/60 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-200">SkillForge AI</h1>
              <span className="text-slate-500 text-xs font-semibold">{getSubjectTitle()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#0c1527] border border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-slate-400">Student:</span>
              <span className="text-slate-200">{studentName}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#1c1d1a] border border-slate-850 px-3.5 py-1.5 rounded-xl text-sm font-bold text-indigo-400">
              <Flame className="h-4 w-4" /> {masteredCount} / {pathNodes.length} Mastered
            </div>
          </div>
        </header>

        {/* Real-time WS AI Intervention Nudge Alert */}
        {aiNudge && (
          <div className="bg-amber-950/20 border border-amber-500/30 text-amber-200 p-5 rounded-2xl mb-8 flex justify-between items-start gap-4 animate-bounce">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-amber-400 block mb-1">⚠️ AI Intervention Triggered</span>
              <p className="text-sm leading-relaxed font-medium">{aiNudge}</p>
            </div>
            <button 
              onClick={clearNudge} 
              className="text-amber-500 hover:text-amber-300 font-bold text-xs uppercase bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. React Flow Interactive DAG Canvas */}
        <div className="mb-8">
          <DAGCanvas 
            nodes={pathNodes} 
            edges={pathEdges} 
            onNodeClick={handleNodeClick} 
          />
        </div>

        {/* 2. Split Dashboard details (Heatmap vs Action panel) */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Competency heat chart */}
          <div className="lg:col-span-7 glass rounded-3xl p-6 border border-slate-800/80">
            <div className="border-b border-slate-850 pb-4 mb-2 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Competency Vector</h2>
                <p className="text-slate-500 text-xs font-medium">Visual diagnosis of your subject mastery levels</p>
              </div>
            </div>
            <CompetencyHeatmap competencyVector={competencyVector} />
          </div>

          {/* Quick study action center */}
          <div className="lg:col-span-5 glass rounded-3xl p-8 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2">Active Study Session</span>
              {activeNode ? (
                <>
                  <h3 className="text-2xl font-extrabold text-slate-100 mb-3">{activeNode.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    This is your next milestone. Launch the study room to review textbook definitions, analyze RAG source logs, and complete practice code exercises.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mb-3">All Milestones Completed!</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Congratulations! You have successfully completed the entire learning path and demonstrated core competency across all evaluated subtopics.
                  </p>
                </>
              )}
            </div>

            {activeNode && (
              <button
                onClick={() => handleNodeClick(activeNode)}
                className="w-full py-4 bg-gradient-brand text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                Enter Study Room <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
