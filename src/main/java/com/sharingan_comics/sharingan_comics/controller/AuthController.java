package com.sharingan_comics.sharingan_comics.controller;

import com.sharingan_comics.sharingan_comics.dto.*;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthController
 * --------------
 * Endpoints de autenticación.
 * Funciona con JWT local y con tokens Clerk (transparente para el frontend).
 *
 * Seguridad:
 *  - @AuthenticationPrincipal inyecta el Usuario Oracle (ya validado por JwtFilter).
 *  - Si usuario == null → el filtro no autenticó → 401.
 *  - No loguear tokens ni contraseñas.
 *  - Respuestas de error son genéricas (evitar information disclosure).
 *
 * Endpoints:
 *  POST /api/auth/register    — Registro local (JWT)
 *  POST /api/auth/login       — Login local (JWT)
 *  POST /api/auth/logout      — Logout (stateless — frontend borra token)
 *  GET  /api/auth/profile     — Perfil del usuario autenticado
 *  PUT  /api/auth/profile     — Actualizar perfil
 *  GET  /api/auth/me          — Alias de profile (para compatibilidad frontend Clerk)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            log.info("[Auth] Registro exitoso. username: {}", response.username());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            // No loguear datos del request (puede contener email)
            log.warn("[Auth] Registro rechazado: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            log.info("[Auth] Login local exitoso. username: {}", response.username());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("[Auth] Login fallido: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/auth/profile
     * Funciona tanto con JWT local como con token Clerk.
     * El principal es inyectado por JwtFilter (Usuario Oracle).
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No autenticado. Por favor inicia sesión."));
        }
        ProfileResponse response = authService.getProfile(usuario);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/auth/me
     * Alias de /profile para compatibilidad con flujo Clerk en frontend.
     * Permite al frontend Clerk verificar que el backend reconoce el token.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No autenticado."));
        }
        ProfileResponse response = authService.getProfile(usuario);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal Usuario usuario,
                                           @RequestBody Map<String, String> updates) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No autenticado."));
        }
        ProfileResponse response = authService.updateProfile(usuario, updates.get("phone"));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // JWT es stateless — el frontend borra el token
        // Para Clerk: el frontend llama clerk.signOut()
        return ResponseEntity.ok(Map.of(
            "message", "Sesión cerrada correctamente.",
            "hint", "Si usas Clerk, también llama clerk.signOut() en el frontend."
        ));
    }
}
