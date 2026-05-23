import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { HelpCircle, Clock, Zap, ArrowRight } from 'lucide-react';

export default function DiagnosticQuiz({ onNavigate }) {
  const activeQuestion = useStore((state) => state.activeQuestion);
  const quizComplete = useStore((state) => state.quizComplete);
  const quizLoading = useStore((state) => state.quizLoading);
  const quizAnswersCount = useStore((state) => state.quizAnswersCount);
  const submitQuizAnswer = useStore((state) => state.submitQuizAnswer);

  const [selectedIdx, setSelectedIdx] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);

  // Core question timer
  useEffect(() => {
    if (submitted || quizLoading || !activeQuestion) return;
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuestion, submitted, quizLoading]);

  const handleSubmit = async () => {
    if (selectedIdx === null) return;
    setSubmitted(true);
    const ansResult = await submitQuizAnswer(selectedIdx, seconds);
    setResult(ansResult);
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setSubmitted(false);
    setResult(null);
    if (quizComplete) {
      onNavigate('path');
    }
  };

  if (quizLoading && !submitted) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Fetching next adaptive question...</p>
        </div>
      </div>
    );
  }

  // Quiz Completed View (heatmaps compiled)
  if (quizComplete) {
    return (
      <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-fuchsia-950/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full glass p-8 rounded-3xl text-center border border-slate-800 relative z-10 glow-indigo">
          <div className="bg-indigo-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <Zap className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100 mb-2">Diagnosis Complete!</h2>
          <p className="text-slate-400 text-sm mb-8">
            SkillForge has analyzed your knowledge state, compiled your competency vector and successfully mapped out your custom learning sequence.
          </p>
          
          <button
            onClick={() => onNavigate('path')}
            className="w-full py-4 bg-gradient-brand rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            Launch Learning Path <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-slate-300">
        No active question found. Go back to subject selection.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-3xl z-10">
        
        {/* Dynamic Difficulty Meter & Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Question Index Indicator */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl text-sm font-bold text-slate-300">
              Question {quizAnswersCount + 1} / 8
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold">
              <Clock className="h-4 w-4" /> {seconds}s
            </div>
          </div>
          
          {/* Adaptive Difficulty meter */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl w-fit">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Difficulty Level:</span>
            <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
              <div 
                className="bg-gradient-brand h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${activeQuestion.difficulty * 100}%` }}
              />
            </div>
            <span className="text-indigo-400 text-sm font-extrabold uppercase tracking-wide">
              {activeQuestion.difficulty <= 0.35 ? 'Easy' : activeQuestion.difficulty <= 0.65 ? 'Medium' : 'Hard'}
            </span>
          </div>
        </div>

        {/* Main Quiz Question Card */}
        <div className="glass rounded-3xl p-8 border border-slate-800 w-full mb-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-400 mt-1">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest block mb-1">
                Subtopic: {activeQuestion.topic_tag.replace('_', ' ')}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug">
                {activeQuestion.question}
              </h2>
            </div>
          </div>

          {/* Option Grid */}
          <div className="grid gap-4 mb-8">
            {activeQuestion.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              let btnClass = "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60";
              
              if (isSelected) {
                btnClass = "border-indigo-500/80 bg-indigo-500/10 text-indigo-200 shadow-md shadow-indigo-500/10";
              }
              
              if (submitted) {
                const isCorrect = idx === activeQuestion.correct_option_idx;
                if (isCorrect) {
                  btnClass = "border-emerald-500/80 bg-emerald-500/10 text-emerald-200 shadow-md shadow-emerald-500/10 cursor-default";
                } else if (isSelected) {
                  btnClass = "border-rose-500/80 bg-rose-500/10 text-rose-200 shadow-md shadow-rose-500/10 cursor-default";
                } else {
                  btnClass = "border-slate-850 bg-slate-900/20 text-slate-500 opacity-60 cursor-default";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-5 rounded-2xl border font-semibold text-sm transition-all flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Text block (Revealed post-submission) */}
          {submitted && result && (
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl mb-8 animate-fadeIn">
              <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${result.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.is_correct ? '✓ Correct Answer' : '✗ Incorrect Answer'}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed">
                {activeQuestion.explanation || "No explanation provided for this question."}
              </p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-end pt-4 border-t border-slate-800/40">
            {!submitted ? (
              <button
                disabled={selectedIdx === null}
                onClick={handleSubmit}
                className="px-8 py-3.5 bg-gradient-brand text-white rounded-xl font-bold shadow-md shadow-indigo-500/10 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                {quizComplete ? 'Compile Path' : 'Next Question'} <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
