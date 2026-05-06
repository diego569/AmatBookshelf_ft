import { api } from "./client";

export type CycleFormat = "INTERSEMANAL" | "SEMANAL" | "CUSTOM";

export interface Cycle {
    id: string;
    clubId: string;
    name: string;
    theme?: string | null;
    summary?: string | null;
    format: CycleFormat;
    plannedReadingSessions: number;
    plannedCoordinationSessions: number;
    isActive: boolean;
    startDate: string;
    endDate?: string | null;
}

export interface MemberCycleSummary {
    id: string;
    membershipId: string;
    cycleId: string;
    status: string;
    cycle: Cycle & { sessionsCount?: number };
}

export interface CycleSession {
    id: string;
    clubId: string;
    cycleId: string | null;
    title?: string | null;
    summary?: string | null;
    sessionType: "LECTURA" | "COORDINACION" | "EXTRAORDINARIA";
    status: "SCHEDULED" | "LIVE" | "ENDED";
    sequenceNumber?: number | null;
    isPointsEnabled: boolean;
    startsAt: string;
    endsAt?: string | null;
    booksCount: number;
    photosCount: number;
    questionsCount: number;
    books: Array<{
        id: string;
        position: number;
        book: {
            id: string;
            title: string;
            authorName?: string | null;
            coverUrl?: string | null;
            firstPublishYear?: number | null;
        }
    }>;
}

export interface CreateCycleDto {
    name: string;
    theme?: string;
    summary?: string;
    format?: CycleFormat;
    plannedReadingSessions?: number;
    plannedCoordinationSessions?: number;
    isActive?: boolean;
    startDate: string;
    endDate?: string;
}

export interface UpdateCycleDto {
    name?: string;
    theme?: string;
    summary?: string;
    format?: CycleFormat;
    plannedReadingSessions?: number;
    plannedCoordinationSessions?: number;
    isActive?: boolean;
    startDate?: string;
    endDate?: string | null;
}

export const cyclesApi = {
    getMyCycles: () =>
        api.get<{ activeCycleMembership: MemberCycleSummary | null; memberCycles: MemberCycleSummary[] }>("/me/cycles"),

    getClubCycles: (clubId: string) =>
        api.get<Cycle[]>(`/clubs/${clubId}/cycles`),

    getCycle: (cycleId: string) =>
        api.get<Cycle & { sessions: CycleSession[] }>(`/cycles/${cycleId}`),

    getCycleSessions: (cycleId: string) =>
        api.get<CycleSession[]>(`/cycles/${cycleId}/sessions`),

    createCycle: (clubId: string, data: CreateCycleDto) =>
        api.post<Cycle>(`/clubs/${clubId}/cycles`, data),

    updateCycle: (clubId: string, cycleId: string, data: UpdateCycleDto) =>
        api.patch<Cycle>(`/clubs/${clubId}/cycles/${cycleId}`, data),

    deleteCycle: (clubId: string, cycleId: string) =>
        api.delete<void>(`/clubs/${clubId}/cycles/${cycleId}`),

    createProgramTemplate: (cycleId: string, coordinationLeadDays: number = 3) =>
        api.post(`/cycles/${cycleId}/program-template`, { coordinationLeadDays }),
};
