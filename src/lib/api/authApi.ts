import { api } from "./client";

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export const authApi = {
    getGoogleAuthUrl: () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
        return `${baseUrl}/auth/google`;
    },

    devLogin: (email: string) =>
        api.post<AuthTokens>("/auth/dev-login", { email }),

    refreshTokens: (refreshToken: string) =>
        api.post<AuthTokens>("/auth/refresh", { refreshToken }),

    logout: () => api.post("/auth/logout"),
};
