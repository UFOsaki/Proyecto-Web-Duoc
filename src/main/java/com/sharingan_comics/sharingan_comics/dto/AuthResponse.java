package com.sharingan_comics.sharingan_comics.dto;

public record AuthResponse(
        String token,
        Long userId,
        String username,
        String email,
        String role
) {}
