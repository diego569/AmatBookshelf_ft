"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appContextApi } from "@/lib/api/appContextApi";
import { cyclesApi, CycleFormat } from "@/lib/api/cyclesApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, ChevronLeft, PencilLine } from "lucide-react";
import { toast } from "sonner";

function toIsoDate(value: string, endOfDay = false) {
    const suffix = endOfDay ? "T23:59:59" : "T00:00:00";
    return new Date(`${value}${suffix}`).toISOString();
}

function toInputDate(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

export default function EditCyclePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useParams<{ id: string }>();
    const cycleId = params.id;
    const [name, setName] = useState("");
    const [theme, setTheme] = useState("");
    const [summary, setSummary] = useState("");
    const [format, setFormat] = useState<CycleFormat>("INTERSEMANAL");
    const [plannedReadingSessions, setPlannedReadingSessions] = useState(0);
    const [plannedCoordinationSessions, setPlannedCoordinationSessions] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(false);

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: cycle, isLoading } = useQuery({
        queryKey: ["cycle", cycleId],
        queryFn: () => cyclesApi.getCycle(cycleId),
        enabled: !!cycleId,
    });

    useEffect(() => {
        if (!cycle) return;
        setName(cycle.name || "");
        setTheme(cycle.theme || "");
        setSummary(cycle.summary || "");
        setFormat(cycle.format);
        setPlannedReadingSessions(cycle.plannedReadingSessions || 0);
        setPlannedCoordinationSessions(cycle.plannedCoordinationSessions || 0);
        setStartDate(toInputDate(cycle.startDate));
        setEndDate(toInputDate(cycle.endDate));
        setIsActive(Boolean(cycle.isActive));
    }, [cycle]);

    const updateCycleMutation = useMutation({
        mutationFn: async () => {
            if (!context?.defaultClubId) {
                throw new Error("No se encontró el club activo");
            }

            return cyclesApi.updateCycle(context.defaultClubId, cycleId, {
                name,
                theme: theme || "",
                summary: summary || "",
                format,
                plannedReadingSessions,
                plannedCoordinationSessions,
                isActive,
                startDate: startDate ? toIsoDate(startDate) : undefined,
                endDate: endDate ? toIsoDate(endDate, true) : null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appContext"] });
            queryClient.invalidateQueries({ queryKey: ["cycles"] });
            queryClient.invalidateQueries({ queryKey: ["cycle", cycleId] });
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            queryClient.invalidateQueries({ queryKey: ["liveSession"] });
            toast.success("Ciclo actualizado correctamente");
            router.push("/manage?tab=cycles");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo actualizar el ciclo");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !startDate) {
            toast.error("Completa el nombre y la fecha de inicio");
            return;
        }

        updateCycleMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-cream px-6 py-8 sm:px-8">
            <div className="mx-auto max-w-md">
                <button
                    onClick={() => router.push("/manage?tab=cycles")}
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-white shadow-soft"
                >
                    <ChevronLeft size={20} className="text-forest" />
                </button>

                <Card className="rounded-3xl p-6">
                    <Badge className="mb-3">Editar ciclo</Badge>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                            <PencilLine size={20} />
                        </div>
                        <div>
                            <h1 className="font-serif text-3xl text-forest">Ajustar ciclo</h1>
                            <p className="text-sm text-charcoal/70">
                                Corrige fechas, nombre, formato y estado del ciclo sin crear uno nuevo.
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-forest/15 bg-beige/30 px-4 py-6 text-center text-sm text-charcoal/60">
                            Cargando datos del ciclo...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <label className="ml-1 text-sm font-medium text-charcoal">Nombre del ciclo</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej. Otoño lector 2026"
                                    className="bg-beige/30 font-serif text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="ml-1 text-sm font-medium text-charcoal">Tema (opcional)</label>
                                <Input
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    placeholder="Ej. Viajes, memoria y comunidad"
                                    className="bg-beige/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="ml-1 text-sm font-medium text-charcoal">Resumen</label>
                                <textarea
                                    rows={4}
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Describe el enfoque del ciclo y la experiencia esperada."
                                    className="w-full resize-none rounded-2xl border border-transparent bg-beige/30 px-4 py-3 text-sm outline-none transition focus:border-forest focus:bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="ml-1 text-sm font-medium text-charcoal">Formato</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as CycleFormat)}
                                    className="w-full appearance-none rounded-2xl border border-transparent bg-beige/30 px-4 py-3 text-sm font-medium outline-none transition focus:border-forest focus:bg-white"
                                >
                                    <option value="INTERSEMANAL">Intersemanal</option>
                                    <option value="SEMANAL">Semanal</option>
                                    <option value="CUSTOM">Personalizado</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="ml-1 text-sm font-medium text-charcoal">Lecturas</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={plannedReadingSessions}
                                        onChange={(e) => setPlannedReadingSessions(Number(e.target.value) || 0)}
                                        className="bg-beige/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="ml-1 text-sm font-medium text-charcoal">Coordinaciones</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={plannedCoordinationSessions}
                                        onChange={(e) => setPlannedCoordinationSessions(Number(e.target.value) || 0)}
                                        className="bg-beige/30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="ml-1 text-sm font-medium text-charcoal">Inicio</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-beige/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="ml-1 text-sm font-medium text-charcoal">Fin</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-beige/30"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl bg-cream p-4">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-forest"
                                    />
                                    <span>
                                        <span className="block text-sm font-medium text-charcoal">Dejar como ciclo activo</span>
                                        <span className="block text-xs text-gray-500">
                                            Si lo activas, este ciclo pasa a ser la referencia principal del club.
                                        </span>
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => router.push("/manage?tab=cycles")}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-14 flex-[2]"
                                    disabled={updateCycleMutation.isPending}
                                >
                                    <CalendarRange size={18} />
                                    {updateCycleMutation.isPending ? "Guardando..." : "Guardar cambios"}
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
