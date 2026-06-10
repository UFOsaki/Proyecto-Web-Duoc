package com.sharingan_comics.sharingan_comics.clerk;

import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * UsuarioSyncService
 * ------------------
 * Responsable de sincronizar (buscar o crear) un usuario Oracle
 * a partir de los claims de un token Clerk válido.
 *
 * Algoritmo de resolución (evita duplicados):
 *  1. Buscar por CLERK_USER_ID → usuario ya conocido de Clerk.
 *  2. Si no, buscar por EMAIL:
 *     a. Existe (era local) → asociar CLERK_USER_ID, actualizar AUTH_PROVIDER.
 *     b. No existe → crear usuario nuevo con role=CUSTOMER y auth_provider=CLERK.
 *  3. Actualizar LAST_LOGIN_AT en cada autenticación exitosa.
 *
 * Reglas de seguridad:
 *  - NUNCA guardar PASSWORD_HASH para usuarios Clerk.
 *  - NUNCA loguear el clerkUserId completo en producción.
 *  - El rol (CUSTOMER/ADMIN) es definido y mantenido internamente en Oracle.
 *    Clerk no puede escalar privilegios.
 *  - Si el email ya existía como LOCAL, la asociación se hace con log de auditoría.
 *
 * Cumplimiento:
 *  - ISO 27001 A.9.2 (gestión de acceso de usuarios)
 *  - ISO 27001 A.12.4.1 (registro de eventos)
 *  - Ley 21.719 (minimización de datos — no guardar datos innecesarios)
 *  - Ley 19.628 (tratamiento responsable de datos personales)
 */
@Service
public class UsuarioSyncService {

    private static final Logger log = LoggerFactory.getLogger(UsuarioSyncService.class);

    private final UsuarioRepository usuarioRepository;

    public UsuarioSyncService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Sincroniza un usuario Clerk con la base de datos Oracle.
     * Crea el usuario si no existe; asocia si venía de LOCAL.
     *
     * @param claims Claims extraídos del JWT de Clerk validado.
     * @return Usuario Oracle sincronizado, listo para ser autenticado.
     */
    @Transactional
    public Usuario syncFromClerk(ClerkTokenClaims claims) {
        // Paso 1: buscar por CLERK_USER_ID (caso más común para usuarios Clerk conocidos)
        Optional<Usuario> byClerkId = usuarioRepository.findByClerkUserId(claims.getClerkUserId());
        if (byClerkId.isPresent()) {
            Usuario usuario = byClerkId.get();
            updateLastLogin(usuario);
            updateMfaStatus(usuario, claims.isMfaEnabled());
            return usuarioRepository.save(usuario);
        }

        // Paso 2: buscar por EMAIL
        if (claims.getEmail() != null) {
            Optional<Usuario> byEmail = usuarioRepository.findByEmail(claims.getEmail());
            if (byEmail.isPresent()) {
                Usuario usuario = byEmail.get();

                // Si era LOCAL y no tenía CLERK_USER_ID, asociar
                if (usuario.getClerkUserId() == null) {
                    String prevProvider = usuario.getAuthProvider();
                    usuario.setClerkUserId(claims.getClerkUserId());
                    usuario.setAuthProvider("CLERK");
                    usuario.setMfaEnabled(claims.isMfaEnabled());

                    // Auditoría: loguear sólo información no sensible
                    log.info("[UsuarioSync] Usuario existente (provider={}) asociado a Clerk. " +
                            "ID interno: {}", prevProvider, usuario.getIdUsuario());
                }
                updateLastLogin(usuario);
                return usuarioRepository.save(usuario);
            }
        }

        // Paso 3: crear usuario nuevo desde Clerk
        return createFromClerk(claims);
    }

    /**
     * Crea un nuevo usuario en Oracle a partir de claims Clerk.
     * Minimización de datos: solo guarda lo necesario.
     * PASSWORD_HASH queda null (usuario Clerk no tiene contraseña local).
     */
    private Usuario createFromClerk(ClerkTokenClaims claims) {
        String baseUsername = claims.deriveUsername();
        String username = ensureUniqueUsername(baseUsername);

        // Determinar AUTH_PROVIDER basado en el email
        // (Google social login suele tener @gmail.com pero no es garantía — usar 'CLERK' por defecto)
        String authProvider = "CLERK";

        Usuario nuevo = new Usuario();
        nuevo.setClerkUserId(claims.getClerkUserId());
        nuevo.setEmail(claims.getEmail() != null ? claims.getEmail() : username + "@clerk.user");
        nuevo.setUsername(username);
        nuevo.setPasswordHash(null);   // ← minimización de datos, Ley 21.719
        nuevo.setRole("CUSTOMER");     // ← rol por defecto, SIEMPRE desde Oracle
        nuevo.setAuthProvider(authProvider);
        nuevo.setMfaEnabled(claims.isMfaEnabled());
        nuevo.setLastLoginAt(LocalDateTime.now());

        Usuario saved = usuarioRepository.save(nuevo);
        log.info("[UsuarioSync] Nuevo usuario Clerk creado. ID interno: {}, role: {}",
                saved.getIdUsuario(), saved.getRole());
        return saved;
    }

    /**
     * Garantiza que el username sea único en Oracle.
     * Si ya existe, agrega un sufijo numérico incremental.
     */
    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int attempt = 0;
        while (usuarioRepository.existsByUsername(candidate)) {
            attempt++;
            // Truncar base si necesario para no superar 80 chars
            String suffix = String.valueOf(attempt);
            int maxBase = 80 - suffix.length();
            String truncatedBase = base.length() > maxBase ? base.substring(0, maxBase) : base;
            candidate = truncatedBase + suffix;
        }
        return candidate;
    }

    private void updateLastLogin(Usuario usuario) {
        usuario.setLastLoginAt(LocalDateTime.now());
    }

    private void updateMfaStatus(Usuario usuario, boolean mfaEnabled) {
        if (usuario.isMfaEnabled() != mfaEnabled) {
            usuario.setMfaEnabled(mfaEnabled);
        }
    }
}
