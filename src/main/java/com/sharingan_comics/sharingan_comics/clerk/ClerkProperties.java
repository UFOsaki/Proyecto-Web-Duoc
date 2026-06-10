package com.sharingan_comics.sharingan_comics.clerk;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * ClerkProperties
 * ---------------
 * Configuración tipada para la integración con Clerk.
 * Los valores se leen desde application.yml (variables de entorno).
 *
 * IMPORTANTE:
 *  - CLERK_PUBLISHABLE_KEY pertenece al frontend (no se carga aquí).
 *  - CLERK_SECRET_KEY NUNCA debe estar en código ni en Git.
 *  - Si clerk.enabled=false, el sistema usa sólo JWT local.
 *
 * Cumplimiento:
 *  - ISO 27001 A.9.4.3 (gestión de secretos/credenciales)
 *  - ISO 27001 A.14.2.9 (seguridad en integraciones con terceros)
 *  - Ley 21.459 (evitar exposición de credenciales)
 */
@Component
@ConfigurationProperties(prefix = "clerk")
public class ClerkProperties {

    /**
     * Habilita o deshabilita la integración Clerk.
     * false = sólo JWT local (modo seguro de fallback).
     * true  = acepta tokens JWT de Clerk además del JWT local.
     */
    private boolean enabled = false;

    /**
     * Issuer del JWT de Clerk.
     * Formato: https://<tu-clerk-frontend-api>.clerk.accounts.dev
     * Usado para validar el claim "iss" del token.
     * Variable de entorno: CLERK_ISSUER
     */
    private String issuer;

    /**
     * URL del endpoint JWKS de Clerk.
     * Formato: https://<tu-clerk-frontend-api>.clerk.accounts.dev/.well-known/jwks.json
     * Usado para obtener las claves públicas de verificación.
     * Variable de entorno: CLERK_JWKS_URL
     */
    private String jwksUrl;

    /**
     * Clave secreta de Clerk (server-side únicamente).
     * Sólo necesaria para llamadas server-to-server (ej. Clerk Management API).
     * NO se usa para validar JWTs de sesión (eso se hace con JWKS).
     * Variable de entorno: CLERK_SECRET_KEY
     * NUNCA imprimir en logs ni exponer en respuestas.
     */
    private String secretKey;

    // ─── Getters y Setters ────────────────────────────────────────────────

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getJwksUrl() {
        return jwksUrl;
    }

    public void setJwksUrl(String jwksUrl) {
        this.jwksUrl = jwksUrl;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    /**
     * Verifica que la configuración mínima requerida esté presente.
     * Llamar en ClerkJwtService.init() para fallar rápido si hay mala configuración.
     */
    public boolean isConfigured() {
        return enabled
                && issuer != null && !issuer.isBlank()
                && jwksUrl != null && !jwksUrl.isBlank();
    }

    /**
     * Representación segura — NO incluye secretKey.
     */
    @Override
    public String toString() {
        return "ClerkProperties{enabled=" + enabled
                + ", issuer='" + issuer + '\''
                + ", jwksUrl='" + jwksUrl + '\''
                + ", secretKey=[PROTECTED]}";
    }
}
