import axios from 'axios';

// Use a relative path so the frontend (served by Vite) can proxy /api to the backend.
// This makes the frontend usable from other devices on the LAN when Vite is
// listening on all interfaces (host: true) and forwarding /api to the backend.
const API_BASE = '/api/notes';

export const fetchNotes = async (page = 1, limit = 5, q?: string) => {
    const params: any = { page, limit };
    if (q && q.length > 0) params.q = q;
    const response = await axios.get(API_BASE, { params });
    return response.data; // { data, total, page, limit, q }
};

export const createNote = async (note: { title: string; content: string; sourceShort?: string; sourceFull?: string }) => {
    const response = await axios.post(API_BASE, note);
    return response.data;
};

export const updateNote = async (id: number, note: { title?: string; content?: string; sourceShort?: string; sourceFull?: string }) => {
    const response = await axios.put(`${API_BASE}/${id}`, note);
    return response.data;
};

export const deleteNote = async (id: number) => {
    await axios.delete(`${API_BASE}/${id}`);
};