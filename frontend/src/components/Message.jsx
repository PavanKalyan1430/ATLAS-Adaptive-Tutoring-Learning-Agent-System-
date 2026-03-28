import { User, Bot, FileText } from 'lucide-react';

export default function Message({ message }) {
  const isUser = message.role === 'user';
  const isError = message.content.startsWith('Error:') || message.content.startsWith('Connection Interrupted:');

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg
          ${isUser ? 'bg-gradient-to-br from-indigo-500 to-purple-500 ml-4' : 'bg-slate-800 border border-slate-700 mr-4'}`}
        >
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div className={`p-5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-xl border
            ${isUser 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500/50 rounded-2xl rounded-tr-sm' 
              : isError
                ? 'bg-pink-950/30 border-pink-500/30 text-pink-200 rounded-2xl rounded-tl-sm'
                : 'bg-slate-800/80 backdrop-blur-md border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-sm'}`}
          >
            {message.content}
          </div>

          {/* Sources Array (if AI message and sources exist) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold my-auto mr-1">Citations:</span>
              {message.sources.map((page, idx) => (
                <div key={idx} className="flex items-center bg-slate-800/80 hover:bg-slate-700 border border-slate-600 px-2.5 py-1 rounded-md text-xs text-indigo-300 transition-colors cursor-default shadow-sm group">
                  <FileText className="w-3.5 h-3.5 mr-1.5 opacity-70 group-hover:opacity-100" />
                  Page {page}
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
