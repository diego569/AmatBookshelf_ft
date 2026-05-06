import { api } from "./client";

export interface AppContext {
    defaultClubId: string;
    defaultClubName: string;
    defaultCycleId: string | null;
    defaultCycleName: string | null;
    activeCycleMembership: {
        id: string;
        membershipId: string;
        cycleId: string;
        status: string;
        cycle: {
            id: string;
            clubId: string;
            name: string;
            theme?: string | null;
            summary?: string | null;
            format: "INTERSEMANAL" | "SEMANAL" | "CUSTOM";
            startDate: string;
            endDate?: string | null;
            isActive: boolean;
        };
    } | null;
    memberCycles: Array<{
        id: string;
        membershipId: string;
        cycleId: string;
        status: string;
        cycle: {
            id: string;
            clubId: string;
            name: string;
            theme?: string | null;
            summary?: string | null;
            format: "INTERSEMANAL" | "SEMANAL" | "CUSTOM";
            startDate: string;
            endDate?: string | null;
            isActive: boolean;
        };
    }>;
}

export const appContextApi = {
    getContext: () => api.get<AppContext>("/app-context"),
};
