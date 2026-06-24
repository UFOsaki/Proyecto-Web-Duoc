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
    // Modo de autenticación: 'local' | 'clerk' | 'hybrid'
    AUTH_MODE: "hybrid",

    // URL Base de la API pública en Render
    API_BASE_URL: "https://sharingan-comics-clerk.onrender.com",

    // Endpoint de autenticación (Render)
    AUTH_API_BASE_URL: "https://sharingan-comics-clerk.onrender.com/api/auth",

    // Endpoint de pagos (Render)
    PAYMENT_API_BASE_URL: "https://sharingan-comics-clerk.onrender.com",

    // Endpoint de catálogo de mangas (Render)
    MANGA_API_BASE_URL: "https://sharingan-comics-clerk.onrender.com/api/mangas/images",

    // Clerk Publishable Key (Seguro en frontend)
    CLERK_PUBLISHABLE_KEY: "pk_test_dGVuZGVyLWNvcmFsLTEzLmNsZXJrLmFjY291bnRzLmRldiQ",

    /*
     * CONFIGURACIÓN LOCAL (Para desarrollo y pruebas locales)
     * Descomentar para desarrollo local:
     * 
     * API_BASE_URL: "http://localhost:8080",
     * AUTH_API_BASE_URL: "http://localhost:8080/api/auth",
     * PAYMENT_API_BASE_URL: "http://localhost:8080",
     * MANGA_API_BASE_URL: "http://localhost:8080/api/mangas/images"
     */
};
