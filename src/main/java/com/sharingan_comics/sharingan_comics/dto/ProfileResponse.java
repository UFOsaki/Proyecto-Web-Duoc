package com.sharingan_comics.sharingan_comics.dto;

/**
 * ProfileResponse
 * ---------------
 * DTO de respuesta para GET /api/auth/profile y GET /api/auth/me.
 * Funciona tanto con JWT local como con token Clerk.
 *
 * Campos excluidos deliberadamente (minimización de datos, Ley 21.719):
 *  - passwordHash (nunca exponer, aunque sea hasheado)
 *  - clerkUserId completo (no necesario para el frontend)
 *  - tokens de cualquier tipo
 *  - datos de sesión internos
 *
 * Cumplimiento:
 *  - ISO 27001 A.9.4.1 (control de acceso a información)
 *  - Ley 21.719 (minimización y proporcionalidad de datos expuestos)
 */
public record ProfileResponse(
        Long userId,
        String username,
        String email,
        String phone,
        String role,
        String authProvider,   // LOCAL | CLERK | GOOGLE
        boolean mfaEnabled     // Indicador observacional de MFA
) {}
