"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

// Basic loader component to replace Lucide since it may not be in scope for this exact file
// or use simple text for now.
function LoadingSpinner() {
    return (
        <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
    );
}

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setTokens = useAuthStore((state) => state.setTokens);

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");

        if (accessToken && refreshToken) {
            setTokens(accessToken, refreshToken);
            // Redirect to dashboard
            router.push("/m");
        } else {
            // Redirect to login with error
            router.push("/m/login?error=auth_failed");
        }
    }, [searchParams, setTokens, router]);

    return (
        <div className="flex flex-col items-center gap-4">
            <LoadingSpinner />
            <p className="text-forest font-medium animate-pulse">Authenticating...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
            <Suspense fallback={<LoadingSpinner />}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
