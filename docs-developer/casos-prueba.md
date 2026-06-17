# Casos de Prueba — Sharingan Comics

**Proyecto:** Sharingan Comics — Tienda Online de Mangas y Cómics  
**Versión:** 2.0 | **Fecha:** 17 de junio de 2026  
**Total de casos:** 22

---

## Índice

- [Autenticación Local](#autenticación-local) (CP-01 a CP-06)
- [Seguridad JWT](#seguridad-jwt) (CP-07 a CP-10)
- [Pagos Mercado Pago](#pagos-mercado-pago) (CP-11 a CP-15)
- [Catálogo y Frontend](#catálogo-y-frontend) (CP-16 a CP-19)
- [Integración Clerk](#integración-clerk) (CP-20 a CP-22)

---

## Autenticación Local

### CP-01: Registro exitoso de usuario

| Campo | Valor |
|-------|-------|
| **Nombre** | Registro exitoso de usuario local |
| **Objetivo** | Verificar que un usuario nuevo puede registrarse y recibir un token JWT válido |
| **Precondición** | Backend ejecutándose en localhost:8080, Oracle conectado |
| **Datos de entrada** | `{ "username": "smoke", "email": "smoke@test.cl", "password": "smoke123", "phone": "" }` |
| **Procedimiento** | `POST http://localhost:8080/api/auth/register` con body JSON |
| **Resultado esperado** | HTTP 201 Created, JSON con campos: `token` (no nulo), `userId` (numérico), `username: "smoke"`, `email: "smoke@test.cl"`, `role: "CUSTOMER"` |
| **Resultado obtenido** | HTTP 201, JSON: `{ "token": "[REDACTADO]", "userId": 1, "username": "smoke", "email": "smoke@test.cl", "role": "CUSTOMER" }` |
| **Estado** | ✅ **Aprobado** |

**Comando PowerShell:**
```powershell
$body = @{ username = "smoke"; email = "smoke@test.cl"; password = "smoke123"; phone = "" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $body
```

**Trazabilidad:** Funcionalidad F-01 → Criterio CA-02

---

### CP-02: Registro con email duplicado

| Campo | Valor |
|-------|-------|
| **Nombre** | Registro rechazado por email duplicado |
| **Objetivo** | Verificar que no se permiten emails duplicados |
| **Precondición** | Usuario `smoke@test.cl` ya registrado (CP-01) |
| **Datos de entrada** | `{ "username": "otrouser", "email": "smoke@test.cl", "password": "pass123", "phone": "" }` |
| **Procedimiento** | `POST /api/auth/register` con email ya existente |
| **Resultado esperado** | HTTP 400, JSON: `{ "error": "Ya existe una cuenta con este correo." }` |
| **Resultado obtenido** | HTTP 400, `{ "error": "Ya existe una cuenta con este correo." }` |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-01 (validación de negocio)

---

### CP-03: Registro con username duplicado

| Campo | Valor |
|-------|-------|
| **Nombre** | Registro rechazado por username duplicado |
| **Objetivo** | Verificar que no se permiten nombres de usuario duplicados |
| **Precondición** | Usuario `smoke` ya registrado |
| **Datos de entrada** | `{ "username": "smoke", "email": "otro@test.cl", "password": "pass123", "phone": "" }` |
| **Procedimiento** | `POST /api/auth/register` con username ya existente |
| **Resultado esperado** | HTTP 400, JSON con error mencionando "nombre de usuario" |
| **Resultado obtenido** | HTTP 400, `{ "error": "Ya existe una cuenta con este nombre de usuario." }` |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-01 (validación de negocio)

---

### CP-04: Login exitoso con email

| Campo | Valor |
|-------|-------|
| **Nombre** | Login exitoso con email y contraseña correctos |
| **Objetivo** | Verificar que el login devuelve un JWT válido |
| **Precondición** | Usuario `smoke@test.cl` registrado con password `smoke123` |
| **Datos de entrada** | `{ "usernameOrEmail": "smoke@test.cl", "password": "smoke123" }` |
| **Procedimiento** | `POST http://localhost:8080/api/auth/login` |
| **Resultado esperado** | HTTP 200, JSON con `token` (string JWT de 3 partes), `username: "smoke"` |
| **Resultado obtenido** | HTTP 200, `{ "token": "eyJhbG...[REDACTADO]", "userId": 1, "username": "smoke", "email": "smoke@test.cl", "role": "CUSTOMER" }` |
| **Estado** | ✅ **Aprobado** |

**Comando PowerShell:**
```powershell
$loginBody = @{ usernameOrEmail = "smoke@test.cl"; password = "smoke123" } | ConvertTo-Json
$response  = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token     = $response.token
Write-Host "Token obtenido: $($token.Substring(0, 20))..."
```

**Trazabilidad:** Funcionalidad F-02 → Criterio CA-03

---

### CP-05: Login con contraseña incorrecta

| Campo | Valor |
|-------|-------|
| **Nombre** | Login rechazado por contraseña incorrecta |
| **Objetivo** | Verificar que credenciales incorrectas son rechazadas |
| **Datos de entrada** | `{ "usernameOrEmail": "smoke@test.cl", "password": "wrongpass" }` |
| **Procedimiento** | `POST /api/auth/login` con contraseña incorrecta |
| **Resultado esperado** | HTTP 401, JSON: `{ "error": "Usuario o contraseña incorrectos." }` |
| **Resultado obtenido** | HTTP 401, `{ "error": "Usuario o contraseña incorrectos." }` |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-02 (seguridad)

---

### CP-06: Perfil autenticado con JWT válido

| Campo | Valor |
|-------|-------|
| **Nombre** | Acceso a perfil con JWT válido |
| **Objetivo** | Verificar que el endpoint de perfil retorna datos del usuario autenticado |
| **Precondición** | Token JWT válido obtenido del CP-04 |
| **Datos de entrada** | Header `Authorization: Bearer {token}` |
| **Procedimiento** | `GET http://localhost:8080/api/auth/profile` con token |
| **Resultado esperado** | HTTP 200, JSON con `userId`, `username`, `email`, `role`, `authProvider`, `mfaEnabled` |
| **Resultado obtenido** | HTTP 200, `{ "userId": 1, "username": "smoke", "email": "smoke@test.cl", "phone": null, "role": "CUSTOMER", "authProvider": "LOCAL", "mfaEnabled": false }` |
| **Estado** | ✅ **Aprobado** |

**Comando PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/profile" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

**Trazabilidad:** Funcionalidad F-03 → Criterio CA-05

---

## Seguridad JWT

### CP-07: Perfil sin autenticación → 401

| Campo | Valor |
|-------|-------|
| **Nombre** | Acceso denegado a perfil sin JWT |
| **Objetivo** | Verificar que el endpoint protegido retorna 401 sin token |
| **Datos de entrada** | Sin header Authorization |
| **Procedimiento** | `GET /api/auth/profile` sin token |
| **Resultado esperado** | HTTP 401 Unauthorized |
| **Resultado obtenido** | HTTP 401 — Spring Security intercepta antes de llegar al controller |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-11 → Criterio CA-04

---

### CP-08: Token inválido → 401

| Campo | Valor |
|-------|-------|
| **Nombre** | Acceso denegado con token manipulado |
| **Objetivo** | Verificar que tokens falsos son rechazados |
| **Datos de entrada** | Header `Authorization: Bearer FAKE_TOKEN_INVALIDO` |
| **Procedimiento** | `GET /api/auth/profile` con token falsificado |
| **Resultado esperado** | HTTP 401 Unauthorized |
| **Resultado obtenido** | HTTP 401 — JwtFilter detecta token inválido, no autentica |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-09 → Criterio CA-12

---

### CP-09: Token firmado con otro secreto → rechazado

| Campo | Valor |
|-------|-------|
| **Nombre** | Token de otro sistema es rechazado |
| **Objetivo** | Verificar que un JWT firmado con clave diferente no es aceptado |
| **Datos de entrada** | Token generado con secreto diferente al configurado |
| **Procedimiento** | Enviar token firmado con `"otro-secreto..."` al backend |
| **Resultado esperado** | HTTP 401, `jwtUtil.isValid()` retorna `false` |
| **Resultado obtenido** | Test unitario `isValid_falseForTokenSignedWithDifferentSecret` → PASS |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-09 (prueba unitaria JwtUtilTest)

---

### CP-10: Token expirado → rechazado

| Campo | Valor |
|-------|-------|
| **Nombre** | Token expirado es rechazado automáticamente |
| **Objetivo** | Verificar que tokens con expiración vencida no son válidos |
| **Datos de entrada** | Token generado con `expirationMs = 1` (1 milisegundo) |
| **Procedimiento** | Generar token con expiración mínima, esperar 10ms, validar |
| **Resultado esperado** | `jwtUtil.isValid(token)` retorna `false` |
| **Resultado obtenido** | Test unitario `isValid_falseForExpiredToken` → PASS |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-10 → Criterio CA-13

---

## Pagos Mercado Pago

### CP-11: Crear preferencia de pago exitosamente

| Campo | Valor |
|-------|-------|
| **Nombre** | Creación exitosa de preferencia Mercado Pago |
| **Objetivo** | Verificar que el backend crea orden en Oracle y preferencia en MP |
| **Precondición** | Token JWT válido, `MERCADOPAGO_ACCESS_TOKEN` configurado |
| **Datos de entrada** | Token JWT + body: `{ "buyerEmail": "smoke@test.cl", "items": [{ "productCode": "MNG-EVA-001", "title": "Evangelion Vol. 1", "description": "Manga de prueba", "quantity": 1, "unitPrice": 1 }] }` |
| **Procedimiento** | `POST /api/payments/create-preference` con Authorization |
| **Resultado esperado** | HTTP 200, JSON con `preferenceId`, `initPoint`, `sandboxInitPoint`, `externalReference`, `message` |
| **Resultado obtenido** | HTTP 200, `{ "preferenceId": "2203...", "initPoint": "https://www.mercadopago.com.ar/checkout/...", "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/...", "externalReference": "UUID-...", "message": "Preferencia creada correctamente" }` |
| **Estado** | ✅ **Aprobado** |

**Comando PowerShell:**
```powershell
$paymentBody = @{
    buyerEmail = "smoke@test.cl"
    items = @(@{
        productCode = "MNG-EVA-001"
        title = "Evangelion Vol. 1"
        description = "Manga de prueba"
        quantity = 1
        unitPrice = 1
    })
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://localhost:8080/api/payments/create-preference" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $paymentBody
```

**Trazabilidad:** Funcionalidad F-13 → Criterio CA-06

---

### CP-12: Crear preferencia sin token → 401

| Campo | Valor |
|-------|-------|
| **Nombre** | Crear preferencia sin autenticación → rechazado |
| **Objetivo** | Verificar que el endpoint de pagos requiere JWT |
| **Datos de entrada** | Body válido pero sin header Authorization |
| **Procedimiento** | `POST /api/payments/create-preference` sin token |
| **Resultado esperado** | HTTP 401 o 403 |
| **Resultado obtenido** | HTTP 403 — Spring Security bloquea antes de llegar al controller |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-13 (seguridad)

---

### CP-13: Validación de ítems del carrito — cantidad y precio positivos

| Campo | Valor |
|-------|-------|
| **Nombre** | Items de pago con cantidad y precio positivo son válidos |
| **Objetivo** | Verificar que la validación de DTOs de pago funciona correctamente |
| **Datos de entrada** | `PaymentItemRequest("MNG-001", "Evangelion", "Desc", 1, 9990)` |
| **Procedimiento** | Instanciar DTO y verificar campo quantity > 0, unitPrice > 0 |
| **Resultado esperado** | `quantity()` es positivo, `unitPrice()` > BigDecimal.ZERO |
| **Resultado obtenido** | Tests `item_positiveQuantity_isValid` y `item_positiveUnitPrice_isValid` → PASS |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-14 (pruebas unitarias PaymentServiceValidationTest)

---

### CP-14: Cálculo correcto de subtotales y total

| Campo | Valor |
|-------|-------|
| **Nombre** | Cálculos de subtotal y total son correctos |
| **Objetivo** | Verificar que la lógica de cálculo de precios funciona |
| **Datos de entrada** | Items: [("Eva", qty=1, price=1000), ("Naruto", qty=2, price=500)] |
| **Procedimiento** | Calcular subtotales y total esperado |
| **Resultado esperado** | Subtotal Eva = 1000, Subtotal Naruto = 1000, Total = 2000 |
| **Resultado obtenido** | Tests `item_subtotalCalculation_isCorrect` y `request_totalCalculation_multipleItems` → PASS |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-14

---

### CP-15: Orden registrada en Oracle tras crear preferencia

| Campo | Valor |
|-------|-------|
| **Nombre** | Orden y ítems persistidos en Oracle después de crear preferencia |
| **Objetivo** | Verificar que la tabla ORDENES y ORDEN_ITEMS contienen los datos |
| **Precondición** | CP-11 ejecutado exitosamente |
| **Datos de entrada** | `EXTERNAL_REFERENCE` del CP-11 |
| **Procedimiento** | Ejecutar SELECT en Oracle SQL Developer |
| **Resultado esperado** | Fila en ORDENES con STATUS='CREATED', MP_PREFERENCE_ID no nulo. Fila en ORDEN_ITEMS con PRODUCT_CODE='MNG-EVA-001' |
| **Resultado obtenido** | Orden con EXTERNAL_REFERENCE=UUID, STATUS='CREATED', TOTAL=1.00, MP_PREFERENCE_ID poblado. Ítem con PRODUCT_CODE='MNG-EVA-001', QUANTITY=1, UNIT_PRICE=1.00, SUBTOTAL=1.00 |
| **Estado** | ✅ **Aprobado** |

**SQL de validación:**
```sql
SELECT ID_ORDEN, ID_USUARIO, EXTERNAL_REFERENCE, BUYER_EMAIL, TOTAL, STATUS, MP_PREFERENCE_ID
FROM ORDENES ORDER BY ID_ORDEN DESC FETCH FIRST 3 ROWS ONLY;

SELECT ID_ITEM, ID_ORDEN, PRODUCT_CODE, TITLE, QUANTITY, UNIT_PRICE, SUBTOTAL
FROM ORDEN_ITEMS ORDER BY ID_ITEM DESC FETCH FIRST 5 ROWS ONLY;
```

**Trazabilidad:** Funcionalidad F-16 → Criterios CA-07, CA-08

---

## Catálogo y Frontend

### CP-16: Catálogo carga correctamente

| Campo | Valor |
|-------|-------|
| **Nombre** | Catálogo de mangas carga desde API externa |
| **Objetivo** | Verificar que el proxy backend retorna datos de la API de mangas |
| **Datos de entrada** | `GET http://localhost:8080/api/mangas` |
| **Procedimiento** | Llamar al endpoint proxy, verificar respuesta JSON con array de mangas |
| **Resultado esperado** | HTTP 200, JSON array con objetos que tienen `id`, `title`, `image` |
| **Resultado obtenido** | HTTP 200, JSON array con múltiples mangas provenientes de `api-rest-manga.onrender.com` |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-18

---

### CP-17: Frontend muestra cards de mangas

| Campo | Valor |
|-------|-------|
| **Nombre** | Página principal muestra catálogo con cards |
| **Objetivo** | Verificar que el frontend renderiza productos correctamente |
| **Datos de entrada** | Abrir `http://localhost:8080/index.html` en navegador |
| **Procedimiento** | Navegar a index.html, esperar carga de catálogo, inspeccionar cards |
| **Resultado esperado** | Cards visibles con imagen, título y precio de cada manga |
| **Resultado obtenido** | Cards renderizan correctamente. Imágenes cargan desde la API externa. Precios fijos desde configuración local. |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-19

---

### CP-18: Agregar producto al carrito

| Campo | Valor |
|-------|-------|
| **Nombre** | Agregar manga al carrito desde modal |
| **Objetivo** | Verificar que el carrito se actualiza en localStorage |
| **Datos de entrada** | Click en manga → modal → "Agregar al carrito" |
| **Procedimiento** | Desde index.html, abrir modal de un manga, click en agregar. Verificar `localStorage['cart']` |
| **Resultado esperado** | `localStorage['cart']` contiene el ítem con `productCode`, `title`, `unitPrice`, `quantity` |
| **Resultado obtenido** | Ítem agregado exitosamente. `JSON.parse(localStorage.getItem('cart'))` muestra array con el producto. Contador del carrito se actualiza en navbar. |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-20

---

### CP-19: Redirección a Mercado Pago Sandbox

| Campo | Valor |
|-------|-------|
| **Nombre** | Checkout redirige a Mercado Pago Sandbox |
| **Objetivo** | Verificar que se redirige a `sandboxInitPoint` después de crear preferencia |
| **Precondición** | Usuario logueado + carrito con al menos 1 ítem |
| **Datos de entrada** | Click en "Pagar con Mercado Pago" en vista_carrito.html |
| **Procedimiento** | Completar flujo: login → agregar al carrito → checkout |
| **Resultado esperado** | Navegador redirige a `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...` |
| **Resultado obtenido** | Redirección exitosa a página de checkout de Mercado Pago sandbox. Formulario de pago con datos del ítem visible. |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-17 → Criterio CA-09

---

## Integración Clerk

### CP-20: Login con Clerk exitoso

| Campo | Valor |
|-------|-------|
| **Nombre** | Autenticación via Clerk crea sesión y sincroniza usuario |
| **Objetivo** | Verificar que el flujo Clerk end-to-end funciona |
| **Precondición** | `clerk.enabled=true`, JWKS configurado, Clerk Dashboard con app activa |
| **Datos de entrada** | Credenciales de cuenta Clerk (email/password o Google) |
| **Procedimiento** | 1) Abrir login.html, 2) Click "Iniciar sesión con Clerk", 3) Autenticar en UI Clerk, 4) Verificar redirección y navbar |
| **Resultado esperado** | Navbar muestra "Profile" y "Logout". `ClerkSessionManager.isLoggedIn()` → true. Usuario en Oracle con `AUTH_PROVIDER='CLERK'` |
| **Resultado obtenido** | Sesión Clerk activa. Token Clerk validado por JwtFilter via JWKS. UsuarioSyncService crea/asocia usuario en Oracle. Navbar actualizado correctamente. |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-23 → Criterio CA-14

---

### CP-21: Login con Google via Clerk

| Campo | Valor |
|-------|-------|
| **Nombre** | Autenticación social con Google a través de Clerk |
| **Objetivo** | Verificar que OAuth con Google funciona end-to-end |
| **Precondición** | Google habilitado como social provider en Clerk Dashboard |
| **Datos de entrada** | Cuenta Google válida |
| **Procedimiento** | 1) Login.html → Clerk → "Continue with Google", 2) Completar OAuth, 3) Verificar sesión |
| **Resultado esperado** | Sesión activa con email de Google. `AUTH_PROVIDER='CLERK'` en Oracle. `PASSWORD_HASH IS NULL`. |
| **Resultado obtenido** | Login social exitoso. Usuario sincronizado en Oracle con `AUTH_PROVIDER='CLERK'`, `CLERK_USER_ID` poblado, `PASSWORD_HASH=NULL`. |
| **Estado** | ✅ **Aprobado** |

**Trazabilidad:** Funcionalidad F-24

---

### CP-22: MFA/2FA con TOTP via Clerk

| Campo | Valor |
|-------|-------|
| **Nombre** | Segundo factor de autenticación (TOTP) funcional |
| **Objetivo** | Verificar que el flujo 2FA end-to-end funciona |
| **Precondición** | MFA/TOTP habilitado en Clerk Dashboard, app autenticadora configurada |
| **Datos de entrada** | Login Clerk + código TOTP de 6 dígitos |
| **Procedimiento** | 1) Login con Clerk, 2) Ingresar código TOTP, 3) Verificar badge 2FA y Oracle |
| **Resultado esperado** | Login exitoso. Badge "2FA" visible en navbar. `MFA_ENABLED=1` en Oracle. |
| **Resultado obtenido** | Flujo 2FA completado. Badge de seguridad visible. Campo `MFA_ENABLED=1` actualizado en USUARIOS. |
| **Estado** | ✅ **Aprobado** |

**SQL de verificación:**
```sql
SELECT ID_USUARIO, USERNAME, EMAIL, AUTH_PROVIDER, MFA_ENABLED, CLERK_USER_ID
FROM USUARIOS WHERE AUTH_PROVIDER = 'CLERK';
```

**Trazabilidad:** Funcionalidad F-25 → Criterio CA-15

---

## Resumen de Resultados

| Caso | Nombre | Tipo | Estado |
|------|--------|------|--------|
| CP-01 | Registro exitoso | Manual + Unit | ✅ Aprobado |
| CP-02 | Registro email duplicado | Manual + Unit | ✅ Aprobado |
| CP-03 | Registro username duplicado | Unit | ✅ Aprobado |
| CP-04 | Login exitoso | Manual + Unit | ✅ Aprobado |
| CP-05 | Login contraseña incorrecta | Manual + Unit | ✅ Aprobado |
| CP-06 | Perfil autenticado | Manual | ✅ Aprobado |
| CP-07 | Perfil sin token → 401 | Manual | ✅ Aprobado |
| CP-08 | Token inválido → 401 | Manual | ✅ Aprobado |
| CP-09 | Token con otro secreto → rechazado | Unit | ✅ Aprobado |
| CP-10 | Token expirado → rechazado | Unit | ✅ Aprobado |
| CP-11 | Crear preferencia MP | Manual | ✅ Aprobado |
| CP-12 | Preferencia sin token → 401 | Manual | ✅ Aprobado |
| CP-13 | Validación ítems de pago | Unit | ✅ Aprobado |
| CP-14 | Cálculo subtotales y total | Unit | ✅ Aprobado |
| CP-15 | Orden en Oracle | Integración | ✅ Aprobado |
| CP-16 | Catálogo API proxy | Integración | ✅ Aprobado |
| CP-17 | Cards en frontend | Manual | ✅ Aprobado |
| CP-18 | Carrito localStorage | Manual | ✅ Aprobado |
| CP-19 | Redirección a MP sandbox | Manual | ✅ Aprobado |
| CP-20 | Login Clerk | Integración | ✅ Aprobado |
| CP-21 | Login Google via Clerk | Integración | ✅ Aprobado |
| CP-22 | MFA/2FA TOTP | Integración | ✅ Aprobado |

**Total: 22 casos | 22 aprobados | 0 rechazados**
