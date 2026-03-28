import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, CornerDownRight } from 'lucide-react';
import Message from './Message';
import { askQuestion } from '../services/api';

export default function Chat({ docId, filename }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !docId || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await askQuestion(userMessage.content, docId);
      const aiMessage = { 
        role: 'assistant', 
        content: data.answer,
        sources: data.sources
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Connection Interrupted: ${error.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl flex flex-col h-[700px] overflow-hidden shadow-2xl relative">
      
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 p-5 pl-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center tracking-wide">
            <Bot className="w-5 h-5 mr-2 text-purple-400" /> Neural Chat Interface
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center font-medium">
            {docId ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" /> Active Context: {filename}</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-slate-500 mr-2" /> Awaiting Document Upload</>
            )}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto scroll-smooth custom-scrollbar">
        {!docId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <Bot className="w-12 h-12 text-slate-600 mb-2 mx-auto" />
              <p className="text-sm font-medium">System standby</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-indigo-500/20">
              <SparklesIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-lg font-medium text-slate-300 mb-2">Analysis Complete.</p>
            <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">
              The internal RAG pipeline is armed. You may now query specific facts, summaries, or insights.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <Message key={idx} message={msg} />
            ))}
          </div>
        )}
        
        {loading && (
          <div className="flex justify-start mt-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-800 border border-slate-700/50 px-5 py-4 rounded-2xl shadow-lg relative flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl animate-pulse" />
              <Loader2 className="w-5 h-5 text-indigo-400 mr-3 animate-spin" />
              <span className="text-sm font-medium text-slate-300 tracking-wide">Synthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-end gap-2">
          <div className="relative w-full bg-slate-900 border border-slate-700 focus-within:border-indigo-500/50 rounded-2xl shadow-inner transition-colors overflow-hidden flex">
            <div className="pl-4 pb-4 pt-4 text-slate-500">
              <CornerDownRight className="w-5 h-5" />
            </div>
            <textarea
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={!docId || loading}
              placeholder={docId ? "Query the document..." : "System locked."}
              className="w-full pl-3 pr-4 py-4 bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none resize-none text-sm leading-relaxed"
            />
          </div>
          <button
            type="submit"
            disabled={!docId || loading || !input.trim()}
            className="flex-shrink-0 h-14 w-14 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none transition-all duration-300 cursor-pointer"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Press Enter to send / Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  );
}

// Just a quick icon for the empty state
function SparklesIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
