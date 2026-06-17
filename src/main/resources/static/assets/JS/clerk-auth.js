/**
 * clerk-auth.js
 * -------------
 * Integración de Clerk en el frontend de Sharingan Comics.
 *
 * Responsabilidades:
 *  - Cargar y configurar ClerkJS desde CDN.
 *  - Exponer ClerkSessionManager con métodos unificados.
 *  - Resolver el token correcto según AUTH_MODE (local, clerk, hybrid).
 *  - Sincronizar el estado de sesión con el navbar (session.js).
 *  - Proveer getAuthToken() para llamadas al backend Spring Boot.
 *
 * Flujo:
 *  1. APP_CONFIG.AUTH_MODE determina el modo.
 *  2. En modo 'hybrid': Clerk es preferido si está configurado y el usuario
 *     tiene sesión activa en Clerk. Si no, fallback a localStorage (JWT local).
 *  3. getAuthToken() retorna el token correcto para Authorization: Bearer.
 *
 * Seguridad:
 *  - NUNCA guardar tokens Clerk en localStorage de forma persistente.
 *  - Clerk gestiona su propio almacenamiento seguro de sesión.
 *  - Solo se guarda en sessionStorage/localStorage el estado de UI (isLoggedIn).
 *  - No loguear tokens ni datos sensibles en consola.
 *
 * Cumplimiento:
 *  - Ley 21.719 (minimización, proporcionalidad)
 *  - ISO 27001 A.12.4.1 (no exponer datos sensibles en logs)
 *  - Ley 21.459 (evitar interceptación de credenciales)
 *
 * Dependencias (orden de carga en HTML):
 *  1. config.js (APP_CONFIG)
 *  2. clerk-auth.js (este archivo) — carga ClerkJS dinámicamente
 *  3. session.js (usa ClerkSessionManager)
 */

// ─── Namespace unificado de sesión ────────────────────────────────────────────
// Expuesto globalmente para que session.js y cart.js puedan usarlo.
window.ClerkSessionManager = (function () {
    'use strict';

    let _clerkInstance = null;
    let _initialized = false;
    let _initPromise = null;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Resuelve de forma dinámica la URL base de la página de inicio (home)
     * para asegurar compatibilidad local (Spring Boot / Live Server) y en GitHub Pages.
     * @returns {string} URL absoluta de inicio
     */
    function getHomeUrl() {
        const origin = window.location.origin;
        const path = window.location.pathname;
        if (path.includes('/Proyecto-Web-Duoc/')) {
            return origin + '/Proyecto-Web-Duoc/';
        }
        const lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex > 0) {
            return origin + path.substring(0, lastSlashIndex + 1);
        }
        return origin + '/';
    }

    // ─── Inicialización ───────────────────────────────────────────────────────

    /**
     * Carga el script de ClerkJS desde CDN y lo inicializa.
     * Solo se ejecuta si CLERK_PUBLISHABLE_KEY está configurado.
     * @returns {Promise<void>}
     */
    async function init() {
        if (_initPromise) return _initPromise;

        _initPromise = _doInit();
        return _initPromise;
    }

    async function _doInit() {
        const mode = APP_CONFIG.AUTH_MODE || 'local';
        const pk = APP_CONFIG.CLERK_PUBLISHABLE_KEY;

        if ((mode === 'local') || !pk || pk.trim() === '') {
            console.info('[ClerkAuth] Modo local — Clerk no inicializado.');
            _initialized = false;
            return;
        }

        try {
            await _loadClerkScript(pk);
            _clerkInstance = window.Clerk;
            await _clerkInstance.load();
            _initialized = true;
            console.info('[ClerkAuth] Clerk inicializado correctamente.');

            // Notificar a session.js que el estado puede haber cambiado
            document.dispatchEvent(new CustomEvent('clerk-ready'));
        } catch (err) {
            console.warn('[ClerkAuth] Error al inicializar Clerk:', err.message || err);
            _initialized = false;
            // Fallback graceful — continuar con JWT local si está disponible
        }
    }

    /**
     * Carga el script de ClerkJS desde CDN dinámicamente.
     * Usa la versión estable de ClerkJS v4.
     */
    function _loadClerkScript(publishableKey) {
        return new Promise((resolve, reject) => {
            if (document.getElementById('clerk-script')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.id = 'clerk-script';
            script.async = true;
            script.crossOrigin = 'anonymous';
            // ClerkJS v4 — versión estable recomendada para frontends estáticos
            script.src = `https://cdn.jsdelivr.net/npm/@clerk/clerk-js@4/dist/clerk.browser.js`;
            script.setAttribute('data-clerk-publishable-key', publishableKey);

            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error cargando ClerkJS desde CDN'));

            document.head.appendChild(script);
        });
    }

    // ─── Estado de sesión ─────────────────────────────────────────────────────

    /**
     * Verifica si hay una sesión activa (Clerk o local).
     * @returns {boolean}
     */
    function isLoggedIn() {
        // Primero verificar Clerk si está disponible y tiene sesión activa
        if (_initialized && _clerkInstance && _clerkInstance.user) {
            return true;
        }
        // Fallback: localStorage JWT local
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    /**
     * Obtiene el token de autenticación para enviar al backend.
     * Retorna el token correcto según el modo activo.
     *
     * IMPORTANTE: No loguear el resultado de esta función.
     * @returns {Promise<string|null>}
     */
    async function getAuthToken() {
        const mode = APP_CONFIG.AUTH_MODE || 'local';

        // Modo clerk o hybrid con Clerk activo
        if (_initialized && _clerkInstance && _clerkInstance.session) {
            try {
                // getToken() retorna un JWT de sesión corta duración (60 seg por defecto)
                // Clerk lo refresca automáticamente.
                const token = await _clerkInstance.session.getToken();
                if (token) {
                    return token;
                }
            } catch (err) {
                console.warn('[ClerkAuth] Error obteniendo token Clerk:', err.message || err);
            }
        }

        // Fallback a JWT local (modo local o Clerk no disponible/no autenticado)
        return localStorage.getItem('authToken');
    }

    /**
     * Obtiene información básica del usuario para el frontend.
     * NO expone datos sensibles.
     * @returns {{ email: string|null, username: string|null, provider: string }|null}
     */
    function getCurrentUserInfo() {
        // Clerk activo
        if (_initialized && _clerkInstance && _clerkInstance.user) {
            const user = _clerkInstance.user;
            return {
                email: user.primaryEmailAddress?.emailAddress || null,
                username: user.username || user.firstName || null,
                provider: 'clerk',
                hasMfa: user.twoFactorEnabled || false,
            };
        }

        // Fallback local
        try {
            const local = JSON.parse(localStorage.getItem('loggedInUser'));
            if (local) {
                return {
                    email: local.email || null,
                    username: local.username || null,
                    provider: 'local',
                    hasMfa: false,
                };
            }
        } catch (_) {/* ignorar */}

        return null;
    }

    // ─── Acciones de sesión ───────────────────────────────────────────────────

    /**
     * Abre el modal de sign-in de Clerk o redirige a login.html.
     * @param {string} [redirectUrl] URL a donde ir tras el login.
     */
    async function signIn(redirectUrl) {
        if (_initialized && _clerkInstance) {
            try {
                // Convertir a URL absoluta para evitar problemas con Clerk redirigiendo a la raíz del dominio
                const home = getHomeUrl();
                const absRedirect = redirectUrl 
                    ? (redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, window.location.href).href)
                    : home;
                await _clerkInstance.redirectToSignIn({
                    redirectUrl: absRedirect,
                });
                return;
            } catch (err) {
                console.warn('[ClerkAuth] Error en redirectToSignIn:', err.message);
            }
        }
        // Fallback local
        window.location.href = 'login.html' + (redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '');
    }

    /**
     * Abre el modal de sign-up de Clerk o redirige a signup.html.
     */
    async function signUp(redirectUrl) {
        if (_initialized && _clerkInstance) {
            try {
                const home = getHomeUrl();
                const absRedirect = redirectUrl 
                    ? (redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, window.location.href).href)
                    : home;
                await _clerkInstance.redirectToSignUp({
                    redirectUrl: absRedirect,
                });
                return;
            } catch (err) {
                console.warn('[ClerkAuth] Error en redirectToSignUp:', err.message);
            }
        }
        window.location.href = 'signup.html';
    }

    /**
     * Cierra la sesión activa (Clerk y/o local).
     * Limpia todos los datos de sesión del navegador.
     *
     * Datos limpiados en logout (minimización, Ley 21.719):
     *  - authToken (JWT local)
     *  - isLoggedIn (flag UI)
     *  - loggedInUser (datos de sesión)
     *  - lastPaymentPreference (dato de pago temporal)
     * NO se limpia:
     *  - cart (el carrito persiste por UX)
     */
    async function signOut() {
        // Limpiar datos locales
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('lastPaymentPreference');

        const home = getHomeUrl();

        // Cerrar sesión en Clerk si está activo
        if (_initialized && _clerkInstance) {
            try {
                await _clerkInstance.signOut({
                    redirectUrl: home
                });
                return;
            } catch (err) {
                console.warn('[ClerkAuth] Error en signOut Clerk:', err.message);
            }
        }

        // Redirigir a inicio
        window.location.href = home;
    }

    // ─── API pública ──────────────────────────────────────────────────────────

    return {
        init,
        isLoggedIn,
        getAuthToken,
        getCurrentUserInfo,
        signIn,
        signUp,
        signOut,
        getHomeUrl,
        /** @returns {boolean} Si Clerk está inicializado y disponible */
        isClerkActive: () => _initialized && !!_clerkInstance,
        /** @returns {object|null} Instancia interna de Clerk (para uso avanzado) */
        getClerk: () => _clerkInstance,
    };
})();

// ─── Auto-inicialización al cargar el script ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ClerkSessionManager.init().catch((err) => {
        console.warn('[ClerkAuth] Inicialización fallida, continuando en modo local:', err);
    });
});
