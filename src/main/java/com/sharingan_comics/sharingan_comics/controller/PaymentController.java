package com.sharingan_comics.sharingan_comics.controller;

import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceRequest;
import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceResponse;
import com.sharingan_comics.sharingan_comics.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-preference")
    public ResponseEntity<CreatePreferenceResponse> createPreference(
            @Valid @RequestBody CreatePreferenceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        CreatePreferenceResponse response = paymentService.createPreference(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> receiveWebhook(@RequestParam Map<String, String> allParams) {
        paymentService.processWebhook(allParams);
        return ResponseEntity.ok("OK");
    }
    
    @GetMapping("/webhook")
    public ResponseEntity<String> receiveWebhookGet(@RequestParam Map<String, String> allParams) {
        // A veces Mercado Pago envía validaciones por GET
        paymentService.processWebhook(allParams);
        return ResponseEntity.ok("OK");
    }
}
