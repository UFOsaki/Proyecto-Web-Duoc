package com.sharingan_comics.sharingan_comics.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Pruebas unitarias para JwtUtil.
 * No requieren contexto de Spring — son tests puros de lógica.
 */
@DisplayName("JwtUtil - Pruebas unitarias")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    // Clave de 64+ caracteres para cumplir con HS256/HS512
    private static final String SECRET =
        "sharingan-comics-jwt-secret-local-development-2026-very-secure-key-32chars";
    private static final long EXPIRATION_MS = 86_400_000L; // 24h

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, EXPIRATION_MS);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // generateToken
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateToken devuelve un token no nulo y no vacío")
    void generateToken_returnsNonBlankToken() {
        String token = jwtUtil.generateToken("testuser", "test@test.cl", "CUSTOMER");
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("generateToken contiene tres partes separadas por puntos (JWT)")
    void generateToken_hasThreeParts() {
        String token = jwtUtil.generateToken("testuser", "test@test.cl", "CUSTOMER");
        assertThat(token.split("\\.")).hasSize(3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getUsername
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUsername extrae el username correcto del token")
    void getUsername_returnsCorrectUsername() {
        String token    = jwtUtil.generateToken("smokeUser", "smoke@test.cl", "CUSTOMER");
        String username = jwtUtil.getUsername(token);
        assertThat(username).isEqualTo("smokeUser");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // isValid
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isValid retorna true para un token recién generado")
    void isValid_trueForFreshToken() {
        String token = jwtUtil.generateToken("user1", "u@test.cl", "CUSTOMER");
        assertThat(jwtUtil.isValid(token)).isTrue();
    }

    @Test
    @DisplayName("isValid retorna false para un token claramente inválido")
    void isValid_falseForGarbageToken() {
        assertThat(jwtUtil.isValid("este.no.esuntoken")).isFalse();
    }

    @Test
    @DisplayName("isValid retorna false para token nulo")
    void isValid_falseForNull() {
        assertThat(jwtUtil.isValid(null)).isFalse();
    }

    @Test
    @DisplayName("isValid retorna false para token expirado (expiración de 1ms)")
    void isValid_falseForExpiredToken() throws InterruptedException {
        JwtUtil shortLivedUtil = new JwtUtil(SECRET, 1L); // expira en 1ms
        String token = shortLivedUtil.generateToken("user", "u@test.cl", "CUSTOMER");
        Thread.sleep(10); // esperar que expire
        assertThat(shortLivedUtil.isValid(token)).isFalse();
    }

    @Test
    @DisplayName("isValid retorna false para token firmado con otro secreto")
    void isValid_falseForTokenSignedWithDifferentSecret() {
        JwtUtil otherUtil = new JwtUtil(
            "otro-secreto-completamente-diferente-con-mas-de-32-caracteres-ok",
            EXPIRATION_MS
        );
        String tokenDeOtro = otherUtil.generateToken("user", "u@test.cl", "CUSTOMER");
        assertThat(jwtUtil.isValid(tokenDeOtro)).isFalse();
    }
}
