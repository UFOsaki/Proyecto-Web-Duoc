package com.sharingan_comics.sharingan_comics.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Usuario
 * -------
 * Entidad JPA que mapea la tabla USUARIOS en Oracle.
 *
 * Soporta dos modos de autenticación en convivencia temporal:
 *  - LOCAL: usuarios con password_hash (JWT propio)
 *  - CLERK: usuarios autenticados vía Clerk (Google, 2FA/MFA)
 *
 * Minimización de datos (Ley 21.719):
 *  - password_hash es NULL para usuarios Clerk.
 *  - No se almacenan tokens de sesión.
 *  - No se guarda información innecesaria de Clerk.
 *
 * El rol (CUSTOMER/ADMIN) es la fuente de verdad para autorización interna.
 * Clerk solo provee identidad, nunca define roles de negocio.
 */
@Entity
@Table(name = "USUARIOS")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_USUARIO")
    private Long idUsuario;

    @Column(name = "USERNAME", nullable = false, unique = true, length = 80)
    private String username;

    @Column(name = "EMAIL", nullable = false, unique = true, length = 120)
    private String email;

    /**
     * Hash BCrypt de contraseña local.
     * NULL para usuarios Clerk (minimización de datos, Ley 21.719 art. 3 lit. c).
     * NUNCA guardar contraseña en texto plano.
     */
    @Column(name = "PASSWORD_HASH", length = 255)
    private String passwordHash;

    @Column(name = "PHONE", length = 30)
    private String phone;

    /**
     * Rol interno de negocio. Fuente de verdad: Oracle.
     * Valores: CUSTOMER, ADMIN.
     * Clerk no puede definir ni escalar este rol.
     */
    @Column(name = "ROLE", nullable = false, length = 30)
    @Builder.Default
    private String role = "CUSTOMER";

    // ─── Campos de integración Clerk ──────────────────────────────────────

    /**
     * ID del usuario en Clerk (campo "sub" del JWT de Clerk).
     * NULL para usuarios locales que nunca usaron Clerk.
     * Índice único en DB — Oracle ignora NULLs en índices únicos.
     */
    @Column(name = "CLERK_USER_ID", length = 150, unique = true)
    private String clerkUserId;

    /**
     * Origen de autenticación: LOCAL | CLERK | GOOGLE.
     * DEFAULT 'LOCAL' para usuarios pre-existentes.
     * Actualizado por UsuarioSyncService al autenticar con Clerk.
     */
    @Column(name = "AUTH_PROVIDER", nullable = false, length = 40)
    @Builder.Default
    private String authProvider = "LOCAL";

    /**
     * Indicador local de MFA (0=false, 1=true).
     * Fuente de verdad real: Clerk Dashboard.
     * Se sincroniza en cada autenticación exitosa.
     * Cumple ISO 27001 A.9.4.2 (autenticación segura).
     */
    @Column(name = "MFA_ENABLED", nullable = false)
    @Builder.Default
    private boolean mfaEnabled = false;

    /**
     * Timestamp del último inicio de sesión exitoso.
     * Trazabilidad de accesos. ISO 27001 A.12.4.1. Ley 21.663.
     */
    @Column(name = "LAST_LOGIN_AT")
    private LocalDateTime lastLoginAt;

    /**
     * Consentimiento de Términos y Condiciones. Ley 21.719 art. 12.
     */
    @Column(name = "TERMS_ACCEPTED_AT")
    private LocalDateTime termsAcceptedAt;

    /**
     * Consentimiento de Política de Privacidad. Ley 21.719.
     */
    @Column(name = "PRIVACY_ACCEPTED_AT")
    private LocalDateTime privacyAcceptedAt;

    // ─── Auditoría ────────────────────────────────────────────────────────

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
