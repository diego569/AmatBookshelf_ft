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
import { Camera, ChevronLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ManageSessionPhotosPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const sessionId = params.id as string;
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [sortOrder, setSortOrder] = useState(0);

    const { data: session } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.getSession(sessionId),
    });

    const { data: photos } = useQuery({
        queryKey: ["sessionPhotos", sessionId],
        queryFn: () => sessionContentApi.getPhotos(sessionId),
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) {
                throw new Error("Selecciona una imagen");
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("caption", caption);
            formData.append("sortOrder", String(sortOrder));
            return sessionContentApi.uploadPhoto(sessionId, formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionPhotos", sessionId] });
            queryClient.invalidateQueries({ queryKey: ["sessionExperience", sessionId] });
            setFile(null);
            setCaption("");
            setSortOrder(0);
            toast.success("Foto subida correctamente");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo subir la foto");
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
                    <Badge className="mb-3">Galería de la sesión</Badge>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                            <Camera size={20} />
                        </div>
                        <div>
                            <h1 className="font-serif text-3xl text-forest">{session?.title || "Sesión"}</h1>
                            <p className="text-sm text-charcoal/70">
                                Sube recuerdos de la sesión para que los lectores los vean desde el ciclo.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="bg-beige/30"
                        />
                        <Input
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Pie de foto (opcional)"
                            className="bg-beige/30"
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
                            onClick={() => uploadMutation.mutate()}
                            disabled={uploadMutation.isPending}
                            className="w-full"
                        >
                            <Upload size={18} />
                            <span>{uploadMutation.isPending ? "Subiendo..." : "Subir foto"}</span>
                        </Button>
                    </div>
                </Card>

                <Card className="rounded-3xl p-6">
                    <p className="font-serif text-2xl text-forest">Fotos actuales</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {photos?.map((photo) => (
                            <div key={photo.id} className="overflow-hidden rounded-2xl bg-white border border-gray-100">
                                <img src={photo.url} alt={photo.caption || "Foto de la sesión"} className="h-40 w-full object-cover" />
                                {photo.caption ? (
                                    <p className="px-3 py-2 text-xs text-charcoal/70">{photo.caption}</p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                    {!photos?.length && (
                        <p className="mt-4 text-sm text-gray-400 italic">
                            Aún no hay fotos subidas para esta sesión.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}
