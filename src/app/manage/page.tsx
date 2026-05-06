"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth";
import { appContextApi } from "@/lib/api/appContextApi";
import { sessionsApi, Session } from "@/lib/api/sessionsApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { cyclesApi } from "@/lib/api/cyclesApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Users,
    Book,
    Edit,
    Trash2,
    PlayCircle,
    UserPlus,
    CalendarRange,
    Menu,
    X,
    LibraryBig,
    Radio,
    LayoutDashboard,
    FolderKanban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

function formatCycleDate(value?: string | null) {
    if (!value) return "Fecha por confirmar";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Fecha por confirmar";
    return date.toLocaleDateString("es-PE", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function ManagerDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { membershipId, accessToken } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"planning" | "live" | "cycles">("planning");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

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

    const { data: cycles } = useQuery({
        queryKey: ["cycles", context?.defaultClubId],
        queryFn: () => cyclesApi.getClubCycles(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    const sortedCycles = useMemo(
        () =>
            [...(cycles || [])].sort(
                (a, b) => +new Date(b.startDate) - +new Date(a.startDate)
            ),
        [cycles]
    );

    useEffect(() => {
        if (!sortedCycles.length) return;

        setSelectedCycleId((current) => {
            if (current && sortedCycles.some((cycle) => cycle.id === current)) {
                return current;
            }

            return context?.defaultCycleId ?? sortedCycles[0].id;
        });
    }, [sortedCycles, context?.defaultCycleId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = new URLSearchParams(window.location.search);
        const initialTab = query.get("tab");
        const initialCycleId = query.get("cycleId");
        if (initialTab === "planning" || initialTab === "live" || initialTab === "cycles") {
            setActiveTab(initialTab);
        }
        if (initialCycleId) {
            setSelectedCycleId(initialCycleId);
        }
    }, []);

    const selectedCycle = useMemo(
        () => sortedCycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
        [sortedCycles, selectedCycleId]
    );

    const historicalCycles = useMemo(
        () => sortedCycles.filter((cycle) => cycle.id !== selectedCycleId),
        [sortedCycles, selectedCycleId]
    );

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

    const canOperateAttendance = memberRole === "admin" || memberRole === "MODERATOR";
    const canManageSessions = memberRole === "admin";

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

    const filteredSessions = useMemo(() => {
        if (!sessions) return [] as Session[];
        if (!selectedCycleId) return sessions;
        return sessions.filter((session) => session.cycleId === selectedCycleId);
    }, [sessions, selectedCycleId]);

    const selectedLiveSession = useMemo(() => {
        if (!liveSession) return null;
        if (!selectedCycleId) return liveSession;
        return liveSession.cycleId === selectedCycleId ? liveSession : null;
    }, [liveSession, selectedCycleId]);

    const { upcomingSessions, pastSessions } = useMemo(() => {
        if (!filteredSessions.length) {
            return { upcomingSessions: [] as Session[], pastSessions: [] as Session[] };
        }
        const now = Date.now();
        const liveSessionId = selectedLiveSession?.id ?? null;
        const ordered = [...filteredSessions].sort(
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
    }, [filteredSessions, selectedLiveSession?.id]);

    if (!canOperateAttendance && memberships) {
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
    const handleCreateCycle = () => router.push("/manage/cycles/new");
    const handleAddMember = () => router.push("/manage/members/new");
    const handleEdit = (id: string) => router.push(`/manage/sessions/${id}/edit`);
    const navigateFromMenu = (href: string) => {
        setIsMobileMenuOpen(false);
        router.push(href);
    };
    const selectTabFromMenu = (tab: "planning" | "live" | "cycles") => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };
    const selectCycle = (cycleId: string) => {
        setSelectedCycleId(cycleId);
        setActiveTab("cycles");
        setIsMobileMenuOpen(false);
    };
    const openLiveSession = () => {
        if (!selectedLiveSession?.id) {
            toast.error("No se encontró una sesión en vivo válida");
            queryClient.invalidateQueries({ queryKey: ["liveSession", context?.defaultClubId] });
            return;
        }
        router.push(`/manage/sessions/${selectedLiveSession.id}`);
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

    const handleDelete = (id: string, title?: string | null) => {
        const label = title?.trim() || "esta sesión";
        const confirmDelete = window.confirm(`¿Seguro que deseas eliminar ${label}?`);
        if (!confirmDelete) return;
        deleteSessionMutation.mutate(id);
    };

    const handleEditCycle = (cycleId: string) => router.push(`/manage/cycles/${cycleId}/edit`);

    const openReaderCycle = (cycleId: string) =>
        router.push(`/m/cycles/${cycleId}?fromManage=1&manageTab=cycles&manageCycleId=${cycleId}`);

    const deleteCycleMutation = useMutation({
        mutationFn: (cycleId: string) => cyclesApi.deleteCycle(context!.defaultClubId, cycleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appContext"] });
            queryClient.invalidateQueries({ queryKey: ["cycles", context?.defaultClubId] });
            queryClient.invalidateQueries({ queryKey: ["sessions", context?.defaultClubId] });
            queryClient.invalidateQueries({ queryKey: ["liveSession", context?.defaultClubId] });
            toast.success("Ciclo eliminado correctamente");
        },
        onError: (error: any) => {
            toast.error(error?.message || "No se pudo eliminar el ciclo");
        },
    });

    const handleDeleteCycle = (cycleId: string, cycleName?: string | null) => {
        const label = cycleName?.trim() || "este ciclo";
        const confirmDelete = window.confirm(
            `¿Seguro que deseas eliminar ${label}? Se quitarán sus sesiones, membresías y datos relacionados de este ciclo.`
        );
        if (!confirmDelete) return;
        deleteCycleMutation.mutate(cycleId);
    };

    return (
        <div className="min-h-screen h-dvh flex flex-col bg-cream animate-fade-in relative overflow-hidden">
            {isMobileMenuOpen ? (
                <div className="fixed inset-0 z-50 sm:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menu"
                        className="absolute inset-0 bg-charcoal/35 backdrop-blur-[2px]"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    <div className="absolute inset-y-0 right-0 flex w-[min(88vw,340px)] flex-col border-l border-forest/10 bg-white px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/42">
                                    Gestion del club
                                </p>
                                <p className="mt-2 font-serif text-3xl text-forest">Gestion</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Cerrar menu"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-forest/10 bg-[#f7f2e8] text-forest transition hover:bg-beige"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6 rounded-[1.8rem] border border-forest/8 bg-[#f7f2e8] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/42">
                                Ciclo seleccionado
                            </p>
                            <p className="mt-2 font-serif text-2xl leading-tight text-forest">
                                {selectedCycle?.name || context?.defaultCycleName || "Sin ciclo activo"}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                                {selectedCycle
                                    ? `Revisa sesiones y movimientos del ciclo ${selectedCycle.isActive ? "activo" : "anterior"} desde esta misma vista.`
                                    : "Accesos rapidos para moverte por gestion y la vista del lector sin perderte en celular."}
                            </p>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={() => selectTabFromMenu("planning")}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-3 text-left transition",
                                    activeTab === "planning"
                                        ? "border-forest/10 bg-forest text-white"
                                        : "border-forest/8 bg-white text-charcoal hover:border-forest/15 hover:bg-[#f7f2e8]"
                                )}
                            >
                                <span className="inline-flex items-center gap-3 font-medium">
                                    <LayoutDashboard size={17} />
                                    Planificacion
                                </span>
                                <span className="text-xs uppercase tracking-[0.18em] opacity-70">Vista</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => selectTabFromMenu("live")}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-3 text-left transition",
                                    activeTab === "live"
                                        ? "border-forest/10 bg-forest text-white"
                                        : "border-forest/8 bg-white text-charcoal hover:border-forest/15 hover:bg-[#f7f2e8]"
                                )}
                            >
                                <span className="inline-flex items-center gap-3 font-medium">
                                    <Radio size={17} />
                                    En vivo
                                </span>
                                <span className="text-xs uppercase tracking-[0.18em] opacity-70">Vista</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => selectTabFromMenu("cycles")}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-3 text-left transition",
                                    activeTab === "cycles"
                                        ? "border-forest/10 bg-forest text-white"
                                        : "border-forest/8 bg-white text-charcoal hover:border-forest/15 hover:bg-[#f7f2e8]"
                                )}
                            >
                                <span className="inline-flex items-center gap-3 font-medium">
                                    <FolderKanban size={17} />
                                    Ciclos
                                </span>
                                <span className="text-xs uppercase tracking-[0.18em] opacity-70">Gestion</span>
                            </button>
                        </div>

                        <div className="mt-6 space-y-3">
                            {canManageSessions ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => navigateFromMenu("/manage/sessions/new")}
                                        className="flex w-full items-center justify-between rounded-[1.4rem] border border-forest/8 bg-white px-4 py-3 text-left text-charcoal transition hover:border-forest/15 hover:bg-[#f7f2e8]"
                                    >
                                        <span className="inline-flex items-center gap-3 font-medium">
                                            <Plus size={17} />
                                            Nueva sesion
                                        </span>
                                        <span className="text-xs uppercase tracking-[0.18em] text-charcoal/45">Crear</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigateFromMenu("/manage/cycles/new")}
                                        className="flex w-full items-center justify-between rounded-[1.4rem] border border-forest/8 bg-white px-4 py-3 text-left text-charcoal transition hover:border-forest/15 hover:bg-[#f7f2e8]"
                                    >
                                        <span className="inline-flex items-center gap-3 font-medium">
                                            <CalendarRange size={17} />
                                            Nuevo ciclo
                                        </span>
                                        <span className="text-xs uppercase tracking-[0.18em] text-charcoal/45">Crear</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigateFromMenu("/manage/members/new")}
                                        className="flex w-full items-center justify-between rounded-[1.4rem] border border-forest/8 bg-white px-4 py-3 text-left text-charcoal transition hover:border-forest/15 hover:bg-[#f7f2e8]"
                                    >
                                        <span className="inline-flex items-center gap-3 font-medium">
                                            <UserPlus size={17} />
                                            Agregar miembro
                                        </span>
                                        <span className="text-xs uppercase tracking-[0.18em] text-charcoal/45">Alta</span>
                                    </button>
                                </>
                            ) : null}

                            {selectedLiveSession?.id ? (
                                <button
                                    type="button"
                                    onClick={() => navigateFromMenu(`/manage/sessions/${selectedLiveSession.id}`)}
                                    className="flex w-full items-center justify-between rounded-[1.4rem] border border-sage/20 bg-[#edf7ef] px-4 py-3 text-left text-charcoal transition hover:border-sage/30"
                                >
                                        <span className="inline-flex items-center gap-3 font-medium text-forest">
                                            <PlayCircle size={17} />
                                            Abrir sesion en vivo
                                        </span>
                                        <span className="text-xs uppercase tracking-[0.18em] text-sage">Ahora</span>
                                    </button>
                            ) : null}
                        </div>

                        {historicalCycles.length ? (
                            <div className="mt-6">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/42">
                                    Ir a un ciclo
                                </p>
                                <div className="mt-3 space-y-3">
                                    {sortedCycles.map((cycle) => (
                                        <button
                                            key={cycle.id}
                                            type="button"
                                            onClick={() => selectCycle(cycle.id)}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-3 text-left transition",
                                                selectedCycleId === cycle.id
                                                    ? "border-forest/10 bg-forest text-white"
                                                    : "border-forest/8 bg-white text-charcoal hover:border-forest/15 hover:bg-[#f7f2e8]"
                                            )}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{cycle.name}</span>
                                                <span className={cn(
                                                    "mt-1 block text-xs uppercase tracking-[0.16em]",
                                                    selectedCycleId === cycle.id ? "text-white/70" : "text-charcoal/45"
                                                )}>
                                                    {cycle.isActive ? "Activo" : "Anterior"}
                                                </span>
                                            </span>
                                            <span className={cn(
                                                "text-xs uppercase tracking-[0.18em]",
                                                selectedCycleId === cycle.id ? "text-white/70" : "text-charcoal/45"
                                            )}>
                                                Ver
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-auto space-y-3 pt-6">
                            <button
                                type="button"
                                onClick={() => navigateFromMenu("/m")}
                                className="flex w-full items-center justify-between rounded-[1.4rem] border border-forest/8 bg-white px-4 py-3 text-left text-charcoal transition hover:border-forest/15 hover:bg-[#f7f2e8]"
                            >
                                <span className="inline-flex items-center gap-3 font-medium">
                                    <LibraryBig size={17} />
                                    Vista del lector
                                </span>
                                <span className="text-xs uppercase tracking-[0.18em] text-charcoal/45">Abrir</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Header & Tabs */}
            <div className="sticky top-0 z-40 bg-cream/70 backdrop-blur border-b border-gray-200/60">
                <div className="max-w-md mx-auto px-6 sm:px-8 py-3">
                    <div className="mb-3 flex items-center justify-between sm:hidden">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/42">
                                Panel del club
                            </p>
                            <p className="mt-1 font-serif text-3xl text-forest">Gestion</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Abrir menu"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-forest/10 bg-white text-forest shadow-sm transition hover:border-forest/20 hover:bg-[#f7f2e8]"
                        >
                            <Menu size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
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
                        <button
                            onClick={() => setActiveTab("cycles")}
                            className={cn(
                                "flex-1 py-2 rounded-2xl text-sm font-bold tracking-wide transition",
                                activeTab === "cycles"
                                    ? "bg-white border border-beige shadow-sm text-forest"
                                    : "bg-transparent text-gray-500 hover:bg-white/50"
                            )}
                        >
                            Ciclos
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto w-full flex-1 overflow-y-auto px-6 sm:px-8 py-6 pb-6">
                {activeTab === "planning" ? (
                    <div className="space-y-6">
                        <header>
                            <Badge className="mb-2">
                                Ciclo seleccionado: {selectedCycle?.name || context?.defaultCycleName || "Cargando..."}
                            </Badge>
                            <h1 className="font-serif text-3xl text-forest">Gestión del club</h1>
                        </header>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ciclos</p>
                                <p className="font-serif text-xl text-forest">
                                    {selectedCycle?.name || context?.defaultCycleName || "Crear nuevo ciclo"}
                                </p>
                                {selectedCycle ? (
                                    <p className="mt-2 text-sm text-gray-500">
                                        {selectedCycle.isActive ? "Ciclo activo" : "Ciclo anterior"} • {formatCycleDate(selectedCycle.startDate)}
                                    </p>
                                ) : null}
                            </div>
                            {canManageSessions ? (
                                <Button onClick={handleCreateCycle} variant="secondary" className="h-11 px-4">
                                    <CalendarRange size={16} />
                                    <span>Nuevo</span>
                                </Button>
                            ) : (
                                <Badge variant="secondary" className="border-0 bg-[#f4efe5] text-charcoal">
                                    {selectedCycle?.isActive ? "Activo" : "Anterior"}
                                </Badge>
                            )}
                        </div>

                        {sortedCycles.length ? (
                            <Card className="rounded-[2rem] border border-forest/8 bg-white/88 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                            Gestion de ciclos
                                        </p>
                                        <p className="mt-2 font-serif text-2xl text-charcoal">Ahora vive en su propia pestaña</p>
                                        <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                                            Desde allí puedes revisar ciclos anteriores, corregir errores y abrir cada ciclo en la vista del lector.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-11 shrink-0 rounded-full px-4"
                                        onClick={() => setActiveTab("cycles")}
                                    >
                                        Abrir ciclos
                                    </Button>
                                </div>
                            </Card>
                        ) : null}

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
                                    {filteredSessions.length || "—"}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Del ciclo
                                </span>
                            </Card>
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <span className="text-lg font-bold text-forest leading-none">
                                    {cycles?.length || "—"}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Ciclos
                                </span>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            {canManageSessions && (
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
                            )}

                            {selectedLiveSession && (
                                <div className="bg-white rounded-2xl border border-sage/30 shadow-sm p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-sage uppercase tracking-wider">Sesión en vivo</p>
                                        <p className="font-serif text-xl text-forest truncate">{selectedLiveSession.title || "Sesión activa"}</p>
                                    </div>
                                    <Button onClick={openLiveSession} className="h-11 px-4">
                                        Abrir
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <h2 className="font-serif text-xl text-charcoal">
                                    Próximas sesiones
                                    {selectedCycle ? ` · ${selectedCycle.name}` : ""}
                                </h2>
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
                                                {canManageSessions ? (
                                                    <>
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
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/manage/sessions/${s.id}`)}
                                                        className="px-3 py-2 rounded-xl bg-forest text-white text-[10px] font-bold tracking-wider shadow-sm hover:bg-[#15322b] active:scale-95 transition"
                                                    >
                                                        Ver
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingSessions.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 italic">
                                        {selectedCycle
                                            ? "No hay sesiones próximas para este ciclo."
                                            : "No hay sesiones próximas."}
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
                                                        {canManageSessions && (
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
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : activeTab === "cycles" ? (
                    <div className="space-y-6">
                        <header>
                            <Badge className="mb-2">
                                Gestion de ciclos: {selectedCycle?.name || context?.defaultCycleName || "Cargando..."}
                            </Badge>
                            <h1 className="font-serif text-3xl text-forest">Ciclos del club</h1>
                            <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                                Revisa el ciclo activo, corrige datos de ciclos anteriores y abre su vista del lector sin mezclar permisos.
                            </p>
                        </header>

                        <Card className="rounded-[2.2rem] border border-forest/8 bg-white/88 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-charcoal/45">
                                        Ciclo seleccionado
                                    </p>
                                    <p className="mt-2 truncate font-serif text-3xl text-charcoal">
                                        {selectedCycle?.name || "Selecciona un ciclo"}
                                    </p>
                                    {selectedCycle ? (
                                        <p className="mt-2 text-sm text-charcoal/60">
                                            {selectedCycle.isActive ? "Activo" : "Anterior"} • {formatCycleDate(selectedCycle.startDate)}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    {canManageSessions ? (
                                        <Button onClick={handleCreateCycle} variant="secondary" className="h-11 px-4">
                                            <CalendarRange size={16} />
                                            <span>Nuevo</span>
                                        </Button>
                                    ) : null}
                                    {selectedCycle ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="h-11 px-4"
                                            onClick={() => openReaderCycle(selectedCycle.id)}
                                        >
                                            <LibraryBig size={16} />
                                            <span>Lector</span>
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-3 gap-3">
                            <Card className="rounded-2xl p-3 text-center">
                                <span className="text-lg font-bold text-forest leading-none">
                                    {cycles?.length || "—"}
                                </span>
                                <span className="mt-1 text-[10px] font-bold uppercase text-gray-400">
                                    Ciclos
                                </span>
                            </Card>
                            <Card className="rounded-2xl p-3 text-center">
                                <span className="text-lg font-bold text-forest leading-none">
                                    {historicalCycles.length || 0}
                                </span>
                                <span className="mt-1 text-[10px] font-bold uppercase text-gray-400">
                                    Anteriores
                                </span>
                            </Card>
                            <Card className="rounded-2xl p-3 text-center">
                                <span className="text-lg font-bold text-forest leading-none">
                                    {selectedCycle ? filteredSessions.length : "—"}
                                </span>
                                <span className="mt-1 text-[10px] font-bold uppercase text-gray-400">
                                    Sesiones
                                </span>
                            </Card>
                        </div>

                        <div className="space-y-3">
                            {sortedCycles.map((cycle) => (
                                <Card
                                    key={cycle.id}
                                    className={cn(
                                        "rounded-[2rem] border p-5 transition",
                                        selectedCycleId === cycle.id
                                            ? "border-forest/16 bg-[#f7f2e8]"
                                            : "border-forest/8 bg-white/88"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary" className="border-0 bg-white text-charcoal">
                                                    {cycle.isActive ? "Activo" : "Anterior"}
                                                </Badge>
                                                <span className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
                                                    {formatCycleDate(cycle.startDate)}
                                                </span>
                                            </div>
                                            <p className="mt-3 truncate font-serif text-3xl text-charcoal">{cycle.name}</p>
                                            <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
                                                {cycle.summary || cycle.theme || "Sin descripción todavía. Puedes entrar a editarlo para completar sus datos."}
                                            </p>
                                            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-charcoal/42">
                                                {cycle.plannedReadingSessions} lecturas • {cycle.plannedCoordinationSessions} coordinaciones
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant={selectedCycleId === cycle.id ? "default" : "secondary"}
                                            className="h-11 shrink-0 rounded-full px-4"
                                            onClick={() => setSelectedCycleId(cycle.id)}
                                        >
                                            Ver
                                        </Button>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="h-11 rounded-full px-4"
                                            onClick={() => openReaderCycle(cycle.id)}
                                        >
                                            <LibraryBig size={16} />
                                            <span>Ver lector</span>
                                        </Button>

                                        {canManageSessions ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-11 rounded-full px-4"
                                                    onClick={() => handleEditCycle(cycle.id)}
                                                >
                                                    <Edit size={16} />
                                                    <span>Editar</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-11 rounded-full px-4 text-red hover:bg-red/10 hover:text-red"
                                                    onClick={() => handleDeleteCycle(cycle.id, cycle.name)}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Eliminar</span>
                                                </Button>
                                            </>
                                        ) : null}
                                    </div>
                                </Card>
                            ))}

                            {!sortedCycles.length ? (
                                <Card className="rounded-[2rem] border border-dashed border-forest/15 bg-white/70 p-6 text-center text-sm text-charcoal/60">
                                    Todavía no hay ciclos creados para este club.
                                </Card>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-cream min-h-[50vh]">
                        {selectedLiveSession ? (
                            <Card className="p-8 w-full">
                                <PlayCircle size={48} className="text-sage mx-auto mb-4" />
                                <h2 className="font-serif text-2xl text-forest">{selectedLiveSession?.title || "Sesión activa"}</h2>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    {new Date(selectedLiveSession?.startsAt || "").toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                    })}{" "}
                                    •{" "}
                                    {new Date(selectedLiveSession?.startsAt || "").toLocaleTimeString(undefined, {
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

            {canManageSessions && (
                <div className="w-full px-6 pb-6 pt-4 bg-forest border-t border-forest/30 flex justify-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                    <button
                        className="w-full max-w-md h-14 text-white font-serif text-2xl flex items-center justify-center gap-3"
                        onClick={handleCreate}
                    >
                        <Plus size={18} />
                        Anadir sesion
                    </button>
                </div>
            )}
        </div>
    );
}
