import { useState, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { UploadCloud, FileText, Database, HardDrive, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function DocumentsPage() {
  const { documents, addDocument } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.pdf')) return alert('Only PDF files allowed.');
    setUploading(true);
    try {
      const res = await api.uploadDocument(file);
      const doc = { doc_id: res.doc_id, filename: file.name, status: 'processing', chunk_count: null };
      addDocument(doc);
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }, [addDocument]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full mx-auto p-8 lg:p-10 max-w-[1600px]">
      <header className="mb-10">
        <h1 className="text-[28px] font-display font-semibold text-[#111827] mb-2 tracking-tight">Dataset Intelligence</h1>
        <p className="text-[15px] text-[#6B7280] max-w-2xl leading-relaxed">
          Ingest unstructured PDF documents into the semantic vector space for agentic retrieval.
        </p>
      </header>

      {/* Enterprise Upload Zone */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
        className={cn(
          "relative mb-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer bg-white shadow-sm",
          isDragging ? "border-blue-500 bg-blue-50/50 shadow-md" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30",
          uploading && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        
        <div className="px-8 py-16 flex flex-col items-center justify-center text-center">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
            isDragging ? "bg-blue-100 text-blue-600 scale-110 shadow-sm" : "bg-gray-50 text-gray-400 border border-gray-100"
          )}>
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#111827] mb-2">Click or drag document to upload</h3>
          <p className="text-[14px] text-gray-500 font-medium">Maximum file size 50MB. PDF format only.</p>
          
          {uploading && (
            <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-blue-700 bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing vector embeddings...
            </div>
          )}
        </div>
      </motion.div>

      {/* Registry */}
      <div className="enterprise-card overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-md border border-gray-200 shadow-sm">
              <HardDrive className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-[14px] font-semibold text-[#111827]">Indexed Documents</h2>
          </div>
          <span className="text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
            {documents.length} Total
          </span>
        </div>
        
        {documents.length === 0 ? (
          <div className="p-20 text-center bg-white flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Knowledge base is empty</h3>
            <p className="text-[14px] font-medium text-gray-500">Upload your first document to begin vectorization.</p>
          </div>
        ) : (
          <div className="flex flex-col bg-white">
            <AnimatePresence>
              {documents.map((doc, idx) => (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  key={doc.doc_id} 
                  className={cn(
                    "p-5 flex items-center justify-between hover:bg-[#F4F7FB] transition-colors group",
                    idx !== documents.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 group-hover:border-blue-300 group-hover:shadow-md transition-all">
                      <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[15px] font-semibold text-[#111827] leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{doc.filename}</h3>
                      <div className="flex items-center gap-3 text-[12px] text-gray-500 font-mono font-medium">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">ID: {doc.doc_id.split('-')[0]}</span>
                        {doc.status === 'ready' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-gray-600">{doc.chunk_count} CHUNKS</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <StatusBadge status={doc.status} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  if (status === 'ready') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-[13px] font-semibold tracking-wide">Ready</span>
      </div>
    );
  }
  if (status === 'processing') {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-[13px] font-semibold tracking-wide">Embedding</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      <span className="text-[13px] font-semibold tracking-wide">Failed</span>
    </div>
  );
}
