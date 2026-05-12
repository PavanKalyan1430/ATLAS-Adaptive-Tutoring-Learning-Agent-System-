import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Documents
  documents: [],
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  setDocuments: (docs) => set({ documents: docs }),
  updateDocumentStatus: (docId, status, chunkCount) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.doc_id === docId ? { ...d, status, chunk_count: chunkCount ?? d.chunk_count } : d
      ),
    })),

  // Active document for querying
  activeDocId: null,
  setActiveDocId: (id) => set({ activeDocId: id }),

  // Chat messages per session
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  // Agent thought stream
  agentSteps: [],
  addAgentStep: (step) => set((s) => ({ agentSteps: [...s.agentSteps, step] })),
  clearAgentSteps: () => set({ agentSteps: [] }),

  // Analytics
  analytics: {
    totalQueries: 0,
    avgResponseTime: 0,
    hallucinationsCaught: 0,
    lastResponseMs: 0,
  },
  updateAnalytics: (patch) =>
    set((s) => ({ analytics: { ...s.analytics, ...patch } })),

  // Strategy mode
  strategyMode: 'deep', // 'fast' | 'deep'
  setStrategyMode: (mode) => set({ strategyMode: mode }),

  // UI state
  activeTab: 'chat', // 'chat' | 'graph' | 'analytics'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // System health
  health: null,
  setHealth: (h) => set({ health: h }),

  // Session
  sessionId: crypto.randomUUID(),
}));
