"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, SessionType, CreateSessionDto } from "@/lib/api/sessionsApi";
import { appContextApi } from "@/lib/api/appContextApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SessionFormPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const isEdit = !!params.id;

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: existingSession, isLoading: isLoadingSession } = useQuery({
        queryKey: ["session", params.id],
        queryFn: () => sessionsApi.getSession(params.id as string),
        enabled: isEdit,
    });

    const [formData, setFormData] = useState<Partial<CreateSessionDto>>({
        title: "",
        sessionType: "LECTURA",
        startsAt: "",
        summary: "",
        isPointsEnabled: true,
    });

    // Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
    const toLocalISO = (dateStr: string) => {
        const date = new Date(dateStr);
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    // Populate form if editing
    useEffect(() => {
        if (existingSession) {
            setFormData({
                title: existingSession.title || "",
                sessionType: existingSession.sessionType,
                startsAt: existingSession.startsAt ? toLocalISO(existingSession.startsAt) : "",
                endsAt: existingSession.endsAt ? toLocalISO(existingSession.endsAt) : "",
                summary: existingSession.summary || "",
                sequenceNumber: existingSession.sequenceNumber || undefined,
                isPointsEnabled: existingSession.isPointsEnabled ?? true,
            });
        }
    }, [existingSession]);

    const createMutation = useMutation({
        mutationFn: (data: CreateSessionDto) =>
            sessionsApi.createSession(context!.defaultClubId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success("Sesión creada correctamente");
            router.push("/manage");
        },
        onError: (error: any) => toast.error(error.message || "No se pudo crear la sesión"),
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateSessionDto>) =>
            sessionsApi.updateSession(params.id as string, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            queryClient.invalidateQueries({ queryKey: ["session", params.id] });
            toast.success("Sesión actualizada correctamente");
            router.push("/manage");
        },
        onError: (error: any) => toast.error(error.message || "No se pudo actualizar la sesión"),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.startsAt) {
            toast.error("Completa el título y la hora de inicio");
            return;
        }

        const data = {
            ...formData,
            startsAt: new Date(formData.startsAt!).toISOString(),
            endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : undefined,
            cycleId: context?.defaultCycleId,
            isPointsEnabled:
                formData.isPointsEnabled ?? formData.sessionType !== "COORDINACION",
        } as CreateSessionDto;

        if (isEdit) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    if (isEdit && isLoadingSession) {
        return <div className="min-h-screen flex items-center justify-center bg-cream italic text-gray-400">Cargando sesión...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-cream animate-fade-in relative">
            <div className="absolute top-10 left-10 z-20">
                <button onClick={() => router.back()} className="p-3 bg-white rounded-full shadow-soft hover:bg-gray-50 transition">
                    <X size={24} className="text-forest" />
                </button>
            </div>

            <Card className="w-full max-w-md p-8 bg-white shadow-float relative z-10">
                <header className="mb-8">
                    <Badge className="mb-2">{isEdit ? "Actualizar detalles" : "Nueva sesión"}</Badge>
                    <h1 className="font-serif text-3xl text-forest">
                        {isEdit ? "Editar sesión" : "Crear sesión"}
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal ml-1">Tipo de sesión</label>
                        <select
                            value={formData.sessionType}
                            onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as SessionType })}
                            className="w-full appearance-none bg-beige/30 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-forest transition outline-none"
                        >
                            <option value="LECTURA">Sesión de lectura</option>
                            <option value="COORDINACION">Coordinación / Admin</option>
                            <option value="EXTRAORDINARIA">Evento extraordinario</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal ml-1">Libro o tema</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="p. ej. El Gran Gatsby"
                            className="font-serif text-lg bg-beige/30"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Fecha y hora de inicio</label>
                            <div className="relative">
                                <Input
                                    type="datetime-local"
                                    value={formData.startsAt}
                                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                    className="pl-12 bg-beige/30"
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Fecha y hora de fin</label>
                            <div className="relative">
                                <Input
                                    type="datetime-local"
                                    value={formData.endsAt || ""}
                                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                                    className="pl-12 bg-beige/30"
                                />
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal ml-1">Resumen (opcional)</label>
                        <textarea
                            rows={3}
                            value={formData.summary || ""}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            placeholder="Detalles clave de la sesión, dinámica o recordatorios..."
                            className="w-full bg-beige/30 border border-transparent rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-forest transition resize-none outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Número de sesión</label>
                            <Input
                                type="number"
                                min={1}
                                value={formData.sequenceNumber ?? ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        sequenceNumber: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                }
                                className="bg-beige/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Puntos</label>
                            <select
                                value={String(formData.isPointsEnabled ?? true)}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isPointsEnabled: e.target.value === "true",
                                    })
                                }
                                className="w-full appearance-none bg-beige/30 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-forest transition outline-none"
                            >
                                <option value="true">Esta sesión sí suma puntos</option>
                                <option value="false">Esta sesión no suma puntos</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] h-14"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {isEdit ? "Guardar cambios" : "Crear sesión"}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Decorative blobs */}
            <div className="absolute top-[-5%] right-[-10%] w-64 h-64 bg-forest/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-ochre/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
}
