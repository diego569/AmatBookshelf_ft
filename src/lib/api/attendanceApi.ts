import { api } from "./client";

export type AttendanceStatus = "ON_TIME" | "LATE" | "ABSENT";

export interface ScanResponseDto {
    ok: boolean;
    status: "ON_TIME" | "LATE";
    minutesLate: number;
    pointsDelta: number;
    totalPoints: number;
    membershipId: string;
    sessionId: string;
    message: string;
    checkInTime: string;
}

export interface AttendanceRecord {
    id: string;
    membershipId: string;
    sessionId: string;
    status: AttendanceStatus;
    checkInAt?: string;
    minutesLate?: number;
    pointsAwarded?: number;
}

export const attendanceApi = {
    scanQr: (qrToken: string) =>
        api.post<ScanResponseDto>("/attendance/scan", { qrToken }),

    getQrToken: (sessionId: string) =>
        api.get<{ qrToken: string; expiresIn: number }>(`/sessions/${sessionId}/qr-token`),

    getSessionAttendance: (sessionId: string) =>
        api.get<AttendanceRecord[]>(`/sessions/${sessionId}/attendance`),

    getMembershipAttendance: (membershipId: string) =>
        api.get<AttendanceRecord[]>(`/memberships/${membershipId}/attendance`),

    bulkMark: (sessionId: string, marks: { membershipId: string; status: AttendanceStatus }[]) =>
        api.post(`/sessions/${sessionId}/attendance`, { marks }),
};
