"use client";

import { useEffect, useMemo, useState } from "react";

export function useManageReaderContext(fallbackCycleId?: string | null) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        setSearch(window.location.search);
    }, []);

    return useMemo(() => {
        const query = new URLSearchParams(search);
        const fromManage = query.get("fromManage") === "1";
        const manageTab = query.get("manageTab") || "cycles";
        const manageCycleId = query.get("manageCycleId") || fallbackCycleId || null;
        const manageSuffix = fromManage
            ? `?fromManage=1&manageTab=${encodeURIComponent(manageTab)}${manageCycleId ? `&manageCycleId=${encodeURIComponent(manageCycleId)}` : ""}`
            : "";

        const withManageContext = (href: string) => {
            if (!fromManage) return href;
            const divider = href.includes("?") ? "&" : "?";
            return `${href}${divider}${new URLSearchParams(manageSuffix.slice(1)).toString()}`;
        };

        const manageReturnHref = fromManage
            ? `/manage?tab=${encodeURIComponent(manageTab)}${manageCycleId ? `&cycleId=${encodeURIComponent(manageCycleId)}` : ""}`
            : null;

        return {
            fromManage,
            manageTab,
            manageCycleId,
            manageSuffix,
            manageReturnHref,
            withManageContext,
        };
    }, [fallbackCycleId, search]);
}
