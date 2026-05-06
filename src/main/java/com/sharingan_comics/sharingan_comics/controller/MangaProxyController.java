package com.sharingan_comics.sharingan_comics.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * MangaProxyController
 * --------------------
 * Proxy reverso hacia la API externa de mangas.
 * Usa java.net.http.HttpClient (JDK 11+) en lugar de RestClient
 * para mayor compatibilidad y control sobre timeouts.
 */
@RestController
@RequestMapping("/api/mangas")
public class MangaProxyController {

    private static final Logger log = LoggerFactory.getLogger(MangaProxyController.class);
    private static final String EXTERNAL_API_BASE = "https://api-rest-manga.onrender.com";

    private final HttpClient httpClient;

    public MangaProxyController() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * GET /api/mangas
     * Retorna la lista completa de mangas desde la API externa.
     */
    @GetMapping(produces = "application/json")
    public ResponseEntity<String> getAllMangas() {
        String url = EXTERNAL_API_BASE + "/images";
        log.info("Proxy → GET {}", url);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("API respondió con status {}", response.statusCode());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "application/json; charset=utf-8")
                        .body(response.body());
            } else {
                log.warn("API devolvió status inesperado: {}", response.statusCode());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("{\"error\": \"API externa devolvió status " + response.statusCode() + "\"}");
            }
        } catch (IOException | InterruptedException e) {
            log.error("Error al contactar la API externa: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"No se pudo contactar la API externa de mangas.\"}");
        }
    }

    /**
     * GET /api/mangas/{id}
     * Retorna los detalles de un manga específico por su ID.
     */
    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<String> getMangaById(@PathVariable String id) {
        String url = EXTERNAL_API_BASE + "/images/" + id;
        log.info("Proxy → GET {}", url);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "application/json; charset=utf-8")
                        .body(response.body());
            } else {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("{\"error\": \"API externa devolvió status " + response.statusCode() + "\"}");
            }
        } catch (IOException | InterruptedException e) {
            log.error("Error al obtener manga {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"No se pudo obtener el manga con id: " + id + "\"}");
        }
    }
}
