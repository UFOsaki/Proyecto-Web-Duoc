package com.sharingan_comics.sharingan_comics.security;

import com.sharingan_comics.sharingan_comics.clerk.ClerkJwtService;
import com.sharingan_comics.sharingan_comics.clerk.ClerkTokenClaims;
import com.sharingan_comics.sharingan_comics.clerk.UsuarioSyncService;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * JwtFilter (actualizado para convivencia JWT local + Clerk)
 * ----------------------------------------------------------
 * Procesa cada request con header "Authorization: Bearer <token>".
 *
 * Lógica de decisión:
 *  1. Si el token tiene "kid" en el header → intentar validación Clerk.
 *     a. Clerk deshabilitado → rechazar (401).
 *     b. Token Clerk válido → sincronizar usuario Oracle → autenticar.
 *     c. Token Clerk inválido → no autenticar (continuar como anónimo).
 *  2. Si el token NO tiene "kid" → intentar validación JWT local.
 *     a. Token local válido → buscar usuario en Oracle → autenticar.
 *     b. Token local inválido → no autenticar.
 *  3. Sin header Authorization → continuar sin autenticación.
 *
 * Seguridad crítica:
 *  - NUNCA loguear el token completo.
 *  - NUNCA loguear el Authorization header completo.
 *  - Loguear solo el username/id truncado para trazabilidad.
 *  - Errores internos no exponen información sensible al cliente.
 *
 * Cumplimiento:
 *  - ISO 27001 A.12.4.1 (logging sin datos sensibles)
 *  - Ley 21.459 (evitar interceptación/uso indebido de credenciales)
 *  - ISO 25010 (seguridad, confiabilidad)
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final ClerkJwtService clerkJwtService;
    private final UsuarioSyncService usuarioSyncService;

    public JwtFilter(JwtUtil jwtUtil,
                     UsuarioRepository usuarioRepository,
                     ClerkJwtService clerkJwtService,
                     UsuarioSyncService usuarioSyncService) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
        this.clerkJwtService = clerkJwtService;
        this.usuarioSyncService = usuarioSyncService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // NUNCA loguear el token completo
        String token = header.substring(7);

        try {
            if (clerkJwtService.looksLikeClerkToken(token)) {
                // ── Camino Clerk ──────────────────────────────────────────
                handleClerkToken(token);
            } else {
                // ── Camino JWT local ──────────────────────────────────────
                handleLocalJwtToken(token);
            }
        } catch (Exception e) {
            // Error inesperado en el filtro — no exponer detalles
            log.error("[JwtFilter] Error inesperado procesando token: {}", e.getClass().getSimpleName());
            // Continuar sin autenticar (Spring Security manejará el 401 si el endpoint lo requiere)
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Procesa un token JWT de Clerk:
     *  1. Valida con JWKS.
     *  2. Sincroniza usuario en Oracle.
     *  3. Crea Authentication con rol interno Oracle.
     */
    private void handleClerkToken(String token) {
        Optional<ClerkTokenClaims> claimsOpt = clerkJwtService.validateToken(token);
        if (claimsOpt.isEmpty()) {
            log.warn("[JwtFilter] Token Clerk inválido o Clerk deshabilitado");
            return;
        }

        ClerkTokenClaims claims = claimsOpt.get();

        try {
            Usuario usuario = usuarioSyncService.syncFromClerk(claims);
            setAuthentication(usuario, "clerk");
        } catch (Exception e) {
            // Error de sincronización — no autenticar, no romper el request
            log.error("[JwtFilter] Error sincronizando usuario Clerk: {}", e.getMessage());
        }
    }

    /**
     * Procesa un token JWT local (firmado con HMAC/JWT propio).
     * Mantiene comportamiento previo intacto para compatibilidad.
     */
    private void handleLocalJwtToken(String token) {
        if (!jwtUtil.isValid(token)) {
            log.debug("[JwtFilter] Token local inválido o expirado");
            return;
        }

        String username = jwtUtil.getUsername(token);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);

        if (usuarioOpt.isEmpty()) {
            log.debug("[JwtFilter] Token local válido pero usuario no encontrado: {}", username);
            return;
        }

        setAuthentication(usuarioOpt.get(), "local");
    }

    /**
     * Crea y registra el objeto Authentication en el SecurityContext.
     * El principal es el objeto Usuario Oracle (fuente de verdad de roles).
     *
     * @param usuario  Usuario Oracle sincronizado.
     * @param authType Tipo de autenticación para trazabilidad de logs.
     */
    private void setAuthentication(Usuario usuario, String authType) {
        var auth = new UsernamePasswordAuthenticationToken(
                usuario,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRole()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
        log.debug("[JwtFilter] Autenticado via {} — user_id: {}, role: {}",
                authType, usuario.getIdUsuario(), usuario.getRole());
    }
}
