import { useState } from 'react';
import { Upload as UploadIcon, File, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { uploadPDF } from '../services/api';

export default function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (selected) => {
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
      setSuccess(false);
    } else {
      setFile(null);
      setError('Invalid format. Please upload a PDF file.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await uploadPDF(file);
      setSuccess(true);
      onUploadSuccess(data.doc_id, file.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-indigo-500/30">
      
      {/* Background glow effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />
      
      <div className="flex items-center mb-6">
        <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
        <h2 className="text-xl font-medium text-slate-100 tracking-wide">Knowledge Base</h2>
      </div>
      
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl mb-6 transition-all duration-300
          ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/20 hover:bg-slate-800/50 hover:border-slate-600'}`}
      >
        <div className="p-4 bg-slate-800 rounded-full mb-4 shadow-inner ring-1 ring-slate-700/50 group-hover:scale-110 transition-transform duration-300">
          <UploadIcon className={`w-8 h-8 ${dragActive ? 'text-indigo-400' : 'text-slate-400'}`} />
        </div>
        <p className="text-slate-300 font-medium mb-1">Drag & drop your PDF here</p>
        <p className="text-xs text-slate-500 mb-6">Max file size: 50MB</p>
        
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-slate-800 border border-slate-700 hover:border-slate-600 px-6 py-2.5 rounded-full shadow-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          Browse Files
        </label>
      </div>

      {file && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-indigo-500/10 text-indigo-200 rounded-xl mb-6 border border-indigo-500/20 shadow-inner">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
              <File className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[150px] md:max-w-[200px]">{file.name}</span>
              <span className="text-xs text-indigo-400/70">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={loading || success}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all duration-300
              ${loading || success 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/25 hover:scale-105'}`}
          >
            {loading ? 'Processing...' : success ? 'Vectorized ✓' : 'Instill Knowledge'}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center p-4 text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-xl text-sm animate-pulse">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center p-4 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>Document embeddings successfully stored.</p>
        </div>
      )}
    </div>
  );
}
