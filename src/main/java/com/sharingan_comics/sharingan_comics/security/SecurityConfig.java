package com.sharingan_comics.sharingan_comics.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.Arrays;
import java.util.List;

/**
 * SecurityConfig
 * --------------
 * Configura Spring Security para convivencia de JWT local y Clerk.
 *
 * Políticas de acceso:
 *  - Públicos: catálogo, assets, login/register, webhooks MP, páginas de pago.
 *  - Autenticados: profile, create-preference.
 *  - Solo ADMIN: gestión de productos e inventario sensible.
 *
 * CORS:
 *  Permite orígenes de desarrollo, GitHub Pages y Render.
 *  Requerido para que el frontend pueda enviar Authorization: Bearer.
 *
 * Cumplimiento:
 *  - ISO 27001 A.9.4.1 (restricción de acceso a información)
 *  - ISO 27001 A.13.1.3 (segregación en redes)
 *  - Ley 21.663 (seguridad de sistemas y redes)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Value("${allowed.origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ─── Endpoints de autenticación (público) ─────────────────────
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/logout"
                ).permitAll()

                // ─── Webhook Mercado Pago (sin JWT, IP/secret de MP) ──────────
                .requestMatchers(
                    "/api/payments/webhook",
                    "/api/payments/webhook/**"
                ).permitAll()

                // ─── API de productos/mangas (catálogo público) ───────────────
                .requestMatchers(
                    "/api/mangas/**",
                    "/api/images/**",
                    "/api/productos"        // GET catálogo (si existe endpoint propio)
                ).permitAll()

                // ─── Recursos estáticos y páginas de resultado de pago ────────
                .requestMatchers(
                    AntPathRequestMatcher.antMatcher("/"),
                    AntPathRequestMatcher.antMatcher("/index.html"),
                    AntPathRequestMatcher.antMatcher("/**/*.html"),
                    AntPathRequestMatcher.antMatcher("/**/*.css"),
                    AntPathRequestMatcher.antMatcher("/**/*.js"),
                    AntPathRequestMatcher.antMatcher("/**/*.png"),
                    AntPathRequestMatcher.antMatcher("/**/*.jpg"),
                    AntPathRequestMatcher.antMatcher("/**/*.jpeg"),
                    AntPathRequestMatcher.antMatcher("/**/*.webp"),
                    AntPathRequestMatcher.antMatcher("/**/*.svg"),
                    AntPathRequestMatcher.antMatcher("/**/*.ico"),
                    AntPathRequestMatcher.antMatcher("/**/*.woff"),
                    AntPathRequestMatcher.antMatcher("/**/*.woff2"),
                    AntPathRequestMatcher.antMatcher("/**/*.ttf"),
                    AntPathRequestMatcher.antMatcher("/assets/**"),
                    AntPathRequestMatcher.antMatcher("/payment-success.html"),
                    AntPathRequestMatcher.antMatcher("/payment-failure.html"),
                    AntPathRequestMatcher.antMatcher("/payment-pending.html")
                ).permitAll()

                // ─── Endpoints autenticados (JWT local o Clerk) ───────────────
                .requestMatchers(
                    "/api/auth/profile",
                    "/api/auth/me"
                ).authenticated()

                .requestMatchers("/api/payments/create-preference").authenticated()

                // ─── Solo ADMIN ───────────────────────────────────────────────
                // Gestión de productos e inventario — NUNCA exponer al CUSTOMER
                .requestMatchers(
                    "/api/admin/**"
                ).hasRole("ADMIN")

                // ─── Todo lo demás requiere autenticación ─────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuración CORS explícita.
     *
     * Orígenes permitidos:
     *  - localhost (desarrollo con Spring Boot y Live Server)
     *  - GitHub Pages (producción frontend)
     *  - Render (producción backend, si el frontend está separado)
     *
     * IMPORTANTE: allowedOriginPatterns("*") NO se usa — sería inseguro con allowCredentials=true.
     * Agregar dominios de Render cuando estén disponibles.
     *
     * Cumplimiento: ISO 27001 A.13.1.3, Ley 21.663 (seguridad redes).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
