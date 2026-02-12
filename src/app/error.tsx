"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-cream">
            <Card className="p-8 max-w-sm text-center">
                <h2 className="text-2xl font-serif text-forest mb-2">Something went wrong</h2>
                <p className="text-gray-500 mb-6 text-sm">
                    We encountered an unexpected error. Please try again or return to the dashboard.
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={() => reset()} className="w-full">
                        Try again
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => (window.location.href = "/")}
                        className="w-full"
                    >
                        Go Home
                    </Button>
                </div>
            </Card>
        </div>
    );
}
