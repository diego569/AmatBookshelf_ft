"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { appContextApi } from "@/lib/api/appContextApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { attendanceApi, AttendanceStatus } from "@/lib/api/attendanceApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, CheckCircle, Clock, Circle, Users } from "lucide-react";
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

    const markMutation = useMutation({
        mutationFn: (records: { membershipId: string; status: AttendanceStatus }[]) =>
            attendanceApi.bulkMark(sessionId, records),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", sessionId] });
            toast.success("Attendance updated");
        },
        onError: (error: any) => toast.error(error.message || "Failed to update attendance"),
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

    const handleToggle = (membershipId: string, currentStatus: AttendanceStatus) => {
        let nextStatus: AttendanceStatus = "ON_TIME";
        if (currentStatus === "ON_TIME") nextStatus = "LATE";
        else if (currentStatus === "LATE") nextStatus = "ABSENT";
        else nextStatus = "ON_TIME";

        markMutation.mutate([{ membershipId, status: nextStatus }]);
    };

    const getStatusIcon = (status?: AttendanceStatus) => {
        if (status === "ON_TIME") return <CheckCircle size={18} className="text-sage" />;
        if (status === "LATE") return <Clock size={18} className="text-ochre" />;
        return <Circle size={18} className="text-gray-300" />;
    };

    const getStatusLabel = (status?: AttendanceStatus) => {
        if (status === "ON_TIME") return "Present";
        if (status === "LATE") return "Late";
        return "Absent";
    };

    return (
        <div className="fixed inset-0 z-50 bg-cream flex flex-col items-center animate-fade-in overflow-hidden">
            <div className="w-full px-6 py-6 border-b border-gray-200/60 flex justify-between items-center bg-white rounded-b-3xl shadow-sm z-20">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Session Tools</p>
                    <h2 className="font-serif text-2xl text-forest font-bold">Manual Attendance</h2>
                </div>
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-forest/5 rounded-full transition-colors"
                    aria-label="Close"
                >
                    <X className="text-gray-500" />
                </button>
            </div>

            <main className="flex-1 w-full max-w-md flex flex-col p-6 overflow-hidden">
                <div className="mb-6 relative">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search members..."
                        className="pl-12 h-14 bg-white/50 backdrop-blur-sm border-forest/10"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-10 space-y-3">
                    {filteredMembers.map((m) => {
                        const att = attendance?.find((a) => a.membershipId === m.id);
                        const status = att?.status || "ABSENT";

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
                                            {m.person?.fullName || `Member ID: ${m.id.substring(0, 8)}`}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {getStatusIcon(status)}
                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                                                status === 'ON_TIME' ? "text-sage" : status === 'LATE' ? "text-ochre" : "text-gray-400"
                                            )}>
                                                {getStatusLabel(status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0">
                                    <button
                                        onClick={() => handleToggle(m.id, status)}
                                        className="px-4 py-2 rounded-xl bg-forest/5 text-forest text-xs font-bold tracking-wider hover:bg-forest/10 active:scale-95 transition-all shadow-sm border border-forest/5"
                                    >
                                        Toggle
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredMembers.length === 0 && memberships && (
                        <div className="py-20 text-center opacity-40">
                            <Users size={48} className="mx-auto mb-4" />
                            <p className="italic font-serif">No members found</p>
                        </div>
                    )}
                </div>
            </main>

            <div className="w-full px-6 pb-10 pt-4 bg-white border-t border-gray-100 flex justify-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <Button
                    variant="secondary"
                    className="w-full max-w-sm h-14"
                    onClick={() => router.push(`/manage/sessions/${sessionId}`)}
                >
                    Done
                </Button>
            </div>
        </div>
    );
}
