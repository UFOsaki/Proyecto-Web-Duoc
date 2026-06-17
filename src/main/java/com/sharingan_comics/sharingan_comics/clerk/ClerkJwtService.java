package com.sharingan_comics.sharingan_comics.clerk;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * ClerkJwtService
 * ---------------
 * Servicio responsable de validar tokens JWT emitidos por Clerk.
 *
 * Flujo de validación:
 *  1. Descargar JWKS de la URL configurada en Clerk.
 *  2. Cachear claves públicas en memoria (Map kid → PublicKey).
 *  3. Para cada token: parsear header → obtener "kid" → validar firma.
 *  4. Verificar issuer, expiración y subject.
 *  5. Extraer claims relevantes (sub, email, mfa).
 *
 * Seguridad:
 *  - NUNCA imprime el token completo en logs.
 *  - Solo loguea sub (clerk user id) truncado para trazabilidad.
 *  - Falla silenciosamente si Clerk no está configurado (isEnabled=false).
 *
 * Cumplimiento:
 *  - ISO 27001 A.10.1 (criptografía), A.12.4 (logging)
 *  - Ley 21.459 (evitar manipulación de tokens)
 *  - ISO 25010 (seguridad, confiabilidad)
 */
@Service
public class ClerkJwtService {

    private static final Logger log = LoggerFactory.getLogger(ClerkJwtService.class);

    private final ClerkProperties clerkProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // Cache de claves públicas: kid → PublicKey
    private final Map<String, PublicKey> jwksCache = new ConcurrentHashMap<>();

    public ClerkJwtService(ClerkProperties clerkProperties) {
        this.clerkProperties = clerkProperties;
    }

    @PostConstruct
    public void init() {
        if (!clerkProperties.isEnabled()) {
            log.info("[Clerk] Integración deshabilitada (clerk.enabled=false). Solo JWT local activo.");
            return;
        }
        if (!clerkProperties.isConfigured()) {
            log.warn("[Clerk] Habilitado pero faltan clerk.issuer o clerk.jwks-url. Deshabilitar o completar configuración.");
            return;
        }
        log.info("[Clerk] Integración habilitada. Issuer: {}", clerkProperties.getIssuer());
        refreshJwks();
    }

    /**
     * Descarga y cachea las claves públicas del endpoint JWKS de Clerk.
     * Se puede llamar periódicamente para rotar claves sin reiniciar.
     */
    public void refreshJwks() {
        if (!clerkProperties.isConfigured()) return;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(clerkProperties.getJwksUrl()))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("[Clerk] Error obteniendo JWKS: HTTP {}", response.statusCode());
                return;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode keys = root.get("keys");
            if (keys == null || !keys.isArray()) {
                log.error("[Clerk] JWKS response no contiene array 'keys'");
                return;
            }

            jwksCache.clear();
            for (JsonNode key : keys) {
                String kid = key.get("kid").asText();
                PublicKey publicKey = buildRsaPublicKey(key);
                if (publicKey != null) {
                    jwksCache.put(kid, publicKey);
                }
            }
            log.info("[Clerk] JWKS cargado. Claves disponibles: {}", jwksCache.size());

        } catch (Exception e) {
            log.error("[Clerk] Error al cargar JWKS: {}", e.getMessage());
        }
    }

    /**
     * Construye una RSAPublicKey desde un nodo JWK (n y e en Base64url).
     */
    private PublicKey buildRsaPublicKey(JsonNode keyNode) {
        try {
            byte[] nBytes = Base64.getUrlDecoder().decode(keyNode.get("n").asText());
            byte[] eBytes = Base64.getUrlDecoder().decode(keyNode.get("e").asText());

            BigInteger modulus = new BigInteger(1, nBytes);
            BigInteger exponent = new BigInteger(1, eBytes);

            RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return factory.generatePublic(spec);
        } catch (Exception e) {
            log.error("[Clerk] Error construyendo clave RSA: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Valida un token JWT de Clerk.
     *
     * @param token Token Bearer (sin el prefijo "Bearer ")
     * @return Optional con los claims si el token es válido, empty si no.
     *
     * Proceso:
     *  1. Extraer "kid" del header del JWT sin validar.
     *  2. Buscar la clave pública en el cache JWKS.
     *  3. Si no está en cache, refrescar JWKS e intentar de nuevo.
     *  4. Validar firma, issuer y expiración.
     *  5. Retornar claims si todo es válido.
     */
    public Optional<ClerkTokenClaims> validateToken(String token) {
        if (!clerkProperties.isEnabled() || token == null || token.isBlank()) {
            return Optional.empty();
        }

        try {
            // Parsear header sin verificar para obtener kid
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            JsonNode header = objectMapper.readTree(headerJson);
            String kid = header.has("kid") ? header.get("kid").asText() : null;

            if (kid == null) {
                log.debug("[Clerk] Token sin 'kid' en header — no es un token Clerk");
                return Optional.empty();
            }

            // Buscar clave en cache; refrescar si no existe
            PublicKey publicKey = jwksCache.get(kid);
            if (publicKey == null) {
                log.debug("[Clerk] kid '{}' no encontrado en cache, refrescando JWKS", kid);
                refreshJwks();
                publicKey = jwksCache.get(kid);
            }

            if (publicKey == null) {
                log.warn("[Clerk] kid '{}' no encontrado en JWKS después de refresh", kid);
                return Optional.empty();
            }

            return validateWithRsaKey(token, publicKey);

        } catch (Exception e) {
            // No loguear el token completo — solo el tipo de error
            log.debug("[Clerk] Token inválido: {}", e.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    /**
     * Validación RSA usando JJWT 0.12.x con clave pública RSA.
     */
    private Optional<ClerkTokenClaims> validateWithRsaKey(String token, PublicKey publicKey) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith((java.security.interfaces.RSAPublicKey) publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String iss = claims.getIssuer();
            String configuredIssuer = clerkProperties.getIssuer();
            if (iss == null || (!iss.equals(configuredIssuer) && !iss.equals(configuredIssuer + "/"))) {
                log.warn("[Clerk] Issuer no coincide. Token: {}, Configurado: {}", iss, configuredIssuer);
                return Optional.empty();
            }

            String clerkUserId = claims.getSubject();
            if (clerkUserId == null || clerkUserId.isBlank()) {
                log.warn("[Clerk] Token válido pero sin 'sub'");
                return Optional.empty();
            }

            // Extraer email (puede estar en diferentes claims según config Clerk)
            String email = getClaimAsString(claims, "email");
            if (email == null) {
                email = getClaimAsString(claims, "email_address");
            }

            // Extraer indicador MFA (Clerk puede exponerlo como metadata o factor)
            boolean mfaEnabled = extractMfaStatus(claims);

            // Extraer nombre (para username derivado si el usuario es nuevo)
            String firstName = getClaimAsString(claims, "first_name");
            String lastName  = getClaimAsString(claims, "last_name");

            // Loguear sólo el ID truncado, nunca el token completo
            String safeId = clerkUserId.length() > 12
                    ? clerkUserId.substring(0, 12) + "..."
                    : clerkUserId;
            log.info("[Clerk] Token válido para usuario: {}", safeId);

            return Optional.of(ClerkTokenClaims.builder()
                    .clerkUserId(clerkUserId)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .mfaEnabled(mfaEnabled)
                    .build());

        } catch (Exception e) {
            log.warn("[Clerk] Validación RSA fallida: {} — {}", e.getClass().getSimpleName(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Intenta detectar si el usuario tiene MFA activo desde los claims del token.
     * Clerk puede exponer esto de distintas formas según la versión/configuración.
     */
    private boolean extractMfaStatus(Claims claims) {
        try {
            // Clerk JWT v2: el claim "fva" (factor verification age) indica 2FA completado
            Object fva = claims.get("fva");
            if (fva instanceof java.util.List) {
                java.util.List<?> factors = (java.util.List<?>) fva;
                return factors.size() > 1; // más de un factor = MFA activo
            }
            // Alternativa: metadata pública del usuario
            Object meta = claims.get("public_metadata");
            if (meta instanceof Map) {
                Object mfa = ((Map<?, ?>) meta).get("mfa_enabled");
                return Boolean.TRUE.equals(mfa) || "true".equals(String.valueOf(mfa));
            }
        } catch (Exception e) {
            // No crítico — default false
        }
        return false;
    }

    private String getClaimAsString(Claims claims, String key) {
        Object value = claims.get(key);
        return value != null ? String.valueOf(value) : null;
    }

    /**
     * Verifica si el token parece ser de Clerk (tiene "kid" en el header).
     * Permite al filtro decidir si intentar validación Clerk o JWT local.
     * NO valida el token, solo inspecciona el header.
     */
    public boolean looksLikeClerkToken(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            JsonNode header = objectMapper.readTree(headerJson);
            return header.has("kid");
        } catch (Exception e) {
            return false;
        }
    }
}
