# Seguridad Clerk — Sharingan Comics
**Rama:** `Smoke` | **Versión:** 2026-06 | **Estado:** Integración progresiva (convivencia JWT + Clerk)

---

## 1. Decisiones técnicas de seguridad

### 1.1 Arquitectura de identidad dual (período de transición)

Durante el período de convivencia temporal, el sistema acepta **dos tipos de token** en el header `Authorization: Bearer`:

| Token | Emisor | Validación | Detección |
|-------|--------|-----------|-----------|
| JWT Local | Spring Boot (HMAC-SHA256) | `JwtUtil.isValid()` con clave simétrica | Ausencia de `kid` en header |
| JWT Clerk | Clerk (RSA-RS256) | `ClerkJwtService` con JWKS público | Presencia de `kid` en header |

**`JwtFilter`** detecta el tipo de token inspeccionando el header del JWT (campo `kid`) sin validar la firma primero. Esta heurística es segura porque:
- Un JWT sin `kid` jamás pasará la validación RSA de Clerk.
- Un JWT con `kid` no conocido tampoco pasará (el `kid` debe estar en el JWKS).

### 1.2 Roles — fuente de verdad: Oracle

**El rol del usuario (`CUSTOMER`, `ADMIN`) se define y mantiene exclusivamente en Oracle.** Clerk provee solo identidad (quién eres), no autorización (qué puedes hacer).

```
Clerk → Identidad (quién eres)
Oracle → Autorización (qué puedes hacer)
```

- Clerk **no puede** escalar privilegios.
- El rol no se lee del JWT de Clerk.
- Si un usuario Clerk intenta manipular claims de rol en su token, Spring Boot lo ignora — el rol siempre viene de la tabla `USUARIOS.ROLE`.

### 1.3 Sincronización Clerk → Oracle (`UsuarioSyncService`)

Cuando un token Clerk válido llega al backend:

```
Token Clerk (válido)
        │
        ▼
Extraer clerkUserId (sub), email, mfaEnabled
        │
        ▼
Buscar por CLERK_USER_ID en Oracle
        │
   ┌────┴────┐
   │ Existe  │ No existe
   │         │
   ▼         ▼
Actualizar  Buscar por EMAIL
LAST_LOGIN  │
   │    ┌───┴────┐
   │    │Existe  │No existe
   │    │(LOCAL) │
   │    ▼        ▼
   │  Asociar  Crear nuevo
   │  CLERK_ID  usuario
   │  mantener  (CUSTOMER,
   │  rol       authProvider=CLERK)
   ▼
Autenticar con rol Oracle
```

**Regla crítica:** Si un usuario local y un usuario Clerk tienen el mismo email, se asocian. El usuario local pasa a tener también acceso via Clerk. Esta operación se loguea con nivel INFO para auditoría.

### 1.4 Secretos y variables de entorno

| Variable | Dónde va | Sensible | Expuesto a cliente |
|----------|----------|----------|-------------------|
| `CLERK_PUBLISHABLE_KEY` | Frontend (`config.js`) | No (es pública) | Sí (por diseño) |
| `CLERK_SECRET_KEY` | Backend (env var) | **SÍ** | **NUNCA** |
| `CLERK_JWKS_URL` | Backend (`application.yml`) | No (es URL pública) | No |
| `CLERK_ISSUER` | Backend (`application.yml`) | No (es URL pública) | No |
| `JWT_SECRET` | Backend (env var) | **SÍ** | **NUNCA** |
| `MERCADOPAGO_ACCESS_TOKEN` | Backend (env var) | **SÍ** | **NUNCA** |
| `ORACLE_DB_PASSWORD` | Backend (env var) | **SÍ** | **NUNCA** |

### 1.5 Logging seguro

Reglas implementadas:
- **NUNCA** se loguea el token completo (`Authorization` header).
- **NUNCA** se loguea `CLERK_SECRET_KEY`, `JWT_SECRET` ni `MERCADOPAGO_ACCESS_TOKEN`.
- Los IDs de Clerk se truncan en logs (`sub[0:12]...`).
- Los emails en logs de advertencia se enmascaran parcialmente.
- El payload del carrito no se loguea completo (puede contener email).
- `ClerkProperties.toString()` excluye `secretKey`.

---

## 2. MFA/2FA — Configuración en Clerk Dashboard

### 2.1 Qué se configura en Clerk (no en código)

1. Ir a [dashboard.clerk.com](https://dashboard.clerk.com)
2. Seleccionar tu aplicación → **Configure → Multi-factor**
3. Habilitar:
   - ✅ **Authenticator application (TOTP)** — Google Authenticator, Authy
   - ✅ **Backup codes** — códigos de recuperación
   - ⬜ **SMS** — opcional, tiene costos adicionales
4. En **Authentication strategy**:
   - Social Login → habilitar **Google**
5. En **Redirect URLs** y **Allowed Origins** agregar:
   - `https://sharingan-comics-clerk.onrender.com`
   - `https://sharingan-comics-clerk.onrender.com/`
   - `https://sharingan-comics-clerk.onrender.com/index.html`
   - `https://ufosaki.github.io`
   - `https://ufosaki.github.io/Proyecto-Web-Duoc/`
   - `http://localhost:8080`
   - `http://localhost:8080/`
   - `http://localhost:8080/index.html`
   - `http://127.0.0.1:5501`
   - `http://127.0.0.1:5501/`

### 2.2 Qué MFA se habilitó

| Factor | Estado | Evidencia requerida |
|--------|--------|---------------------|
| TOTP (app autenticadora) | Configurar en Dashboard | Captura del Dashboard con MFA habilitado |
| Backup codes | Configurar en Dashboard | Captura de flujo de setup |
| Google social login | Configurar en Dashboard | Captura de login con cuenta Google |

### 2.3 Qué datos se guardan localmente (Oracle)

| Dato | Almacenado en Oracle | Nota |
|------|---------------------|------|
| `clerkUserId` (sub) | ✅ Sí | Para identificar al usuario |
| `authProvider` | ✅ Sí | LOCAL / CLERK / GOOGLE |
| `mfaEnabled` (indicador) | ✅ Sí | Solo observacional — fuente real: Clerk |
| Contraseña/PIN de 2FA | ❌ No | Gestionado 100% por Clerk |
| Seed/secreto TOTP | ❌ No | Gestionado 100% por Clerk |
| Tokens de sesión Clerk | ❌ No | Gestionado por Clerk SDK |

### 2.4 Cómo probar 2FA

1. Crear cuenta en `signup.html` usando botón "Registrarse con Clerk".
2. Después del registro, ir a la página de perfil de Clerk.
3. Activar "Two-step verification" → TOTP → escanear QR con Google Authenticator.
4. Hacer logout → login → el sistema pedirá el código TOTP.
5. Verificar en Spring Boot logs: `[Clerk] Token válido para usuario: clerk_...`.
6. Verificar en Oracle: `SELECT CLERK_USER_ID, MFA_ENABLED FROM USUARIOS`.

---

## 3. Cumplimiento normativo

### ISO/IEC 27001

| Control | Implementación |
|---------|---------------|
| A.9.2 Gestión de acceso | `UsuarioSyncService` — registro y asociación de identidades |
| A.9.4.2 Autenticación segura | 2FA/MFA via Clerk, campo `MFA_ENABLED` en Oracle |
| A.9.4.3 Gestión de contraseñas | `PASSWORD_HASH=null` para Clerk, BCrypt para locales |
| A.10.1 Criptografía | HMAC-SHA256 (JWT local), RSA-RS256 (Clerk JWKS) |
| A.12.4.1 Registro de eventos | `LAST_LOGIN_AT`, logs de sync/auth sin datos sensibles |
| A.13.1.3 Segregación de redes | CORS explícito por origen, sin `*` wildcard |
| A.14.2.9 Seguridad en terceros | Clerk como IdP externo con JWKS público verificable |

### ISO/IEC 25010

| Característica | Implementación |
|----------------|---------------|
| Seguridad | JWKS, HMAC, BCrypt, CORS restrictivo, no token en logs |
| Confiabilidad | Fallback a JWT local si Clerk no disponible |
| Mantenibilidad | Componentes separados (`clerk/` package), sin mezcla de responsabilidades |
| Compatibilidad | Convivencia JWT local + Clerk sin romper nada existente |
| Portabilidad | Variables de entorno, sin hardcode de URLs o secretos |
| Usabilidad | Clerk UI para 2FA, Google login, sin reimplementar flujos |

### Ley 21.719 — Protección de datos personales

| Principio | Implementación |
|-----------|---------------|
| Minimización | `PASSWORD_HASH=null` para Clerk; no guardar tokens de sesión |
| Finalidad | `CLERK_USER_ID` solo para identificar al usuario en el sistema |
| Proporcionalidad | Solo se guardan datos necesarios para el negocio |
| Consentimiento | `TERMS_ACCEPTED_AT`, `PRIVACY_ACCEPTED_AT` en esquema |
| Derechos del titular | Perfil editable, logout limpia sesión |
| No exponer en logs | Emails y IDs no se loguean completos |

### Ley 21.663 — Ley Marco de Ciberseguridad

| Aspecto | Implementación |
|---------|---------------|
| Confidencialidad | Tokens via HTTPS, CORS restrictivo, no en logs |
| Integridad | JWT firmado, JWKS verificado, rol desde Oracle |
| Disponibilidad | Fallback a JWT local si Clerk no responde |
| Trazabilidad | `LAST_LOGIN_AT`, `AUTH_PROVIDER`, logs de auditoría |
| Resiliencia | `clerk.enabled=false` para deshabilitar sin downtime |

### Ley 21.459 — Delitos informáticos

| Riesgo | Mitigación |
|--------|-----------|
| Acceso indebido | JWT firmado, JWKS verificado, CORS restrictivo |
| Interceptación | HTTPS obligatorio, tokens no en logs |
| Manipulación de tokens | Firma criptográfica, verificación de `iss` y `exp` |
| Uso indebido de credenciales | Roles solo desde Oracle, Clerk no define autorización |

### Ley 19.628 — Protección de vida privada

- Los datos personales (email, nombre) se tratan solo para el propósito declarado (identificación y compras).
- No se comparten con terceros no declarados.
- Los datos de Clerk quedan en los servidores de Clerk (política de privacidad de Clerk aplica).

---

## 4. Análisis de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Token Clerk expirado | Alta | Bajo | Clerk refresca automáticamente; 401 claro al usuario |
| Usuarios duplicados por email | Media | Medio | `UsuarioSyncService` busca por email antes de crear |
| Roles manipulados desde cliente | Baja | Alto | Rol siempre desde Oracle, nunca desde token frontend |
| Clerk no disponible | Baja | Medio | `clerk.enabled=false` + fallback JWT local |
| Tokens en logs | Baja | Alto | Reglas de logging estrictas implementadas |
| CORS mal configurado | Baja | Alto | Lista explícita de orígenes, sin `*` |
| 2FA activado pero no probado | Media | Alto | Plan de pruebas en `plan-pruebas-clerk.md` |
| Credenciales en Git | Muy baja | Crítico | `.gitignore` actualizado, `.env.example` sin valores |

---

## 5. Pendientes

### ✅ Completados
- [x] `CLERK_PUBLISHABLE_KEY` asignada en `config.js` (`pk_test_dGVuZGVy...`).
- [x] `CLERK_ISSUER` y `CLERK_JWKS_URL` configurados en `application.yml` (tender-coral-13).
- [x] `CLERK_ENABLED=true` como default en `application.yml`.
- [x] `profile.html` resuelto (conflictos de merge eliminados) + badge MFA.
- [x] `profile.js` actualizado con ClerkSessionManager y display de authProvider/mfaEnabled.
- [x] `docs/` sincronizado completamente con `src/main/resources/static/`.
- [x] `docs/assets/JS/clerk-auth.js` agregado a GitHub Pages.
- [x] Rama `Smoke` pusheada a GitHub.

### ⬜ Pendientes de configuración manual
- [ ] Activar MFA (TOTP) en Clerk Dashboard → Configure → Multi-factor.
- [ ] Activar Google como social provider → Configure → Social connections.
- [ ] Agregar Redirect URLs en Clerk Dashboard (ver Sección 2.1).
- [ ] Ejecutar `database/migrations/2026_clerk_auth.sql` en Oracle producción.
- [ ] Configurar variables de entorno en Render (ver lista en README.md).

### ✅ Completados en esta iteración
- [x] Configurar CORS dinámico por variable de entorno `ALLOWED_ORIGINS` en `CorsConfig.java` y `SecurityConfig.java`.
- [x] Actualizar `APP_CONFIG` centralizado para usar la API de Render en producción.
- [x] Ajustar redirección de `getHomeUrl()` en `clerk-auth.js` según el dominio de ejecución actual.
- [x] Proteger `getAuthToken()` y llamadas fetch contra tokens con valor `"null"` o `"undefined"`.
