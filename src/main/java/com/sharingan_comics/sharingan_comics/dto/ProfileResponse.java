package com.sharingan_comics.sharingan_comics.dto;

public record ProfileResponse(
        Long userId,
        String username,
        String email,
        String phone,
        String role
) {}
