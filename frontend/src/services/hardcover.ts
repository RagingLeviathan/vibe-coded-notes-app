// Hardcover catalog search through the backend proxy (/api/hardcover).
// Hardcover rejects `_ilike`, so this uses their Typesense-backed `search` query.

const SEARCH_QUERY = `
  query SearchBooks($q: String!, $page: Int!, $perPage: Int!) {
    search(query: $q, query_type: "Book", per_page: $perPage, page: $page) {
      results
    }
  }
`;

export interface BookHit {
    id: string;
    title?: string;
    subtitle?: string;
    authors: string[];
    pages?: number;
    releaseYear?: number;
    slug?: string;
}

export const searchBooks = async (q: string, page = 1, perPage = 25): Promise<{ hits: BookHit[]; total: number }> => {
    const res = await fetch('/api/hardcover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: SEARCH_QUERY, variables: { q, page, perPage }, operationName: 'SearchBooks' }),
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));

    const typesense = json.data && json.data.search && json.data.search.results;
    const rawHits: any[] = (typesense && typesense.hits) || [];
    return {
        hits: rawHits.map((h: any) => {
            const d = h.document || {};
            return {
                id: String(d.id),
                title: d.title,
                subtitle: d.subtitle,
                authors: d.author_names || [],
                pages: d.pages,
                releaseYear: d.release_year,
                slug: d.slug,
            };
        }),
        total: (typesense && typesense.found) || 0,
    };
};

export const bookUrl = (slug?: string | null) => (slug ? `https://hardcover.app/books/${encodeURIComponent(slug)}` : null);

// Query string used to open the note editor pre-linked to a book
export const addNoteLink = (book: { id: string | number; title?: string; slug?: string }) => {
    const params = new URLSearchParams({ bookId: String(book.id), bookTitle: book.title || 'Untitled' });
    if (book.slug) params.set('bookSlug', book.slug);
    return `/?${params.toString()}`;
};
