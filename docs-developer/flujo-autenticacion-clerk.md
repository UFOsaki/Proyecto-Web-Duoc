# Flujo de Autenticación Clerk — Sharingan Comics

## Arquitectura antes/después

### ANTES (solo JWT local)
```
Frontend → POST /api/auth/login → Spring Boot → Oracle
                                       ↓
                              JWT local (HMAC-SHA256)
                                       ↓
                              Frontend guarda authToken en localStorage
```

### DESPUÉS (convivencia JWT + Clerk)
```
Frontend
    │
    ├── Opción A: Login Clerk (Google / 2FA)
    │       │
    │       ▼
    │   Clerk SDK (frontend) → Clerk Cloud
    │       │
    │       ▼
    │   clerk.session.getToken() → JWT corto plazo (RS256, con kid)
    │
    └── Opción B: Login local (usuario/contraseña)
            │
            ▼
        POST /api/auth/login → Spring Boot
            │
            ▼
        JWT local (HMAC-SHA256, sin kid)
            │
            ▼
        localStorage.authToken

    ┌── En ambos casos ──────────────────────────────────────────┐
    │                                                            │
    │  fetch('/api/payments/create-preference', {               │
    │    headers: { 'Authorization': 'Bearer <token>' }         │
    │  })                                                        │
    │                          │                                 │
    │                          ▼                                 │
    │              JwtFilter (Spring Boot)                       │
    │                          │                                 │
    │          ┌───────────────┴───────────────┐                 │
    │          │ ¿Tiene kid en header?          │                 │
    │          │                               │                 │
    │         Sí                               No               │
    │          │                               │                 │
    │          ▼                               ▼                 │
    │   ClerkJwtService               JwtUtil.isValid()          │
    │   (JWKS + RSA)                  (HMAC-SHA256)              │
    │          │                               │                 │
    │          ▼                               ▼                 │
    │  UsuarioSyncService              Buscar por username        │
    │  (busca/crea en Oracle)         en UsuarioRepository       │
    │          │                               │                 │
    │          └───────────────┬───────────────┘                 │
    │                          ▼                                 │
    │            SecurityContextHolder.setAuthentication         │
    │            (principal = Usuario Oracle, rol desde Oracle)  │
    │                                                            │
    └────────────────────────────────────────────────────────────┘
```

## Flujo de login con Clerk

```
1. Usuario abre login.html
2. Si CLERK_PUBLISHABLE_KEY está configurado → se muestra botón "Login con Clerk"
3. Usuario hace clic → ClerkSessionManager.signIn()
4. Clerk redirige a su UI (o modal si está embebido)
5. Usuario autentica: contraseña, Google, 2FA si está requerido
6. Clerk emite un JWT de sesión (RS256, ~60 segundos, auto-renovable)
7. Clerk redirige a la URL configurada (index.html)
8. Frontend: clerk.session.getToken() → token fresco
9. Frontend envía token en Authorization: Bearer
10. JwtFilter detecta kid → ClerkJwtService valida → UsuarioSyncService sincroniza
11. Spring Boot aplica rol Oracle → endpoint responde
```

## Flujo MFA/2FA con Clerk

```
1. Usuario activa 2FA en Clerk Dashboard o en su perfil
2. Escanea QR con app autenticadora (Google Authenticator, Authy)
3. En el próximo login: Clerk pide código TOTP automáticamente
4. Si el código es correcto → Clerk emite token con claim fva=[factor1, factor2]
5. ClerkJwtService extrae mfaEnabled=true del claim fva
6. UsuarioSyncService actualiza USUARIOS.MFA_ENABLED=1 en Oracle
7. session.js muestra badge "2FA" en el navbar
```

## Flujo token Clerk → Spring Boot

```
1. Frontend: token = await clerk.session.getToken()
2. fetch(url, { headers: { Authorization: 'Bearer ' + token } })
3. JwtFilter.doFilterInternal():
   a. Extraer header Authorization
   b. Substring Bearer → token
   c. ClerkJwtService.looksLikeClerkToken(token) → true (tiene kid)
   d. ClerkJwtService.validateToken(token):
      - Base64url decode header → obtener kid
      - jwksCache.get(kid) → PublicKey (RSA)
      - Jwts.parser().verifyWith(rsaPublicKey).requireIssuer(clerk.issuer).build().parseSignedClaims(token)
      - Extraer sub, email, mfaEnabled
   e. UsuarioSyncService.syncFromClerk(claims) → Usuario Oracle
   f. SecurityContextHolder.setAuthentication(usuario, ROLE_CUSTOMER)
4. @AuthenticationPrincipal Usuario → usuario sincronizado
5. Endpoint responde con datos del negocio
```

## Sincronización usuario Clerk → Oracle

Ver `docs-developer/seguridad-clerk.md` sección 1.3 para el diagrama completo.

**Reglas de negocio:**
- Un usuario Clerk tiene exactamente un registro en USUARIOS (no hay duplicados por email).
- El username en Oracle puede ser derivado del nombre/email de Clerk.
- El rol siempre es `CUSTOMER` para usuarios nuevos de Clerk.
- Solo un administrador puede cambiar el rol a `ADMIN` directamente en Oracle.

## Relación con Mercado Pago

```
1. Usuario autenticado (Clerk o JWT local) → checkout
2. ClerkSessionManager.getAuthToken() → token correcto
3. POST /api/payments/create-preference con Authorization: Bearer <token>
4. JwtFilter autentica → PaymentController recibe Usuario Oracle via @AuthenticationPrincipal
5. PaymentService.createPreference(request, usuario.getUsername())
6. Orden creada en ORDENES con ID_USUARIO = usuario.getIdUsuario()
7. Mercado Pago preference creada → sandboxInitPoint retornado
8. Frontend redirige a sandboxInitPoint
9. Webhook de MP → PaymentController → PaymentService.processWebhook()
10. Orden actualizada en ORDENES con status del pago
```

## Variables de entorno requeridas

### Backend (application.yml / env vars)
```bash
CLERK_ENABLED=true
CLERK_ISSUER=https://<tu-app>.clerk.accounts.dev
CLERK_JWKS_URL=https://<tu-app>.clerk.accounts.dev/.well-known/jwks.json
CLERK_SECRET_KEY=sk_live_...   # solo si usas Clerk Management API
```

### Frontend (config.js)
```javascript
CLERK_PUBLISHABLE_KEY: 'pk_test_...'  // o pk_live_...
AUTH_MODE: 'hybrid'  // 'local' | 'clerk' | 'hybrid'
```

## Configuración Clerk Dashboard

1. Ir a [dashboard.clerk.com](https://dashboard.clerk.com)
2. **Configure → Restrictions**: activar sign-up si se desea.
3. **Configure → Email, Phone, Username**: activar email.
4. **Configure → Social connections**: habilitar Google.
5. **Configure → Multi-factor**: habilitar TOTP y Backup codes.
6. **API Keys**: copiar `Publishable key` → `config.js`.
7. **Paths → Redirect URLs**: agregar URLs del proyecto.

## Configuración CORS

Orígenes permitidos en `SecurityConfig.java`:
- `http://localhost:8080` — Spring Boot local
- `http://localhost:5500` / `5501` — Live Server
- `http://127.0.0.1:5500` / `5501` — Live Server (127)
- `https://ufosaki.github.io` — GitHub Pages
- `https://felipedev-one.github.io` — GitHub Pages alternativo

Agregar cuando esté disponible: URL de Render.
