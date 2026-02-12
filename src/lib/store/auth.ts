import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Person {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    currentPerson: Person | null;
    membershipId: string | null;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setUser: (person: Person) => void;
    setMembershipId: (id: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            currentPerson: null,
            membershipId: null,
            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),
            setUser: (currentPerson) => set({ currentPerson }),
            setMembershipId: (membershipId) => set({ membershipId }),
            logout: () =>
                set({
                    accessToken: null,
                    refreshToken: null,
                    currentPerson: null,
                    membershipId: null,
                }),
        }),
        {
            name: "amat-auth-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
