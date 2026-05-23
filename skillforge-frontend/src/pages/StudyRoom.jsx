import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  ArrowLeft, 
  BookOpen, 
  Terminal, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';

export default function StudyRoom({ onNavigate }) {
  const activeNode = useStore((state) => state.activeNode);
  const evaluationResult = useStore((state) => state.evaluationResult);
  const evaluationLoading = useStore((state) => state.evaluationLoading);
  const submitExercise = useStore((state) => state.submitExercise);
  const fetchLearningPath = useStore((state) => state.fetchLearningPath);
  const aiNudge = useStore((state) => state.aiNudge);
  const clearNudge = useStore((state) => state.clearNudge);

  const [answer, setAnswer] = useState('');
  const [activeTab, setActiveTab] = useState('textbook');

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    await submitExercise(answer);
  };

  const handleBackToPath = async () => {
    // Reload path to show updatedMastery states
    await fetchLearningPath();
    onNavigate('path');
  };

  if (!activeNode) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Resolving study materials...</p>
        </div>
      </div>
    );
  }

  // Filter resources by type
  const textbookResources = activeNode.resources.filter(r => r.type === 'textbook');
  const transcriptResources = activeNode.resources.filter(r => r.type === 'video_transcript');

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 relative flex flex-col">
      <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Bar */}
      <header className="flex items-center gap-4 pb-4 border-b border-slate-800/60 mb-6 z-10 relative">
        <button 
          onClick={handleBackToPath}
          className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </button>
        <div>
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest block mb-0.5">
            📍 Study Module Focus: {activeNode.topic.replace('_', ' ')}
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100">{activeNode.title}</h1>
        </div>
      </header>

      {/* Live AI Nudge Banner / Coaching Hint */}
      {aiNudge && (
        <div className="bg-indigo-950/20 border border-indigo-500/30 text-indigo-200 p-4 rounded-2xl mb-6 z-10 relative flex justify-between items-start gap-4 animate-slideIn">
          <div className="flex gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 h-fit border border-indigo-500/20">
              <Lightbulb className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 block mb-0.5">💡 Tutor Hint Triggered</span>
              <p className="text-sm leading-relaxed">{aiNudge}</p>
            </div>
          </div>
          <button 
            onClick={clearNudge} 
            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase"
          >
            Clear
          </button>
        </div>
      )}

      {/* Main Split Layout Panel */}
      <div className="grid lg:grid-cols-12 gap-8 flex-grow z-10 relative">
        
        {/* LEFT COLUMN: Study Materials & RAG logs */}
        <div className="lg:col-span-6 flex flex-col h-full">
          <div className="glass rounded-3xl border border-slate-800/80 p-6 flex flex-col h-full min-h-[400px]">
            {/* Textbook Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-850 pb-4">
              <button 
                onClick={() => setActiveTab('textbook')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === 'textbook' 
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-450 hover:border-slate-700'
                }`}
              >
                Textbook Concepts
              </button>
              <button 
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === 'video' 
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-450 hover:border-slate-700'
                }`}
              >
                Video Logs ({transcriptResources.length})
              </button>
            </div>

            {/* Content Display list */}
            <div className="flex-grow overflow-y-auto space-y-6 max-h-[500px] pr-2">
              {activeTab === 'textbook' ? (
                textbookResources.map((res, idx) => (
                  <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl glow-indigo">
                    <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4.5 w-4.5 text-indigo-400" /> {res.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      {res.content}
                    </p>
                  </div>
                ))
              ) : (
                transcriptResources.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase py-12">
                    No video transcripts indexed for this level.
                  </div>
                ) : (
                  transcriptResources.map((res, idx) => (
                    <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl border-l-amber-500">
                      <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
                        🎥 Video Lecture: {res.title}
                      </h3>
                      <p className="text-slate-450 text-sm leading-relaxed italic">
                        "...{res.content}..."
                      </p>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Exercise & Grading center */}
        <div className="lg:col-span-6 flex flex-col h-full">
          <div className="glass rounded-3xl border border-slate-800/80 p-6 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-100">Practice Sandbox</h2>
            </div>
            
            {/* Exercise Prompt */}
            <div className="bg-[#0e172e] border border-slate-800 p-5 rounded-2xl mb-6">
              <span className="text-[10px] font-bold tracking-widest text-indigo-400 block mb-1 uppercase">EXERCISE TASK</span>
              <p className="text-slate-350 text-sm leading-relaxed font-semibold">
                {activeNode.exercise || "Summarize the core concepts of this topic in your own words, explaining the primary tradeoffs."}
              </p>
            </div>

            {/* Answer Submissions Box */}
            <div className="mb-6 flex-grow flex flex-col">
              <textarea
                value={answer}
                disabled={evaluationLoading}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your explanation or code logic here..."
                className="w-full flex-grow min-h-[140px] px-4 py-4 bg-[#0d1527]/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-250 placeholder-slate-500 transition-all font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Evaluation Score Card / Reroute Alerts */}
            {evaluationResult && (
              <div className="border-t border-slate-850 pt-6 mb-6">
                <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl">
                  {/* Score Indicator */}
                  <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-850">
                    <div className="flex items-center gap-2">
                      {evaluationResult.score >= 0.8 ? (
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-rose-400" />
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Evaluation Score</span>
                        <h4 className="text-lg font-extrabold text-slate-200">
                          {evaluationResult.score >= 0.8 ? '⚡ PASSED' : '⚠️ RE-SUBMIT REQUIRED'}
                        </h4>
                      </div>
                    </div>
                    
                    <span className={`text-3xl font-extrabold ${evaluationResult.score >= 0.8 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(evaluationResult.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Misconceptions Chips */}
                  {evaluationResult.misconceptions.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Detected Misconceptions</span>
                      <div className="flex flex-wrap gap-2">
                        {evaluationResult.misconceptions.map((m, idx) => (
                          <span key={idx} className="bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs text-rose-300 font-semibold uppercase">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Feedback</span>
                    <p className="text-slate-350 text-sm leading-relaxed font-semibold">
                      {evaluationResult.feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-800/40 mt-auto">
              {evaluationResult && evaluationResult.score >= 0.8 ? (
                <button
                  onClick={handleBackToPath}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2 animate-pulse"
                >
                  Unlock Next Topic <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  disabled={answer.trim() === '' || evaluationLoading}
                  onClick={handleSubmit}
                  className="px-8 py-3.5 bg-gradient-brand text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/15 hover:opacity-95 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {evaluationLoading ? 'Grading Answer...' : 'Submit Evaluation'}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
