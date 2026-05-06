"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appContextApi } from "@/lib/api/appContextApi";
import { cyclesApi, CycleFormat } from "@/lib/api/cyclesApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CalendarRange } from "lucide-react";
import { toast } from "sonner";

function toIsoDate(value: string, endOfDay = false) {
    const suffix = endOfDay ? "T23:59:59" : "T00:00:00";
    return new Date(`${value}${suffix}`).toISOString();
}

export default function NewCyclePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [theme, setTheme] = useState("");
    const [summary, setSummary] = useState("");
    const [format, setFormat] = useState<CycleFormat>("INTERSEMANAL");
    const [plannedReadingSessions, setPlannedReadingSessions] = useState(8);
    const [plannedCoordinationSessions, setPlannedCoordinationSessions] = useState(8);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [generateTemplate, setGenerateTemplate] = useState(true);
    const [coordinationLeadDays, setCoordinationLeadDays] = useState(3);

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const createCycleMutation = useMutation({
        mutationFn: async () => {
            if (!context?.defaultClubId) {
                throw new Error("No se encontró el club activo");
            }

            const cycle = await cyclesApi.createCycle(context.defaultClubId, {
                name,
                theme: theme || undefined,
                summary: summary || undefined,
                format,
                plannedReadingSessions,
                plannedCoordinationSessions,
                isActive,
                startDate: toIsoDate(startDate),
                endDate: endDate ? toIsoDate(endDate, true) : undefined,
            });

            if (generateTemplate) {
                await cyclesApi.createProgramTemplate(cycle.id, coordinationLeadDays);
            }

            return cycle;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appContext"] });
            queryClient.invalidateQueries({ queryKey: ["cycles"] });
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success(
                generateTemplate
                    ? "Ciclo creado con programación base"
                    : "Ciclo creado correctamente"
            );
            router.push("/manage?tab=cycles");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo crear el ciclo");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !startDate) {
            toast.error("Completa el nombre y la fecha de inicio");
            return;
        }

        createCycleMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-cream px-6 py-8 sm:px-8">
            <div className="mx-auto max-w-md">
                <button
                    onClick={() => router.back()}
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white border border-beige shadow-soft"
                >
                    <ChevronLeft size={20} className="text-forest" />
                </button>

                <Card className="rounded-3xl p-6">
                    <Badge className="mb-3">Nuevo ciclo</Badge>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest/5 text-forest">
                            <CalendarRange size={20} />
                        </div>
                        <div>
                            <h1 className="font-serif text-3xl text-forest">Crear ciclo</h1>
                            <p className="text-sm text-charcoal/70">
                                Define el periodo y, si quieres, genera la base de sesiones.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Nombre del ciclo</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Otoño lector 2026"
                                className="bg-beige/30 font-serif text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Tema (opcional)</label>
                            <Input
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="Ej. Viajes, memoria y comunidad"
                                className="bg-beige/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Resumen</label>
                            <textarea
                                rows={4}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Describe el enfoque del ciclo y el tipo de experiencia esperada."
                                className="w-full rounded-2xl border border-transparent bg-beige/30 px-4 py-3 text-sm outline-none transition focus:border-forest focus:bg-white resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Formato</label>
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
                                <label className="text-sm font-medium text-charcoal ml-1">Lecturas</label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={plannedReadingSessions}
                                    onChange={(e) => setPlannedReadingSessions(Number(e.target.value) || 0)}
                                    className="bg-beige/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-charcoal ml-1">Coordinaciones</label>
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
                                <label className="text-sm font-medium text-charcoal ml-1">Inicio</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-beige/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-charcoal ml-1">Fin</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-beige/30"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-cream p-4 space-y-4">
                            <label className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-forest"
                                />
                                <span>
                                    <span className="block text-sm font-medium text-charcoal">Marcar como ciclo activo</span>
                                    <span className="block text-xs text-gray-500">
                                        Si activas este ciclo, el lector con membresía vigente entrará directo aquí.
                                    </span>
                                </span>
                            </label>

                            <label className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={generateTemplate}
                                    onChange={(e) => setGenerateTemplate(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-forest"
                                />
                                <span>
                                    <span className="block text-sm font-medium text-charcoal">Generar programación base</span>
                                    <span className="block text-xs text-gray-500">
                                        Crea sesiones de coordinación y lectura numeradas para que luego solo ajustes fechas, libros o notas.
                                    </span>
                                </span>
                            </label>

                            {generateTemplate && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-charcoal ml-1">
                                        Días previos para la coordinación
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={coordinationLeadDays}
                                        onChange={(e) => setCoordinationLeadDays(Number(e.target.value) || 0)}
                                        className="bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
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
                                disabled={createCycleMutation.isPending}
                            >
                                {createCycleMutation.isPending ? "Creando..." : "Crear ciclo"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
