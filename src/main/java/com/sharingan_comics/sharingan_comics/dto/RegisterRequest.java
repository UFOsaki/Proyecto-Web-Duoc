package com.sharingan_comics.sharingan_comics.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(min = 3, max = 80, message = "El nombre de usuario debe tener entre 3 y 80 caracteres")
        String username,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo debe ser válido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 100, message = "La contraseña debe tener al menos 6 caracteres")
        String password,

        String phone
) {}
