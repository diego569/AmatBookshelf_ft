import Link from "next/link";
import { BookOpen, CalendarDays, Camera, ChevronRight, Clock3, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CycleSession } from "@/lib/api/cyclesApi";
import { cn } from "@/lib/utils";

interface MemberSessionCardProps {
    session: CycleSession;
    href: string;
    compact?: boolean;
}

const typeTone: Record<CycleSession["sessionType"], string> = {
    LECTURA: "bg-[#E8F7EC] text-sage",
    COORDINACION: "bg-[#FFF1D9] text-[#9A6900]",
    EXTRAORDINARIA: "bg-[#F4EFFF] text-[#7A4D9E]",
};

const typeLabel: Record<CycleSession["sessionType"], string> = {
    LECTURA: "Lectura",
    COORDINACION: "Coordinacion",
    EXTRAORDINARIA: "Extraordinaria",
};

export function MemberSessionCard({
    session,
    href,
    compact = false,
}: MemberSessionCardProps) {
    const cover = session.books[0]?.book?.coverUrl;
    const sessionDate = new Date(session.startsAt);

    return (
        <Link href={href} className="group block">
            <Card
                className={cn(
                    "overflow-hidden rounded-[2rem] border border-forest/8 bg-white/92 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-float",
                    compact ? "p-4" : "p-5"
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="relative hidden h-28 w-20 shrink-0 overflow-hidden rounded-[1.35rem] border border-forest/8 bg-beige/60 sm:block">
                        {cover ? (
                            <img
                                src={cover}
                                alt={session.books[0]?.book?.title || "Portada del libro"}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-charcoal/25">
                                <BookOpen size={20} />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                    typeTone[session.sessionType]
                                )}
                            >
                                {typeLabel[session.sessionType]}
                            </span>
                            {session.sequenceNumber ? (
                                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/35">
                                    Sesion {session.sequenceNumber}
                                </span>
                            ) : null}
                            <Badge variant="secondary" className="border-0 bg-forest/6 text-forest">
                                {session.status}
                            </Badge>
                        </div>

                        <div className="mt-3 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="text-balance font-serif text-[1.9rem] leading-tight text-charcoal">
                                    {session.title || "Sesion del ciclo"}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                                    {session.summary ||
                                        (session.books[0]?.book?.title
                                            ? `Discutiendo ${session.books[0].book.title}`
                                            : "Toca afinar la conversacion, los libros y la energia del encuentro.")}
                                </p>
                            </div>

                            <div className="hidden shrink-0 rounded-[1.35rem] bg-forest/5 px-4 py-3 text-right text-charcoal/70 md:block">
                                <p className="text-lg font-semibold leading-none text-charcoal">
                                    {sessionDate.toLocaleDateString("es-PE", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="mt-2 inline-flex items-center gap-1 text-xs">
                                    <Clock3 size={13} />
                                    {sessionDate.toLocaleTimeString("es-PE", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-charcoal/60">
                            <span className="inline-flex items-center gap-1 rounded-full bg-beige/70 px-3 py-1.5">
                                <CalendarDays size={13} />
                                {sessionDate.toLocaleDateString("es-PE", {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-beige/70 px-3 py-1.5">
                                <BookOpen size={13} />
                                {session.booksCount} libros
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-beige/70 px-3 py-1.5">
                                <Camera size={13} />
                                {session.photosCount} fotos
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-beige/70 px-3 py-1.5">
                                <MessageSquare size={13} />
                                {session.questionsCount} preguntas
                            </span>
                            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-white">
                                Ver detalle
                                <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
