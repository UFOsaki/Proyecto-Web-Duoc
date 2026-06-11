/**
 * config.js
 * ---------
 * Configuración central del frontend de Sharingan Comics.
 * Cargar ANTES que cualquier otro script del proyecto.
 *
 * Modos de autenticación soportados:
 *  - 'local'  : Solo JWT propio (comportamiento actual)
 *  - 'clerk'  : Solo Clerk (cuando migración sea completa)
 *  - 'hybrid' : Convivencia temporal (Clerk preferido, fallback local)
 *
 * IMPORTANTE:
 *  - CLERK_PUBLISHABLE_KEY es seguro en frontend (es público por diseño de Clerk).
 *  - CLERK_SECRET_KEY NUNCA debe estar en este archivo.
 *
 * Para producción (GitHub Pages + Render):
 *  - Cambiar AUTH_API_BASE_URL al dominio de Render.
 *  - Cambiar PAYMENT_API_BASE_URL al dominio de Render.
 *
 * Cumplimiento: Ley 21.719 (minimización de datos en frontend)
 */
const APP_CONFIG = {
    // ─── Backend Spring Boot ──────────────────────────────────────────────────
    // Para desarrollo local:
    AUTH_API_BASE_URL: 'http://localhost:8080/api/auth',
    PAYMENT_API_BASE_URL: 'http://localhost:8080',
    // Para producción Render (descomentar y actualizar):
    // AUTH_API_BASE_URL: 'https://sharingan-comics.onrender.com/api/auth',
    // PAYMENT_API_BASE_URL: 'https://sharingan-comics.onrender.com',

    // ─── API externa de mangas (catálogo) ─────────────────────────────────────
    MANGA_API_BASE_URL: 'https://api-rest-manga.onrender.com',

    // ─── Autenticación ────────────────────────────────────────────────────────
    // Modo: 'local' | 'clerk' | 'hybrid'
    // 'hybrid' = intenta Clerk primero, usa local si Clerk no disponible
    AUTH_MODE: 'hybrid',

    // ─── Clerk (Identidad externa con 2FA/MFA y Google login) ─────────────────
    // Clerk frontend API: https://tender-coral-13.clerk.accounts.dev
    // Es SEGURO tener la publishable key en el frontend (es pública por diseño).
    CLERK_PUBLISHABLE_KEY: 'pk_test_dGVuZGVyLWNvcmFsLTEzLmNsZXJrLmFjY291bnRzLmRldiQ',

    // URL de Clerk para configuración de cuentas
    CLERK_ACCOUNT_PORTAL: 'https://accounts.clerk.dev',
};
