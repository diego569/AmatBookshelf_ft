"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/sessionsApi";
import { sessionContentApi, BookSearchResult } from "@/lib/api/sessionContentApi";
import { appContextApi } from "@/lib/api/appContextApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";

type ManualBookForm = {
    title: string;
    authorName: string;
    firstPublishYear: string;
    coverUrl: string;
    isbn: string;
};

export default function ManageSessionBooksPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const sessionId = params.id as string;
    const [query, setQuery] = useState("");
    const [author, setAuthor] = useState("");
    const [position, setPosition] = useState(1);
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [manualBook, setManualBook] = useState<ManualBookForm>({
        title: "",
        authorName: "",
        firstPublishYear: "",
        coverUrl: "",
        isbn: "",
    });

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: session } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.getSession(sessionId),
    });

    const { data: books } = useQuery({
        queryKey: ["sessionBooks", sessionId],
        queryFn: () => sessionContentApi.getSessionBooks(sessionId),
    });

    const searchMutation = useMutation({
        mutationFn: () => sessionContentApi.searchBooks(query, author || undefined),
        onSuccess: (data) => {
            setResults(data);
            if (!data.length) {
                toast.message("No encontramos resultados; puedes registrar el libro manualmente.");
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo buscar en Open Library");
        },
    });

    const importAndAttachMutation = useMutation({
        mutationFn: async (selected: BookSearchResult) => {
            const imported = await sessionContentApi.importBook({
                clubId: session?.clubId || context?.defaultClubId || "",
                title: selected.title,
                authorName: selected.authorName,
                firstPublishYear: selected.firstPublishYear,
                coverUrl: selected.coverUrl,
                openLibraryWorkKey: selected.openLibraryWorkKey,
                openLibraryEditionKey: selected.openLibraryEditionKey,
                isbn: selected.isbn,
            });

            await sessionContentApi.attachBook(sessionId, {
                bookId: (imported as { id: string }).id,
                position,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionBooks", sessionId] });
            queryClient.invalidateQueries({ queryKey: ["sessionExperience", sessionId] });
            toast.success("Libro asignado a la sesión");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo asignar el libro");
        },
    });

    const manualMutation = useMutation({
        mutationFn: async () => {
            const imported = await sessionContentApi.importBook({
                clubId: session?.clubId || context?.defaultClubId || "",
                title: manualBook.title,
                authorName: manualBook.authorName || undefined,
                firstPublishYear: manualBook.firstPublishYear
                    ? Number(manualBook.firstPublishYear)
                    : undefined,
                coverUrl: manualBook.coverUrl || undefined,
                isbn: manualBook.isbn || undefined,
            });

            await sessionContentApi.attachBook(sessionId, {
                bookId: (imported as { id: string }).id,
                position,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionBooks", sessionId] });
            setManualBook({
                title: "",
                authorName: "",
                firstPublishYear: "",
                coverUrl: "",
                isbn: "",
            });
            toast.success("Libro manual agregado");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo registrar el libro manual");
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
                    <Badge className="mb-3">Libros de la sesión</Badge>
                    <h1 className="font-serif text-3xl text-forest">{session?.title || "Sesión"}</h1>
                    <p className="mt-2 text-sm text-charcoal/70">
                        Busca en Open Library por título o autor y deja guardada la metadata localmente.
                    </p>

                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-[1fr_auto] gap-3">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Título del libro"
                                className="bg-beige/30"
                            />
                            <select
                                value={position}
                                onChange={(e) => setPosition(Number(e.target.value))}
                                className="rounded-2xl border border-transparent bg-beige/30 px-4 py-3 text-sm font-medium outline-none transition focus:border-forest focus:bg-white"
                            >
                                <option value={1}>Libro 1</option>
                                <option value={2}>Libro 2</option>
                            </select>
                        </div>

                        <Input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Autor (opcional)"
                            className="bg-beige/30"
                        />

                        <Button
                            onClick={() => {
                                if (!query.trim()) {
                                    toast.error("Escribe al menos el título");
                                    return;
                                }
                                searchMutation.mutate();
                            }}
                            className="w-full"
                            disabled={searchMutation.isPending}
                        >
                            <Search size={18} />
                            <span>{searchMutation.isPending ? "Buscando..." : "Buscar en Open Library"}</span>
                        </Button>
                    </div>
                </Card>

                {results.length > 0 && (
                    <Card className="rounded-3xl p-6">
                        <p className="font-serif text-2xl text-forest">Resultados</p>
                        <div className="mt-4 space-y-3">
                            {results.map((result, index) => (
                                <div key={`${result.title}-${result.authorName || "na"}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-4">
                                    <div className="flex gap-4">
                                        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-2xl bg-beige/40">
                                            {result.coverUrl ? (
                                                <img
                                                    src={result.coverUrl}
                                                    alt={result.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-serif text-xl text-forest leading-tight">{result.title}</p>
                                            <p className="mt-1 text-sm text-charcoal/70">{result.authorName || "Autor por confirmar"}</p>
                                            {result.firstPublishYear ? (
                                                <p className="mt-2 text-xs text-gray-400">{result.firstPublishYear}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => importAndAttachMutation.mutate(result)}
                                        disabled={importAndAttachMutation.isPending}
                                        className="mt-4 w-full"
                                    >
                                        Asignar a la sesión
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card className="rounded-3xl p-6">
                    <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-forest" />
                        <p className="font-serif text-2xl text-forest">Agregar manualmente</p>
                    </div>
                    <div className="mt-4 space-y-3">
                        <Input
                            value={manualBook.title}
                            onChange={(e) => setManualBook((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Título"
                            className="bg-beige/30"
                        />
                        <Input
                            value={manualBook.authorName}
                            onChange={(e) => setManualBook((prev) => ({ ...prev, authorName: e.target.value }))}
                            placeholder="Autor"
                            className="bg-beige/30"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                value={manualBook.firstPublishYear}
                                onChange={(e) => setManualBook((prev) => ({ ...prev, firstPublishYear: e.target.value }))}
                                placeholder="Año"
                                className="bg-beige/30"
                            />
                            <Input
                                value={manualBook.isbn}
                                onChange={(e) => setManualBook((prev) => ({ ...prev, isbn: e.target.value }))}
                                placeholder="ISBN"
                                className="bg-beige/30"
                            />
                        </div>
                        <Input
                            value={manualBook.coverUrl}
                            onChange={(e) => setManualBook((prev) => ({ ...prev, coverUrl: e.target.value }))}
                            placeholder="URL de portada (opcional)"
                            className="bg-beige/30"
                        />
                        <Button
                            onClick={() => {
                                if (!manualBook.title.trim()) {
                                    toast.error("El título es obligatorio");
                                    return;
                                }
                                manualMutation.mutate();
                            }}
                            disabled={manualMutation.isPending}
                            className="w-full"
                        >
                            Guardar libro manual
                        </Button>
                    </div>
                </Card>

                <Card className="rounded-3xl p-6">
                    <p className="font-serif text-2xl text-forest">Libros ya asignados</p>
                    <div className="mt-4 space-y-3">
                        {books?.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-white p-4 border border-gray-100">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Libro {item.position}</p>
                                <p className="mt-2 font-serif text-xl text-forest">{item.book.title}</p>
                                <p className="text-sm text-charcoal/70">{item.book.authorName || "Autor por confirmar"}</p>
                            </div>
                        ))}
                        {!books?.length && (
                            <p className="text-sm text-gray-400 italic">
                                Todavía no hay libros asociados a esta sesión.
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
