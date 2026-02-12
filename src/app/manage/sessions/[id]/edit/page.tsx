"use client";

import { useState } from "react";
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
        type: "LECTURA",
        startTime: "",
        description: "",
    });

    // Effect to populate form if editing
    useState(() => {
        if (existingSession) {
            setFormData({
                title: existingSession.title,
                type: existingSession.type,
                startTime: existingSession.startTime.split("T")[0] + "T" + existingSession.startTime.split("T")[1].substring(0, 5),
                description: existingSession.description,
            });
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateSessionDto) =>
            sessionsApi.createSession(context!.defaultClubId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast.success("Session created successfully");
            router.push("/manage");
        },
        onError: (error: any) => toast.error(error.message || "Failed to create session"),
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateSessionDto>) =>
            sessionsApi.updateSession(params.id as string, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            queryClient.invalidateQueries({ queryKey: ["session", params.id] });
            toast.success("Session updated successfully");
            router.push("/manage");
        },
        onError: (error: any) => toast.error(error.message || "Failed to update session"),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.startTime) {
            toast.error("Please fill in title and start time");
            return;
        }

        const data = {
            ...formData,
            startTime: new Date(formData.startTime!).toISOString(),
            cycleId: context?.defaultCycleId,
        } as CreateSessionDto;

        if (isEdit) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    if (isEdit && isLoadingSession) {
        return <div className="min-h-screen flex items-center justify-center bg-cream italic text-gray-400">Loading session...</div>;
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
                    <Badge className="mb-2">{isEdit ? "Update Details" : "New Session"}</Badge>
                    <h1 className="font-serif text-3xl text-forest">
                        {isEdit ? "Edit Session" : "Create Session"}
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal ml-1">Session Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as SessionType })}
                            className="w-full appearance-none bg-beige/30 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-forest transition outline-none"
                        >
                            <option value="LECTURA">Reading Session</option>
                            <option value="COORDINACION">Coordination / Admin</option>
                            <option value="EXTRAORDINARIA">Extraordinary Event</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal ml-1">Book Title / Topic</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. The Great Gatsby"
                            className="font-serif text-lg bg-beige/30"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Start Date & Time</label>
                            <div className="relative">
                                <Input
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="pl-12 bg-beige/30"
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal ml-1">Notes (Optional)</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Chapter details, location notes..."
                            className="w-full bg-beige/30 border border-transparent rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-forest transition resize-none outline-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] h-14"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {isEdit ? "Save Changes" : "Create Session"}
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
