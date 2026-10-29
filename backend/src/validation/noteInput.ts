import { Note } from '../services/notesService';

export const LIMITS = {
    title: 255,
    content: 15000,
    sourceShort: 255,
    sourceFull: 10000,
    bookTitle: 255,
    bookSlug: 255,
};

const MAX_BOOK_ID = 4294967295;
const SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

export interface ValidationResult {
    errors: Record<string, string>;
    value: Partial<Note>;
}

const has = (body: any, key: string) => Object.prototype.hasOwnProperty.call(body, key);

// Validates and normalizes note input. Only known fields are copied into `value`.
// In 'create' mode title and content are required; in 'update' mode only supplied fields are checked.
export const validateNoteInput = (rawBody: any, mode: 'create' | 'update'): ValidationResult => {
    const errors: Record<string, string> = {};
    const value: Partial<Note> = {};

    if (rawBody === null || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
        return { errors: { body: 'Request body must be a JSON object' }, value };
    }
    const body = rawBody as Record<string, unknown>;

    const requiredText = (key: 'title' | 'content') => {
        if (!has(body, key)) {
            if (mode === 'create') errors[key] = `${key} is required`;
            return;
        }
        const v = body[key];
        if (typeof v !== 'string') {
            errors[key] = `${key} must be text`;
        } else if (v.trim() === '') {
            errors[key] = `${key} cannot be empty`;
        } else if (v.trim().length > LIMITS[key]) {
            errors[key] = `${key} must be at most ${LIMITS[key]} characters`;
        } else {
            value[key] = v.trim();
        }
    };

    // Optional text: empty string or null clears the value
    const optionalText = (key: 'sourceShort' | 'sourceFull') => {
        if (!has(body, key)) return;
        const v = body[key];
        if (v === null || v === undefined) {
            value[key] = null;
        } else if (typeof v !== 'string') {
            errors[key] = `${key} must be text`;
        } else if (v.trim().length > LIMITS[key]) {
            errors[key] = `${key} must be at most ${LIMITS[key]} characters`;
        } else {
            value[key] = v.trim() === '' ? null : v.trim();
        }
    };

    requiredText('title');
    requiredText('content');
    optionalText('sourceShort');
    optionalText('sourceFull');

    // Book link is optional and handled as a group: bookId present (null clears the link)
    const touchesBook = has(body, 'bookId') || has(body, 'bookTitle') || has(body, 'bookSlug');
    if (touchesBook) {
        if (!has(body, 'bookId')) {
            errors.bookId = 'bookId is required when setting book details';
        } else {
            const raw = body.bookId;
            if (raw === null || raw === undefined || raw === '') {
                value.bookId = null;
                value.bookTitle = null;
                value.bookSlug = null;
            } else {
                const id = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
                if (!Number.isInteger(id) || id < 1 || id > MAX_BOOK_ID) {
                    errors.bookId = 'bookId must be a positive whole number';
                } else {
                    value.bookId = id;
                }

                const title = body.bookTitle;
                if (typeof title !== 'string' || title.trim() === '') {
                    errors.bookTitle = 'bookTitle is required when linking a book';
                } else if (title.trim().length > LIMITS.bookTitle) {
                    errors.bookTitle = `bookTitle must be at most ${LIMITS.bookTitle} characters`;
                } else {
                    value.bookTitle = title.trim();
                }

                const slug = body.bookSlug;
                if (slug === undefined || slug === null || slug === '') {
                    value.bookSlug = null;
                } else if (typeof slug !== 'string' || slug.length > LIMITS.bookSlug || !SLUG_PATTERN.test(slug)) {
                    errors.bookSlug = 'bookSlug is not a valid slug';
                } else {
                    value.bookSlug = slug;
                }
            }
        }
    }

    return { errors, value };
};
