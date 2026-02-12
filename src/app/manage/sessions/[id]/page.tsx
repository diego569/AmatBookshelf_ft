"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api/sessionsApi";
import { attendanceApi } from "@/lib/api/attendanceApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, ListCheck, Users, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SessionLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const { data: session } = useQuery({
        queryKey: ["session", sessionId],
        queryFn: () => sessionsApi.getSession(sessionId),
    });

    const { data: attendance } = useQuery({
        queryKey: ["attendance", sessionId],
        queryFn: () => attendanceApi.getSessionAttendance(sessionId),
        refetchInterval: 5000,
    });

    const stats = {
        present: attendance?.filter((a) => a.status === "ON_TIME").length || 0,
        late: attendance?.filter((a) => a.status === "LATE").length || 0,
        total: attendance?.length || 0,
    };

    if (!session) return <div className="p-8 text-center text-gray-500 italic">Loading session...</div>;

    return (
        <div className="min-h-screen flex flex-col p-6 sm:p-8 bg-cream animate-fade-in">
            <div className="mb-7 pt-3 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-forest uppercase tracking-widest">Live Session</span>
                    </div>
                    <h1 className="font-serif text-3xl text-forest leading-tight font-bold">{session.title}</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {new Date(session.startsAt).toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                        })}
                        {" • "}
                        {new Date(session.startsAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
                <button
                    onClick={() => router.push("/manage")}
                    className="p-2 rounded-full bg-white shadow-soft transition-colors hover:bg-forest/5"
                >
                    <ChevronLeft size={24} className="text-forest" />
                </button>
            </div>

            <Card className="p-6 mb-7 flex items-center justify-between border-forest/10 overflow-hidden relative">
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Attendance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="font-serif text-5xl text-forest font-bold">{stats.present + stats.late}</span>
                        <span className="text-gray-400 font-medium">Recorded</span>
                    </div>
                    <div className="mt-3 flex gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-sage/10 text-sage font-bold">{stats.present} present</span>
                        <span className="px-2 py-1 rounded-full bg-ochre/10 text-ochre font-bold">{stats.late} late</span>
                    </div>
                </div>
                <div className="w-16 h-16 bg-beige/30 rounded-full flex items-center justify-center text-forest relative z-10">
                    <Users size={32} />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-forest/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            </Card>

            <div className="grid grid-cols-1 gap-4 mb-7">
                <Button onClick={() => router.push(`/manage/sessions/${sessionId}/qr`)} className="h-20 shadow-float">
                    <QrCode size={26} />
                    <span className="font-serif text-xl">Display QR Code</span>
                </Button>
                <Button variant="secondary" onClick={() => router.push(`/manage/sessions/${sessionId}/manual`)} className="h-16">
                    <ListCheck size={22} />
                    <span>Manual Attendance</span>
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <h3 className="text-charcoal font-serif text-lg mb-3 border-b border-gray-100 pb-2">Recent Scan Events</h3>
                <div className="space-y-3 overflow-y-auto no-scrollbar pb-20">
                    {attendance?.filter(a => a.status !== 'ABSENT').sort((a, b) => (b.checkInAt || '').localeCompare(a.checkInAt || '')).map((a) => (
                        <div key={a.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-slide-up">
                            <div className="w-10 h-10 rounded-full bg-forest/5 flex items-center justify-center font-bold text-forest text-xs">
                                {a.status === 'ON_TIME' ? 'OT' : 'LT'}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-charcoal">
                                    Attendance recorded as <span className={cn("font-bold", a.status === 'ON_TIME' ? "text-sage" : "text-ochre")}>{a.status.replace('_', ' ')}</span>
                                </p>
                                <p className={cn("text-xs font-bold", a.status === 'ON_TIME' ? "text-sage" : "text-ochre")}>
                                    {a.pointsAwarded ? `+${a.pointsAwarded} Points` : "— Points"}
                                </p>
                            </div>
                            <span className="text-xs text-gray-400">
                                {a.checkInAt ? new Date(a.checkInAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                        </div>
                    ))}
                    {(!attendance || attendance.filter(a => a.status !== 'ABSENT').length === 0) && (
                        <p className="text-center py-10 text-gray-400 italic">No scans recorded yet.</p>
                    )}
                </div>
            </div>

            <button onClick={() => router.push("/manage")} className="mt-auto w-full py-4 text-red-700 font-medium text-sm hover:underline hover:text-red-800 transition-colors pt-10">
                End Current Session
            </button>
        </div>
    );
}
