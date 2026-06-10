package com.sharingan_comics.sharingan_comics.service;

import com.sharingan_comics.sharingan_comics.dto.*;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.repository.UsuarioRepository;
import com.sharingan_comics.sharingan_comics.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * AuthService
 * -----------
 * Servicio de autenticación local (JWT propio).
 * Mantiene compatibilidad con el sistema local mientras Clerk se valida.
 *
 * NOTA: El registro local solo aplica para usuarios con credenciales propias.
 * Los usuarios Clerk se crean automáticamente via UsuarioSyncService.
 *
 * Seguridad:
 *  - Password hasheado con BCrypt.
 *  - LOGIN solo funciona si AUTH_PROVIDER='LOCAL' y PASSWORD_HASH no es null.
 *  - No expone password_hash en ninguna respuesta.
 *
 * Cumplimiento:
 *  - ISO 27001 A.9.4.3 (gestión de contraseñas)
 *  - Ley 21.719 (minimización, proporcionalidad)
 */
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        // Validar duplicados
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ya existe una cuenta con este correo.");
        }
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Ya existe una cuenta con este nombre de usuario.");
        }

        // Crear usuario local con password hasheado
        Usuario usuario = Usuario.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role("CUSTOMER")
                .authProvider("LOCAL")
                .mfaEnabled(false)
                .lastLoginAt(LocalDateTime.now())
                .build();

        usuario = usuarioRepository.save(usuario);

        // Generar token JWT local
        String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getEmail(), usuario.getRole());

        return new AuthResponse(
                token,
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }

    public AuthResponse login(LoginRequest request) {
        // Buscar por username o email
        Usuario usuario = usuarioRepository
                .findByUsernameOrEmail(request.usernameOrEmail(), request.usernameOrEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuario o contraseña incorrectos."));

        // Login local requiere password_hash (usuarios Clerk no tienen contraseña local)
        if (usuario.getPasswordHash() == null || usuario.getPasswordHash().isBlank()) {
            throw new IllegalArgumentException(
                "Esta cuenta usa autenticación externa (Clerk/Google). Por favor inicia sesión con Clerk."
            );
        }

        // Validar password
        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos.");
        }

        // Actualizar último login
        usuario.setLastLoginAt(LocalDateTime.now());
        usuarioRepository.save(usuario);

        // Generar token JWT local
        String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getEmail(), usuario.getRole());

        return new AuthResponse(
                token,
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }

    /**
     * Construye el perfil del usuario autenticado.
     * Funciona tanto para usuarios locales como Clerk.
     * NO incluye password_hash ni tokens.
     */
    public ProfileResponse getProfile(Usuario usuario) {
        return new ProfileResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getPhone(),
                usuario.getRole(),
                usuario.getAuthProvider() != null ? usuario.getAuthProvider() : "LOCAL",
                usuario.isMfaEnabled()
        );
    }

    public ProfileResponse updateProfile(Usuario usuario, String phone) {
        if (phone != null) {
            usuario.setPhone(phone);
        }
        usuarioRepository.save(usuario);

        return new ProfileResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getPhone(),
                usuario.getRole(),
                usuario.getAuthProvider() != null ? usuario.getAuthProvider() : "LOCAL",
                usuario.isMfaEnabled()
        );
    }
}
