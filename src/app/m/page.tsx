"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRight, LibraryBig, Sparkles } from "lucide-react";
import { appContextApi } from "@/lib/api/appContextApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReaderShell } from "@/components/member/reader-shell";

export default function MemberEntryPage() {
    const router = useRouter();

    const { data: context, isLoading } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    useEffect(() => {
        if (context?.activeCycleMembership?.cycleId) {
            router.replace(`/m/cycles/${context.activeCycleMembership.cycleId}`);
        }
    }, [context?.activeCycleMembership?.cycleId, router]);

    const sortedCycles = useMemo(
        () =>
            [...(context?.memberCycles || [])].sort(
                (a, b) => +new Date(b.cycle.startDate) - +new Date(a.cycle.startDate)
            ),
        [context?.memberCycles]
    );

    if (isLoading || context?.activeCycleMembership?.cycleId) {
        return (
            <div className="min-h-screen bg-[#f7f2e8] px-6 py-16 text-center text-charcoal/55">
                Cargando tu experiencia lectora...
            </div>
        );
    }

    return (
        <ReaderShell
            active="home"
            cycleId={null}
            clubName={context?.defaultClubName}
            badge="Centro del lector"
            title="Pasaporte"
            subtitle="No tienes un ciclo activo ahora mismo, pero tu historia lectora sigue aqui y puedes volver a cualquiera de tus ciclos."
        >
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
                <div className="space-y-4">
                    {sortedCycles.length ? (
                        sortedCycles.map((item) => (
                            <Card key={item.id} className="rounded-[2rem] border border-forest/8 bg-white/88 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/8 text-forest">
                                            <LibraryBig size={20} />
                                        </div>
                                        <h2 className="mt-4 font-serif text-4xl leading-tight text-charcoal">
                                            {item.cycle.name}
                                        </h2>
                                        <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                                            {item.cycle.theme || "Tu passport conserva sesiones, libros y conversaciones de este ciclo."}
                                        </p>
                                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/42">
                                            {new Date(item.cycle.startDate).toLocaleDateString("es-PE", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>

                                    <Button asChild className="rounded-full px-5">
                                        <Link href={`/m/cycles/${item.cycleId}`}>
                                            Abrir
                                            <ArrowRight size={16} />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="rounded-[2rem] border border-dashed border-forest/15 bg-white/78 p-8 text-center">
                            <p className="font-serif text-3xl text-charcoal">Aun no tienes ciclos registrados</p>
                            <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                                Cuando te inscriban en un ciclo, este espacio se convertira en tu passport lector.
                            </p>
                        </Card>
                    )}
                </div>

                <div className="space-y-5">
                    <Card className="rounded-[2rem] border border-forest/8 bg-gradient-to-br from-white via-white to-[#f2ecdf] p-6">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className="text-ochre" />
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                Mientras tanto
                            </p>
                        </div>
                        <p className="mt-4 font-serif text-3xl text-charcoal">
                            Tu app ya puede lucir como un passport vivo.
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-charcoal/62">
                            Aunque no haya un ciclo activo, desde aqui puedes volver a los anteriores y mantener la continuidad visual del area del lector.
                        </p>
                        <Button asChild variant="secondary" className="mt-5 w-full rounded-2xl">
                            <Link href="/m/history">Explorar historial</Link>
                        </Button>
                    </Card>
                </div>
            </section>
        </ReaderShell>
    );
}
