package com.sharingan_comics.sharingan_comics.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * ImageProxyController
 * --------------------
 * Proxy reverso para las imágenes de portada de los mangas.
 * Sirve las imágenes como bytes desde el mismo origen (localhost:8080),
 * evitando cualquier problema CORS o de mixed-content.
 *
 * Uso: GET /api/images?path=/uploads/naruto.jpg
 */
@RestController
@RequestMapping("/api/images")
public class ImageProxyController {

    private static final Logger log = LoggerFactory.getLogger(ImageProxyController.class);
    private static final String EXTERNAL_API_BASE = "https://api-rest-manga.onrender.com";

    private final HttpClient httpClient;

    public ImageProxyController() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @GetMapping
    public ResponseEntity<byte[]> proxyImage(@RequestParam String path) {
        // Validación básica: solo rutas que empiecen con /uploads/
        if (path == null || !path.startsWith("/uploads/")) {
            log.warn("Ruta de imagen inválida bloqueada: {}", path);
            return ResponseEntity.badRequest().build();
        }

        String url = EXTERNAL_API_BASE + path;
        log.info("Proxy imagen → GET {}", url);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String contentType = detectContentType(path);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                        .body(response.body());
            } else {
                log.warn("Imagen devolvió status {}: {}", response.statusCode(), url);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
            }

        } catch (IOException | InterruptedException e) {
            log.error("Error al obtener imagen {}: {}", url, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    private String detectContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".gif"))  return "image/gif";
        return "image/jpeg";
    }
}
