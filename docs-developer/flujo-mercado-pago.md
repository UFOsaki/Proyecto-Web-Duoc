# Flujo de Pago — Mercado Pago
## Sharingan Comics — Documentación Técnica

---

## Diagrama del Flujo

```
Usuario logueado
     │
     ▼
Vista Carrito (vista_carrito.html)
     │  Clic "Pagar con Mercado Pago"
     ▼
cart.js → buildCheckoutPayload()
     │  Valida: authToken, loggedInUser, ítems del carrito
     ▼
POST /api/payments/create-preference
Headers: Authorization: Bearer {JWT}
Body: { buyerEmail, items: [{ productCode, title, description, quantity, unitPrice }] }
     │
     ▼
PaymentController.createPreference()
     │  @AuthenticationPrincipal Usuario usuario
     │  Valida que usuario != null (401 si no hay sesión)
     ▼
PaymentService.createPreference()
     ├── 1. Valida MERCADOPAGO_ACCESS_TOKEN
     ├── 2. Genera externalReference (UUID)
     ├── 3. Busca Usuario en Oracle por username (JwtFilter ya lo validó)
     ├── 4. Crea Orden en estado CREATED
     ├── 5. Guarda OrdenItems (cascade)
     ├── 6. Calcula total
     ├── 7. Llama a Mercado Pago SDK → PreferenceClient.create()
     │       └── Items, payer email, back_urls, externalReference
     ├── 8. Guarda mpPreferenceId en la Orden
     └── 9. Devuelve CreatePreferenceResponse
             { preferenceId, initPoint, sandboxInitPoint, externalReference, message }
     │
     ▼
cart.js recibe la respuesta
     │  Guarda en localStorage: lastPaymentPreference
     │  Redirige a: sandboxInitPoint (primero) || initPoint
     ▼
Mercado Pago Sandbox
     │  Usuario completa (o rechaza) el pago
     ▼
Redirección a back_url configurada
     ├── /payment-success.html → limpia carrito
     ├── /payment-failure.html → conserva carrito
     └── /payment-pending.html → conserva carrito
     │
     ▼
Webhook (opcional, requiere URL pública)
POST /api/payments/webhook
     │  Sin JWT (endpoint público)
     │  Recibe: topic/type, id, data.id
     ▼
PaymentService.processWebhook()
     ├── Consulta a MP API por payment_id
     ├── Obtiene externalReference
     ├── Busca Orden en Oracle
     ├── Actualiza STATUS de la Orden (APPROVED/REJECTED/PENDING)
     └── Inserta registro en PAGOS_MP
```

---

## Endpoint de Creación de Preferencia

```http
POST /api/payments/create-preference
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "buyerEmail": "usuario@test.cl",
  "items": [
    {
      "productCode": "MNG-EVA-001",
      "title": "Evangelion Vol. 1",
      "description": "Manga de prueba",
      "quantity": 1,
      "unitPrice": 9990
    }
  ]
}
```

### Respuesta exitosa (HTTP 200)

```json
{
  "preferenceId": "UUID-de-mercadopago",
  "initPoint": "https://www.mercadopago.com.ar/checkout/...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/...",
  "externalReference": "UUID-de-la-orden",
  "message": "Preferencia creada correctamente"
}
```

### Errores posibles

| HTTP | Causa | Descripción |
|------|-------|-------------|
| 400  | Validación fallida | Email inválido, items vacíos, precio/cantidad inválidos |
| 401  | Sin JWT o JWT inválido | No autenticado |
| 500  | Error MP o DB | Access token inválido, Oracle no disponible |

---

## Endpoint Webhook

```http
POST /api/payments/webhook
GET  /api/payments/webhook
# Sin autenticación — Mercado Pago llama directamente
```

### Parámetros recibidos (query o body)

| Parámetro | Descripción |
|-----------|-------------|
| `id`      | ID del pago en MP |
| `topic`   | Tipo de evento (API vieja: `payment`) |
| `type`    | Tipo de evento (API nueva: `payment`) |
| `data.id` | ID del pago en cuerpo JSON |

---

## Variables de Entorno Requeridas

```powershell
$env:ORACLE_DB_USERNAME       = "ADMIN"
$env:ORACLE_DB_PASSWORD       = "TU_CLAVE_REAL"
$env:ORACLE_DB_TNS_ALIAS      = "sharingan_medium"
$env:TNS_ADMIN                = "C:/ruta/al/wallet"
$env:JAVA_TOOL_OPTIONS        = "-Doracle.net.tns_admin=C:/ruta/al/wallet"
$env:MERCADOPAGO_ACCESS_TOKEN = "APP_USR-TU-TOKEN-SANDBOX"
$env:JWT_SECRET               = "min-32-chars-secret-here"
$env:MP_SUCCESS_URL           = "http://localhost:8080/payment-success.html"
$env:MP_FAILURE_URL           = "http://localhost:8080/payment-failure.html"
$env:MP_PENDING_URL           = "http://localhost:8080/payment-pending.html"
$env:MP_NOTIFICATION_URL      = ""  # URL de ngrok para webhook local
```

---

## Tablas Involucradas en el Flujo

```sql
-- Validar tablas existentes
SELECT table_name FROM user_tables
WHERE table_name IN ('USUARIOS', 'ORDENES', 'ORDEN_ITEMS', 'PAGOS_MP');

-- Ver órdenes recientes
SELECT ID_ORDEN, EXTERNAL_REFERENCE, BUYER_EMAIL, TOTAL, STATUS, MP_PREFERENCE_ID
FROM ORDENES ORDER BY ID_ORDEN DESC;

-- Ver ítems de la última orden
SELECT ID_ITEM, ID_ORDEN, PRODUCT_CODE, TITLE, QUANTITY, UNIT_PRICE, SUBTOTAL
FROM ORDEN_ITEMS ORDER BY ID_ITEM DESC;

-- Ver registros de pagos MP (webhook)
SELECT ID_PAGO, ID_ORDEN, MP_PAYMENT_ID, MP_STATUS, MP_STATUS_DETAIL, CREATED_AT
FROM PAGOS_MP ORDER BY ID_PAGO DESC;
```

---

## Estados Posibles de una Orden

| Status      | Descripción |
|------------|-------------|
| `CREATED`  | Orden creada, preferencia MP generada, pago no iniciado |
| `PENDING`  | Pago iniciado, pendiente de confirmación |
| `APPROVED` | Pago confirmado por MP |
| `REJECTED` | Pago rechazado |
| `CANCELLED`| Pago cancelado por el usuario |
| `ERROR`    | Error al procesar |

---

## Configuración para GitHub Pages (docs/)

Si `docs/` se usa con GitHub Pages y backend en Render:

Editar `docs/assets/JS/config.js`:

```js
const APP_CONFIG = {
    AUTH_API_BASE_URL:    'https://TU-RENDER-URL.onrender.com/api/auth',
    PAYMENT_API_BASE_URL: 'https://TU-RENDER-URL.onrender.com',
    MANGA_API_BASE_URL:   'https://api-rest-manga.onrender.com'
};
```

Para desarrollo local, el `config.js` en `src/main/resources/static` usa `http://localhost:8080`.

---

## Ngrok para Webhook Local

```powershell
# 1. Iniciar ngrok
ngrok http 8080

# 2. Copiar la URL HTTPS generada, por ejemplo:
#    https://abc123.ngrok-free.app

# 3. Configurar variable de entorno
$env:MP_NOTIFICATION_URL = "https://abc123.ngrok-free.app/api/payments/webhook"

# 4. Reiniciar Spring Boot con las variables actualizadas
.\mvnw.cmd spring-boot:run

# 5. Crear una preferencia → pagar en sandbox → esperar webhook
```

**Log esperado en Spring Boot:**
```
INFO  PaymentController: Webhook POST recibido. Params: {id=XXX, topic=payment}
INFO  PaymentService: Orden X actualizada a status approved
```
