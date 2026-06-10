# Evidencias de Pruebas — Sharingan Comics
## Integración Mercado Pago + Spring Boot + Oracle

> **Instrucciones:** Completa cada sección con la captura o log obtenido al ejecutar las pruebas.
> No subir secretos, contraseñas ni tokens reales en este archivo.

---

## EV-01: Spring Boot iniciado correctamente

**Log esperado:**
```
HikariPool-1 - Added connection oracle.jdbc.driver.T4CConnection@...
Mercado Pago SDK inicializado correctamente.
Tomcat started on port 8080 (http)
Started SharinganComicsApplication in X.XXX seconds
```

**Log obtenido:**
```
(completar al ejecutar el backend)
```

**Estado:** 🔄 Pendiente

---

## EV-02: Conexión Oracle Hikari

**Log esperado:**
```
HikariPool-1 - Added connection ...
```

**Log obtenido:**
```
(completar)
```

**Estado:** 🔄 Pendiente

---

## EV-03: Usuario registrado en Oracle

**Comando ejecutado:**
```powershell
# (sin el token real)
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $body
```

**Respuesta obtenida:**
```json
{
  "token": "[REDACTADO - no mostrar token real]",
  "userId": X,
  "username": "smoke",
  "email": "smoke@test.cl",
  "role": "CUSTOMER"
}
```

**SQL de validación:**
```sql
SELECT ID_USUARIO, USERNAME, EMAIL, ROLE, CREATED_AT FROM USUARIOS ORDER BY ID_USUARIO DESC;
```

**Resultado SQL:**
```
(completar con captura de SQL Developer)
```

**Estado:** 🔄 Pendiente

---

## EV-04: Login con token JWT

**Respuesta obtenida:**
```json
{
  "token": "[REDACTADO]",
  "userId": X,
  "username": "smoke",
  "email": "smoke@test.cl",
  "role": "CUSTOMER"
}
```

**Estado:** 🔄 Pendiente

---

## EV-05: Perfil autenticado

**Respuesta obtenida:**
```json
{
  "userId": X,
  "username": "smoke",
  "email": "smoke@test.cl",
  "phone": null,
  "role": "CUSTOMER"
}
```

**Estado:** 🔄 Pendiente

---

## EV-06: Respuesta JSON de preferencia Mercado Pago

**Respuesta obtenida:**
```json
{
  "preferenceId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "externalReference": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "message": "Preferencia creada correctamente"
}
```

**Estado:** 🔄 Pendiente

---

## EV-07: Orden creada en Oracle

**SQL ejecutado:**
```sql
SELECT ID_ORDEN, ID_USUARIO, EXTERNAL_REFERENCE, BUYER_EMAIL, TOTAL, STATUS, MP_PREFERENCE_ID, CREATED_AT
FROM ORDENES ORDER BY ID_ORDEN DESC;
```

**Resultado:**
```
(completar con datos del SQL Developer — NO incluir tokens MP)
```

**Estado:** 🔄 Pendiente

---

## EV-08: Ítems de orden en Oracle

**SQL ejecutado:**
```sql
SELECT ID_ITEM, ID_ORDEN, PRODUCT_CODE, TITLE, QUANTITY, UNIT_PRICE, SUBTOTAL
FROM ORDEN_ITEMS ORDER BY ID_ITEM DESC;
```

**Resultado:**
```
(completar)
```

**Estado:** 🔄 Pendiente

---

## EV-09: Redirección a Mercado Pago Sandbox

**Descripción:** Al clic en "Pagar con Mercado Pago" en `vista_carrito.html`, el browser redirige a la URL de sandbox.

**URL de redirección observada:**
```
https://sandbox.mercadopago.com.ar/checkout/...
```

**Estado:** 🔄 Pendiente

---

## EV-10: Página payment-success.html

**Descripción:** Después de completar pago en sandbox, Mercado Pago redirige a `payment-success.html`.
- Carrito borrado de localStorage: ✅ / ❌
- Referencia de pago mostrada: ✅ / ❌

**Estado:** 🔄 Pendiente

---

## EV-11: Página payment-failure.html

**Descripción:** Al rechazar pago en sandbox, redirige a `payment-failure.html`.
- Carrito conservado: ✅ / ❌

**Estado:** 🔄 Pendiente

---

## EV-12: Webhook Mercado Pago

**Configuración usada:**
```
MP_NOTIFICATION_URL = https://[ngrok-id].ngrok-free.app/api/payments/webhook
```

**Log recibido en Spring Boot:**
```
(completar con log del webhook)
```

**Estado de orden actualizado:**
```
(completar)
```

**Estado:** 🔄 Pendiente (requiere ngrok activo)

---

## EV-13: Resultado de pruebas unitarias

**Comando ejecutado:**
```powershell
.\mvnw.cmd test -Dtest="JwtUtilTest,AuthServiceTest,PaymentServiceValidationTest"
```

**Resultado:**
```
(completar con salida de Maven)
```

**Estado:** 🔄 Pendiente

---

## EV-14: Captura DevTools Network

**Descripción:** Captura de pantalla del panel Network de Chrome DevTools mostrando:
- `POST /api/payments/create-preference` con status 200
- Headers de CORS correctos
- Response JSON con `preferenceId`

**Captura:**
```
[Adjuntar captura de pantalla aquí]
```

**Estado:** 🔄 Pendiente

---

## Resumen Final de Evidencias

| Evidencia | Estado |
|-----------|--------|
| EV-01: Spring Boot iniciado | 🔄 |
| EV-02: Oracle Hikari conectado | 🔄 |
| EV-03: Usuario registrado en Oracle | 🔄 |
| EV-04: Login JWT | 🔄 |
| EV-05: Perfil autenticado | 🔄 |
| EV-06: Preferencia MP creada | 🔄 |
| EV-07: Orden en Oracle | 🔄 |
| EV-08: Ítems de orden | 🔄 |
| EV-09: Redirección a MP | 🔄 |
| EV-10: payment-success.html | 🔄 |
| EV-11: payment-failure.html | 🔄 |
| EV-12: Webhook | 🔄 |
| EV-13: Pruebas unitarias | 🔄 |
| EV-14: DevTools Network | 🔄 |
