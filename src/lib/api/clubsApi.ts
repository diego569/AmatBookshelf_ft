import { api } from "./client";

export interface Club {
    id: string;
    name: string;
    description?: string;
}

export interface Membership {
    id: string;
    clubId: string;
    personId: string;
    role: "MEMBER" | "MODERATOR" | "admin";
    status: "ACTIVE" | "INACTIVE" | "LEFT";
    person?: {
        id: string;
        fullName: string;
        email: string;
        picture?: string;
    }
}

export const clubsApi = {
    getClubs: () => api.get<Club[]>("/clubs"),
    getClub: (id: string) => api.get<Club>(`/clubs/${id}`),
    getMemberships: (clubId: string) => api.get<Membership[]>(`/clubs/${clubId}/memberships`),
};
