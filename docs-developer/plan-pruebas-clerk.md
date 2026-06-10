# Plan de Pruebas — Integración Clerk
**Proyecto:** Sharingan Comics | **Rama:** Smoke | **Versión:** 2026-06

---

## Requisitos previos

- [ ] Spring Boot corriendo en `localhost:8080`
- [ ] Oracle Wallet configurado y conectado
- [ ] `CLERK_ENABLED=true` en variables de entorno
- [ ] `CLERK_PUBLISHABLE_KEY` en `config.js`
- [ ] `CLERK_ISSUER` y `CLERK_JWKS_URL` en `application.yml` o env vars
- [ ] Google habilitado como social provider en Clerk Dashboard
- [ ] MFA/TOTP habilitado en Clerk Dashboard
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado (para pruebas de pago)

---

## TC-CLERK-01: Login con Clerk correcto

**Objetivo:** Verificar que un usuario puede iniciar sesión con Clerk y el backend lo autentica.

**Pasos:**
1. Abrir `login.html`
2. Hacer clic en "Iniciar sesión con Clerk"
3. Completar autenticación en UI de Clerk
4. Verificar redirección a `index.html`
5. Verificar que el navbar muestra "Profile" y "Logout"

**Resultado esperado:**
- Frontend muestra usuario autenticado
- `ClerkSessionManager.isLoggedIn()` retorna `true`
- `ClerkSessionManager.getAuthToken()` retorna un JWT no vacío

**Evidencia:** Captura de pantalla del navbar con usuario autenticado.

---

## TC-CLERK-02: Login con Google

**Objetivo:** Verificar login social con Google via Clerk.

**Pasos:**
1. Abrir `login.html`
2. Clic en "Iniciar sesión con Clerk"
3. En la UI de Clerk, seleccionar "Continue with Google"
4. Autenticar con cuenta Google
5. Verificar redirección y estado de sesión

**Resultado esperado:**
- Sesión activa con usuario Google
- `auth_provider='CLERK'` en Oracle para ese usuario

**Evidencia:** Captura de login con Google + registro en Oracle.

---

## TC-CLERK-03: MFA/2FA requerido y completado

**Objetivo:** Verificar que el flujo 2FA funciona end-to-end.

**Pasos:**
1. Activar 2FA en el perfil Clerk (escanear QR con Google Authenticator)
2. Hacer logout
3. Hacer login nuevamente → Clerk pedirá código TOTP
4. Ingresar código de 6 dígitos
5. Verificar autenticación exitosa

**Resultado esperado:**
- Login exitoso con 2FA
- Badge "2FA" visible en el navbar
- `mfa_enabled=1` en Oracle para ese usuario

**Evidencia:** Captura de flujo 2FA + Oracle con mfa_enabled=1.

---

## TC-CLERK-04: Token Clerk válido en /api/auth/profile

**Objetivo:** Verificar que el backend valida el token Clerk y retorna el perfil.

**Pasos:**
1. Autenticar con Clerk
2. Abrir DevTools → Network
3. Navegar a `profile.html` o llamar manualmente:
```bash
curl -H "Authorization: Bearer <token_clerk>" http://localhost:8080/api/auth/profile
```

**Resultado esperado:**
```json
{
  "userId": 123,
  "username": "nombre_derivado",
  "email": "usuario@ejemplo.com",
  "role": "CUSTOMER",
  "authProvider": "CLERK",
  "mfaEnabled": true
}
```

**Evidencia:** Captura de respuesta (ocultando token Bearer y datos sensibles).

---

## TC-CLERK-05: Token ausente → 401

**Objetivo:** Verificar que endpoints protegidos rechazan requests sin token.

**Pasos:**
```bash
curl http://localhost:8080/api/auth/profile
curl http://localhost:8080/api/auth/me
curl -X POST http://localhost:8080/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -d '{"buyerEmail":"test@test.com","items":[]}'
```

**Resultado esperado:** HTTP 401 en todos los casos.

---

## TC-CLERK-06: Token inválido → 401

**Objetivo:** Verificar que tokens manipulados son rechazados.

**Pasos:**
```bash
curl -H "Authorization: Bearer token.invalido.aqui" \
  http://localhost:8080/api/auth/profile
```

**Resultado esperado:** HTTP 401.

---

## TC-CLERK-07: Token expirado → 401

**Objetivo:** Verificar que tokens expirados son rechazados.
(Difícil de probar manualmente — Clerk tiene tokens de ~60 segundos).

**Pasos:**
1. Obtener un token Clerk
2. Esperar a que expire (>60 segundos sin refrescar)
3. Enviar al backend

**Resultado esperado:** HTTP 401 (JwtException en servidor, no 500).

---

## TC-CLERK-08: Usuario nuevo Clerk se crea en Oracle

**Objetivo:** Verificar que al autenticar con Clerk por primera vez se crea el registro en Oracle.

**Pasos:**
1. Usar una cuenta Clerk que nunca se haya autenticado en el sistema
2. Autenticar
3. Verificar en Oracle:
```sql
SELECT ID_USUARIO, USERNAME, EMAIL, ROLE, AUTH_PROVIDER, CLERK_USER_ID, MFA_ENABLED
FROM USUARIOS
WHERE AUTH_PROVIDER = 'CLERK'
ORDER BY CREATED_AT DESC
FETCH FIRST 5 ROWS ONLY;
```

**Resultado esperado:**
- Nuevo registro con `AUTH_PROVIDER='CLERK'`
- `PASSWORD_HASH IS NULL`
- `ROLE='CUSTOMER'`
- `CLERK_USER_ID` no null

**Evidencia:** Captura de Oracle SQL Developer con el registro.

---

## TC-CLERK-09: Usuario existente (local) se asocia a Clerk

**Objetivo:** Si existe un usuario local con el mismo email, se asocia el CLERK_USER_ID sin crear duplicado.

**Pasos:**
1. Crear usuario local con email `test@ejemplo.com`
2. Autenticar con Clerk usando la misma cuenta `test@ejemplo.com`
3. Verificar en Oracle: solo 1 registro con ese email, con CLERK_USER_ID poblado

---

## TC-CLERK-10: Logout limpia sesión

**Objetivo:** Verificar que el logout limpia todos los datos de sesión.

**Pasos:**
1. Autenticar con Clerk
2. Hacer logout
3. Verificar:
   - `localStorage.getItem('authToken')` → null
   - `localStorage.getItem('isLoggedIn')` → null
   - `localStorage.getItem('loggedInUser')` → null
   - Navbar muestra Login/Sign Up
   - `ClerkSessionManager.isLoggedIn()` → false

---

## TC-ROLES-01: CUSTOMER no puede crear productos

**Pasos:**
```bash
curl -X POST http://localhost:8080/api/admin/productos \
  -H "Authorization: Bearer <token_customer>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test"}'
```

**Resultado esperado:** HTTP 403.

---

## TC-ROLES-02: ADMIN puede acceder a endpoints admin

**Pasos:**
1. Cambiar rol en Oracle: `UPDATE USUARIOS SET ROLE='ADMIN' WHERE ID_USUARIO=X;`
2. Re-autenticar (el token debe reflejarse con el nuevo rol)
3. Llamar a endpoint admin

**Resultado esperado:** HTTP 200.

---

## TC-MP-01: Usuario Clerk puede crear preferencia de pago

**Pasos:**
1. Autenticar con Clerk
2. Agregar producto al carrito
3. Hacer checkout

**Resultado esperado:**
- `POST /api/payments/create-preference` → HTTP 200
- Respuesta con `sandboxInitPoint` o `initPoint`
- Orden creada en Oracle con `ID_USUARIO` del usuario Clerk

---

## TC-MP-02: Sin token no puede crear preferencia

**Pasos:**
```bash
curl -X POST http://localhost:8080/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -d '{"buyerEmail":"test@test.com","items":[...]}'
```

**Resultado esperado:** HTTP 401.

---

## TC-SEC-01: Tokens no aparecen en logs de Spring Boot

**Pasos:**
1. Autenticar con Clerk
2. Revisar los logs de Spring Boot en consola/archivo
3. Buscar patrones de token JWT (ej. `eyJ...`)

**Resultado esperado:** No se encuentran tokens JWT en los logs.

---

## TC-SEC-02: PASSWORD_HASH null para usuarios Clerk

**SQL de verificación:**
```sql
SELECT USERNAME, EMAIL, AUTH_PROVIDER, 
       CASE WHEN PASSWORD_HASH IS NULL THEN 'NULL (correcto para Clerk)' 
            ELSE 'TIENE HASH (local)' END AS HASH_STATUS
FROM USUARIOS;
```

**Resultado esperado:** Usuarios con `AUTH_PROVIDER='CLERK'` tienen `PASSWORD_HASH IS NULL`.

---

## Checklist de evidencias para evaluación

- [ ] Captura Clerk Dashboard con MFA activado (sin exponer secretos)
- [ ] Captura login con Google en Clerk UI
- [ ] Captura flujo 2FA (input código TOTP)
- [ ] Captura navbar con badge "2FA" y usuario autenticado
- [ ] Captura Network tab: request a `/api/auth/profile` (token Bearer ocultado)
- [ ] Captura respuesta JSON de `GET /api/auth/profile` (sin datos sensibles)
- [ ] Captura Oracle: usuario Clerk en tabla USUARIOS
- [ ] Captura rol `CUSTOMER` en Oracle
- [ ] Captura `POST /api/payments/create-preference` con usuario Clerk (HTTP 200)
- [ ] Captura orden en Oracle con ID_USUARIO correcto
- [ ] Captura redirección a Mercado Pago sandbox
- [ ] Captura logs Spring Boot sin tokens visibles
- [ ] Prueba negativa: sin token → 401 (captura respuesta)
- [ ] Prueba negativa: CUSTOMER en endpoint admin → 403
- [ ] Captura de logout limpio
