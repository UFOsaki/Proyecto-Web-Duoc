/**
 * config.js
 * ---------
 * Configuración central de URLs del proyecto.
 * Cargar ANTES que cualquier otro JS del proyecto.
 *
 * Para desarrollo local (Live Server + Spring Boot):
 *   AUTH_API_BASE_URL apunta a localhost:8080
 *
 * Para producción (GitHub Pages + Render):
 *   Cambiar AUTH_API_BASE_URL al dominio de Render.
 */
const APP_CONFIG = {
    // Backend de autenticación (Spring Boot local)
    AUTH_API_BASE_URL: 'http://localhost:8080/api/auth',

    // API externa de mangas (catálogo)
    MANGA_API_BASE_URL: 'https://api-rest-manga.onrender.com',

    // Backend Mercado Pago
    PAYMENT_API_BASE_URL: 'https://ms-sharingan-comics-pay-mercado-pago.onrender.com'
};
