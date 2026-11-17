/**
 * Centralized API client for LabXAI FastAPI backend.
 * All AI requests go through the backend; no OpenRouter keys exist in the frontend.
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const DEFAULT_STUDENT_ID = 'demo-student-1';

export class ApiError extends Error {
  constructor(message, status, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 35000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const detail = data?.detail || `Request failed with status ${response.status}`;
      throw new ApiError(
        typeof detail === 'string' ? detail : JSON.stringify(detail),
        response.status,
        detail
      );
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out while contacting the LabXAI backend.', 408);
    }
    throw new ApiError(
      'Unable to connect to the LabXAI backend server. Ensure FastAPI is running on ' + API_BASE_URL,
      0
    );
  } finally {
    clearTimeout(timer);
  }
}

export const labApi = {
  // Health & Languages
  getHealth: () => request('/api/v1/health'),
  getLanguages: () => request('/api/v1/languages'),

  // Experiments
  listExperiments: ({ subject, difficulty, search } = {}) => {
    const params = new URLSearchParams();
    if (subject && subject !== 'all') params.set('subject', subject);
    if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request(`/api/v1/experiments${qs ? `?${qs}` : ''}`);
  },
  getExperiment: (experimentId) => request(`/api/v1/experiments/${encodeURIComponent(experimentId)}`),
  simulateExperiment: (experimentId, { studentId = DEFAULT_STUDENT_ID, parameters, saveRun = true, notes = '' }) =>
    request(`/api/v1/experiments/${encodeURIComponent(experimentId)}/simulate`, {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        parameters,
        save_run: saveRun,
        notes,
      }),
    }),

  // AI Tutor
  explainExperiment: ({ experimentId, parameters, measurements, language = 'en', studentId = DEFAULT_STUDENT_ID }) =>
    request('/api/v1/ai/explain', {
      method: 'POST',
      body: JSON.stringify({
        experiment_id: experimentId,
        parameters,
        measurements,
        language,
        student_id: studentId,
      }),
    }),
  chatWithTutor: ({
    experimentId,
    question,
    parameters,
    measurements,
    history = [],
    language = 'en',
    studentId = DEFAULT_STUDENT_ID,
  }) =>
    request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        experiment_id: experimentId,
        question,
        parameters,
        measurements,
        history,
        language,
        student_id: studentId,
      }),
    }),

  // Quizzes
  listQuizzes: (experimentId) => {
    const qs = experimentId ? `?experiment_id=${encodeURIComponent(experimentId)}` : '';
    return request(`/api/v1/quizzes${qs}`);
  },
  getQuiz: (quizId) => request(`/api/v1/quizzes/${encodeURIComponent(quizId)}`),
  submitQuiz: (quizId, { studentId = DEFAULT_STUDENT_ID, answers }) =>
    request(`/api/v1/quizzes/${encodeURIComponent(quizId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        answers,
      }),
    }),

  // Student Profile, Progress & History
  getStudent: (studentId = DEFAULT_STUDENT_ID) =>
    request(`/api/v1/students/${encodeURIComponent(studentId)}`),
  updateStudent: (studentId = DEFAULT_STUDENT_ID, updates) =>
    request(`/api/v1/students/${encodeURIComponent(studentId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  getStudentProgress: (studentId = DEFAULT_STUDENT_ID) =>
    request(`/api/v1/students/${encodeURIComponent(studentId)}/progress`),
  getStudentHistory: (studentId = DEFAULT_STUDENT_ID) =>
    request(`/api/v1/students/${encodeURIComponent(studentId)}/history`),
};
