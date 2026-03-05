"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { appContextApi } from "@/lib/api/appContextApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { sessionsApi } from "@/lib/api/sessionsApi";
import { attendanceApi, AttendanceStatus } from "@/lib/api/attendanceApi";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays, Check, Clock3, MapPin, Search, UserRoundX, Users, X, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ManualAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const sessionId = params.id as string;
    const [searchQuery, setSearchQuery] = useState("");

    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: memberships } = useQuery({
        queryKey: ["memberships", context?.defaultClubId],
        queryFn: () => clubsApi.getMemberships(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    const { data: attendance } = useQuery({
        queryKey: ["attendance", sessionId],
        queryFn: () => attendanceApi.getSessionAttendance(sessionId),
    });

    const { data: session } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.getSession(sessionId),
    });

    const markMutation = useMutation({
        mutationFn: (records: { membershipId: string; status: AttendanceStatus; minutesLate?: number }[]) =>
            attendanceApi.bulkMark(sessionId, records),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", sessionId] });
            toast.success("Asistencia actualizada");
        },
        onError: (error: any) => toast.error(error.message || "No se pudo actualizar la asistencia"),
    });

    const filteredMembers = useMemo(() => {
        if (!memberships) return [];
        return memberships.filter(m =>
            m.role !== 'admin' // Optionally hide admins from manual check-in
        ).filter(m =>
            m.status === 'ACTIVE'
        ).filter(m =>
            // Note: Real name searching would need Person details which are not in current memberships expansion
            // For MVP, if backend doesn't return person objects, we might search by ID or just list all.
            // Assuming backend might have expanded or we list all.
            (m.person?.fullName || m.id).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [memberships, searchQuery]);

    const activeMembers = useMemo(() => {
        if (!memberships) return [];
        return memberships
            .filter((m) => m.role !== "admin")
            .filter((m) => m.status === "ACTIVE");
    }, [memberships]);

    type UiStatus = "ON_TIME" | "LATE" | "ABSENT" | "EXCUSED";

    const getUiStatus = (record?: { status?: AttendanceStatus; minutesLate?: number }): UiStatus => {
        if (!record?.status) return "ABSENT";
        if (record.status === "EXCUSED") return "EXCUSED";
        if (record.status === "ABSENT") return "ABSENT";
        return record.minutesLate && record.minutesLate > 0 ? "LATE" : "ON_TIME";
    };

    const getStatusIcon = (status?: UiStatus) => {
        if (status === "ON_TIME") return <Check size={18} className="text-sage" />;
        if (status === "LATE") return <Clock3 size={18} className="text-ochre" />;
        if (status === "EXCUSED") return <Circle size={18} className="text-blue-400" />;
        return <Circle size={18} className="text-gray-300" />;
    };

    const getStatusLabel = (status?: UiStatus) => {
        if (status === "ON_TIME") return "Presente";
        if (status === "LATE") return "Tarde";
        if (status === "EXCUSED") return "Justificado";
        return "Ausente";
    };

    const groupedFilteredMembers = useMemo(() => {
        const registered: typeof filteredMembers = [];
        const pending: typeof filteredMembers = [];

        filteredMembers.forEach((member) => {
            const record = attendance?.find((a) => a.membershipId === member.id);
            const status = getUiStatus(record);
            if (status === "ON_TIME" || status === "LATE") {
                registered.push(member);
                return;
            }
            pending.push(member);
        });

        return { registered, pending };
    }, [filteredMembers, attendance]);

    const summary = useMemo(() => {
        const total = activeMembers.length;
        let onTime = 0;
        let late = 0;
        let excused = 0;

        activeMembers.forEach((member) => {
            const record = attendance?.find((a) => a.membershipId === member.id);
            const status = getUiStatus(record);
            if (status === "ON_TIME") onTime += 1;
            else if (status === "LATE") late += 1;
            else if (status === "EXCUSED") excused += 1;
        });

        const registered = onTime + late;
        const pending = Math.max(0, total - registered);
        return { total, onTime, late, excused, registered, pending };
    }, [activeMembers, attendance]);

    const setAttendanceStatus = (membershipId: string, status: UiStatus) => {
        let next: { status: AttendanceStatus; minutesLate?: number };
        if (status === "ON_TIME") next = { status: "PRESENT", minutesLate: 0 };
        else if (status === "LATE") next = { status: "PRESENT", minutesLate: 10 };
        else if (status === "EXCUSED") next = { status: "EXCUSED", minutesLate: 0 };
        else next = { status: "ABSENT", minutesLate: 0 };
        markMutation.mutate([{ membershipId, ...next }]);
    };

    const markPendingAsAbsent = () => {
        const marks = groupedFilteredMembers.pending.map((m) => ({
            membershipId: m.id,
            status: "ABSENT" as AttendanceStatus,
            minutesLate: 0,
        }));
        if (!marks.length) return;
        markMutation.mutate(marks);
    };

    const statusActions = (membershipId: string, current?: { status?: AttendanceStatus; minutesLate?: number }) => {
        const uiStatus = getUiStatus(current);
        return (
            <div className="flex items-center gap-1 p-1 rounded-full border border-gray-100 bg-cream">
                <button
                    onClick={() => setAttendanceStatus(membershipId, "ON_TIME")}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition",
                        uiStatus === "ON_TIME" ? "bg-forest text-white shadow-sm" : "text-gray-400 hover:bg-white"
                    )}
                    title="Marcar presente"
                >
                    <Check size={14} />
                </button>
                <button
                    onClick={() => setAttendanceStatus(membershipId, "LATE")}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition",
                        uiStatus === "LATE" ? "bg-ochre text-white shadow-sm" : "text-gray-400 hover:bg-white"
                    )}
                    title="Marcar tarde"
                >
                    <Clock3 size={14} />
                </button>
                <button
                    onClick={() => setAttendanceStatus(membershipId, "EXCUSED")}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition",
                        uiStatus === "EXCUSED" ? "bg-blue-500 text-white shadow-sm" : "text-gray-400 hover:bg-white"
                    )}
                    title="Marcar justificado"
                >
                    <CalendarDays size={14} />
                </button>
                <button
                    onClick={() => setAttendanceStatus(membershipId, "ABSENT")}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition",
                        uiStatus === "ABSENT" ? "bg-red text-white shadow-sm" : "text-gray-400 hover:bg-white"
                    )}
                    title="Marcar ausente"
                >
                    <X size={14} />
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-cream flex flex-col items-center animate-fade-in overflow-hidden">
            <main className="flex-1 w-full max-w-md flex flex-col p-6 overflow-hidden">
                <header className="pb-4 border-b border-gray-200/70">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-serif text-4xl text-forest leading-none">
                                {context?.defaultCycleName || "Ciclo"}
                            </h2>
                            <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
                                <MapPin size={13} />
                                {context?.defaultClubName || "El Librero de Amat"} ·{" "}
                                {session
                                    ? new Date(session.startsAt).toLocaleDateString("es-PE", { month: "short", day: "numeric" })
                                    : "hoy"}
                            </p>
                        </div>
                        <div className="text-forest font-serif text-4xl leading-none">
                            {summary.registered}
                            <span className="text-xl text-gray-400">/{summary.total}</span>
                        </div>
                    </div>
                </header>

                <div className="mb-6 relative">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar lector..."
                        className="pl-12 h-14 bg-white/50 backdrop-blur-sm border-forest/10"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                <div className="mb-4">
                    <div className="w-full h-2 bg-beige/60 rounded-full overflow-hidden border border-gray-100 flex">
                        <div
                            className="h-full bg-sage transition-all"
                            style={{ width: `${summary.total ? (summary.onTime / summary.total) * 100 : 0}%` }}
                        />
                        <div
                            className="h-full bg-ochre transition-all"
                            style={{ width: `${summary.total ? (summary.late / summary.total) * 100 : 0}%` }}
                        />
                        <div
                            className="h-full bg-blue-400 transition-all"
                            style={{ width: `${summary.total ? (summary.excused / summary.total) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-10 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                            Por marcar ({groupedFilteredMembers.pending.length})
                        </p>
                        <Badge className="text-[10px]">{summary.pending}</Badge>
                    </div>

                    {groupedFilteredMembers.pending.map((m) => {
                        const att = attendance?.find((a) => a.membershipId === m.id);
                        const status = getUiStatus(att);

                        return (
                            <div
                                key={m.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 animate-slide-up"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-beige/30 flex items-center justify-center font-bold text-forest text-xs opacity-60">
                                        {(m.person?.fullName || m.id).substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-charcoal truncate text-sm">
                                            {m.person?.fullName || `ID miembro: ${m.id.substring(0, 8)}`}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {getStatusIcon(status)}
                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                                                status === 'ON_TIME' ? "text-sage" : status === 'LATE' ? "text-ochre" : status === 'EXCUSED' ? "text-blue-500" : "text-gray-400"
                                            )}>
                                                {getStatusLabel(status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {statusActions(m.id, att)}
                            </div>
                        );
                    })}

                    <div className="flex items-center justify-between px-1 pt-1">
                        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                            Registrados ({groupedFilteredMembers.registered.length})
                        </p>
                        <Badge className="text-[10px]">{summary.registered}</Badge>
                    </div>

                    {groupedFilteredMembers.registered.map((m) => {
                        const att = attendance?.find((a) => a.membershipId === m.id);
                        const status = getUiStatus(att);

                        return (
                            <div
                                key={m.id}
                                className="bg-white rounded-2xl border border-sage/30 shadow-sm p-4 flex items-center justify-between gap-4 animate-slide-up"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-beige/30 flex items-center justify-center font-bold text-forest text-xs opacity-60">
                                        {(m.person?.fullName || m.id).substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-charcoal truncate text-sm">
                                            {m.person?.fullName || `ID miembro: ${m.id.substring(0, 8)}`}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {getStatusIcon(status)}
                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                                                status === 'ON_TIME' ? "text-sage" : status === 'LATE' ? "text-ochre" : status === 'EXCUSED' ? "text-blue-500" : "text-gray-400"
                                            )}>
                                                {getStatusLabel(status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {statusActions(m.id, att)}
                            </div>
                        );
                    })}

                    {filteredMembers.length === 0 && memberships && (
                        <div className="py-20 text-center opacity-40">
                            <Users size={48} className="mx-auto mb-4" />
                            <p className="italic font-serif">No se encontraron miembros</p>
                        </div>
                    )}
                </div>
            </main>

            <div className="w-full px-6 pb-6 pt-4 bg-forest border-t border-forest/30 flex justify-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <button
                    className="w-full max-w-sm h-14 text-white font-serif text-2xl flex items-center justify-center gap-3"
                    onClick={() => router.push(`/manage/sessions/${sessionId}`)}
                >
                    <ArrowLeft size={18} />
                    Volver a la sesión
                </button>
            </div>
        </div>
    );
}
