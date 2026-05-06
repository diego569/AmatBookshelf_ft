"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Medal, Trophy } from "lucide-react";
import { appContextApi } from "@/lib/api/appContextApi";
import { pointsApi } from "@/lib/api/pointsApi";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReaderShell } from "@/components/member/reader-shell";
import { cn } from "@/lib/utils";

export default function RankPage() {
    const { membershipId } = useAuthStore();

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const cycleId = context?.activeCycleMembership?.cycleId || context?.defaultCycleId || undefined;

    const { data: leaderboard } = useQuery({
        queryKey: ["leaderboard", context?.defaultClubId, cycleId],
        queryFn: () => pointsApi.getLeaderboard(context!.defaultClubId, cycleId, 20),
        enabled: !!context?.defaultClubId,
    });

    const myEntry = useMemo(
        () => leaderboard?.find((entry) => entry.membershipId === membershipId) ?? null,
        [leaderboard, membershipId]
    );

    const podium = leaderboard?.slice(0, 3) || [];

    return (
        <ReaderShell
            active="rank"
            cycleId={cycleId}
            cycleName={context?.activeCycleMembership?.cycle.name}
            clubName={context?.defaultClubName}
            badge="Ranking del ciclo"
            title="Ranking"
            subtitle="Una vista clara del ranking del ciclo actual para que se sienta vivo, no escondido."
            headerAction={
                cycleId ? (
                    <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                        <Link href={`/m/cycles/${cycleId}`}>Volver al passport</Link>
                    </Button>
                ) : null
            }
        >
            <section className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Tu lugar
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">
                        {myEntry ? `#${myEntry.rank}` : "Sin puesto"}
                    </p>
                    <p className="mt-2 text-sm text-charcoal/60">Tu posicion dentro del ciclo actual.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Puntos
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{myEntry?.totalPoints ?? 0}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Puntos que hoy te sostienen en el ranking.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Participantes
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{leaderboard?.length ?? 0}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Miembros visibles en la tabla de este ciclo.</p>
                </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Podio
                    </p>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {podium.map((entry, index) => (
                            <div
                                key={entry.membershipId}
                                className={cn(
                                    "rounded-[1.8rem] border p-5 text-center",
                                    index === 0
                                        ? "border-ochre/30 bg-[#fff4e6]"
                                        : "border-forest/8 bg-[#f4efe5]"
                                )}
                            >
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-forest shadow-soft">
                                    <Medal size={20} />
                                </div>
                                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/45">
                                    #{entry.rank}
                                </p>
                                <p className="mt-2 font-serif text-3xl text-charcoal">{entry.name}</p>
                                <p className="mt-3 text-sm text-charcoal/65">{entry.totalPoints} pts</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="rounded-[2.2rem] border border-forest/8 bg-[#17352e] p-6 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                                Tu energia en el ciclo
                            </p>
                            <p className="mt-4 font-serif text-4xl">
                                {myEntry ? `#${myEntry.rank}` : "Sigue sumando"}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-white/72">
                                {myEntry
                                    ? `Llevas ${myEntry.totalPoints} puntos en este recorrido.`
                                    : "Aun no apareces en la tabla, pero tu passport ya esta listo para crecer con cada asistencia."}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-3">
                            <Trophy size={20} />
                        </div>
                    </div>
                </Card>
            </section>

            <section className="mt-6">
                <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Tabla completa
                    </p>
                    <div className="mt-5 space-y-3">
                        {(leaderboard || []).map((entry) => (
                            <div
                                key={entry.membershipId}
                                className={cn(
                                    "flex items-center justify-between rounded-[1.6rem] border px-4 py-4",
                                    entry.membershipId === membershipId
                                        ? "border-sage/25 bg-[#edf7ef]"
                                        : "border-forest/8 bg-[#f7f2e8]"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-forest shadow-soft">
                                        {entry.rank}
                                    </div>
                                    <div>
                                        <p className="font-medium text-charcoal">{entry.name}</p>
                                        <p className="text-sm text-charcoal/55">
                                            {entry.membershipId === membershipId ? "Tu posicion actual" : "Miembro del ciclo"}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-serif text-2xl text-charcoal">{entry.totalPoints}</p>
                            </div>
                        ))}

                        {!leaderboard?.length ? (
                            <p className="rounded-[1.6rem] border border-dashed border-forest/15 bg-[#f7f2e8] px-4 py-6 text-center text-sm text-charcoal/60">
                                Aun no hay datos en el ranking visible para este ciclo.
                            </p>
                        ) : null}
                    </div>
                </Card>
            </section>
        </ReaderShell>
    );
}
