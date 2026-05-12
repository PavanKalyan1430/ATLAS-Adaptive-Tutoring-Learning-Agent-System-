import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { Send, Lock, Search, FileText, CornerDownRight, Sparkles, MessageSquare, Terminal, Zap, ArrowRight, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function ChatPage() {
  const { messages, addMessage, activeDocId, documents, sessionId, updateAnalytics, analytics } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  const activeDoc = documents.find((d) => d.doc_id === activeDocId);
  const canQuery = activeDoc?.status === 'ready';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !canQuery) return;
    const question = input.trim();
    setInput('');
    addMessage({ role: 'user', content: question, id: Date.now() });
    setLoading(true);

    const t = Date.now();
    try {
      const res = await api.query(question, sessionId);
      const elapsed = Date.now() - t;
      
      updateAnalytics({
        totalQueries: analytics.totalQueries + 1,
        lastResponseMs: elapsed,
        avgResponseTime: Math.round((analytics.avgResponseTime * analytics.totalQueries + elapsed) / (analytics.totalQueries + 1)),
      });

      addMessage({ role: 'assistant', content: res.answer, sources: res.sources, contextUsed: res.context_used, id: Date.now(), elapsed });
    } catch (e) {
      addMessage({ role: 'error', content: e.message, id: Date.now() });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-full w-full font-sans flex overflow-hidden bg-transparent">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative min-w-0">
          
          <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col custom-scrollbar pb-40">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center h-full max-w-[640px] mx-auto w-full text-center"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                    <div className="w-16 h-16 bento-card flex items-center justify-center relative z-10">
                      <Sparkles className="w-8 h-8 text-black" />
                    </div>
                  </div>
                  
                  <h2 className="text-[32px] font-display font-semibold text-[#09090B] mb-4 tracking-tighter leading-tight">
                    {!activeDoc ? 'Connect a Dataset' : !canQuery ? 'Embedding Dataset...' : 'How can I help you today?'}
                  </h2>
                  <p className="text-[16px] text-[#71717A] leading-relaxed mb-12 max-w-[480px]">
                    {!activeDoc ? 'Select or upload a document from the Datasets panel to bind a knowledge graph to this terminal.' :
                     !canQuery ? 'The LangGraph orchestration engine is currently chunking and indexing your vectors.' :
                     'The autonomous intelligence engine is ready. Ask any question about the currently bound dataset.'}
                  </p>

                  {canQuery && (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {["Summarize key findings", "Extract exact metrics", "Identify main risks", "Explain the topology"].map((prompt, i) => (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.4 }}
                          key={i} 
                          onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                          className="p-4 text-left bento-card flex items-start gap-3 group"
                        >
                          <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-black group-hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col pt-0.5">
                            <span className="text-[14px] text-gray-900 font-medium">{prompt}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="max-w-[760px] mx-auto w-full flex flex-col gap-10">
                  {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-5 w-full">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                        <Sparkles className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex flex-col gap-2 pt-2 flex-1">
                         <div className="h-2.5 bg-gray-100 rounded-full w-1/3 animate-pulse"></div>
                         <div className="h-2.5 bg-gray-100 rounded-full w-1/4 animate-pulse"></div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} className="h-10" />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Glass Input Area */}
          <div className="absolute bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none">
            <div className="max-w-[760px] w-full relative pointer-events-auto">
              {!canQuery && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center">
                  <div className="bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 text-[12px] font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    {activeDoc?.status === 'processing' ? (
                      <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Processing Vectors</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5" /> No Context Bound</>
                    )}
                  </div>
                </div>
              )}
              
              <div className={cn("glass-input p-2 flex flex-col", !canQuery && "opacity-50 grayscale")}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={!canQuery || loading}
                  placeholder={canQuery ? 'Ask anything...' : 'Input disabled...'}
                  className="w-full max-h-[300px] min-h-[60px] bg-transparent border-none focus:ring-0 resize-none text-[15px] text-[#09090B] placeholder:text-gray-400 px-4 py-3 custom-scrollbar font-sans leading-relaxed"
                  rows={1}
                />
                <div className="flex justify-between items-center px-2 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-[11px] font-semibold tracking-wide flex items-center gap-1.5 border border-gray-200/50">
                      <Layers className="w-3 h-3" /> gpt-4o-mini
                    </div>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!canQuery || !input.trim() || loading}
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
                      canQuery && input.trim() && !loading 
                        ? "bg-black text-white hover:scale-105 shadow-[0_4px_14px_rgba(0,0,0,0.2)]" 
                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-center mt-3 text-[11px] text-gray-400 font-medium">
                A.R.C.H.E.R. can make mistakes. Consider verifying important information.
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Context Inspector */}
        <div className="hidden lg:flex flex-col w-[380px] flex-shrink-0 border-l border-gray-100 bg-white/50 backdrop-blur-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 h-full">
          <div className="h-16 border-b border-gray-100 flex items-center px-6 flex-shrink-0">
            <h2 className="text-[12px] font-bold text-gray-900 tracking-widest uppercase flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Retrieval Trace
            </h2>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <Terminal className="w-8 h-8 text-gray-300 mb-3" />
                <span className="text-[13px] font-medium text-gray-500">Awaiting inference...</span>
              </div>
            ) : (
              <AnimatePresence>
                {messages.filter(m => m.role === 'assistant').slice(-1).map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    key={idx} 
                    className="flex flex-col gap-6"
                  >
                    {/* Stats */}
                    <div className="bento-card p-5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">E2E Latency</div>
                      <div className="text-[32px] font-mono text-black leading-none tracking-tighter">
                        {(msg.elapsed / 1000).toFixed(2)}<span className="text-[16px] text-gray-400 ml-1 tracking-normal">s</span>
                      </div>
                    </div>

                    {/* Raw Chunks */}
                    {msg.contextUsed && msg.contextUsed.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vector Payload Extract</div>
                        {msg.contextUsed.slice(0, 3).map((chunk, i) => (
                          <div key={i} className="p-4 bento-card text-[12px] font-mono text-gray-600 leading-relaxed">
                            <div className="flex items-center gap-2 text-black mb-2 font-bold pb-2 border-b border-gray-100">
                              <CornerDownRight className="w-3.5 h-3.5" />
                              <span>Chunk_{i}</span>
                            </div>
                            <div className="line-clamp-5 opacity-80">{chunk.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="bg-[#F3F4F6] text-[#09090B] px-6 py-4 rounded-3xl rounded-tr-md max-w-[85%] text-[15px] leading-relaxed font-medium">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-5 w-full group">
      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden">
        <Sparkles className="w-5 h-5 text-black relative z-10" />
      </div>
      <div className="flex-1 flex flex-col gap-2 min-w-0 pt-1.5">
        <div className={cn(
          "text-[15px] leading-relaxed text-[#09090B] font-medium", 
          isError && "text-red-600 font-mono text-[13px]",
          "prose prose-p:leading-relaxed prose-p:text-[#09090B] prose-headings:text-[#09090B] prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-black prose-a:underline prose-code:text-black prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:text-black"
        )}>
          <ReactMarkdown>
            {msg.content}
          </ReactMarkdown>
        </div>
        
        {msg.sources?.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {msg.sources.map((page, i) => (
              <span key={i} className="text-[11px] font-mono px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-500 flex items-center gap-1.5 shadow-sm">
                <FileText className="w-3 h-3" />
                Page {page}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
