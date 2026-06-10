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

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

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
                // ─── Autenticación ───────────────────────────────────────
                .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/logout").permitAll()

                // ─── Webhook MP (sin JWT) ─────────────────────────────────
                .requestMatchers("/api/payments/webhook", "/api/payments/webhook/**").permitAll()

                // ─── APIs públicas ────────────────────────────────────────
                .requestMatchers("/api/mangas/**", "/api/images/**").permitAll()

                // ─── Recursos estáticos y páginas de pago ────────────────
                .requestMatchers(
                    "/", "/index.html",
                    "/**/*.html", "/**/*.css", "/**/*.js",
                    "/**/*.png", "/**/*.jpg", "/**/*.webp",
                    "/**/*.svg", "/**/*.ico", "/**/*.woff2",
                    "/assets/**"
                ).permitAll()

                // ─── Endpoints autenticados ───────────────────────────────
                .requestMatchers("/api/auth/profile").authenticated()
                .requestMatchers("/api/payments/create-preference").authenticated()

                // ─── Todo lo demás requiere autenticación ─────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Bean CORS explícito — requerido para que Spring Security aplique las reglas.
     * Orígenes permitidos: localhost (dev), GitHub Pages, Render (prod).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:8080",
            "http://localhost:5500",
            "http://localhost:5501",
            "http://127.0.0.1:5500",
            "http://127.0.0.1:5501",
            "https://ufosaki.github.io",
            "https://felipedev-one.github.io"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
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
