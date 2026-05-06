import { api } from "./client";

export interface BookSearchResult {
    title: string;
    authorName?: string | null;
    firstPublishYear?: number | null;
    coverUrl?: string | null;
    openLibraryWorkKey?: string | null;
    openLibraryEditionKey?: string | null;
    isbn?: string | null;
}

export interface SessionBookItem {
    id: string;
    position: number;
    notes?: string | null;
    book: {
        id: string;
        title: string;
        authorName?: string | null;
        firstPublishYear?: number | null;
        coverUrl?: string | null;
    };
    reviews: Array<{
        id: string;
        rating: number;
        comment?: string | null;
    }>;
}

export interface SessionPhotoItem {
    id: string;
    url: string;
    caption?: string | null;
    sortOrder: number;
    createdAt: string;
}

export interface DiscussionQuestion {
    id: string;
    prompt: string;
    sortOrder: number;
    replies: Array<{
        id: string;
        body: string;
        displayMode: "NAMED" | "ANONYMOUS";
    }>;
}

export interface DiscussionReply {
    id: string;
    sessionId: string;
    questionId?: string | null;
    body: string;
    displayMode: "NAMED" | "ANONYMOUS";
    displayName: string;
    createdAt: string;
}

export interface SessionExperience {
    id: string;
    title?: string | null;
    summary?: string | null;
    sessionType: "LECTURA" | "COORDINACION" | "EXTRAORDINARIA";
    status: "SCHEDULED" | "LIVE" | "ENDED";
    startsAt: string;
    isPointsEnabled: boolean;
    books: SessionBookItem[];
    photos: SessionPhotoItem[];
    discussionQuestions: DiscussionQuestion[];
    replies: DiscussionReply[];
}

export const sessionContentApi = {
    getSessionExperience: (sessionId: string) =>
        api.get<SessionExperience>(`/sessions/${sessionId}/experience`),

    searchBooks: (q: string, author?: string) => {
        const params = new URLSearchParams({ q });
        if (author) params.append("author", author);
        return api.get<BookSearchResult[]>(`/books/search?${params.toString()}`);
    },

    importBook: (data: {
        clubId: string;
        title: string;
        authorName?: string | null;
        firstPublishYear?: number | null;
        coverUrl?: string | null;
        openLibraryWorkKey?: string | null;
        openLibraryEditionKey?: string | null;
        isbn?: string | null;
    }) => api.post(`/books/import-from-open-library`, data),

    getSessionBooks: (sessionId: string) =>
        api.get<SessionBookItem[]>(`/sessions/${sessionId}/books`),

    attachBook: (sessionId: string, data: { bookId: string; position: number; notes?: string }) =>
        api.post(`/sessions/${sessionId}/books`, data),

    getPhotos: (sessionId: string) =>
        api.get<SessionPhotoItem[]>(`/sessions/${sessionId}/photos`),

    uploadPhoto: (sessionId: string, formData: FormData) =>
        api.post(`/sessions/${sessionId}/photos`, formData),

    getQuestions: (sessionId: string) =>
        api.get<DiscussionQuestion[]>(`/sessions/${sessionId}/questions`),

    addQuestion: (sessionId: string, data: { prompt: string; sortOrder?: number }) =>
        api.post(`/sessions/${sessionId}/questions`, data),

    getReplies: (sessionId: string) =>
        api.get<DiscussionReply[]>(`/sessions/${sessionId}/replies`),

    addReply: (sessionId: string, data: { questionId?: string; body: string; displayMode?: "NAMED" | "ANONYMOUS" }) =>
        api.post(`/sessions/${sessionId}/replies`, data),

    createReview: (sessionId: string, sessionBookId: string, data: { rating: number; comment?: string }) =>
        api.post(`/sessions/${sessionId}/books/${sessionBookId}/review`, data),
};
