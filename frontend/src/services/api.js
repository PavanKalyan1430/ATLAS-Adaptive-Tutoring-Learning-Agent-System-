// Centralized API service layer — all backend communication lives here
const BASE_URL = 'http://127.0.0.1:8000';

export const api = {
  // Upload a PDF document
  async uploadDocument(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Poll document status until ready
  async getDocumentStatus(docId) {
    const res = await fetch(`${BASE_URL}/status/${docId}`);
    if (!res.ok) throw new Error(`Status check failed for ${docId}`);
    return res.json();
  },

  // Get all documents
  async listDocuments() {
    const res = await fetch(`${BASE_URL}/documents`);
    if (!res.ok) return [];
    return res.json();
  },

  // Query the AI agent
  async query(question, sessionId) {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: sessionId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Query failed');
    }
    return res.json();
  },

  // Health check
  async health() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },
};
