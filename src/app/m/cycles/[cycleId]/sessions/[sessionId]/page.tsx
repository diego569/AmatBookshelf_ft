"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Camera, Clock3, MessageSquareMore, Sparkles, Star, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { appContextApi } from "@/lib/api/appContextApi";
import { sessionContentApi } from "@/lib/api/sessionContentApi";
import { ReaderShell } from "@/components/member/reader-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useManageReaderContext } from "@/lib/navigation/useManageReaderContext";

const sessionTone = {
    LECTURA: "bg-[#E8F7EC] text-sage",
    COORDINACION: "bg-[#FFF1D9] text-[#9A6900]",
    EXTRAORDINARIA: "bg-[#F4EFFF] text-[#7A4D9E]",
} as const;

const sessionLabel = {
    LECTURA: "Lectura",
    COORDINACION: "Coordinacion",
    EXTRAORDINARIA: "Extraordinaria",
} as const;

export default function SessionExperiencePage() {
    const params = useParams();
    const queryClient = useQueryClient();
    const cycleId = params.cycleId as string;
    const sessionId = params.sessionId as string;
    const { manageSuffix } = useManageReaderContext(cycleId);
    const [replyBody, setReplyBody] = useState("");
    const [displayMode, setDisplayMode] = useState<"NAMED" | "ANONYMOUS">("NAMED");
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [replyByQuestion, setReplyByQuestion] = useState<Record<string, string>>({});
    const [anonymousByQuestion, setAnonymousByQuestion] = useState<Record<string, boolean>>({});

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: session } = useQuery({
        queryKey: ["sessionExperience", sessionId],
        queryFn: () => sessionContentApi.getSessionExperience(sessionId),
    });

    const replyMutation = useMutation({
        mutationFn: ({ questionId, body, mode }: { questionId?: string; body: string; mode: "NAMED" | "ANONYMOUS" }) =>
            sessionContentApi.addReply(sessionId, {
                questionId,
                body,
                displayMode: mode,
            }),
        onSuccess: (_, variables) => {
            if (variables.questionId) {
                setReplyByQuestion((prev) => ({ ...prev, [variables.questionId!]: "" }));
                setAnonymousByQuestion((prev) => ({ ...prev, [variables.questionId!]: false }));
            } else {
                setReplyBody("");
                setDisplayMode("NAMED");
            }
            queryClient.invalidateQueries({ queryKey: ["sessionExperience", sessionId] });
            toast.success("Tu aporte fue publicado");
        },
        onError: (error: any) => toast.error(error.message || "No se pudo publicar tu aporte"),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ sessionBookId, rating, comment }: { sessionBookId: string; rating: number; comment?: string }) =>
            sessionContentApi.createReview(sessionId, sessionBookId, { rating, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionExperience", sessionId] });
            toast.success("Resena guardada");
        },
        onError: (error: any) => toast.error(error.message || "No se pudo guardar la resena"),
    });

    const books = session?.books ?? [];
    const allPhotos = session?.photos ?? [];
    const questions = session?.discussionQuestions ?? [];
    const replies = session?.replies ?? [];
    const generalReplies = replies.filter((reply) => !reply.questionId);
    const leadBook = books[0]?.book;
    const heroImage = leadBook?.coverUrl || allPhotos[0]?.url || null;
    const visibleCycleName =
        context?.memberCycles?.find((item) => item.cycleId === cycleId)?.cycle.name ||
        context?.activeCycleMembership?.cycle.name;

    const repliesByQuestion = useMemo(() => {
        return questions.reduce<Record<string, typeof replies>>((acc, question) => {
            acc[question.id] = replies.filter((reply) => reply.questionId === question.id);
            return acc;
        }, {});
    }, [questions, replies]);

    return (
        <ReaderShell
            active="sessions"
            cycleId={cycleId}
            cycleName={visibleCycleName}
            clubName={context?.defaultClubName}
            badge={session?.sessionType ? sessionLabel[session.sessionType] : "Sesion"}
            title={session?.title || "Sesion del ciclo"}
            subtitle={session?.summary || "Una vista pensada para leer la sesion como experiencia: libro, fotos, reseñas y conversacion."}
            headerAction={
                <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
                    <Link href={`/m/cycles/${cycleId}/sessions${manageSuffix}`}>Volver al calendario</Link>
                </Button>
            }
        >
            <section className="overflow-hidden rounded-[2.4rem] border border-forest/8 bg-[#111b17] text-white shadow-float">
                <div className="grid min-h-[320px] gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">
                        {heroImage ? (
                            <img src={heroImage} alt={leadBook?.title || "Sesion"} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-white/5 text-white/40">
                                <BookOpen size={30} />
                            </div>
                        )}
                    </div>

                    <div className="relative overflow-hidden px-6 py-7 sm:px-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_35%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_50%)]" />
                        <div className="relative">
                            <div className="flex flex-wrap items-center gap-2">
                                {session?.sessionType ? (
                                    <span
                                        className={cn(
                                            "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                            sessionTone[session.sessionType]
                                        )}
                                    >
                                        {sessionLabel[session.sessionType]}
                                    </span>
                                ) : null}
                                <Badge className="border-white/15 bg-white/10 text-white shadow-none">
                                    {session?.status || "SCHEDULED"}
                                </Badge>
                                {session?.isPointsEnabled ? (
                                    <Badge className="border-transparent bg-[#fff4e6] text-[#7b5511] shadow-none">
                                        Suma puntos
                                    </Badge>
                                ) : null}
                            </div>

                            <h2 className="mt-5 max-w-4xl text-balance font-serif text-[2.5rem] leading-[0.92] text-white sm:text-[4.2rem]">
                                {session?.title || "Sesion"}
                            </h2>

                            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/72">
                                {session?.startsAt ? (
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays size={15} />
                                        {new Date(session.startsAt).toLocaleDateString("es-PE", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                ) : null}
                                {session?.startsAt ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Clock3 size={15} />
                                        {new Date(session.startsAt).toLocaleTimeString("es-PE", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                ) : null}
                                {leadBook ? (
                                    <span className="inline-flex items-center gap-2">
                                        <BookOpen size={15} />
                                        {leadBook.title} {leadBook.authorName ? `de ${leadBook.authorName}` : ""}
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <Button asChild className="rounded-full px-5">
                                    <Link href="/m/scan">Marcar asistencia</Link>
                                </Button>
                                <Button asChild variant="secondary" className="rounded-full border-white/15 bg-white/10 px-5 text-white hover:bg-white/15">
                                    <Link href={`/m/cycles/${cycleId}${manageSuffix}`}>Volver al passport</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
                <div className="space-y-6">
                    {books.length ? (
                        <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-6">
                            <div className="flex items-center gap-3">
                                <BookOpen size={18} className="text-forest" />
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                        Lecturas de hoy
                                    </p>
                                    <h3 className="font-serif text-3xl text-charcoal">Libros de la sesion</h3>
                                </div>
                            </div>

                            <div className="mt-5 space-y-5">
                                {books.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-[1.8rem] border border-forest/8 bg-[#f7f2e8] p-4"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            <div className="h-36 w-24 shrink-0 overflow-hidden rounded-[1.3rem] border border-forest/8 bg-beige/60">
                                                {item.book.coverUrl ? (
                                                    <img
                                                        src={item.book.coverUrl}
                                                        alt={item.book.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="font-serif text-3xl leading-tight text-charcoal">
                                                            {item.book.title}
                                                        </h4>
                                                        <p className="mt-1 text-sm text-charcoal/62">
                                                            {item.book.authorName || "Autor por confirmar"}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" className="border-0 bg-[#e8f7ec] text-sage">
                                                        {item.position === 1 ? "Principal" : `Libro ${item.position}`}
                                                    </Badge>
                                                </div>

                                                <div className="mt-5 rounded-[1.4rem] bg-white p-4">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/45">
                                                        ¿Que te parecio este libro?
                                                    </p>
                                                    <div className="mt-3 flex gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() =>
                                                                    setRatings((prev) => ({ ...prev, [item.id]: star }))
                                                                }
                                                                className="text-ochre transition hover:scale-110"
                                                            >
                                                                <Star
                                                                    size={20}
                                                                    fill={(ratings[item.id] || 0) >= star ? "currentColor" : "none"}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        rows={3}
                                                        value={comments[item.id] || ""}
                                                        onChange={(e) =>
                                                            setComments((prev) => ({
                                                                ...prev,
                                                                [item.id]: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Que te parecio este libro en esta sesion?"
                                                        className="mt-3 w-full rounded-[1.2rem] border border-forest/8 bg-[#f7f2e8] px-4 py-3 text-sm outline-none transition focus:border-forest/20"
                                                    />
                                                    <Button
                                                        onClick={() =>
                                                            reviewMutation.mutate({
                                                                sessionBookId: item.id,
                                                                rating: ratings[item.id] || 5,
                                                                comment: comments[item.id],
                                                            })
                                                        }
                                                        className="mt-3 rounded-2xl"
                                                    >
                                                        Guardar resena
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : null}

                    {allPhotos.length ? (
                        <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-6">
                            <div className="flex items-center gap-3">
                                <Camera size={18} className="text-sage" />
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                        Galeria de la sesion
                                    </p>
                                    <h3 className="font-serif text-3xl text-charcoal">Fotos</h3>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {allPhotos.map((photo) => (
                                    <div key={photo.id} className="overflow-hidden rounded-[1.6rem] border border-forest/8 bg-[#f7f2e8]">
                                        <img
                                            src={photo.url}
                                            alt={photo.caption || "Foto de la sesion"}
                                            className="h-64 w-full object-cover"
                                        />
                                        {photo.caption ? (
                                            <p className="px-4 py-3 text-sm text-charcoal/60">{photo.caption}</p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : null}

                    <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-6">
                        <div className="flex items-center gap-3">
                            <MessageSquareMore size={18} className="text-forest" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                    De lo que se discutio
                                </p>
                                <h3 className="font-serif text-3xl text-charcoal">Conversacion de la sesion</h3>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[1.8rem] bg-[#f7f2e8] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/45">
                                Aporte libre
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={displayMode === "NAMED" ? "primary" : "secondary"}
                                    onClick={() => setDisplayMode("NAMED")}
                                    className="h-11 rounded-full px-4"
                                >
                                    Con mi nombre
                                </Button>
                                <Button
                                    type="button"
                                    variant={displayMode === "ANONYMOUS" ? "primary" : "secondary"}
                                    onClick={() => setDisplayMode("ANONYMOUS")}
                                    className="h-11 rounded-full px-4"
                                >
                                    Como anonimo
                                </Button>
                            </div>
                            <textarea
                                rows={3}
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                placeholder="Que te quedo rondando despues de la sesion?"
                                className="mt-3 w-full rounded-[1.2rem] border border-forest/8 bg-white px-4 py-3 text-sm outline-none transition focus:border-forest/20"
                            />
                            <Button
                                onClick={() =>
                                    replyMutation.mutate({
                                        body: replyBody,
                                        mode: displayMode,
                                    })
                                }
                                disabled={!replyBody.trim() || replyMutation.isPending}
                                className="mt-3 rounded-2xl"
                            >
                                Publicar
                            </Button>
                        </div>

                        {generalReplies.length ? (
                            <div className="mt-5 space-y-3">
                                {generalReplies.map((reply) => (
                                    <div key={reply.id} className="rounded-[1.6rem] border border-forest/8 bg-[#f7f2e8] px-4 py-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                                            {reply.displayName}
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{reply.body}</p>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-6 space-y-5">
                            {questions.map((question, index) => {
                                const questionReplies = repliesByQuestion[question.id] || [];
                                const questionBody = replyByQuestion[question.id] || "";
                                const questionMode = anonymousByQuestion[question.id] ? "ANONYMOUS" : "NAMED";

                                return (
                                    <div key={question.id} className="rounded-[1.8rem] border border-forest/8 bg-[#f7f2e8] p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-forest text-white">
                                                <MessageSquareMore size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                                                    Pregunta {index + 1}
                                                </p>
                                                <p className="mt-2 text-lg font-medium leading-relaxed text-charcoal">
                                                    {question.prompt}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {questionReplies.map((reply) => (
                                                <div key={reply.id} className="rounded-[1.4rem] bg-white px-4 py-4">
                                                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                                                        <UserCircle2 size={14} />
                                                        {reply.displayName}
                                                    </div>
                                                    <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{reply.body}</p>
                                                </div>
                                            ))}

                                            {!questionReplies.length ? (
                                                <p className="rounded-[1.4rem] border border-dashed border-forest/12 px-4 py-4 text-sm text-charcoal/55">
                                                    Todavia no hay respuestas para esta pregunta.
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 rounded-[1.4rem] bg-white p-4">
                                            <textarea
                                                rows={2}
                                                value={questionBody}
                                                onChange={(e) =>
                                                    setReplyByQuestion((prev) => ({
                                                        ...prev,
                                                        [question.id]: e.target.value,
                                                    }))
                                                }
                                                placeholder="Escribe tu respuesta..."
                                                className="w-full rounded-[1.1rem] border border-forest/8 bg-[#f7f2e8] px-4 py-3 text-sm outline-none transition focus:border-forest/20"
                                            />
                                            <label className="mt-3 inline-flex items-center gap-2 text-sm text-charcoal/62">
                                                <input
                                                    type="checkbox"
                                                    checked={anonymousByQuestion[question.id] || false}
                                                    onChange={(e) =>
                                                        setAnonymousByQuestion((prev) => ({
                                                            ...prev,
                                                            [question.id]: e.target.checked,
                                                        }))
                                                    }
                                                    className="h-4 w-4 rounded border-forest/20 text-forest"
                                                />
                                                Publicar de forma anonima
                                            </label>
                                            <Button
                                                onClick={() =>
                                                    replyMutation.mutate({
                                                        questionId: question.id,
                                                        body: questionBody,
                                                        mode: questionMode,
                                                    })
                                                }
                                                disabled={!questionBody.trim() || replyMutation.isPending}
                                                className="mt-3 rounded-2xl"
                                            >
                                                Publicar
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {!questions.length ? (
                                <div className="rounded-[1.8rem] border border-dashed border-forest/15 bg-[#f7f2e8] px-4 py-6 text-center">
                                    <p className="font-serif text-3xl text-charcoal">Aun no hay preguntas cargadas</p>
                                    <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
                                        Cuando moderacion plantee preguntas para la discusion, apareceran aqui.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </Card>
                </div>

                <div className="space-y-5">
                    <Card className="rounded-[2rem] border border-forest/8 bg-[#17352e] p-5 text-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                            Resumen
                        </p>
                        <p className="mt-4 font-serif text-4xl">
                            {books.length} libro{books.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/72">
                            {allPhotos.length} fotos y {questions.length} preguntas disponibles para esta sesion.
                        </p>
                    </Card>

                    <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className="text-ochre" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                    Estado de la sesion
                                </p>
                                <p className="mt-1 font-serif text-2xl text-charcoal">
                                    {session?.status || "Programada"}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-charcoal/62">
                            <div className="rounded-2xl bg-[#f7f2e8] px-4 py-3">
                                {session?.isPointsEnabled
                                    ? "Esta sesion tiene puntos habilitados para lectores."
                                    : "Esta sesion no suma puntos en esta configuracion."}
                            </div>
                            <div className="rounded-2xl bg-[#f7f2e8] px-4 py-3">
                                Las respuestas pueden publicarse con nombre o en modo anonimo.
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
        </ReaderShell>
    );
}
