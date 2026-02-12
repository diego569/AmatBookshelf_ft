"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth";
import { appContextApi } from "@/lib/api/appContextApi";
import { sessionsApi } from "@/lib/api/sessionsApi";
import { pointsApi } from "@/lib/api/pointsApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Scan, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MemberDashboard() {
    const router = useRouter();
    const { currentPerson, membershipId, logout } = useAuthStore();

    // Redirect to login if no person data
    useEffect(() => {
        if (!useAuthStore.getState().accessToken) {
            router.push("/m/login");
        }
    }, [router]);

    // Fetch App Context
    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    // Fetch Next Session
    const { data: sessions } = useQuery({
        queryKey: ["sessions", context?.defaultClubId],
        queryFn: () =>
            sessionsApi.getSessions(context!.defaultClubId, {
                from: new Date().toISOString(),
                to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }),
        enabled: !!context?.defaultClubId,
    });

    const nextSession = sessions?.[0];

    // Fetch Points
    const { data: points } = useQuery({
        queryKey: ["points", membershipId, context?.defaultClubId],
        queryFn: () =>
            pointsApi.getPointsSummary(membershipId!, context!.defaultClubId, context?.defaultCycleId),
        enabled: !!membershipId && !!context?.defaultClubId,
    });

    const handleScan = () => router.push("/m/scan");
    const handleLedger = () => router.push("/m/ledger");

    return (
        <div className="min-h-screen flex flex-col pb-24 animate-fade-in bg-cream">
            <header className="px-6 sm:px-8 pt-10 pb-6 flex items-end justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Welcome back,</p>
                    <h2 className="font-serif text-3xl text-forest">
                        {currentPerson?.name || "Member"}
                    </h2>
                </div>

                <button
                    onClick={handleLedger}
                    className="bg-white px-4 py-2 rounded-full shadow-sm border border-beige flex items-center gap-2 active:scale-95 transition"
                    aria-label="Open points ledger"
                >
                    <span className="font-serif font-bold text-forest">
                        {points?.totalPoints ?? "—"} pts
                    </span>
                    <History size={16} className="text-ochre" />
                </button>
            </header>

            <main className="flex-1 px-6 sm:px-8 flex flex-col justify-center">
                {nextSession ? (
                    <Card className="p-7 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-beige/40 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                        <div className="relative z-10">
                            <Badge className="mb-4">Next Session</Badge>
                            <h1 className="font-serif text-3xl sm:text-4xl text-forest leading-tight">
                                {nextSession.title}
                            </h1>
                            <p className="text-gray-400 text-sm mt-2">
                                {new Date(nextSession.startsAt).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                                {" • "}
                                {new Date(nextSession.startsAt).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>

                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-forest/5 flex items-center justify-center">
                                    <BookOpen size={14} className="text-forest/40" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {nextSession.sessionType.toLowerCase()} session
                                </span>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-7 text-center">
                        <p className="text-gray-400 italic">No upcoming sessions found.</p>
                    </Card>
                )}

                {!membershipId && (
                    <p className="text-center text-ochre text-xs mt-6 font-medium animate-pulse">
                        Scan your first session to join the club!
                    </p>
                )}

                <p className="text-center text-gray-400 text-sm mt-8 px-6 leading-relaxed">
                    “Books are a uniquely portable magic.”<br />
                    <span className="italic opacity-60">— Stephen King</span>
                </p>
            </main>

            {/* Bottom primary action (mobile first) */}
            <div className="fixed bottom-7 left-0 right-0 px-6 sm:px-8 z-30 flex justify-center">
                <div className="w-full max-w-md">
                    <Button onClick={handleScan} size="lg" className="w-full h-16 shadow-float">
                        <Scan className="text-beige" />
                        <span className="tracking-wide">Scan Attendance QR</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
