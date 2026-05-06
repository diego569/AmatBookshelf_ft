import { appContextApi } from "@/lib/api/appContextApi";
import { clubsApi } from "@/lib/api/clubsApi";

function decodePersonIdFromToken(token: string): string | null {
    try {
        const base64Url = token.split(".")[1];
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
}

export async function resolveIntranetRoute(accessToken: string): Promise<"/m" | "/manage"> {
    const personId = decodePersonIdFromToken(accessToken);
    if (!personId) return "/m";

    try {
        const context = await appContextApi.getContext();
        if (!context?.defaultClubId) return "/m";

        const memberships = await clubsApi.getMemberships(context.defaultClubId);
        const currentMembership = memberships.find(
            (membership) => membership.personId === personId && membership.status === "ACTIVE"
        );

        if (currentMembership?.role === "admin" || currentMembership?.role === "MODERATOR") {
            return "/manage";
        }
    } catch {
        return "/m";
    }

    return "/m";
}
