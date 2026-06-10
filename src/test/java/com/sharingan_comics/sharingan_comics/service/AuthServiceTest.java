package com.sharingan_comics.sharingan_comics.service;

import com.sharingan_comics.sharingan_comics.dto.AuthResponse;
import com.sharingan_comics.sharingan_comics.dto.LoginRequest;
import com.sharingan_comics.sharingan_comics.dto.RegisterRequest;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.repository.UsuarioRepository;
import com.sharingan_comics.sharingan_comics.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para AuthService usando Mockito.
 * No requieren base de datos ni contexto Spring.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Pruebas unitarias")
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtUtil jwtUtil;

    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        // Inyectar el encoder real manualmente (Mockito no mockea PasswordEncoder)
        authService = new AuthService(usuarioRepository, passwordEncoder, jwtUtil);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Registro
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register: crea usuario exitosamente cuando email y username no existen")
    void register_success() {
        when(usuarioRepository.existsByEmail("nuevo@test.cl")).thenReturn(false);
        when(usuarioRepository.existsByUsername("nuevousr")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setIdUsuario(1L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("token-fake");

        RegisterRequest req = new RegisterRequest("nuevousr", "nuevo@test.cl", "pass123", "");
        AuthResponse resp    = authService.register(req);

        assertThat(resp).isNotNull();
        assertThat(resp.token()).isEqualTo("token-fake");
        assertThat(resp.username()).isEqualTo("nuevousr");
        assertThat(resp.email()).isEqualTo("nuevo@test.cl");
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    @DisplayName("register: lanza IllegalArgumentException cuando el email ya existe")
    void register_failsDuplicateEmail() {
        when(usuarioRepository.existsByEmail("dup@test.cl")).thenReturn(true);

        RegisterRequest req = new RegisterRequest("usr2", "dup@test.cl", "pass", "");

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("correo");
    }

    @Test
    @DisplayName("register: lanza IllegalArgumentException cuando el username ya existe")
    void register_failsDuplicateUsername() {
        when(usuarioRepository.existsByEmail(anyString())).thenReturn(false);
        when(usuarioRepository.existsByUsername("duplicado")).thenReturn(true);

        RegisterRequest req = new RegisterRequest("duplicado", "otro@test.cl", "pass", "");

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("usuario");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: retorna AuthResponse con token cuando credenciales son correctas")
    void login_success() {
        String hashedPwd = passwordEncoder.encode("correctPass");
        Usuario usuario  = Usuario.builder()
            .idUsuario(1L)
            .username("smoke")
            .email("smoke@test.cl")
            .passwordHash(hashedPwd)
            .role("CUSTOMER")
            .build();

        when(usuarioRepository.findByUsernameOrEmail("smoke@test.cl", "smoke@test.cl"))
            .thenReturn(Optional.of(usuario));
        when(jwtUtil.generateToken("smoke", "smoke@test.cl", "CUSTOMER")).thenReturn("jwt-ok");

        LoginRequest req = new LoginRequest("smoke@test.cl", "correctPass");
        AuthResponse resp = authService.login(req);

        assertThat(resp.token()).isEqualTo("jwt-ok");
        assertThat(resp.username()).isEqualTo("smoke");
    }

    @Test
    @DisplayName("login: lanza IllegalArgumentException con contraseña incorrecta")
    void login_failsWrongPassword() {
        String hashedPwd = passwordEncoder.encode("correctPass");
        Usuario usuario  = Usuario.builder()
            .idUsuario(1L)
            .username("smoke")
            .email("smoke@test.cl")
            .passwordHash(hashedPwd)
            .role("CUSTOMER")
            .build();

        when(usuarioRepository.findByUsernameOrEmail("smoke@test.cl", "smoke@test.cl"))
            .thenReturn(Optional.of(usuario));

        LoginRequest req = new LoginRequest("smoke@test.cl", "wrongPass");

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("incorrectos");
    }

    @Test
    @DisplayName("login: lanza IllegalArgumentException cuando el usuario no existe")
    void login_failsUserNotFound() {
        when(usuarioRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest("noexiste@test.cl", "pass");

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("incorrectos");
    }
}
