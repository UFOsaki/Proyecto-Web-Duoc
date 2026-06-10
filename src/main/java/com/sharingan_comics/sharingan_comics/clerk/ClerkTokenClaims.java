package com.sharingan_comics.sharingan_comics.clerk;

/**
 * ClerkTokenClaims
 * ----------------
 * DTO inmutable con los claims relevantes extraídos de un JWT de Clerk.
 *
 * Solo contiene datos necesarios para la sincronización de usuario:
 *  - clerkUserId: identificador único en Clerk (claim "sub")
 *  - email: dirección de correo del usuario
 *  - firstName / lastName: para derivar username si es usuario nuevo
 *  - mfaEnabled: si completó un segundo factor (indicador observacional)
 *
 * Principio de minimización de datos (Ley 21.719 art. 3 lit. c):
 *  No se almacenan claims innecesarios (ej. raw token, session_id, etc.)
 *
 * Nota: Se usa Builder manual (sin Lombok) para mantener control explícito
 * y no depender de generación de código en este DTO crítico.
 */
public class ClerkTokenClaims {

    private final String clerkUserId;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final boolean mfaEnabled;

    private ClerkTokenClaims(Builder builder) {
        this.clerkUserId = builder.clerkUserId;
        this.email       = builder.email;
        this.firstName   = builder.firstName;
        this.lastName    = builder.lastName;
        this.mfaEnabled  = builder.mfaEnabled;
    }

    public String getClerkUserId() { return clerkUserId; }
    public String getEmail()       { return email; }
    public String getFirstName()   { return firstName; }
    public String getLastName()    { return lastName; }
    public boolean isMfaEnabled()  { return mfaEnabled; }

    /**
     * Deriva un username a partir del nombre, apellido o email.
     * Garantiza que el resultado sea válido (alfanumérico, <= 80 chars).
     */
    public String deriveUsername() {
        // 1. Intentar con nombre + apellido
        if (firstName != null && !firstName.isBlank()) {
            String base = firstName.toLowerCase().replaceAll("[^a-z0-9]", "");
            if (lastName != null && !lastName.isBlank()) {
                base += "." + lastName.toLowerCase().replaceAll("[^a-z0-9]", "");
            }
            if (!base.isBlank() && base.length() <= 75) {
                return base;
            }
        }
        // 2. Fallback: parte local del email
        if (email != null && email.contains("@")) {
            String local = email.split("@")[0].toLowerCase().replaceAll("[^a-z0-9._-]", "");
            if (!local.isBlank() && local.length() <= 80) {
                return local;
            }
        }
        // 3. Último recurso: prefijo clerk_ + parte del ID
        String suffix = clerkUserId != null && clerkUserId.length() > 8
                ? clerkUserId.substring(clerkUserId.length() - 8)
                : "user";
        return "clerk_" + suffix;
    }

    /**
     * Representación segura — NO incluye el clerkUserId completo.
     */
    @Override
    public String toString() {
        String safeId = clerkUserId != null && clerkUserId.length() > 8
                ? clerkUserId.substring(0, 8) + "..."
                : "[null]";
        return "ClerkTokenClaims{clerkUserId='" + safeId
                + "', email='" + (email != null ? email.replaceAll("(?<=.).(?=.*@)", "*") : "null") + '\''
                + ", mfaEnabled=" + mfaEnabled + '}';
    }

    // ─── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String clerkUserId;
        private String email;
        private String firstName;
        private String lastName;
        private boolean mfaEnabled = false;

        public Builder clerkUserId(String clerkUserId) {
            this.clerkUserId = clerkUserId;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder mfaEnabled(boolean mfaEnabled) {
            this.mfaEnabled = mfaEnabled;
            return this;
        }

        public ClerkTokenClaims build() {
            if (clerkUserId == null || clerkUserId.isBlank()) {
                throw new IllegalStateException("clerkUserId no puede ser null o vacío");
            }
            return new ClerkTokenClaims(this);
        }
    }
}
