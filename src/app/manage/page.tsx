"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth";
import { appContextApi } from "@/lib/api/appContextApi";
import { sessionsApi, Session } from "@/lib/api/sessionsApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Book, Edit, Trash2, PlayCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function isValidSessionDate(value?: string | null): value is string {
    if (!value) return false;
    return !Number.isNaN(new Date(value).getTime());
}

function normalizeLiveSession(input: unknown): Session | null {
    if (!input || typeof input !== "object") return null;
    const candidate = input as Partial<Session>;
    if (!candidate.id || typeof candidate.id !== "string") return null;
    if (!isValidSessionDate(candidate.startsAt)) return null;
    return candidate as Session;
}

const PAST_GRACE_MS = 60 * 1000;

function toMs(value?: string | null): number | null {
    if (!value) return null;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
}

export default function ManagerDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { membershipId, accessToken } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"planning" | "live">("planning");

    // Fetch App Context
    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    // Fetch Memberships to check role
    const { data: memberships } = useQuery({
        queryKey: ["memberships", context?.defaultClubId],
        queryFn: () => clubsApi.getMemberships(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    const tokenPersonId = useMemo(() => {
        if (!accessToken) return null;
        try {
            const base64Url = accessToken.split(".")[1];
            if (!base64Url) return null;
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            const payload = JSON.parse(json) as { sub?: string };
            return payload.sub ?? null;
        } catch {
            return null;
        }
    }, [accessToken]);

    const memberRole = useMemo(() => {
        if (!memberships) return null;
        // Prefer cached membershipId when available.
        if (membershipId) {
            const byMembershipId = memberships.find((m) => m.id === membershipId);
            if (byMembershipId?.role) return byMembershipId.role;
        }
        // Fallback: match by personId from JWT.
        if (tokenPersonId) {
            const byPersonId = memberships.find((m) => m.personId === tokenPersonId);
            if (byPersonId?.role) return byPersonId.role;
        }
        return null;
    }, [memberships, membershipId, tokenPersonId]);

    const isAdmin = memberRole === "admin" || memberRole === "MODERATOR";

    // Fetch Sessions
    const { data: sessions } = useQuery({
        queryKey: ["sessions", context?.defaultClubId],
        queryFn: () => sessionsApi.getSessions(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    const { data: liveSessionRaw } = useQuery({
        queryKey: ["liveSession", context?.defaultClubId],
        queryFn: () => sessionsApi.getLiveSession(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
        refetchInterval: activeTab === "live" ? 5000 : 15000,
    });
    const liveSession = useMemo(() => normalizeLiveSession(liveSessionRaw), [liveSessionRaw]);

    const { upcomingSessions, pastSessions } = useMemo(() => {
        if (!sessions) return { upcomingSessions: [] as Session[], pastSessions: [] as Session[] };
        const now = Date.now();
        const liveSessionId = liveSession?.id ?? null;
        const ordered = [...sessions].sort(
            (a, b) => (toMs(a.startsAt) ?? 0) - (toMs(b.startsAt) ?? 0)
        );
        const withoutLive = ordered.filter(
            (s) => s.status !== "LIVE" && (!liveSessionId || s.id !== liveSessionId)
        );

        const isPastSession = (s: Session) => {
            const startsAtMs = toMs(s.startsAt);
            const endedAtMs = toMs(s.endedAt);
            const pastByTime = startsAtMs !== null ? startsAtMs < now - PAST_GRACE_MS : false;

            // ENDED only counts as past if it has an endedAt in the past or it is already past by time.
            if (s.status === "ENDED") {
                return (endedAtMs !== null && endedAtMs <= now) || pastByTime;
            }

            return pastByTime;
        };

        return {
            upcomingSessions: withoutLive.filter((s) => !isPastSession(s)),
            pastSessions: withoutLive.filter((s) => isPastSession(s)).reverse(),
        };
    }, [sessions, liveSession?.id]);

    if (!isAdmin && memberships) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-center bg-cream">
                <Card className="p-8 max-w-sm">
                    <h2 className="text-2xl text-forest mb-4">Acceso restringido</h2>
                    <p className="text-gray-500 mb-6">Solo administradores y moderadores pueden acceder al panel de gestión.</p>
                    <Button onClick={() => router.push("/m")} className="w-full">
                        Volver a miembros
                    </Button>
                </Card>
            </div>
        );
    }

    const handleCreate = () => router.push("/manage/sessions/new");
    const handleAddMember = () => router.push("/manage/members/new");
    const handleEdit = (id: string) => router.push(`/manage/sessions/${id}/edit`);
    const openLiveSession = () => {
        if (!liveSession?.id) {
            toast.error("No se encontró una sesión en vivo válida");
            queryClient.invalidateQueries({ queryKey: ["liveSession", context?.defaultClubId] });
            return;
        }
        router.push(`/manage/sessions/${liveSession.id}`);
    };

    const startSessionMutation = useMutation({
        mutationFn: (id: string) => sessionsApi.startSession(id),
        onSuccess: (startedSession) => {
            queryClient.invalidateQueries({ queryKey: ["sessions", context?.defaultClubId] });
            queryClient.invalidateQueries({ queryKey: ["liveSession", context?.defaultClubId] });
            router.push(`/manage/sessions/${startedSession.id}`);
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo iniciar la sesión");
        },
    });
    const handleStart = (id: string) => startSessionMutation.mutate(id);

    const deleteSessionMutation = useMutation({
        mutationFn: (id: string) => sessionsApi.deleteSession(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions", context?.defaultClubId] });
            queryClient.invalidateQueries({ queryKey: ["liveSession", context?.defaultClubId] });
            toast.success("Sesión eliminada correctamente");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo eliminar la sesión");
        },
    });

    const handleDelete = (id: string, title?: string) => {
        const label = title?.trim() || "esta sesión";
        const confirmDelete = window.confirm(`¿Seguro que deseas eliminar ${label}?`);
        if (!confirmDelete) return;
        deleteSessionMutation.mutate(id);
    };

    return (
        <div className="min-h-screen h-dvh flex flex-col bg-cream animate-fade-in relative overflow-hidden">
            {/* Header & Tabs */}
            <div className="sticky top-0 z-40 bg-cream/70 backdrop-blur border-b border-gray-200/60">
                <div className="max-w-md mx-auto px-6 sm:px-8 py-3 flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab("planning")}
                        className={cn(
                            "flex-1 py-2 rounded-2xl text-sm font-bold tracking-wide transition",
                            activeTab === "planning"
                                ? "bg-white border border-beige shadow-sm text-forest"
                                : "bg-transparent text-gray-500 hover:bg-white/50"
                        )}
                    >
                        Planificación
                    </button>
                    <button
                        onClick={() => setActiveTab("live")}
                        className={cn(
                            "flex-1 py-2 rounded-2xl text-sm font-bold tracking-wide transition",
                            activeTab === "live"
                                ? "bg-white border border-beige shadow-sm text-forest"
                                : "bg-transparent text-gray-500 hover:bg-white/50"
                        )}
                    >
                        En vivo
                    </button>
                </div>
            </div>

            <main className="max-w-md mx-auto w-full flex-1 overflow-y-auto px-6 sm:px-8 py-6 pb-6">
                {activeTab === "planning" ? (
                    <div className="space-y-6">
                        <header>
                            <Badge className="mb-2">Ciclo actual: {context?.defaultCycleName || "Cargando..."}</Badge>
                            <h1 className="font-serif text-3xl text-forest">Gestión del club</h1>
                        </header>

                        <div className="grid grid-cols-3 gap-3">
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <Users className="text-ochre mb-1" size={18} />
                                <span className="text-lg font-bold text-forest leading-none">
                                    {memberships?.length || "—"}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Miembros
                                </span>
                            </Card>
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <Book className="text-sage mb-1" size={18} />
                                <span className="text-lg font-bold text-forest leading-none">
                                    {sessions?.length || "—"}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Sesiones
                                </span>
                            </Card>
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <span className="text-lg font-bold text-forest leading-none">
                                    15m
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Regla de tardanza
                                </span>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Miembros</p>
                                    <p className="font-serif text-xl text-forest">Inscripción manual</p>
                                </div>
                                <Button onClick={handleAddMember} variant="secondary" className="h-11 px-4">
                                    <UserPlus size={16} />
                                    <span>Agregar</span>
                                </Button>
                            </div>

                            {liveSession && (
                                <div className="bg-white rounded-2xl border border-sage/30 shadow-sm p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-sage uppercase tracking-wider">Sesión en vivo</p>
                                        <p className="font-serif text-xl text-forest truncate">{liveSession.title || "Sesión activa"}</p>
                                    </div>
                                    <Button onClick={openLiveSession} className="h-11 px-4">
                                        Abrir
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <h2 className="font-serif text-xl text-charcoal">Próximas sesiones</h2>
                            </div>

                            <div className="space-y-3">
                                {upcomingSessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                                                            s.sessionType === "LECTURA"
                                                                ? "bg-sage/10 text-sage"
                                                                : s.sessionType === "COORDINACION"
                                                                    ? "bg-ochre/10 text-ochre"
                                                                    : "bg-forest/5 text-forest"
                                                        )}
                                                    >
                                                        {s.sessionType}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(s.startsAt).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })} • {new Date(s.startsAt).toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="font-serif text-xl text-forest truncate">
                                                    {s.title}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleStart(s.id)}
                                                    className="px-3 py-2 rounded-xl bg-forest text-white text-[10px] font-bold tracking-wider shadow-sm hover:bg-[#15322b] active:scale-95 transition"
                                                >
                                                    Iniciar
                                                </button>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(s.id)}
                                                        className="p-2 rounded-xl bg-forest/5 text-forest hover:bg-forest/10 active:scale-95"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(s.id, s.title)}
                                                        className="p-2 rounded-xl bg-red/10 text-red hover:bg-red/15 active:scale-95"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingSessions.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 italic">
                                        No hay sesiones próximas.
                                    </p>
                                )}
                            </div>

                            {pastSessions.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between pt-2">
                                        <h2 className="font-serif text-xl text-charcoal">Sesiones pasadas</h2>
                                    </div>

                                    <div className="space-y-3">
                                        {pastSessions.map((s) => (
                                            <div
                                                key={s.id}
                                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 opacity-90"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span
                                                                className={cn(
                                                                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                                                                    s.sessionType === "LECTURA"
                                                                        ? "bg-sage/10 text-sage"
                                                                        : s.sessionType === "COORDINACION"
                                                                            ? "bg-ochre/10 text-ochre"
                                                                            : "bg-forest/5 text-forest"
                                                                )}
                                                            >
                                                                {s.sessionType}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {new Date(s.startsAt).toLocaleDateString(undefined, {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}{" "}
                                                                •{" "}
                                                                {new Date(s.startsAt).toLocaleTimeString(undefined, {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="font-serif text-xl text-forest truncate">
                                                            {s.title}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => router.push(`/manage/sessions/${s.id}`)}
                                                            className="px-3 py-2 rounded-xl bg-forest text-white text-[10px] font-bold tracking-wider shadow-sm hover:bg-[#15322b] active:scale-95 transition"
                                                        >
                                                            Ver
                                                        </button>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(s.id)}
                                                                className="p-2 rounded-xl bg-forest/5 text-forest hover:bg-forest/10 active:scale-95"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(s.id, s.title)}
                                                                className="p-2 rounded-xl bg-red/10 text-red hover:bg-red/15 active:scale-95"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-cream min-h-[50vh]">
                        {liveSession ? (
                            <Card className="p-8 w-full">
                                <PlayCircle size={48} className="text-sage mx-auto mb-4" />
                                <h2 className="font-serif text-2xl text-forest">{liveSession.title || "Sesión activa"}</h2>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    {new Date(liveSession.startsAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                    })}{" "}
                                    •{" "}
                                    {new Date(liveSession.startsAt).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                                <Button onClick={openLiveSession} className="w-full mt-6">
                                    Abrir sesión en vivo
                                </Button>
                            </Card>
                        ) : (
                            <Card className="p-8 w-full">
                                <PlayCircle size={48} className="text-forest/10 mx-auto mb-4" />
                                <h2 className="font-serif text-2xl text-forest">No hay sesión en vivo</h2>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    Inicia una sesión desde Planificación para mostrar el QR y gestionar asistencia.
                                </p>
                                <Button onClick={() => setActiveTab("planning")} variant="secondary" className="w-full mt-6">
                                    Ir a Planificación
                                </Button>
                            </Card>
                        )}
                    </div>
                )}
            </main>

            <div className="w-full px-6 pb-6 pt-4 bg-forest border-t border-forest/30 flex justify-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <button
                    className="w-full max-w-md h-14 text-white font-serif text-2xl flex items-center justify-center gap-3"
                    onClick={handleCreate}
                >
                    <Plus size={18} />
                    Anadir sesion
                </button>
            </div>
        </div>
    );
}
