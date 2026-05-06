"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/sessionsApi";
import { sessionContentApi } from "@/lib/api/sessionContentApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MessageSquareMore } from "lucide-react";
import { toast } from "sonner";

export default function ManageSessionDiscussionPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const sessionId = params.id as string;
    const [prompt, setPrompt] = useState("");
    const [sortOrder, setSortOrder] = useState(0);

    const { data: session } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.getSession(sessionId),
    });

    const { data: questions } = useQuery({
        queryKey: ["sessionQuestions", sessionId],
        queryFn: () => sessionContentApi.getQuestions(sessionId),
    });

    const { data: replies } = useQuery({
        queryKey: ["sessionReplies", sessionId],
        queryFn: () => sessionContentApi.getReplies(sessionId),
    });

    const addQuestionMutation = useMutation({
        mutationFn: () => sessionContentApi.addQuestion(sessionId, { prompt, sortOrder }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionQuestions", sessionId] });
            queryClient.invalidateQueries({ queryKey: ["sessionExperience", sessionId] });
            setPrompt("");
            setSortOrder(0);
            toast.success("Pregunta agregada");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo agregar la pregunta");
        },
    });

    return (
        <div className="min-h-screen bg-cream px-6 py-8 sm:px-8">
            <div className="mx-auto max-w-md space-y-4">
                <button
                    onClick={() => router.push(`/manage/sessions/${sessionId}`)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white border border-beige shadow-soft"
                >
                    <ChevronLeft size={20} className="text-forest" />
                </button>

                <Card className="rounded-3xl p-6">
                    <Badge className="mb-3">Discusión</Badge>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                            <MessageSquareMore size={20} />
                        </div>
                        <div>
                            <h1 className="font-serif text-3xl text-forest">{session?.title || "Sesión"}</h1>
                            <p className="text-sm text-charcoal/70">
                                Añade preguntas guía para que la conversación siga viva incluso después de la sesión.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <textarea
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ej. ¿Qué parte del libro conectó más con tu experiencia?"
                            className="w-full rounded-2xl border border-transparent bg-beige/30 px-4 py-3 text-sm outline-none transition focus:border-forest focus:bg-white resize-none"
                        />
                        <Input
                            type="number"
                            min={0}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                            placeholder="Orden"
                            className="bg-beige/30"
                        />
                        <Button
                            onClick={() => {
                                if (!prompt.trim()) {
                                    toast.error("Escribe la pregunta antes de guardarla");
                                    return;
                                }
                                addQuestionMutation.mutate();
                            }}
                            disabled={addQuestionMutation.isPending}
                            className="w-full"
                        >
                            Guardar pregunta
                        </Button>
                    </div>
                </Card>

                <Card className="rounded-3xl p-6">
                    <p className="font-serif text-2xl text-forest">Preguntas registradas</p>
                    <div className="mt-4 space-y-3">
                        {questions?.map((question, index) => (
                            <div key={question.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                                    Pregunta {index + 1} · {question.replies.length} respuestas
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{question.prompt}</p>
                            </div>
                        ))}
                        {!questions?.length && (
                            <p className="text-sm text-gray-400 italic">
                                Todavía no hay preguntas de discusión para esta sesión.
                            </p>
                        )}
                    </div>
                </Card>

                <Card className="rounded-3xl p-6">
                    <p className="font-serif text-2xl text-forest">Respuestas recientes</p>
                    <div className="mt-4 space-y-3">
                        {replies?.map((reply) => (
                            <div key={reply.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{reply.displayName}</p>
                                <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{reply.body}</p>
                            </div>
                        ))}
                        {!replies?.length && (
                            <p className="text-sm text-gray-400 italic">
                                Aún no hay respuestas publicadas por los lectores.
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
