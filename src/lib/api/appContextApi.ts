import { api } from "./client";

export interface AppContext {
    defaultClubId: string;
    defaultClubName: string;
    defaultCycleId: string;
    defaultCycleName: string;
}

export const appContextApi = {
    getContext: () => api.get<AppContext>("/app-context"),
};
