import { create } from 'zustand';
import { api } from './services/api';

export const useStore = create((set, get) => ({
  // Active State Session variables
  sessionId: null,
  studentName: '',
  subject: '',
  competencyVector: {},
  
  // Quiz Variables
  activeQuestion: null,
  quizComplete: false,
  quizLoading: false,
  quizAnswersCount: 0,
  
  // Learning Path Variables
  pathNodes: [],
  pathEdges: [],
  activeNode: null,
  pathLoading: false,
  
  // Evaluation Variables
  evaluationResult: null,
  evaluationLoading: false,
  
  // Real-time Push notifications
  aiNudge: null,
  wsConnected: false,

  // Action methods
  setSession: (sessionId, studentName, subject) => {
    set({ sessionId, studentName, subject });
  },

  startSession: async (studentName, subject) => {
    set({ quizLoading: true });
    try {
      const data = await api.createSession(studentName, subject);
      set({ 
        sessionId: data.session_id,
        studentName: data.student_name,
        subject: data.subject,
        competencyVector: data.competency_vector || {},
        quizComplete: false,
        activeQuestion: null,
        quizAnswersCount: 0,
        aiNudge: null
      });
      
      // Fetch first question instantly
      const q = await api.getNextQuestion(data.session_id);
      set({ activeQuestion: q, quizLoading: false });
    } catch (e) {
      console.error(e);
      set({ quizLoading: false });
    }
  },

  submitQuizAnswer: async (selectedOptionIdx, timeTakenSeconds) => {
    const { sessionId, activeQuestion, quizAnswersCount } = get();
    if (!sessionId || !activeQuestion) return null;
    
    set({ quizLoading: true });
    try {
      const result = await api.submitQuizAnswer(
        sessionId,
        activeQuestion.question_id,
        selectedOptionIdx,
        timeTakenSeconds
      );
      
      set({ quizAnswersCount: quizAnswersCount + 1 });
      
      if (result.quiz_complete) {
        set({ 
          quizComplete: true,
          activeQuestion: null,
          competencyVector: result.competency_vector || {},
          quizLoading: false
        });
        // Immediately load the learning path sequence
        await get().fetchLearningPath();
      } else {
        set({ 
          activeQuestion: result.next_question, 
          quizLoading: false 
        });
      }
      return result;
    } catch (e) {
      console.error(e);
      set({ quizLoading: false });
      return null;
    }
  },

  fetchLearningPath: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ pathLoading: true });
    try {
      const data = await api.getLearningPath(sessionId);
      set({
        pathNodes: data.nodes,
        pathEdges: data.edges,
        competencyVector: data.competency_vector || {},
        pathLoading: false
      });
    } catch (e) {
      console.error(e);
      set({ pathLoading: false });
    }
  },

  fetchCurrentNode: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ pathLoading: true });
    try {
      const nodeDetails = await api.getCurrentNode(sessionId);
      set({ activeNode: nodeDetails, pathLoading: false, evaluationResult: null });
    } catch (e) {
      console.error(e);
      set({ pathLoading: false });
    }
  },

  submitExercise: async (answer) => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ evaluationLoading: true });
    try {
      const result = await api.submitExercise(sessionId, answer);
      set({ evaluationResult: result, evaluationLoading: false });
      return result;
    } catch (e) {
      console.error(e);
      set({ evaluationLoading: false });
      return null;
    }
  },

  // WebSocket Live Push Handlers
  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  triggerNudge: (message) => {
    set({ aiNudge: message });
  },
  
  clearNudge: () => set({ aiNudge: null }),
  
  handleWsReroute: (newPath, activeIndex) => {
    // Generate React Flow edges dynamically from prerequisites
    const edges = [];
    for (const node of newPath) {
      const prereqs = node.prerequisites || [];
      for (const p of prereqs) {
        edges.push({
          id: `edge_${p}_to_${node.topic}`,
          source: `node_${p}`,
          target: node.node_id,
          animated: node.status === 'current' || node.status === 'mastered'
        });
      }
    }
    
    // Remediation edges
    for (const node of newPath) {
      if (node.is_remediation) {
        edges.push({
          id: `edge_remedy_${node.topic}`,
          source: node.node_id,
          target: `node_${node.topic}`,
          animated: true,
          style: { stroke: '#ff9800', strokeDasharray: '5' }
        });
      }
    }

    set({ 
      pathNodes: newPath,
      pathEdges: edges,
      aiNudge: "Learning velocity audit failed! SkillForge has dynamically re-routed your path to reinforce fundamentals."
    });
  }
}));
