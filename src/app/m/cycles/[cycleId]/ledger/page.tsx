"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { History, Sparkles, Wallet } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { appContextApi } from "@/lib/api/appContextApi";
import { pointsApi } from "@/lib/api/pointsApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { cyclesApi } from "@/lib/api/cyclesApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReaderShell } from "@/components/member/reader-shell";
import { cn } from "@/lib/utils";
import { useManageReaderContext } from "@/lib/navigation/useManageReaderContext";

export default function CycleLedgerPage() {
    const { currentPerson, membershipId, accessToken } = useAuthStore();
    const params = useParams<{ cycleId: string }>();
    const cycleId = params.cycleId;
    const { manageSuffix } = useManageReaderContext(cycleId);

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: cycle } = useQuery({
        queryKey: ["cycle", cycleId],
        queryFn: () => cyclesApi.getCycle(cycleId),
        enabled: !!cycleId,
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
            const match = memberships.find((member) => member.personId === tokenPersonId);
            if (match?.person?.fullName) return match.person.fullName;
        }
        return currentPerson?.name || "Miembro";
    }, [memberships, tokenPersonId, currentPerson?.name]);

    const { data: points, isLoading } = useQuery({
        queryKey: ["points", membershipId, context?.defaultClubId, cycleId],
        queryFn: () => pointsApi.getPointsSummary(membershipId!, context!.defaultClubId, cycleId),
        enabled: !!membershipId && !!context?.defaultClubId && !!cycleId,
    });

    const cycleName =
        cycle?.name ||
        context?.memberCycles?.find((item) => item.cycleId === cycleId)?.cycle.name ||
        "Ciclo lector";

    const transactions = points?.transactions || [];

    return (
        <ReaderShell
            active="ledger"
            cycleId={cycleId}
            cycleName={cycleName}
            clubName={context?.defaultClubName}
            badge={`Registro de ${cycleName}`}
            title="Puntos"
            subtitle="Cada movimiento de puntos del ciclo abierto, en una vista clara y solo de lectura."
            headerAction={
                <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                    <Link href={`/m/cycles/${cycleId}${manageSuffix}`}>Volver al passport</Link>
                </Button>
            }
        >
            <section className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Balance
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{points?.totalPoints || 0}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Puntos acumulados en el ciclo visible.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Movimientos
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{transactions.length}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Entradas y ajustes registrados en este ciclo.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Persona
                    </p>
                    <p className="mt-3 font-serif text-2xl text-charcoal">{displayName}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Tu historial de puntos dentro de {cycleName}.</p>
                </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
                <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                Registro
                            </p>
                            <h2 className="mt-2 font-serif text-4xl text-charcoal">Historial de puntos</h2>
                        </div>
                        <div className="rounded-2xl bg-forest/8 p-3 text-forest">
                            <History size={18} />
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {isLoading ? (
                            <p className="rounded-[1.6rem] border border-dashed border-forest/15 bg-[#f7f2e8] px-4 py-6 text-center text-sm text-charcoal/60">
                                Cargando historial...
                            </p>
                        ) : transactions.length ? (
                            transactions.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start justify-between gap-4 rounded-[1.6rem] border border-forest/8 bg-[#f7f2e8] px-4 py-4"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-charcoal">{item.reason}</p>
                                        <p className="mt-1 text-xs text-charcoal/45">
                                            {new Date(item.createdAt).toLocaleDateString("es-PE", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            "shrink-0 font-serif text-2xl",
                                            item.points > 0 ? "text-sage" : "text-red"
                                        )}
                                    >
                                        {item.points > 0 ? `+${item.points}` : item.points}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="rounded-[1.6rem] border border-dashed border-forest/15 bg-[#f7f2e8] px-4 py-6 text-center text-sm text-charcoal/60">
                                Aún no hay movimientos registrados para este ciclo.
                            </p>
                        )}
                    </div>
                </Card>

                <div className="space-y-5">
                    <Card className="rounded-[2rem] border border-forest/8 bg-[#17352e] p-5 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                                    Resumen
                                </p>
                                <p className="mt-4 font-serif text-4xl">{points?.totalPoints || 0} pts</p>
                                <p className="mt-2 text-sm leading-relaxed text-white/72">
                                    Todo lo que ganaste o ajustaste durante {cycleName} aparece aquí de forma ordenada.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-3">
                                <Wallet size={18} />
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className="text-ochre" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                    Consejo
                                </p>
                                <p className="mt-1 font-serif text-2xl text-charcoal">Todo claro y trazable</p>
                            </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                            Si una asistencia o ajuste no se refleja como esperabas, este ledger te muestra el motivo exacto y la fecha.
                        </p>
                    </Card>
                </div>
            </section>
        </ReaderShell>
    );
}
