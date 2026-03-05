"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/scanner/QrScanner";
import { attendanceApi } from "@/lib/api/attendanceApi";
import { useAuthStore } from "@/lib/store/auth";
import { toast } from "sonner";

export default function ScanPage() {
    const router = useRouter();
    const setMembershipId = useAuthStore((state) => state.setMembershipId);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleScan = async (token: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const result = await attendanceApi.scanQr(token);

            // Cache membershipId if it was newly created or changed
            if (result.membershipId) {
                setMembershipId(result.membershipId);
            }

            // Encode result for the result page (or use a state machine/store if more complex)
            const params = new URLSearchParams({
                status: result.status,
                points: result.pointsDelta.toString(),
                message: result.message,
                ok: result.ok.toString(),
            });

            router.push(`/m/result?${params.toString()}`);
        } catch (error: any) {
            toast.error(error.message || "No se pudo escanear el código QR");
            router.push("/m/result?ok=false&status=ERROR&message=Token inválido o error de conexión");
        } finally {
            setIsProcessing(false);
        }
    };

    return <QrScanner onScan={handleScan} onClose={() => router.back()} />;
}
