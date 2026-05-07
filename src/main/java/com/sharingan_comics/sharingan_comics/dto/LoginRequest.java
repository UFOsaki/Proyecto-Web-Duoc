package com.sharingan_comics.sharingan_comics.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El usuario o correo es obligatorio")
        String usernameOrEmail,

        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {}
