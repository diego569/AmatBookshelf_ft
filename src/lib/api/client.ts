import { useAuthStore } from "@/lib/store/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export class ApiError extends Error {
    constructor(public status: number, public message: string, public data?: any) {
        super(message);
        this.name = "ApiError";
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    const raw = await response.text();
    let data: any = null;

    if (raw) {
        data = (() => {
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
            }
        })();
    }

    if (!response.ok) {
        const message =
            (typeof data === "object" && data?.message) ||
            response.statusText ||
            "An error occurred";
        throw new ApiError(response.status, message, data);
    }

    return data as T;
}

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState();

    const headers = new Headers(options.headers);
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

    let response = await fetch(url, { ...options, headers });

    // Handle 401 and refresh token
    if (response.status === 401 && refreshToken) {
        try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                    await refreshResponse.json();

                setTokens(newAccessToken, newRefreshToken);

                // Retry original request with new token
                headers.set("Authorization", `Bearer ${newAccessToken}`);
                response = await fetch(url, { ...options, headers });
            } else {
                logout();
                throw new ApiError(401, "Session expired. Please login again.");
            }
        } catch (error) {
            logout();
            throw error;
        }
    }

    return handleResponse<T>(response);
}

export const api = {
    get: <T>(url: string, options?: RequestInit) =>
        apiFetch<T>(url, { ...options, method: "GET" }),
    post: <T>(url: string, body?: any, options?: RequestInit) =>
        apiFetch<T>(url, {
            ...options,
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),
    patch: <T>(url: string, body?: any, options?: RequestInit) =>
        apiFetch<T>(url, {
            ...options,
            method: "PATCH",
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),
    delete: <T>(url: string, options?: RequestInit) =>
        apiFetch<T>(url, { ...options, method: "DELETE" }),
};
