import axios from 'axios';

// Use a relative path so the frontend (served by Vite) can proxy /api to the backend.
// This makes the frontend usable from other devices on the LAN when Vite is
// listening on all interfaces (host: true) and forwarding /api to the backend.
const API_BASE = '/api/notes';

export const fetchNotes = async (page = 1, limit = 5, q?: string, fields?: string[], sourceFull?: string) => {
    const params: any = { page, limit };
    if (q && q.length > 0) params.q = q;
    if (fields && fields.length > 0) params.fields = fields.join(',');
    const response = sourceFull === undefined
        ? await axios.get(API_BASE, { params })
        : await axios.post(`${API_BASE}/by-source`, { sourceFull }, { params });
    return response.data; // { data, total, page, limit, q }
};

export const fetchNote = async (id: number | string) => {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
};

export interface NoteInput {
    title?: string;
    content?: string;
    sourceShort?: string | null;
    sourceFull?: string | null;
    // Optional Hardcover link; bookId null clears it
    bookId?: number | null;
    bookTitle?: string | null;
    bookSlug?: string | null;
}

export interface SourceTag {
    id: number;
    sourceShort: string;
    sourceFull: string;
    bookId: number;
    bookTitle: string;
    bookSlug: string | null;
}

export type SourceTagInput = Omit<SourceTag, 'id'>;

export const fetchSourceTags = async (): Promise<SourceTag[]> => {
    const response = await axios.get<SourceTag[]>('/api/source-tags');
    return response.data;
};

export const saveSourceTag = async (tag: SourceTagInput, id?: number): Promise<{ updatedNotes: number }> => {
    const response = id === undefined
        ? await axios.post('/api/source-tags', tag)
        : await axios.put(`/api/source-tags/${id}`, tag);
    return response.data;
};

// Turns an axios/network error into a readable message, including backend field errors
export const getErrorMessage = (err: any): string => {
    const data = err && err.response && err.response.data;
    if (data && data.errors && typeof data.errors === 'object') {
        const details = Object.values(data.errors).join('; ');
        return `${data.message || 'Request failed'}: ${details}`;
    }
    if (data && typeof data.message === 'string') return data.message;
    if (err && err.response) return `Request failed (HTTP ${err.response.status})`;
    return 'Could not reach the server. Check that the backend is running.';
};

export const createNote = async (note: NoteInput) => {
    const response = await axios.post(API_BASE, note);
    return response.data;
};

export const updateNote = async (id: number, note: NoteInput) => {
    const response = await axios.put(`${API_BASE}/${id}`, note);
    return response.data;
};

// Downloads every note as a file (json or csv) via a temporary link
export const exportNotes = async (format: 'json' | 'csv') => {
    const response = await axios.get(`${API_BASE}/export`, { params: { format }, responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booknotes-export-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const deleteNote = async (id: number) => {
    await axios.delete(`${API_BASE}/${id}`);
};