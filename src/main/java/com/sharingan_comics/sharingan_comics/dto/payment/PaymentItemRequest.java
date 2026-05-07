package com.sharingan_comics.sharingan_comics.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PaymentItemRequest(
    @NotBlank(message = "El código del producto es obligatorio")
    String productCode,
    
    @NotBlank(message = "El título es obligatorio")
    String title,
    
    String description,
    
    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser mayor a 0")
    Integer quantity,
    
    @NotNull(message = "El precio unitario es obligatorio")
    @Positive(message = "El precio unitario debe ser mayor a 0")
    BigDecimal unitPrice
) {}
