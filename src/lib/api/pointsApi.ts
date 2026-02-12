import { api } from "./client";

export interface PointsSummary {
    totalPoints: number;
    transactions: {
        id: string;
        points: number;
        reason: string;
        createdAt: string;
    }[];
}

export interface LeaderboardEntry {
    membershipId: string;
    name: string;
    totalPoints: number;
    rank: number;
}

export const pointsApi = {
    getPointsSummary: (membershipId: string, clubId: string, cycleId?: string) => {
        const params = new URLSearchParams({ clubId });
        if (cycleId) params.append("cycleId", cycleId);
        return api.get<PointsSummary>(`/memberships/${membershipId}/points?${params.toString()}`);
    },

    getLeaderboard: (clubId: string, cycleId?: string, limit: number = 10) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cycleId) params.append("cycleId", cycleId);
        return api.get<LeaderboardEntry[]>(`/clubs/${clubId}/leaderboard?${params.toString()}`);
    },
};
