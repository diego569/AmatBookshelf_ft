"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth";
import { appContextApi } from "@/lib/api/appContextApi";
import { pointsApi } from "@/lib/api/pointsApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { Card } from "@/components/ui/card";
import { ChevronLeft, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function LedgerPage() {
    const router = useRouter();
    const { currentPerson, membershipId, accessToken } = useAuthStore();

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const tokenPersonId = useMemo(() => {
        if (!accessToken) return null;
        try {
            const base64Url = accessToken.split(".")[1];
            if (!base64Url) return null;
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            const payload = JSON.parse(json) as { sub?: string };
            return payload.sub ?? null;
        } catch {
            return null;
        }
    }, [accessToken]);

    const { data: memberships } = useQuery({
        queryKey: ["memberships", context?.defaultClubId],
        queryFn: () => clubsApi.getMemberships(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    const displayName = useMemo(() => {
        if (memberships && tokenPersonId) {
            const match = memberships.find((m) => m.personId === tokenPersonId);
            if (match?.person?.fullName) return match.person.fullName;
        }
        return currentPerson?.name || "Member";
    }, [memberships, tokenPersonId, currentPerson?.name]);

    const { data: points, isLoading } = useQuery({
        queryKey: ["points", membershipId, context?.defaultClubId],
        queryFn: () =>
            pointsApi.getPointsSummary(membershipId!, context!.defaultClubId, context?.defaultCycleId),
        enabled: !!membershipId && !!context?.defaultClubId,
    });

    const transactions = points?.transactions || [];

    return (
        <div className="min-h-screen pb-10 animate-fade-in bg-cream">
            <header className="px-6 sm:px-8 pt-10 pb-5 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-white shadow-sm border border-beige active:scale-95 transition"
                >
                    <ChevronLeft size={20} className="text-forest" />
                </button>
                <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium">Mis puntos</p>
                    <h2 className="font-serif text-2xl text-forest">
                        {displayName}
                    </h2>
                </div>
                <div className="px-4 py-2 rounded-full bg-white border border-beige shadow-sm">
                    <span className="font-serif font-bold text-forest">
                        {points?.totalPoints || 0} pts
                    </span>
                </div>
            </header>

            <main className="px-6 sm:px-8">
                <Card className="p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Registro
                            </p>
                            <h3 className="font-serif text-xl text-forest mt-1">Historial</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-forest/5 flex items-center justify-center text-forest">
                            <History size={18} />
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {isLoading ? (
                            <p className="text-center py-10 text-gray-400 italic">Cargando historial...</p>
                        ) : transactions.length > 0 ? (
                            transactions.map((it) => (
                                <div
                                    key={it.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-medium text-charcoal truncate">
                                                {it.reason}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(it.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div
                                            className={cn(
                                                "font-serif text-xl shrink-0 font-bold",
                                                it.points > 0 ? "text-sage" : "text-red"
                                            )}
                                        >
                                            {it.points > 0 ? `+${it.points}` : it.points}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-10 text-gray-400 italic">Aún no hay movimientos.</p>
                        )}
                    </div>

                    <div className="h-px bg-gray-200/70 w-full my-6" />
                    <div className="pt-2 text-xs text-gray-400 leading-relaxed italic">
                        Consejo: si tu cámara no funciona, pide al coordinador usar Asistencia Manual.
                    </div>
                </Card>
            </main>
        </div>
    );
}
