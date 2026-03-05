import { api } from "./client";

export type SessionType = "LECTURA" | "COORDINACION" | "EXTRAORDINARIA";
export type SessionStatus = "SCHEDULED" | "LIVE" | "ENDED";

export interface Session {
    id: string;
    clubId: string;
    cycleId: string;
    title: string;
    sessionType: SessionType;
    status?: SessionStatus;
    startsAt: string;
    endsAt?: string;
    startedAt?: string | null;
    endedAt?: string | null;
    location?: string;
    description?: string;
}

export interface CreateSessionDto {
    title: string;
    sessionType: SessionType;
    startsAt: string;
    endsAt?: string;
    location?: string;
    description?: string;
    cycleId?: string;
}

export const sessionsApi = {
    getSessions: (clubId: string, params?: { from?: string; to?: string; type?: SessionType }) => {
        const query = new URLSearchParams(params as any).toString();
        return api.get<Session[]>(`/clubs/${clubId}/sessions?${query}`);
    },

    getSession: (id: string) => api.get<Session>(`/sessions/${id}`),

    getLiveSession: (clubId: string) => api.get<Session | null>(`/clubs/${clubId}/live-session`),

    createSession: (clubId: string, data: CreateSessionDto) =>
        api.post<Session>(`/clubs/${clubId}/sessions`, data),

    updateSession: (id: string, data: Partial<CreateSessionDto>) =>
        api.patch<Session>(`/sessions/${id}`, data),

    startSession: (id: string) =>
        api.post<Session>(`/sessions/${id}/start`, {}),

    endSession: (id: string) =>
        api.post<Session>(`/sessions/${id}/end`, {}),

    deleteSession: (id: string) =>
        api.delete<void>(`/sessions/${id}`),
};
