import React, { useState } from 'react';
import SubjectSelect from './pages/SubjectSelect';
import DiagnosticQuiz from './pages/DiagnosticQuiz';
import LearningPath from './pages/LearningPath';
import StudyRoom from './pages/StudyRoom';
import WebSocketProvider from './components/WebSocketProvider';

export default function App() {
  const [currentPage, setCurrentPage] = useState('select'); // select, quiz, path, study

  const renderPage = () => {
    switch (currentPage) {
      case 'select':
        return <SubjectSelect onNavigate={setCurrentPage} />;
      case 'quiz':
        return <DiagnosticQuiz onNavigate={setCurrentPage} />;
      case 'path':
        return <LearningPath onNavigate={setCurrentPage} />;
      case 'study':
        return <StudyRoom onNavigate={setCurrentPage} />;
      default:
        return <SubjectSelect onNavigate={setCurrentPage} />;
    }
  };

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-[#070b19] font-sans antialiased text-slate-100 selection:bg-indigo-500/30">
        {renderPage()}
      </div>
    </WebSocketProvider>
  );
}
