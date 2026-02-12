import { api } from "./client";
import { Membership } from "./clubsApi";

export const membershipsApi = {
    createMembership: (data: { clubId: string; personId: string; role?: string }) =>
        api.post<Membership>("/memberships", data),

    updateMembership: (id: string, data: Partial<Membership>) =>
        api.patch<Membership>(`/memberships/${id}`, data),
};
