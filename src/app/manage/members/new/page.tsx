"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appContextApi } from "@/lib/api/appContextApi";
import { peopleApi } from "@/lib/api/peopleApi";
import { membershipsApi } from "@/lib/api/membershipsApi";
import { clubsApi } from "@/lib/api/clubsApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

type MembershipRole = "MEMBER" | "MODERATOR";
type EnrollmentMode = "new" | "existing";

export default function AddMemberPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: context } = useQuery({
        queryKey: ["appContext"],
        queryFn: appContextApi.getContext,
    });

    const { data: people } = useQuery({
        queryKey: ["people"],
        queryFn: peopleApi.getPeople,
    });

    const { data: memberships } = useQuery({
        queryKey: ["memberships", context?.defaultClubId],
        queryFn: () => clubsApi.getMemberships(context!.defaultClubId),
        enabled: !!context?.defaultClubId,
    });

    const [mode, setMode] = useState<EnrollmentMode>("existing");
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: "MEMBER" as MembershipRole,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

    const unassignedPeople = useMemo(() => {
        if (!people) return [];
        const activeMembershipPersonIds = new Set((memberships || []).map((m) => m.personId));
        return people.filter((person) => !activeMembershipPersonIds.has(person.id));
    }, [people, memberships]);

    const filteredPeople = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return unassignedPeople;
        return unassignedPeople.filter((person) => {
            const fullName = person.fullName?.toLowerCase() || "";
            const email = person.email?.toLowerCase() || "";
            return fullName.includes(q) || email.includes(q);
        });
    }, [searchTerm, unassignedPeople]);

    const canSubmit = useMemo(() => {
        if (!context?.defaultClubId) return false;
        if (mode === "existing") return Boolean(selectedPersonId);
        return Boolean(formData.fullName.trim());
    }, [context?.defaultClubId, mode, selectedPersonId, formData.fullName]);

    const createMemberMutation = useMutation({
        mutationFn: async () => {
            if (!context?.defaultClubId) {
                throw new Error("Club context is not loaded yet.");
            }

            let personId = selectedPersonId;
            if (mode === "new") {
                const person = await peopleApi.createPerson({
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim() || undefined,
                    phone: formData.phone.trim() || undefined,
                });
                personId = person.id;
            }

            if (!personId) {
                throw new Error("Please select a person to enroll.");
            }

            await membershipsApi.createMembership({
                clubId: context.defaultClubId,
                personId,
                role: formData.role,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["people"] });
            queryClient.invalidateQueries({ queryKey: ["memberships", context?.defaultClubId] });
            toast.success("Miembro agregado correctamente");
            router.push("/manage");
        },
        onError: (error: unknown) => {
            const fallback = "No se pudo agregar el miembro. Verifica el correo e intenta otra vez.";
            const message = error instanceof Error ? error.message : fallback;
            toast.error(typeof message === "string" ? message : fallback);
        },
    });

    return (
        <div className="min-h-screen bg-cream p-6 sm:p-8 animate-fade-in">
            <div className="max-w-md mx-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-5 p-2 rounded-full bg-white shadow-soft hover:bg-forest/5 transition"
                    aria-label="Back"
                >
                    <ChevronLeft className="text-forest" />
                </button>

                <Card className="p-7">
                    <div className="mb-7">
                        <Badge className="mb-2">Inscripción manual</Badge>
                        <h1 className="font-serif text-3xl text-forest">Agregar miembro</h1>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Agrega personas al club creando un perfil nuevo o eligiendo uno existente.
                        </p>
                    </div>

                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!canSubmit) return;
                            createMemberMutation.mutate();
                        }}
                    >
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-beige/40">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("new");
                                    setSelectedPersonId(null);
                                }}
                                className={`py-2 rounded-xl text-sm font-semibold transition ${mode === "new" ? "bg-white text-forest shadow-sm" : "text-gray-500"
                                    }`}
                            >
                                Persona nueva
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("existing");
                                }}
                                className={`py-2 rounded-xl text-sm font-semibold transition ${mode === "existing" ? "bg-white text-forest shadow-sm" : "text-gray-500"
                                    }`}
                            >
                                Persona existente
                            </button>
                        </div>

                        {mode === "new" ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-charcoal ml-1">Nombre completo</label>
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                                        placeholder="p. ej. Ana Pérez"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-charcoal ml-1">Correo (opcional)</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        placeholder="ana@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-charcoal ml-1">Teléfono (opcional)</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+51 999 999 999"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-charcoal ml-1">Selecciona persona existente</label>
                                <div className="relative">
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por nombre o correo..."
                                        className="pl-11"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-2">
                                    {filteredPeople.map((person) => (
                                        <button
                                            key={person.id}
                                            type="button"
                                            onClick={() => setSelectedPersonId(person.id)}
                                            className={`w-full text-left rounded-2xl border p-3 transition ${selectedPersonId === person.id
                                                ? "border-forest bg-forest/5"
                                                : "border-gray-100 bg-white hover:border-forest/30"
                                                }`}
                                        >
                                            <p className="text-sm font-semibold text-charcoal truncate">{person.fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{person.email || "Sin correo"}</p>
                                        </button>
                                    ))}
                                    {filteredPeople.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-4">
                                            No hay personas disponibles. Si no existe, usa Persona nueva.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-charcoal ml-1">Rol de membresía</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as MembershipRole }))}
                                className="w-full appearance-none bg-beige/30 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-forest transition outline-none"
                            >
                                <option value="MEMBER">Miembro</option>
                                <option value="MODERATOR">Moderador</option>
                            </select>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => router.push("/manage")}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[2]"
                                disabled={!canSubmit || createMemberMutation.isPending}
                            >
                                <UserPlus />
                                <span>{createMemberMutation.isPending ? "Agregando..." : "Agregar miembro"}</span>
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
