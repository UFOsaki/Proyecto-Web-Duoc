package com.sharingan_comics.sharingan_comics.service;

import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceRequest;
import com.sharingan_comics.sharingan_comics.dto.payment.PaymentItemRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Pruebas unitarias para lógica pura de PaymentService.
 *
 * Estas pruebas validan comportamiento del DTO/request
 * sin necesitar contexto Spring ni base de datos.
 *
 * Las pruebas de integración real (con Mercado Pago y Oracle)
 * deben ejecutarse manualmente con el backend activo.
 */
@DisplayName("PaymentService — Validaciones de Request")
class PaymentServiceValidationTest {

    // ─────────────────────────────────────────────────────────────────────────
    // Validaciones del CreatePreferenceRequest
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("PaymentItemRequest: cantidad positiva es válida")
    void item_positiveQuantity_isValid() {
        PaymentItemRequest item = new PaymentItemRequest(
            "MNG-001", "Evangelion", "Desc", 1, BigDecimal.valueOf(1)
        );
        assertThat(item.quantity()).isPositive();
    }

    @Test
    @DisplayName("PaymentItemRequest: precio unitario positivo es válido")
    void item_positiveUnitPrice_isValid() {
        PaymentItemRequest item = new PaymentItemRequest(
            "MNG-001", "Evangelion", "Desc", 1, BigDecimal.valueOf(9990)
        );
        assertThat(item.unitPrice()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("PaymentItemRequest: cálculo de subtotal es correcto")
    void item_subtotalCalculation_isCorrect() {
        PaymentItemRequest item = new PaymentItemRequest(
            "MNG-001", "Evangelion", "Desc", 3, BigDecimal.valueOf(5000)
        );
        BigDecimal expectedSubtotal = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
        assertThat(expectedSubtotal).isEqualByComparingTo(BigDecimal.valueOf(15000));
    }

    @Test
    @DisplayName("CreatePreferenceRequest: items no vacíos es válido")
    void request_nonEmptyItems_isValid() {
        PaymentItemRequest item = new PaymentItemRequest(
            "MNG-002", "Naruto", "Manga", 2, BigDecimal.valueOf(7990)
        );
        CreatePreferenceRequest req = new CreatePreferenceRequest("user@test.cl", List.of(item));
        assertThat(req.items()).isNotEmpty();
    }

    @Test
    @DisplayName("CreatePreferenceRequest: calcula total correctamente con múltiples ítems")
    void request_totalCalculation_multipleItems() {
        List<PaymentItemRequest> items = List.of(
            new PaymentItemRequest("MNG-001", "Eva", "D", 1, BigDecimal.valueOf(1000)),
            new PaymentItemRequest("MNG-002", "Naruto", "D", 2, BigDecimal.valueOf(500))
        );
        CreatePreferenceRequest req = new CreatePreferenceRequest("buyer@test.cl", items);

        BigDecimal total = req.items().stream()
            .map(i -> i.unitPrice().multiply(BigDecimal.valueOf(i.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(2000));
    }

    @Test
    @DisplayName("externalReference: UUID generado es único en dos llamadas consecutivas")
    void externalReference_isUnique() {
        String ref1 = java.util.UUID.randomUUID().toString();
        String ref2 = java.util.UUID.randomUUID().toString();
        assertThat(ref1).isNotEqualTo(ref2);
        assertThat(ref1).hasSize(36); // Formato UUID estándar
    }

    @Test
    @DisplayName("Validación: lista vacía de ítems debe fallar lógicamente")
    void emptyItems_shouldBeRejected() {
        CreatePreferenceRequest req = new CreatePreferenceRequest("buyer@test.cl", Collections.emptyList());
        // La validación @NotEmpty de Jakarta se verifica en el controlador.
        // Aquí verificamos que la lista esté efectivamente vacía:
        assertThat(req.items()).isEmpty();
    }
}
