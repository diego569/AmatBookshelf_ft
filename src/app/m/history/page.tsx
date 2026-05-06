"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Clock3, LibraryBig } from "lucide-react";
import { appContextApi } from "@/lib/api/appContextApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReaderShell } from "@/components/member/reader-shell";
import { useManageReaderContext } from "@/lib/navigation/useManageReaderContext";

export default function MemberHistoryPage() {
    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const sortedCycles = useMemo(
        () =>
            [...(context?.memberCycles || [])].sort(
                (a, b) => +new Date(b.cycle.startDate) - +new Date(a.cycle.startDate)
            ),
        [context?.memberCycles]
    );

    const activeCycleId = context?.activeCycleMembership?.cycleId || context?.defaultCycleId || null;
    const { manageSuffix } = useManageReaderContext(activeCycleId);
    const activeCycle = sortedCycles.find((item) => item.cycleId === activeCycleId) || null;
    const historicalCycles = sortedCycles.filter((item) => item.cycleId !== activeCycleId);

    return (
        <ReaderShell
            active="history"
            cycleId={activeCycleId}
            cycleName={activeCycle?.cycle.name || context?.activeCycleMembership?.cycle.name}
            clubName={context?.defaultClubName}
            badge="Historial de ciclos"
            title="Historial"
            subtitle="Tus ciclos anteriores y el ciclo actual, ordenados como una memoria viva del club."
            headerAction={
                activeCycleId ? (
                    <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                        <Link href={`/m/cycles/${activeCycleId}${manageSuffix}`}>Volver al ciclo actual</Link>
                    </Button>
                ) : null
            }
        >
            <section className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Ciclos vividos
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{sortedCycles.length}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Cada ciclo guarda su propio mapa de puntos, sesiones y libros.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Activo
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{activeCycle ? 1 : 0}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Si tu membresia sigue vigente, entras directo a ese ciclo al abrir la app.</p>
                </Card>
                <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                        Archivo
                    </p>
                    <p className="mt-3 font-serif text-4xl text-charcoal">{historicalCycles.length}</p>
                    <p className="mt-2 text-sm text-charcoal/60">Tus ciclos anteriores siguen visibles para volver a sus sesiones.</p>
                </Card>
            </section>

            <section className="mt-6 space-y-6">
                {activeCycle ? (
                    <Card className="rounded-[2rem] border border-sage/15 bg-[#edf7ef] p-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sage/80">
                            Activo ahora
                        </p>
                        <h2 className="mt-3 font-serif text-4xl text-charcoal">{activeCycle.cycle.name}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/65">
                            {activeCycle.cycle.theme || "Este es el ciclo al que se abre tu passport en cuanto entras."}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button asChild className="rounded-full px-5">
                                <Link href={`/m/cycles/${activeCycle.cycleId}${manageSuffix}`}>Abrir passport</Link>
                            </Button>
                            <Button asChild variant="secondary" className="rounded-full px-5">
                                <Link href={`/m/cycles/${activeCycle.cycleId}/sessions${manageSuffix}`}>Ver sesiones</Link>
                            </Button>
                        </div>
                    </Card>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                    {historicalCycles.length ? (
                        historicalCycles.map((item) => (
                            <Card key={item.id} className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/8 text-forest">
                                            <LibraryBig size={20} />
                                        </div>
                                        <h3 className="mt-4 font-serif text-3xl leading-tight text-charcoal">
                                            {item.cycle.name}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                                            {item.cycle.theme || "Un tramo mas de tu historia con el club."}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-beige/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">
                                        {item.status}
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 text-sm text-charcoal/60 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-[#f4efe5] p-3">
                                        <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
                                            <CalendarRange size={13} />
                                            Inicio
                                        </p>
                                        <p className="mt-2 font-medium text-charcoal">
                                            {new Date(item.cycle.startDate).toLocaleDateString("es-PE", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f4efe5] p-3">
                                        <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-charcoal/40">
                                            <Clock3 size={13} />
                                            Formato
                                        </p>
                                        <p className="mt-2 font-medium text-charcoal">{item.cycle.format}</p>
                                    </div>
                                </div>

                                <Button asChild variant="secondary" className="mt-5 w-full rounded-2xl">
                                    <Link href={`/m/cycles/${item.cycleId}${manageSuffix}`}>Revisar este ciclo</Link>
                                </Button>
                            </Card>
                        ))
                    ) : (
                        <Card className="rounded-[2rem] border border-dashed border-forest/15 bg-white/78 p-8 text-center md:col-span-2">
                            <p className="font-serif text-3xl text-charcoal">Todavia no hay ciclos historicos</p>
                            <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                                Cuando completes tu primer ciclo y entres a uno nuevo, los anteriores apareceran aqui.
                            </p>
                        </Card>
                    )}
                </div>
            </section>
        </ReaderShell>
    );
}
