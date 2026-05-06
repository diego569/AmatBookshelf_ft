import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:3001";

const adminAccessToken = process.env.ADMIN_ACCESS_TOKEN;
const adminRefreshToken = process.env.ADMIN_REFRESH_TOKEN;
const adminMembershipId = process.env.ADMIN_MEMBERSHIP_ID;
const readerAccessToken = process.env.READER_ACCESS_TOKEN;
const readerRefreshToken = process.env.READER_REFRESH_TOKEN;
const readerMembershipId = process.env.READER_MEMBERSHIP_ID;

if (
    !adminAccessToken ||
    !adminRefreshToken ||
    !adminMembershipId ||
    !readerAccessToken ||
    !readerRefreshToken ||
    !readerMembershipId
) {
    throw new Error("Missing required auth environment variables for smoke test");
}

function authStorage({ accessToken, refreshToken, membershipId, person }) {
    return JSON.stringify({
        state: {
            accessToken,
            refreshToken,
            membershipId,
            currentPerson: person,
        },
        version: 0,
    });
}

async function apiFetch(endpoint, token, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...(options.headers || {}),
        },
    });

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
        throw new Error(
            `API ${response.status} on ${endpoint}: ${JSON.stringify(data)}`
        );
    }

    return data;
}

async function buildContext(browser, storageValue) {
    const context = await browser.newContext({
        viewport: { width: 430, height: 932 },
    });

    await context.addInitScript((value) => {
        window.localStorage.setItem("amat-auth-storage", value);
    }, storageValue);

    return context;
}

async function main() {
    const browser = await chromium.launch({
        channel: "chrome",
        headless: true,
    });

    const artifactsDir = path.resolve("playwright-artifacts");
    fs.mkdirSync(artifactsDir, { recursive: true });

    const cycleName = `Smoke Cycle ${Date.now()}`;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 1);
    const end = new Date(today);
    end.setDate(today.getDate() + 21);
    const readingDateValue = start.toISOString().slice(0, 10);
    const endDateValue = end.toISOString().slice(0, 10);

    const adminContext = await buildContext(
        browser,
        authStorage({
            accessToken: adminAccessToken,
            refreshToken: adminRefreshToken,
            membershipId: adminMembershipId,
            person: {
                id: "admin-smoke",
                email: "admin-smoke@amat.local",
                name: "Admin Smoke",
            },
        })
    );
    const adminPage = await adminContext.newPage();

    const networkLog = [];
    adminPage.on("response", async (response) => {
        const url = response.url();
        if (
            url.includes("/clubs/") && url.includes("/cycles") ||
            url.includes("/program-template") ||
            url.includes("/books/search") ||
            url.includes("/books/import-from-open-library") ||
            url.includes("/sessions/") && (
                url.includes("/books") ||
                url.includes("/photos") ||
                url.includes("/questions")
            )
        ) {
            networkLog.push({
                url,
                status: response.status(),
                method: response.request().method(),
            });
        }
    });

    await adminPage.goto(`${FRONTEND_URL}/manage`, { waitUntil: "networkidle" });
    await adminPage.waitForURL(/\/manage$/);
    await adminPage.goto(`${FRONTEND_URL}/manage/cycles/new`, {
        waitUntil: "networkidle",
    });

    await adminPage
        .locator('label:has-text("Nombre del ciclo")')
        .locator("..")
        .locator("input")
        .fill(cycleName);
    await adminPage
        .locator('label:has-text("Tema (opcional)")')
        .locator("..")
        .locator("input")
        .fill("Smoke testing");
    await adminPage
        .locator('label:has-text("Resumen")')
        .locator("..")
        .locator("textarea")
        .fill("Ciclo creado por smoke test automatizado");
    await adminPage
        .locator('label:has-text("Formato")')
        .locator("..")
        .locator("select")
        .selectOption("SEMANAL");
    await adminPage
        .locator('label:has-text("Lecturas")')
        .locator("..")
        .locator("input")
        .fill("1");
    await adminPage
        .locator('label:has-text("Coordinaciones")')
        .locator("..")
        .locator("input")
        .fill("1");
    await adminPage
        .locator('label:has-text("Inicio")')
        .locator("..")
        .locator("input")
        .fill(readingDateValue);
    await adminPage
        .locator('label:has-text("Fin")')
        .locator("..")
        .locator("input")
        .fill(endDateValue);

    const createCycleResponsePromise = adminPage.waitForResponse((response) =>
        response.url().includes("/clubs/") &&
        response.url().includes("/cycles") &&
        response.request().method() === "POST"
    );
    const programTemplateResponsePromise = adminPage.waitForResponse((response) =>
        response.url().includes("/program-template") &&
        response.request().method() === "POST"
    );

    await adminPage.getByRole("button", { name: "Crear ciclo" }).click();

    const createCycleResponse = await createCycleResponsePromise;
    const programTemplateResponse = await programTemplateResponsePromise;
    const cycle = await createCycleResponse.json();

    if (createCycleResponse.status() !== 201 && createCycleResponse.status() !== 200) {
        throw new Error(`Unexpected cycle creation status: ${createCycleResponse.status()}`);
    }
    if (
        programTemplateResponse.status() !== 201 &&
        programTemplateResponse.status() !== 200
    ) {
        throw new Error(
            `Unexpected program-template status: ${programTemplateResponse.status()}`
        );
    }

    const cycleSessions = await apiFetch(
        `/cycles/${cycle.id}/sessions`,
        adminAccessToken
    );
    const readingSession = cycleSessions.find((session) => session.sessionType === "LECTURA");
    const coordinationSession = cycleSessions.find(
        (session) => session.sessionType === "COORDINACION"
    );

    if (!readingSession || !coordinationSession) {
        throw new Error("Program template did not create reading and coordination sessions");
    }

    await apiFetch(`/cycles/${cycle.id}/enrollments`, adminAccessToken, {
        method: "POST",
        body: JSON.stringify({
            membershipId: readerMembershipId,
            status: "ACTIVE",
        }),
    });

    await adminPage.goto(`${FRONTEND_URL}/manage/sessions/${readingSession.id}/books`, {
        waitUntil: "networkidle",
    });
    await adminPage.getByPlaceholder("Título del libro").fill("The Great Gatsby");
    await adminPage.getByRole("button", { name: "Buscar en Open Library" }).click();
    await adminPage.waitForSelector("text=Resultados", { timeout: 30000 });
    await adminPage
        .getByRole("button", { name: "Asignar a la sesión" })
        .first()
        .click();
    await adminPage.waitForTimeout(1500);

    await adminPage.goto(
        `${FRONTEND_URL}/manage/sessions/${readingSession.id}/discussion`,
        { waitUntil: "networkidle" }
    );
    const promptText = `Pregunta smoke ${Date.now()}`;
    await adminPage
        .getByPlaceholder("Ej. ¿Qué parte del libro conectó más con tu experiencia?")
        .fill(promptText);
    await adminPage.getByRole("button", { name: "Guardar pregunta" }).click();
    await adminPage.waitForSelector(`text=${promptText}`, { timeout: 15000 });

    const pngPath = path.join(artifactsDir, "smoke-photo.png");
    fs.writeFileSync(
        pngPath,
        Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sotY7QAAAAASUVORK5CYII=",
            "base64"
        )
    );

    await adminPage.goto(`${FRONTEND_URL}/manage/sessions/${readingSession.id}/photos`, {
        waitUntil: "networkidle",
    });
    await adminPage.locator('input[type="file"]').setInputFiles(pngPath);
    await adminPage.getByPlaceholder("Pie de foto (opcional)").fill("Foto smoke");
    const photoUploadResponsePromise = adminPage.waitForResponse((response) =>
        response.url().includes(`/sessions/${readingSession.id}/photos`) &&
        response.request().method() === "POST"
    );
    await adminPage.getByRole("button", { name: "Subir foto" }).click();
    const photoUploadResponse = await photoUploadResponsePromise;
    if (![200, 201].includes(photoUploadResponse.status())) {
        throw new Error(`Unexpected photo upload status: ${photoUploadResponse.status()}`);
    }
    await adminPage.waitForSelector("text=Foto smoke", { timeout: 15000 });

    const readerContext = await buildContext(
        browser,
        authStorage({
            accessToken: readerAccessToken,
            refreshToken: readerRefreshToken,
            membershipId: readerMembershipId,
            person: {
                id: "reader-smoke",
                email: "reader-smoke@amat.local",
                name: "Reader Smoke",
            },
        })
    );
    const readerPage = await readerContext.newPage();
    await readerPage.goto(`${FRONTEND_URL}/m`, { waitUntil: "networkidle" });
    await readerPage.waitForURL(new RegExp(`/m/cycles/${cycle.id}`), {
        timeout: 20000,
    });

    await readerPage.goto(
        `${FRONTEND_URL}/m/cycles/${cycle.id}/sessions/${readingSession.id}`,
        { waitUntil: "networkidle" }
    );
    await readerPage.waitForSelector(`text=${promptText}`, { timeout: 15000 });

    await readerPage
        .getByPlaceholder("Que te quedo rondando despues de la sesion?")
        .fill("Respuesta smoke como lector");
    await readerPage.getByRole("button", { name: "Publicar" }).click();
    await readerPage.waitForSelector("text=Respuesta smoke como lector", {
        timeout: 15000,
    });

    const starButtons = readerPage.locator("button.text-ochre");
    await starButtons.nth(4).click();
    await readerPage
        .getByPlaceholder("Que te parecio este libro en esta sesion?")
        .fill("Reseña smoke");
    await readerPage.getByRole("button", { name: "Guardar resena" }).click();
    await readerPage.waitForTimeout(1500);

    const summary = {
        cycleName,
        cycleId: cycle.id,
        readingSessionId: readingSession.id,
        coordinationSessionId: coordinationSession.id,
        networkLog,
    };

    const failedRequests = networkLog.filter((entry) => entry.status >= 400);
    if (failedRequests.length) {
        summary.failedRequests = failedRequests;
    }

    fs.writeFileSync(
        path.join(artifactsDir, "smoke-summary.json"),
        JSON.stringify(summary, null, 2)
    );

    if (failedRequests.length) {
        throw new Error(
            `Smoke test network failures: ${JSON.stringify(failedRequests, null, 2)}`
        );
    }

    await adminPage.screenshot({
        path: path.join(artifactsDir, "admin-manage.png"),
        fullPage: true,
    });
    await readerPage.screenshot({
        path: path.join(artifactsDir, "reader-session.png"),
        fullPage: true,
    });

    console.log(JSON.stringify(summary, null, 2));

    await readerContext.close();
    await adminContext.close();
    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
