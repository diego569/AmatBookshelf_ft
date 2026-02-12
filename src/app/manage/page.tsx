"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth";
import { appContextApi } from "@/lib/api/appContextApi";
import { sessionsApi, Session } from "@/lib/api/sessionsApi";
import { clubsApi, Membership } from "@/lib/api/clubsApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Book, Edit, Trash2, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ManagerDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { currentPerson, membershipId } = useAuthStore();
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

    const memberRole = useMemo(() => {
        if (!memberships || !currentPerson) return null;
        // Note: currentPerson might not have an ID that matches membership personId directly if not synced, 
        // but usually the backend returns memberships for the current user's club.
        // In this MVP, we'll look for the membership that matches the cached membershipId if available.
        return memberships.find(m => m.id === membershipId)?.role;
    }, [memberships, currentPerson, membershipId]);

    const isAdmin = memberRole === "admin" || memberRole === "MODERATOR";

    // Fetch Sessions
    const { data: sessions } = useQuery({
        queryKey: ["sessions", context?.defaultClubId],
        queryFn: () => sessionsApi.getSessions(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    if (!isAdmin && memberships) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-center bg-cream">
                <Card className="p-8 max-w-sm">
                    <h2 className="text-2xl text-forest mb-4">Access Restricted</h2>
                    <p className="text-gray-500 mb-6">Only admins and moderators can access the management dashboard.</p>
                    <Button onClick={() => router.push("/m")} className="w-full">
                        Back to Member Area
                    </Button>
                </Card>
            </div>
        );
    }

    const handleCreate = () => router.push("/manage/sessions/new");
    const handleEdit = (id: string) => router.push(`/manage/sessions/${id}/edit`);
    const handleStart = (id: string) => router.push(`/manage/sessions/${id}`);

    return (
        <div className="min-h-screen flex flex-col bg-cream animate-fade-in relative overflow-hidden">
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
                        Planning
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
                        Live
                    </button>
                </div>
            </div>

            <main className="max-w-md mx-auto w-full flex-1 overflow-y-auto px-6 sm:px-8 py-6 pb-28">
                {activeTab === "planning" ? (
                    <div className="space-y-6">
                        <header>
                            <Badge className="mb-2">Current Cycle: {context?.defaultCycleName || "Loading..."}</Badge>
                            <h1 className="font-serif text-3xl text-forest">Club Management</h1>
                        </header>

                        <div className="grid grid-cols-3 gap-3">
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <Users className="text-ochre mb-1" size={18} />
                                <span className="text-lg font-bold text-forest leading-none">
                                    {memberships?.length || "—"}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Members
                                </span>
                            </Card>
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <Book className="text-sage mb-1" size={18} />
                                <span className="text-lg font-bold text-forest leading-none">
                                    {sessions?.length || "—"}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Sessions
                                </span>
                            </Card>
                            <Card className="p-3 rounded-2xl flex flex-col items-center text-center">
                                <span className="text-lg font-bold text-forest leading-none">
                                    15m
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                    Late Rule
                                </span>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-serif text-xl text-charcoal">Upcoming Sessions</h2>
                            </div>

                            <div className="space-y-3">
                                {sessions?.map((s) => (
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
                                                    Start
                                                </button>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(s.id)}
                                                        className="p-2 rounded-xl bg-forest/5 text-forest hover:bg-forest/10 active:scale-95"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
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
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-cream min-h-[50vh]">
                        <Card className="p-8 w-full">
                            <PlayCircle size={48} className="text-forest/10 mx-auto mb-4" />
                            <h2 className="font-serif text-2xl text-forest">No live session</h2>
                            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                Start a session from the Planning tab to display QR codes and manage attendance.
                            </p>
                            <Button onClick={() => setActiveTab("planning")} variant="secondary" className="w-full mt-6">
                                Go to Planning
                            </Button>
                        </Card>
                    </div>
                )}
            </main>

            {/* Floating action button (mobile) */}
            <div className="fixed bottom-7 left-0 right-0 px-6 sm:px-8 z-30 flex justify-center">
                <div className="w-full max-w-md">
                    <Button onClick={handleCreate} size="lg" className="w-full h-16 shadow-float">
                        <Plus className="text-beige" />
                        <span>Create Session</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
