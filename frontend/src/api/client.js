/**
 * Centralized API client for LabXAI FastAPI backend.
 * All AI and translation requests go through the backend; no API keys exist in browser code.
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
  // Health, Languages, Translation & Speech Config
  getHealth: () => request('/api/v1/health'),
  getLanguages: () => request('/api/v1/languages'),
  getSpeechConfig: () => request('/api/v1/speech/config'),
  getAiProviders: () => request('/api/v1/ai/providers'),
  synthesizeSpeech: ({ text, language = 'en', speed = 1.0 }) =>
    request('/api/v1/speech/tts', {
      method: 'POST',
      body: JSON.stringify({
        text,
        language,
        speed,
      }),
    }),
  translateText: ({ text, sourceLang = 'en', targetLang = 'kn', preserveScientificTerms = true }) =>
    request('/api/v1/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
        preserve_scientific_terms: preserveScientificTerms,
      }),
    }),

  // Subjects & Experiments
  listSubjects: () => request('/api/v1/subjects'),
  listExperiments: ({ subject, difficulty, search } = {}) => {
    const params = new URLSearchParams();
    if (subject && subject !== 'all') params.set('subject', subject);
    if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request(`/api/v1/experiments${qs ? `?${qs}` : ''}`);
  },
  getExperiment: (experimentId) => request(`/api/v1/experiments/${encodeURIComponent(experimentId)}`),
  simulateExperiment: (
    experimentId,
    { studentId = DEFAULT_STUDENT_ID, parameters, language = 'en', saveRun = true, notes = '', durationSeconds = 60 }
  ) =>
    request(`/api/v1/experiments/${encodeURIComponent(experimentId)}/simulate`, {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        parameters,
        language,
        save_run: saveRun,
        notes,
        duration_seconds: durationSeconds,
      }),
    }),

  // Videos
  listVideos: ({ subject, experimentId, difficulty, language, search, featured } = {}) => {
    const params = new URLSearchParams();
    if (subject && subject !== 'all') params.set('subject', subject);
    if (experimentId && experimentId !== 'all') params.set('experiment_id', experimentId);
    if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
    if (language && language !== 'all') params.set('language', language);
    if (search) params.set('search', search);
    if (typeof featured === 'boolean') params.set('featured', String(featured));
    const qs = params.toString();
    return request(`/api/v1/videos${qs ? `?${qs}` : ''}`);
  },
  getVideoRecommendations: ({ experimentId, subject, limit = 6 } = {}) => {
    const params = new URLSearchParams();
    if (experimentId) params.set('experiment_id', experimentId);
    if (subject) params.set('subject', subject);
    if (limit) params.set('limit', String(limit));
    return request(`/api/v1/videos/recommendations?${params.toString()}`);
  },

  // AI Tutor
  explainExperiment: ({
    experimentId,
    parameters,
    measurements,
    language = 'en',
    studentId = DEFAULT_STUDENT_ID,
    mode = 'explain',
    conversationId = null,
  }) =>
    request('/api/v1/ai/explain', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        experiment_id: experimentId,
        parameters,
        measurements,
        language,
        student_id: studentId,
        mode,
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
    mode = 'explain',
    conversationId = null,
  }) =>
    request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        experiment_id: experimentId,
        question,
        parameters,
        measurements,
        history,
        language,
        student_id: studentId,
        mode,
      }),
    }),

  // Quizzes (supports legacy string experimentId OR filter object)
  listQuizzes: (filters) => {
    const params = new URLSearchParams();
    if (typeof filters === 'string' && filters) {
      params.set('experiment_id', filters);
    } else if (filters && typeof filters === 'object') {
      if (filters.experimentId) params.set('experiment_id', filters.experimentId);
      if (filters.subject && filters.subject !== 'all') params.set('subject', filters.subject);
      if (filters.difficulty && filters.difficulty !== 'all') params.set('difficulty', filters.difficulty);
    }
    const qs = params.toString();
    return request(`/api/v1/quizzes${qs ? `?${qs}` : ''}`);
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
  getStudentProgress: (studentId = DEFAULT_STUDENT_ID, { subject, difficulty } = {}) => {
    const params = new URLSearchParams();
    if (subject && subject !== 'all') params.set('subject', subject);
    if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
    const qs = params.toString();
    return request(`/api/v1/students/${encodeURIComponent(studentId)}/progress${qs ? `?${qs}` : ''}`);
  },
  getStudentHistory: (studentId = DEFAULT_STUDENT_ID) =>
    request(`/api/v1/students/${encodeURIComponent(studentId)}/history`),

  // Physics Playground Persistent Projects (SQLite)
  listPlaygroundProjects: ({ studentId = DEFAULT_STUDENT_ID, mode } = {}) => {
    const params = new URLSearchParams({ student_id: studentId });
    if (mode) params.set('mode', mode);
    return request(`/api/v1/playground/projects?${params.toString()}`);
  },
  createPlaygroundProject: ({ studentId = DEFAULT_STUDENT_ID, name, mode = 'circuit', workspace, observations = [] }) =>
    request('/api/v1/playground/projects', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        name,
        mode,
        workspace,
        observations,
      }),
    }),
  getPlaygroundProject: (projectId) =>
    request(`/api/v1/playground/projects/${encodeURIComponent(projectId)}`),
  updatePlaygroundProject: (projectId, updates) =>
    request(`/api/v1/playground/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  deletePlaygroundProject: (projectId) =>
    request(`/api/v1/playground/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
    }),
};
