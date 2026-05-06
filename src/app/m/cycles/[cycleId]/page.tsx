"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarRange, Camera, Flame, MessageSquareMore, ScrollText, Sparkles, Trophy } from "lucide-react";
import { appContextApi } from "@/lib/api/appContextApi";
import { cyclesApi } from "@/lib/api/cyclesApi";
import { pointsApi } from "@/lib/api/pointsApi";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemberSessionCard } from "@/components/member/member-session-card";
import { MemberStatCard } from "@/components/member/member-stat-card";
import { ReaderShell } from "@/components/member/reader-shell";
import { useManageReaderContext } from "@/lib/navigation/useManageReaderContext";

function formatCycleDate(value?: string | null) {
    if (!value) return "Fecha por confirmar";
    return new Date(value).toLocaleDateString("es-PE", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

export default function CycleDetailPage() {
    const params = useParams();
    const cycleId = params.cycleId as string;
    const { manageSuffix } = useManageReaderContext(cycleId);
    const { currentPerson } = useAuthStore();

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

    const cycleMembership = useMemo(
        () => context?.memberCycles?.find((item) => item.cycleId === cycleId) ?? null,
        [context?.memberCycles, cycleId]
    );

    const { data: points } = useQuery({
        queryKey: ["cyclePoints", cycleMembership?.membershipId, context?.defaultClubId, cycleId],
        queryFn: () =>
            pointsApi.getPointsSummary(
                cycleMembership!.membershipId,
                context!.defaultClubId,
                cycleId
            ),
        enabled: !!cycleMembership?.membershipId && !!context?.defaultClubId,
    });

    const { data: leaderboard } = useQuery({
        queryKey: ["leaderboard", context?.defaultClubId, cycleId],
        queryFn: () => pointsApi.getLeaderboard(context!.defaultClubId, cycleId, 5),
        enabled: !!context?.defaultClubId,
    });

    const sortedSessions = useMemo(
        () => [...(sessions || [])].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
        [sessions]
    );

    const now = Date.now();
    const upcomingSessions = sortedSessions.filter((session) => +new Date(session.startsAt) >= now);
    const nextSession = upcomingSessions[0] ?? null;
    const completedSessions = sortedSessions.filter(
        (session) => session.status === "ENDED" || +new Date(session.startsAt) < now
    );
    const uniqueBooks = Array.from(
        new Map(
            sortedSessions
                .flatMap((session) => session.books.map((book) => book.book))
                .map((book) => [book.id, book])
        ).values()
    );

    const progressPercentage = sortedSessions.length
        ? Math.min(100, Math.round((completedSessions.length / sortedSessions.length) * 100))
        : 0;

    const myRank = leaderboard?.find((entry) => entry.membershipId === cycleMembership?.membershipId);
    const displayName = currentPerson?.name?.split(" ")[0] || "Lectora";
    const cycleName = cycle?.name || cycleMembership?.cycle.name || "Tu ciclo lector";
    const cycleTheme = cycle?.theme || cycleMembership?.cycle.theme || "";

    return (
        <ReaderShell
            active="passport"
            cycleId={cycleId}
            cycleName={cycleName}
            clubName={context?.defaultClubName}
            badge={`Ciclo: ${cycleName}`}
            title={cycleName}
            subtitle={
                cycleTheme
                    ? `"${cycleTheme}"`
                    : "Tu passport del ciclo: sesiones, lecturas, conversaciones y puntos en un solo lugar."
            }
            headerAction={
                <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                    <Link href={`/m/history${manageSuffix}`}>Ver historial</Link>
                </Button>
            }
        >
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MemberStatCard
                    label="Puntos del ciclo"
                    value={`${points?.totalPoints ?? 0}`}
                    hint="Lo que has acumulado en este recorrido lector."
                    icon={Trophy}
                    accent="ochre"
                />
                <MemberStatCard
                    label="Sesiones activas"
                    value={`${sortedSessions.length}`}
                    hint="Entre lecturas, coordinaciones y encuentros extraordinarios."
                    icon={CalendarRange}
                    accent="forest"
                />
                <MemberStatCard
                    label="Biblioteca viva"
                    value={`${uniqueBooks.length}`}
                    hint="Libros ya asignados o listos para abrir conversación."
                    icon={BookOpen}
                    accent="sage"
                />
                <MemberStatCard
                    label="Conversaciones"
                    value={`${sortedSessions.reduce((total, session) => total + session.questionsCount, 0)}`}
                    hint="Preguntas y disparadores para seguir pensando."
                    icon={MessageSquareMore}
                    accent="forest"
                />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_320px]">
                <div className="space-y-6">
                    <Card className="overflow-hidden rounded-[2.4rem] border border-forest/8 bg-gradient-to-br from-white via-white to-[#f2ecdf] p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-medium text-charcoal/55">
                                    Te damos la bienvenida, {displayName}.
                                </p>
                                <h2 className="mt-3 font-serif text-[2.4rem] leading-[0.95] text-charcoal sm:text-[3.2rem]">
                                    {nextSession ? "Lo que sigue" : "Tu ciclo ya tiene forma"}
                                </h2>
                                <p className="mt-3 text-sm leading-relaxed text-charcoal/65 sm:text-base">
                                    {nextSession
                                        ? `Tu proxima parada es ${nextSession.title || "la siguiente sesion"} el ${formatCycleDate(nextSession.startsAt)}.`
                                        : "Todavia no hay una proxima sesion visible, pero tu passport ya esta listo para mostrarte cada paso del ciclo."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button asChild className="rounded-full px-5">
                                    <Link href={`/m/cycles/${cycleId}/sessions${manageSuffix}`}>
                                        Calendario completo
                                        <ArrowRight size={16} />
                                    </Link>
                                </Button>
                                <Button asChild variant="secondary" className="rounded-full px-5">
                                    <Link href={`/m/cycles/${cycleId}/ledger${manageSuffix}`}>
                                        Ver ledger
                                        <ScrollText size={16} />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        {upcomingSessions.slice(0, 4).map((session) => (
                            <MemberSessionCard
                                key={session.id}
                                session={session}
                                href={`/m/cycles/${cycleId}/sessions/${session.id}`}
                            />
                        ))}

                        {!upcomingSessions.length && sortedSessions.length > 0 ? (
                            sortedSessions.slice(0, 3).map((session) => (
                                <MemberSessionCard
                                    key={session.id}
                                    session={session}
                                    href={`/m/cycles/${cycleId}/sessions/${session.id}`}
                                />
                            ))
                        ) : null}

                        {!sortedSessions.length ? (
                            <Card className="rounded-[2rem] border border-dashed border-forest/15 bg-white/75 p-8 text-center">
                                <p className="font-serif text-3xl text-charcoal">Aun no hay sesiones en este ciclo</p>
                                <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                                    Cuando el equipo programe las lecturas y coordinaciones, las veras aqui en formato de app.
                                </p>
                            </Card>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-5">
                    <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                            Avance del ciclo
                        </p>
                        <p className="mt-3 text-3xl font-serif text-charcoal">{progressPercentage}%</p>
                        <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                            {completedSessions.length} de {sortedSessions.length} sesiones ya pasaron por tu calendario.
                        </p>
                        <div className="mt-5 h-3 rounded-full bg-beige/85">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-sage to-forest"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-charcoal/65">
                            <div className="rounded-2xl bg-[#f4efe5] p-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
                                    Inicio
                                </p>
                                <p className="mt-2 font-medium text-charcoal">
                                    {formatCycleDate(cycle?.startDate || cycleMembership?.cycle.startDate)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-[#f4efe5] p-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
                                    Cierre
                                </p>
                                <p className="mt-2 font-medium text-charcoal">
                                    {formatCycleDate(cycle?.endDate || cycleMembership?.cycle.endDate)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[2rem] border border-forest/8 bg-[#17352e] p-5 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                                    Tu posicion
                                </p>
                                <p className="mt-4 font-serif text-4xl">
                                    {myRank ? `#${myRank.rank}` : "Sin ranking"}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-white/72">
                                    {myRank
                                        ? `Estas entre quienes mas puntos llevan en este ciclo.`
                                        : "Aun no apareces en el ranking del ciclo, pero tu recorrido ya esta listo."}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-3">
                                <Flame size={20} />
                            </div>
                        </div>
                        <Button asChild variant="secondary" className="mt-5 w-full rounded-2xl bg-white text-forest hover:bg-white/90">
                            <Link href={`/m/cycles/${cycleId}/rank${manageSuffix}`}>Ver ranking completo</Link>
                        </Button>
                    </Card>

                    <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                    Biblioteca del ciclo
                                </p>
                                <p className="mt-2 font-serif text-2xl text-charcoal">Libros y atmosfera</p>
                            </div>
                            <Sparkles size={18} className="text-ochre" />
                        </div>

                        {uniqueBooks.length ? (
                            <div className="mt-5 grid grid-cols-3 gap-3">
                                {uniqueBooks.slice(0, 6).map((book) => (
                                    <div key={book.id} className="space-y-2">
                                        <div className="aspect-[0.74] overflow-hidden rounded-[1.4rem] border border-forest/8 bg-beige/60">
                                            {book.coverUrl ? (
                                                <img
                                                    src={book.coverUrl}
                                                    alt={book.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-charcoal/25">
                                                    <BookOpen size={18} />
                                                </div>
                                            )}
                                        </div>
                                        <p className="line-clamp-2 text-xs font-medium leading-relaxed text-charcoal/70">
                                            {book.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm leading-relaxed text-charcoal/60">
                                Todavia no hay libros cargados en este ciclo. Cuando se definan por votacion, apareceran aqui.
                            </p>
                        )}
                    </Card>

                    <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                            Acciones rapidas
                        </p>
                        <div className="mt-4 space-y-3">
                            <Link
                                href={`/m/cycles/${cycleId}/sessions${manageSuffix}`}
                                className="flex items-center justify-between rounded-2xl border border-forest/8 bg-[#f4efe5] px-4 py-3 text-sm font-medium text-charcoal/72 transition hover:border-forest/18 hover:text-forest"
                            >
                                Abrir todas las sesiones
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/m/scan"
                                className="flex items-center justify-between rounded-2xl border border-forest/8 bg-[#f4efe5] px-4 py-3 text-sm font-medium text-charcoal/72 transition hover:border-forest/18 hover:text-forest"
                            >
                                Escanear QR de asistencia
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href={`/m/cycles/${cycleId}/ledger${manageSuffix}`}
                                className="flex items-center justify-between rounded-2xl border border-forest/8 bg-[#f4efe5] px-4 py-3 text-sm font-medium text-charcoal/72 transition hover:border-forest/18 hover:text-forest"
                            >
                                Revisar movimientos de puntos
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </Card>
                </div>
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <div className="flex items-center gap-3">
                        <Camera size={18} className="text-sage" />
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                Recuerdos del ciclo
                            </p>
                            <p className="mt-1 font-serif text-2xl text-charcoal">Fotos y huellas de las sesiones</p>
                        </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                        {sortedSessions.reduce((total, session) => total + session.photosCount, 0)} fotos disponibles entre todas las sesiones del ciclo.
                    </p>
                </Card>

                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Conversacion en marcha
                    </p>
                    <p className="mt-3 font-serif text-2xl text-charcoal">
                        {sortedSessions.reduce((total, session) => total + session.questionsCount, 0)} preguntas sembradas
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                        Cada sesion puede guardar ideas, respuestas anonimas o con nombre, y reseñas de libros.
                    </p>
                </Card>
            </section>
        </ReaderShell>
    );
}
