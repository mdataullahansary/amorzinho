import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor — Inject JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('amorzinho_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor — Handle 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('amorzinho_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Type-safe API helpers ────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const coupleApi = {
  create: (data?: { anniversaryDate?: string }) => api.post('/couple/create', data),
  join: (inviteCode: string) => api.post('/couple/join', { inviteCode }),
  me: () => api.get('/couple/me'),
  setMood: (mood: string) => api.patch('/couple/mood', { mood }),
  setNote: (note: string) => api.patch('/couple/note', { note }),
  setAnniversary: (date: string) => api.patch('/couple/anniversary', { anniversaryDate: date }),
  getInviteCode: () => api.get('/couple/invite'),
};

export const chatApi = {
  getMessages: (page = 1, limit = 40) =>
    api.get('/chat/messages', { params: { page, limit } }),
  uploadImage: (formData: FormData) =>
    api.post('/chat/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadVoice: (formData: FormData) =>
    api.post('/chat/upload/voice', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markRead: (messageId: string) => api.patch(`/chat/read/${messageId}`),
};

export const musicApi = {
  getSongs: (params?: { search?: string; favorite?: boolean }) =>
    api.get('/music/songs', { params }),
  uploadSong: (formData: FormData) =>
    api.post('/music/songs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadArt: (id: string, formData: FormData) =>
    api.patch(`/music/songs/${id}/art`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleFavorite: (id: string) => api.patch(`/music/songs/${id}/favorite`),
  deleteSong: (id: string) => api.delete(`/music/songs/${id}`),
  getPlaylists: () => api.get('/music/playlists'),
  createPlaylist: (data: { name: string; description?: string }) =>
    api.post('/music/playlists', data),
  updatePlaylistTracks: (id: string, trackId: string, action: 'add' | 'remove') =>
    api.patch(`/music/playlists/${id}/tracks`, { trackId, action }),
  getSession: () => api.get('/music/session'),
};

export const diaryApi = {
  getEntries: (params?: { month?: string; year?: string }) =>
    api.get('/diary', { params }),
  getEntry: (id: string) => api.get(`/diary/${id}`),
  createEntry: (formData: FormData) =>
    api.post('/diary', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateEntry: (id: string, data: object) => api.patch(`/diary/${id}`, data),
  deleteEntry: (id: string) => api.delete(`/diary/${id}`),
};

export const memoriesApi = {
  getMemories: (params?: { tag?: string; year?: string; month?: string }) =>
    api.get('/memories', { params }),
  getMemory: (id: string) => api.get(`/memories/${id}`),
  createMemory: (formData: FormData) =>
    api.post('/memories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMemory: (id: string, data: object) => api.patch(`/memories/${id}`, data),
  deleteMemory: (id: string) => api.delete(`/memories/${id}`),
};

export const movieApi = {
  getCurrentSession: () => api.get('/movie/session/current'),
  createSession: (data: { videoUrl: string; title?: string }) =>
    api.post('/movie/session', data),
  endSession: (id: string) => api.delete(`/movie/session/${id}`),
};

export const bucketApi = {
  getItems: (category?: string) =>
    api.get('/bucket', { params: category ? { category } : {} }),
  createItem: (data: object) => api.post('/bucket', data),
  updateItem: (id: string, data: object) => api.patch(`/bucket/${id}`, data),
  deleteItem: (id: string) => api.delete(`/bucket/${id}`),
};

export const analyticsApi = {
  get: () => api.get('/analytics'),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  readAll: () => api.patch('/notifications/read-all'),
  readOne: (id: string) => api.patch(`/notifications/${id}/read`),
};
