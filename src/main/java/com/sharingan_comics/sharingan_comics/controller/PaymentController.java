package com.sharingan_comics.sharingan_comics.controller;

import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceRequest;
import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceResponse;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Crea una preferencia de pago en Mercado Pago.
     * Requiere JWT válido. El principal es un objeto Usuario (no UserDetails).
     */
    @PostMapping("/create-preference")
    public ResponseEntity<?> createPreference(
            @Valid @RequestBody CreatePreferenceRequest request,
            @AuthenticationPrincipal Usuario usuario) {

        // Validar autenticación explícitamente (evita NPE → 500)
        if (usuario == null) {
            log.warn("Intento de crear preferencia sin usuario autenticado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No autenticado. Por favor inicia sesión."));
        }

        log.info("Creando preferencia para usuario: {}", usuario.getUsername());

        try {
            CreatePreferenceResponse response = paymentService.createPreference(request, usuario);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Solicitud de pago inválida: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error al crear preferencia de pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Webhook de Mercado Pago — no requiere JWT.
     * Acepta tanto parámetros query como body JSON.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> receiveWebhook(
            @RequestParam(required = false) Map<String, String> allParams,
            @RequestBody(required = false) Map<String, Object> body) {

        log.info("Webhook POST recibido. Params: {}", allParams);
        if (body != null) {
            log.info("Webhook body: {}", body);
        }

        // Mergear params + body para procesamiento unificado
        Map<String, String> mergedParams = new java.util.HashMap<>();
        if (allParams != null) mergedParams.putAll(allParams);
        if (body != null) {
            body.forEach((k, v) -> mergedParams.put(k, v != null ? v.toString() : null));
        }

        paymentService.processWebhook(mergedParams);
        return ResponseEntity.ok("OK");
    }

    /**
     * GET webhook — Mercado Pago usa GET para validaciones iniciales.
     */
    @GetMapping("/webhook")
    public ResponseEntity<String> receiveWebhookGet(
            @RequestParam(required = false) Map<String, String> allParams) {

        log.info("Webhook GET recibido. Params: {}", allParams);
        if (allParams != null && !allParams.isEmpty()) {
            paymentService.processWebhook(allParams);
        }
        return ResponseEntity.ok("OK");
    }
}
