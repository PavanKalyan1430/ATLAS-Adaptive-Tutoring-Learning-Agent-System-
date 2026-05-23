import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import ChatPage from './pages/ChatPage';
import ArchitecturePage from './pages/ArchitecturePage';
import PromptsPage from './pages/PromptsPage';
import { useStore } from './store';
import { api } from './services/api';

export default function App() {
  const { setHealth, setDocuments, setActiveDocId } = useStore();

  useEffect(() => {
    // Initialize data
    const init = async () => {
      try {
        const [health, docs] = await Promise.all([api.health(), api.listDocuments()]);
        setHealth(health);
        setDocuments(docs.reverse());
        const readyDoc = docs.find(d => d.status === 'ready');
        if (readyDoc) setActiveDocId(readyDoc.doc_id);
      } catch (e) {
        console.error("Init failed:", e);
      }
    };
    init();

    // Poll health and processing documents
    const intervalId = setInterval(async () => {
      api.health().then(setHealth).catch(() => {});
      const currentDocs = useStore.getState().documents;
      const processingDocs = currentDocs.filter(d => d.status === 'processing');
      for (const doc of processingDocs) {
        try {
          const status = await api.getDocumentStatus(doc.doc_id);
          useStore.getState().updateDocumentStatus(
            doc.doc_id, 
            status.status, 
            status.chunk_count, 
            status.progress
          );
          if (status.status === 'ready' && !useStore.getState().activeDocId) {
            useStore.getState().setActiveDocId(doc.doc_id);
          }
        } catch (e) {}
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [setHealth, setDocuments, setActiveDocId]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="prompts" element={<PromptsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
