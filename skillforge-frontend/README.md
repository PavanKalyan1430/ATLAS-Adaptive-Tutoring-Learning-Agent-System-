# SkillForge AI Frontend — Visual Dashboard
> Interactive Learning Path Visualizations · React Flow + Recharts + Lucide Icons + Tailwind CSS + Zustand

This directory contains the user interface for **SkillForge AI** — an adaptive EdTech system that lets students visualize their custom curriculum directed acyclic graph (DAG) and master competencies in real-time.

---

## 🎨 Layout Overview

```
skillforge-frontend/
├── src/
│   ├── pages/
│   │   ├── SubjectSelect.jsx       # Enter name & choose DSA vs Fundamentals
│   │   ├── DiagnosticQuiz.jsx      # MCQ Adaptive quiz + Difficulty Meter
│   │   ├── LearningPath.jsx        # Curriculum split view (DAG + Heatmap)
│   │   └── StudyRoom.jsx           # RAG textbooks, video logs & practice sandbox
│   ├── components/
│   │   ├── DAGCanvas.jsx           # React Flow Directed Acyclic Graph
│   │   ├── CompetencyHeatmap.jsx   # Recharts mastery bar chart
│   │   └── WebSocketProvider.jsx   # Listens to real-time pushes (nudges, reroutes)
│   ├── services/
│   │   └── api.js                  # Axios client REST requests
│   ├── store.js                    # Zustand global state manager
│   ├── App.jsx                     # Simple single-page routes mapping
│   ├── main.jsx                    # React bootstrap
│   └── index.css                   # Global Tailwind and premium styling tokens
├── tailwind.config.js              # Theme configurations (brand Indigo/Fuchsia glow)
├── postcss.config.js
├── package.json
└── vite.config.js
```

---

## ✨ Features Included

1.  **Animated Difficulty Meter**: During the diagnostic quiz, the dashboard renders a gorgeous, sliding gradient bar that moves and pulses in real time based on your correctness history (adapting difficulty level per question).
2.  **Interactive DAG Canvas**: Utilizes **React Flow** to render your learning milestones dynamically. Mastered nodes are bordered in green, locked nodes in grey, and your active node staggers with a pulsing blue glow.
3.  **Real-Time WebSocket Pushes**: Whenever you submit an exercise in the study room, the backend can trigger an *AI Nudge* (encouraging coach tip banner) or *Path Re-route* (injecting a review module dynamically). The canvas automatically re-calculates edges and staggers the new nodes right before your eyes!
4.  **Competency Heatmap**: Embeds horizontal bar charts colored dynamically based on percentage scores (Green >= 75% mastered, Indigo >= 45% in progress, Rose < 45% needs review).

---

## 🚀 Running the Frontend

To start the local Vite development server:

```bash
# Navigate to the frontend subfolder
cd skillforge-frontend

# Install dependencies
npm install

# Start Vite Server
npm run dev
```

Open `http://localhost:5173` (or the printed port) in your browser and start studying! 🚀
