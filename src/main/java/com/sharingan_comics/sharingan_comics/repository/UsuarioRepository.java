package com.sharingan_comics.sharingan_comics.repository;

import com.sharingan_comics.sharingan_comics.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UsuarioRepository
 * -----------------
 * Repositorio JPA para la entidad Usuario.
 * Incluye métodos para búsqueda por credenciales locales y por Clerk.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // ─── Búsquedas locales ────────────────────────────────────────────────

    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByUsernameOrEmail(String username, String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // ─── Búsquedas Clerk ─────────────────────────────────────────────────

    /**
     * Busca un usuario por su ID de Clerk (campo "sub" del JWT de Clerk).
     * Usado por UsuarioSyncService para identificar usuarios Clerk conocidos.
     *
     * @param clerkUserId ID de Clerk (ej. "user_2abc123...")
     * @return Optional con el usuario si existe
     */
    Optional<Usuario> findByClerkUserId(String clerkUserId);

    /**
     * Verifica si ya existe un usuario con ese CLERK_USER_ID.
     * Útil para evitar duplicados antes de crear.
     *
     * @param clerkUserId ID de Clerk
     * @return true si ya existe
     */
    boolean existsByClerkUserId(String clerkUserId);
}
