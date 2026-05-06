"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { appContextApi } from "@/lib/api/appContextApi";
import { cyclesApi } from "@/lib/api/cyclesApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemberSessionCard } from "@/components/member/member-session-card";
import { ReaderShell } from "@/components/member/reader-shell";
import { useManageReaderContext } from "@/lib/navigation/useManageReaderContext";

export default function CycleSessionsPage() {
    const params = useParams();
    const cycleId = params.cycleId as string;
    const { manageSuffix } = useManageReaderContext(cycleId);

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: cycle } = useQuery({
        queryKey: ["cycle", cycleId],
        queryFn: () => cyclesApi.getCycle(cycleId),
    });

    const { data: sessions } = useQuery({
        queryKey: ["cycleSessions", cycleId],
        queryFn: () => cyclesApi.getCycleSessions(cycleId),
    });

    const sortedSessions = useMemo(
        () => [...(sessions || [])].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
        [sessions]
    );

    const now = Date.now();
    const upcomingSessions = sortedSessions.filter((session) => +new Date(session.startsAt) >= now);
    const archiveSessions = sortedSessions.filter((session) => +new Date(session.startsAt) < now);

    return (
        <ReaderShell
            active="sessions"
            cycleId={cycleId}
            cycleName={cycle?.name}
            clubName={context?.defaultClubName}
            badge="Calendario del ciclo"
            title="Sesiones"
            subtitle="Todo el calendario del ciclo, desde lo que viene pronto hasta lo ya vivido."
            headerAction={
                <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                    <Link href="/m/scan">Escanear asistencia</Link>
                </Button>
            }
        >
            <section className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Total
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{sortedSessions.length}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Sesiones visibles para tu membresia en este ciclo.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Proximas
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{upcomingSessions.length}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Las siguientes paradas de lectura, coordinacion o actividades especiales.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Archivo
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{archiveSessions.length}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Encuentros que ya quedaron en tu historia del ciclo.</p>
                </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_300px]">
                <div className="space-y-6">
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <CalendarClock size={18} className="text-forest" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                    Lo que sigue
                                </p>
                                <h2 className="font-serif text-3xl text-charcoal">Lo que sigue</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {upcomingSessions.length ? (
                                upcomingSessions.map((session) => (
                                    <MemberSessionCard
                                        key={session.id}
                                        session={session}
                                        href={`/m/cycles/${cycleId}/sessions/${session.id}`}
                                    />
                                ))
                            ) : (
                                <Card className="rounded-[2rem] border border-dashed border-forest/15 bg-white/78 p-8 text-center">
                                    <p className="font-serif text-3xl text-charcoal">No hay sesiones proximas</p>
                                    <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                                        Cuando se añadan nuevas fechas, apareceran aqui en primer plano.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <Sparkles size={18} className="text-ochre" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                    Memoria del ciclo
                                </p>
                                <h2 className="font-serif text-3xl text-charcoal">Sesiones pasadas</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {archiveSessions.length ? (
                                [...archiveSessions].reverse().map((session) => (
                                    <MemberSessionCard
                                        key={session.id}
                                        session={session}
                                        href={`/m/cycles/${cycleId}/sessions/${session.id}`}
                                        compact
                                    />
                                ))
                            ) : (
                                <Card className="rounded-[2rem] border border-dashed border-forest/15 bg-white/78 p-8 text-center">
                                    <p className="font-serif text-3xl text-charcoal">Aun no hay archivo</p>
                                    <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                                        Tu historial del ciclo empezara a llenarse despues de las primeras reuniones.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                            Navegacion rapida
                        </p>
                        <div className="mt-4 space-y-3">
                            <Link
                                href={`/m/cycles/${cycleId}${manageSuffix}`}
                                className="flex items-center justify-between rounded-2xl bg-[#f4efe5] px-4 py-3 text-sm font-medium text-charcoal/72 transition hover:text-forest"
                            >
                                Volver al passport del ciclo
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href={`/m/history${manageSuffix}`}
                                className="flex items-center justify-between rounded-2xl bg-[#f4efe5] px-4 py-3 text-sm font-medium text-charcoal/72 transition hover:text-forest"
                            >
                                Ver historial de ciclos
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href={`/m/cycles/${cycleId}/rank${manageSuffix}`}
                                className="flex items-center justify-between rounded-2xl bg-[#f4efe5] px-4 py-3 text-sm font-medium text-charcoal/72 transition hover:text-forest"
                            >
                                Revisar ranking
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </Card>
                </div>
            </section>
        </ReaderShell>
    );
}
