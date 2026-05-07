package com.sharingan_comics.sharingan_comics.dto.payment;

public record CreatePreferenceResponse(
    String preferenceId,
    String initPoint,
    String sandboxInitPoint,
    String externalReference,
    String message
) {}
