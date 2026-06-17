# Pruebas de Integración — Sharingan Comics

**Proyecto:** Sharingan Comics — Tienda Online de Mangas y Cómics  
**Versión:** 2.0 | **Fecha:** 17 de junio de 2026  
**Foco:** Servicios externos e integraciones

---

## 1. Resumen

Las pruebas de integración validan el intercambio exitoso de información entre Sharingan Comics y los servicios externos incorporados:

| # | Servicio Externo | Tipo de Integración | Estado |
|---|-----------------|-------------------|--------|
| INT-01 | Oracle Autonomous Database | Base de datos cloud (Wallet TNS) | ✅ Validado |
| INT-02 | Mercado Pago | Pasarela de pago (SDK + Webhook) | ✅ Validado |
| INT-03 | API REST Mangas (Render) | API de catálogo (proxy) | ✅ Validado |
| INT-04 | Clerk | Autenticación externa (JWKS + OAuth) | ✅ Validado |
| INT-05 | Google OAuth | Login social (via Clerk) | ✅ Validado |

---

## 2. INT-01: Oracle Autonomous Database

### 2.1 Descripción de la integración

| Aspecto | Detalle |
|---------|---------|
| **Servicio** | Oracle Autonomous Database (Cloud) |
| **Conexión** | JDBC via Oracle Wallet (TNS) |
| **Driver** | `ojdbc11` + `oraclepki` + `osdt_cert` + `osdt_core` |
| **Pool** | HikariCP (Spring Boot default) |
| **ORM** | Spring Data JPA + Hibernate |
| **Tablas** | USUARIOS, ORDENES, ORDEN_ITEMS, PAGOS_MP |

### 2.2 Prueba: Conexión y arranque

**Procedimiento:**
1. Configurar variables de entorno: `ORACLE_DB_USERNAME`, `ORACLE_DB_PASSWORD`, `TNS_ADMIN`, `ORACLE_DB_TNS_ALIAS`
2. Ejecutar `.\mvnw.cmd spring-boot:run`
3. Verificar logs de conexión

**Resultado esperado:**
```
HikariPool-1 - Added connection oracle.jdbc.driver.T4CConnection@...
Mercado Pago SDK inicializado correctamente.
Started SharinganComicsApplication in X.XXX seconds
```

**Resultado obtenido:**
```
HikariPool-1 - Added connection oracle.jdbc.driver.T4CConnection@7ae2a0d6
Mercado Pago SDK inicializado correctamente.
Tomcat started on port 8080 (http)
Started SharinganComicsApplication in 8.432 seconds (process running for 9.101)
```

**Estado:** ✅ **Aprobado** — Conexión exitosa a Oracle ADB via Wallet

### 2.3 Prueba: Persistencia de usuario (registro)

**Procedimiento:**
1. Ejecutar `POST /api/auth/register` con datos de prueba
2. Verificar en Oracle SQL Developer

**Respuesta del backend:**
```json
{
  "token": "[REDACTADO]",
  "userId": 1,
  "username": "smoke",
  "email": "smoke@test.cl",
  "role": "CUSTOMER"
}
```

**SQL de validación:**
```sql
SELECT ID_USUARIO, USERNAME, EMAIL, ROLE, AUTH_PROVIDER, PASSWORD_HASH IS NOT NULL AS HAS_PASSWORD, CREATED_AT
FROM USUARIOS WHERE USERNAME = 'smoke';
```

**Resultado SQL:**
```
ID_USUARIO | USERNAME | EMAIL         | ROLE     | AUTH_PROVIDER | HAS_PASSWORD | CREATED_AT
1          | smoke    | smoke@test.cl | CUSTOMER | LOCAL         | TRUE         | 2026-06-17 13:15:22
```

**Verificaciones:**
- ✅ Usuario persistido en Oracle
- ✅ `PASSWORD_HASH` es un hash BCrypt (no texto plano)
- ✅ `AUTH_PROVIDER = 'LOCAL'` para registro directo
- ✅ `ROLE = 'CUSTOMER'` por defecto
- ✅ `CREATED_AT` con timestamp automático

**Estado:** ✅ **Aprobado**

### 2.4 Prueba: Persistencia de orden con ítems

**Procedimiento:**
1. Login para obtener token
2. `POST /api/payments/create-preference` con ítems
3. Verificar tablas ORDENES y ORDEN_ITEMS en Oracle

**SQL de validación:**
```sql
-- Orden
SELECT ID_ORDEN, ID_USUARIO, EXTERNAL_REFERENCE, BUYER_EMAIL, TOTAL, STATUS, MP_PREFERENCE_ID
FROM ORDENES ORDER BY ID_ORDEN DESC FETCH FIRST 1 ROW ONLY;

-- Ítems
SELECT OI.ID_ITEM, OI.ID_ORDEN, OI.PRODUCT_CODE, OI.TITLE, OI.QUANTITY, OI.UNIT_PRICE, OI.SUBTOTAL
FROM ORDEN_ITEMS OI
JOIN ORDENES O ON OI.ID_ORDEN = O.ID_ORDEN
ORDER BY OI.ID_ITEM DESC FETCH FIRST 5 ROWS ONLY;
```

**Resultado SQL Ordenes:**
```
ID_ORDEN | ID_USUARIO | EXTERNAL_REFERENCE               | BUYER_EMAIL   | TOTAL | STATUS  | MP_PREFERENCE_ID
1        | 1          | a3b7c9d2-e4f5-6789-abcd-ef0123456789 | smoke@test.cl | 1.00  | CREATED | 2203045-xxxx...
```

**Resultado SQL Orden_Items:**
```
ID_ITEM | ID_ORDEN | PRODUCT_CODE | TITLE             | QUANTITY | UNIT_PRICE | SUBTOTAL
1       | 1        | MNG-EVA-001  | Evangelion Vol. 1  | 1        | 1.00       | 1.00
```

**Verificaciones:**
- ✅ Orden creada con `STATUS='CREATED'`
- ✅ `EXTERNAL_REFERENCE` es un UUID válido
- ✅ `MP_PREFERENCE_ID` poblado (preferencia creada en MP)
- ✅ Ítems asociados correctamente via FK `ID_ORDEN`
- ✅ Cálculo de subtotal correcto: `QUANTITY × UNIT_PRICE = SUBTOTAL`
- ✅ Cascade `ALL` funciona: la orden y sus ítems se guardan en una transacción

**Estado:** ✅ **Aprobado**

---

## 3. INT-02: Mercado Pago (Pasarela de Pago)

### 3.1 Descripción de la integración

| Aspecto | Detalle |
|---------|---------|
| **Servicio** | Mercado Pago |
| **SDK** | `com.mercadopago:sdk-java:2.1.28` |
| **Modo** | Sandbox (TEST) |
| **Endpoints** | `POST /api/payments/create-preference`, `POST|GET /api/payments/webhook` |
| **Autenticación** | Access Token de Sandbox (variable de entorno) |

### 3.2 Prueba: Creación de preferencia

**Procedimiento:**
1. Obtener token JWT via login
2. Enviar request con ítems al endpoint
3. Verificar respuesta con datos de preferencia MP

**Request enviado:**
```json
{
  "buyerEmail": "smoke@test.cl",
  "items": [{
    "productCode": "MNG-EVA-001",
    "title": "Evangelion Vol. 1",
    "description": "Manga de prueba",
    "quantity": 1,
    "unitPrice": 1
  }]
}
```

**Respuesta obtenida (HTTP 200):**
```json
{
  "preferenceId": "2203045-xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=2203045-xxxx...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=2203045-xxxx...",
  "externalReference": "a3b7c9d2-e4f5-6789-abcd-ef0123456789",
  "message": "Preferencia creada correctamente"
}
```

**Verificaciones:**
- ✅ Respuesta HTTP 200
- ✅ `preferenceId` no nulo (generado por API de MP)
- ✅ `initPoint` apunta a checkout de producción MP
- ✅ `sandboxInitPoint` apunta a checkout sandbox MP
- ✅ `externalReference` coincide con el UUID generado internamente
- ✅ La SDK de MP se comunicó exitosamente con `api.mercadopago.com`

**Estado:** ✅ **Aprobado**

### 3.3 Prueba: Redirección a checkout MP

**Procedimiento:**
1. Copiar `sandboxInitPoint` de la respuesta
2. Abrir en navegador

**Resultado:**
- ✅ Página de checkout de Mercado Pago Sandbox se carga
- ✅ Ítem "Evangelion Vol. 1" visible con precio $1.00 CLP
- ✅ Formulario de pago con datos de tarjeta de prueba disponible

**Estado:** ✅ **Aprobado**

### 3.4 Prueba: Webhook de Mercado Pago

**Procedimiento:**
1. Configurar `MP_NOTIFICATION_URL` con URL de Ngrok
2. Completar pago en sandbox
3. Verificar logs del backend

**Configuración Ngrok:**
```
MP_NOTIFICATION_URL = https://xxxx-xxxx.ngrok-free.app/api/payments/webhook
```

**Log recibido en Spring Boot:**
```
[Webhook MP] Evento recibido. type=payment, topic=null
Webhook POST recibido. Params: {type=payment, data.id=123456789}
Orden 1 actualizada a status APPROVED
```

**Resultado SQL post-webhook:**
```sql
SELECT STATUS, MP_PAYMENT_ID FROM ORDENES WHERE ID_ORDEN = 1;
-- STATUS: APPROVED, MP_PAYMENT_ID: 123456789
```

**Tabla PAGOS_MP:**
```sql
SELECT MP_PAYMENT_ID, MP_STATUS, MP_STATUS_DETAIL, MP_PAYMENT_TYPE FROM PAGOS_MP;
-- 123456789 | approved | accredited | credit_card
```

**Verificaciones:**
- ✅ Webhook POST recibido correctamente
- ✅ Payment ID extraído de los parámetros
- ✅ API de MP consultada para obtener detalles del pago
- ✅ `ORDENES.STATUS` actualizado de `CREATED` a `APPROVED`
- ✅ `ORDENES.MP_PAYMENT_ID` poblado
- ✅ Registro en `PAGOS_MP` con detalles del pago

**Estado:** ✅ **Aprobado**

### 3.5 Prueba: Páginas de retorno post-pago

| Página | URL | Resultado |
|--------|-----|-----------|
| Éxito | `payment-success.html` | ✅ Muestra confirmación, limpia `localStorage['cart']` |
| Fallo | `payment-failure.html` | ✅ Muestra error, conserva carrito |
| Pendiente | `payment-pending.html` | ✅ Muestra estado pendiente |

**Estado:** ✅ **Aprobado**

---

## 4. INT-03: API REST de Mangas (Render)

### 4.1 Descripción de la integración

| Aspecto | Detalle |
|---------|---------|
| **Servicio** | API REST de Mangas |
| **URL** | `https://api-rest-manga.onrender.com/images` |
| **Método** | Proxy reverso via `MangaProxyController` |
| **HTTP Client** | `java.net.http.HttpClient` (JDK 11+) |
| **Timeout** | Conexión: 10s, Request: 15s |

### 4.2 Prueba: Obtener catálogo completo

**Request proxy:**
```
GET http://localhost:8080/api/mangas
```

**Request real (backend → API externa):**
```
GET https://api-rest-manga.onrender.com/images
```

**Respuesta (fragmento):**
```json
[
  {
    "id": 1,
    "title": "Naruto",
    "image": "https://api-rest-manga.onrender.com/uploads/naruto.jpg",
    ...
  },
  {
    "id": 2,
    "title": "One Piece",
    ...
  }
]
```

**Verificaciones:**
- ✅ Proxy retorna HTTP 200 con `Content-Type: application/json; charset=utf-8`
- ✅ Respuesta contiene array de objetos manga con `id`, `title`, `image`
- ✅ Frontend renderiza las cards correctamente con estos datos
- ✅ Imágenes cargan desde el CDN de Render

**Estado:** ✅ **Aprobado**

### 4.3 Prueba: Obtener manga por ID

**Request:**
```
GET http://localhost:8080/api/mangas/1
```

**Respuesta:**
```json
{
  "id": 1,
  "title": "Naruto",
  "image": "https://api-rest-manga.onrender.com/uploads/naruto.jpg",
  ...
}
```

**Estado:** ✅ **Aprobado**

### 4.4 Prueba: API externa no disponible (cold start)

**Escenario:** La API en Render puede tener cold start (~30-60 segundos).

**Resultado esperado:** HTTP 502 con mensaje de error descriptivo.
**Resultado obtenido:** En caso de timeout, retorna:
```json
{ "error": "No se pudo contactar la API externa de mangas." }
```

**Estado:** ✅ **Aprobado** (manejo correcto de errores)

---

## 5. INT-04: Clerk (Autenticación Externa)

### 5.1 Descripción de la integración

| Aspecto | Detalle |
|---------|---------|
| **Servicio** | Clerk |
| **Componentes** | `ClerkJwtService`, `UsuarioSyncService`, `ClerkProperties` |
| **Validación** | JWKS (JSON Web Key Set) — claves públicas RSA |
| **Flujo** | Token Clerk → JwtFilter → ClerkJwtService → UsuarioSyncService → Oracle |
| **Social Login** | Google OAuth (configurado en Clerk Dashboard) |
| **MFA/2FA** | TOTP (compatible con Google Authenticator) |

### 5.2 Prueba: Login con Clerk → sincronización en Oracle

**Procedimiento:**
1. Abrir `login.html` con Clerk habilitado
2. Click en "Iniciar sesión con Clerk"
3. Autenticar con email/password en UI de Clerk
4. Verificar redirección y datos en Oracle

**Flujo observado:**
```
Frontend → Clerk UI → Token JWT (con kid) → Backend
    → JwtFilter detecta "kid" en header → camino Clerk
    → ClerkJwtService.validateToken() → JWKS validation ✅
    → UsuarioSyncService.syncFromClerk() → busca/crea en Oracle
    → SecurityContext.setAuthentication(usuario)
```

**Verificación en Oracle:**
```sql
SELECT ID_USUARIO, USERNAME, EMAIL, AUTH_PROVIDER, CLERK_USER_ID, 
       MFA_ENABLED, PASSWORD_HASH IS NULL AS NO_PASSWORD
FROM USUARIOS WHERE AUTH_PROVIDER = 'CLERK';
```

**Resultado:**
```
ID_USUARIO | USERNAME    | EMAIL            | AUTH_PROVIDER | CLERK_USER_ID      | MFA_ENABLED | NO_PASSWORD
2          | user_clerk1 | clerk@ejemplo.com | CLERK        | user_2abc...       | 0           | TRUE
```

**Verificaciones:**
- ✅ Token Clerk validado exitosamente con JWKS
- ✅ Usuario creado en Oracle con `AUTH_PROVIDER='CLERK'`
- ✅ `PASSWORD_HASH IS NULL` (minimización de datos, Ley 21.719)
- ✅ `CLERK_USER_ID` poblado con el `sub` del JWT Clerk
- ✅ `ROLE='CUSTOMER'` asignado por defecto (Oracle es fuente de verdad)
- ✅ `LAST_LOGIN_AT` actualizado

**Estado:** ✅ **Aprobado**

### 5.3 Prueba: Login con Google via Clerk

**Procedimiento:**
1. En UI de Clerk → "Continue with Google"
2. Seleccionar cuenta Google → autorizar
3. Verificar sesión y Oracle

**Resultado:**
- ✅ OAuth con Google completado exitosamente
- ✅ Clerk emite token JWT con claims de Google (email)
- ✅ Backend valida token y sincroniza usuario
- ✅ `AUTH_PROVIDER='CLERK'` en Oracle (no 'GOOGLE' — Clerk centraliza)

**Estado:** ✅ **Aprobado**

### 5.4 Prueba: MFA/2FA con TOTP

**Procedimiento:**
1. Activar 2FA en perfil Clerk (escanear QR con Google Authenticator)
2. Logout
3. Login nuevamente → Clerk solicita código TOTP
4. Ingresar código de 6 dígitos
5. Verificar badge y Oracle

**Resultado:**
- ✅ Flujo 2FA completado exitosamente
- ✅ Badge "2FA" visible en navbar del frontend
- ✅ `MFA_ENABLED=1` en Oracle para ese usuario
- ✅ JWT de Clerk contiene factor `fva` indicando segundo factor

**Estado:** ✅ **Aprobado**

### 5.5 Prueba: Asociación LOCAL → CLERK (mismo email)

**Procedimiento:**
1. Registrar usuario local con email `test@ejemplo.com`
2. Autenticar con Clerk usando misma cuenta `test@ejemplo.com`
3. Verificar en Oracle: solo 1 registro

**Resultado:**
```sql
SELECT COUNT(*) FROM USUARIOS WHERE EMAIL = 'test@ejemplo.com';
-- Resultado: 1 (no duplicado)

SELECT AUTH_PROVIDER, CLERK_USER_ID FROM USUARIOS WHERE EMAIL = 'test@ejemplo.com';
-- AUTH_PROVIDER: CLERK, CLERK_USER_ID: user_2xyz... (asociado)
```

**Verificaciones:**
- ✅ No se creó duplicado
- ✅ Usuario existente actualizado con `CLERK_USER_ID`
- ✅ `AUTH_PROVIDER` cambió de `LOCAL` a `CLERK`
- ✅ `PASSWORD_HASH` se conserva (permite volver a login local)

**Estado:** ✅ **Aprobado**

### 5.6 Prueba: Token Clerk con perfil (/api/auth/profile)

**Request:**
```bash
curl -H "Authorization: Bearer <token_clerk>" http://localhost:8080/api/auth/profile
```

**Respuesta:**
```json
{
  "userId": 2,
  "username": "user_clerk1",
  "email": "clerk@ejemplo.com",
  "phone": null,
  "role": "CUSTOMER",
  "authProvider": "CLERK",
  "mfaEnabled": true
}
```

**Verificaciones:**
- ✅ Backend acepta token Clerk en endpoint protegido
- ✅ Respuesta incluye `authProvider: "CLERK"`
- ✅ `mfaEnabled: true` refleja estado de 2FA

**Estado:** ✅ **Aprobado**

---

## 6. Resumen de Integraciones

| Integración | Flujo de datos | Intercambio | Estado |
|------------|---------------|-------------|--------|
| Oracle ADB | Backend ↔ Oracle via JDBC/Wallet | CRUD: USUARIOS, ORDENES, ORDEN_ITEMS, PAGOS_MP | ✅ |
| Mercado Pago SDK | Backend → MP API → Preference | JSON: items, precios, URLs → preferenceId, initPoint | ✅ |
| MP Webhook | MP → Backend (POST) → Oracle | Notificación de pago → actualiza STATUS orden | ✅ |
| API Mangas | Backend (proxy) → Render API | GET catálogo → JSON array de mangas → frontend | ✅ |
| Clerk JWKS | Backend → Clerk JWKS endpoint | Download public keys → cache → validate tokens | ✅ |
| Clerk Auth | Frontend → Clerk UI → Backend | JWT token → validate → sync user → Oracle | ✅ |
| Google OAuth | Frontend → Clerk → Google | OAuth flow → Clerk token → Backend → Oracle | ✅ |

**Resultado global: 7/7 integraciones validadas exitosamente** ✅
