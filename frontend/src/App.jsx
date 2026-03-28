import { useState } from 'react';
import Upload from './components/Upload';
import Chat from './components/Chat';

function App() {
  const [docId, setDocId] = useState(null);
  const [filename, setFilename] = useState('');

  const handleUploadSuccess = (newDocId, name) => {
    setDocId(newDocId);
    setFilename(name);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-indigo-500/10 to-transparent blur-3xl opacity-50 mix-blend-screen" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-500/10 to-transparent blur-3xl opacity-50 mix-blend-screen" />
      </div>

      <div className="relative z-10 p-4 md:p-8 flex flex-col items-center min-h-screen">
        
        {/* Header */}
        <header className="w-full max-w-6xl mb-12 text-center pt-8 md:pt-12">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium tracking-wide shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            ✨ Next-Gen RAG Architecture
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Synapse
            </span> Intelligence
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-light">
            Elevate your document analysis. Upload any PDF and experience military-grade semantic search powered by cross-encoder re-ranking.
          </p>
        </header>

        {/* Main Content Grid */}
        <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <Upload onUploadSuccess={handleUploadSuccess} />
            
            {/* Elegant Info Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-indigo-400 font-semibold mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                System Status
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex justify-between items-center">
                  <span>Engine:</span> <span className="text-slate-200">LLaMA-3.1 8B</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Embeddings:</span> <span className="text-slate-200">BGE-Base-EN</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Precision:</span> <span className="text-emerald-400">Cross-Encoder Active</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Chat */}
          <div className="lg:col-span-8">
            <Chat docId={docId} filename={filename} />
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
