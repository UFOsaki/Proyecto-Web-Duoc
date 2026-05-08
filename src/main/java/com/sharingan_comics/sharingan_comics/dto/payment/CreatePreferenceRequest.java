package com.sharingan_comics.sharingan_comics.dto.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreatePreferenceRequest(
    @NotBlank(message = "El email del comprador es obligatorio")
    @Email(message = "Formato de email inválido")
    String buyerEmail,
    
    @NotEmpty(message = "El carrito no puede estar vacío")
    @Valid
    List<PaymentItemRequest> items
) {}
