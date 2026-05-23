import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Session Endpoints
  createSession: async (studentName, subject) => {
    const response = await apiClient.post('/sessions', {
      student_name: studentName,
      subject: subject,
    });
    return response.data;
  },
  
  getSession: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Diagnostic Quiz Endpoints
  getNextQuestion: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/quiz/next`);
    return response.data;
  },
  
  submitQuizAnswer: async (sessionId, questionId, selectedOptionIdx, timeTakenSeconds) => {
    const response = await apiClient.post(`/sessions/${sessionId}/quiz/answer`, {
      question_id: questionId,
      selected_option_idx: selectedOptionIdx,
      time_taken_seconds: timeTakenSeconds,
    });
    return response.data;
  },

  // Learning Path Endpoints
  getLearningPath: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/path`);
    return response.data;
  },
  
  getCurrentNode: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/path/current`);
    return response.data;
  },

  // Exercise Evaluation Endpoints
  submitExercise: async (sessionId, answer) => {
    const response = await apiClient.post(`/sessions/${sessionId}/evaluate`, {
      answer: answer,
    });
    return response.data;
  },
  
  // Base URLs (useful for websockets)
  getWsUrl: (sessionId) => {
    return `ws://127.0.0.1:8001/ws/${sessionId}`;
  }
};
