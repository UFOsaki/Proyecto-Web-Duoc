# Casos de Prueba — Sharingan Comics
## Integración Mercado Pago + Spring Boot + Oracle + JWT

---

## CP-01: Registro de usuario

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Registro exitoso de usuario |
| **Objetivo**       | Verificar que un usuario nuevo puede registrarse y recibir un token JWT |
| **Datos entrada**  | `{ username: "smoke", email: "smoke@test.cl", password: "smoke123", phone: "" }` |
| **Procedimiento**  | `POST http://localhost:8080/api/auth/register` con body JSON |
| **Resultado esperado** | HTTP 201, JSON con `token`, `userId`, `username`, `email`, `role` |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

**Comando PowerShell:**
```powershell
$body = @{ username = "smoke"; email = "smoke@test.cl"; password = "smoke123"; phone = "" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body $body
```

---

## CP-02: Login con JWT

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Login exitoso con email y contraseña |
| **Objetivo**       | Verificar que el login devuelve un JWT válido |
| **Datos entrada**  | `{ usernameOrEmail: "smoke@test.cl", password: "smoke123" }` |
| **Procedimiento**  | `POST http://localhost:8080/api/auth/login` |
| **Resultado esperado** | HTTP 200, JSON con `token` no nulo |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

**Comando PowerShell:**
```powershell
$loginBody = @{ usernameOrEmail = "smoke@test.cl"; password = "smoke123" } | ConvertTo-Json
$response  = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token     = $response.token
Write-Host "Token: $token"
```

---

## CP-03: Perfil autenticado

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Acceso a perfil con JWT válido |
| **Objetivo**       | Verificar que el endpoint de perfil requiere autenticación |
| **Datos entrada**  | Token JWT del CP-02 |
| **Procedimiento**  | `GET /api/auth/profile` con header `Authorization: Bearer {token}` |
| **Resultado esperado** | HTTP 200, JSON con `username`, `email`, `role` |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

**Comando PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/profile" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

---

## CP-04: Perfil sin autenticación

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Acceso denegado a perfil sin JWT |
| **Objetivo**       | Verificar que el endpoint retorna 401 sin token |
| **Datos entrada**  | Sin header Authorization |
| **Procedimiento**  | `GET /api/auth/profile` sin token |
| **Resultado esperado** | HTTP 401 Unauthorized |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-05: Carga del catálogo

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Catálogo de mangas carga correctamente |
| **Objetivo**       | Verificar que el frontend muestra productos al abrir index.html |
| **Datos entrada**  | `http://localhost:8080/index.html` |
| **Procedimiento**  | Abrir en navegador, verificar cards de mangas |
| **Resultado esperado** | Cards con imagen, título y precio visible |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-06: Agregar producto al carrito

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Agregar manga al carrito desde modal |
| **Objetivo**       | Verificar que el carrito se actualiza en localStorage |
| **Datos entrada**  | Click en manga → botón "Agregar al carrito" |
| **Procedimiento**  | Desde index.html, abrir modal de un manga y agregar al carrito |
| **Resultado esperado** | `localStorage['cart']` contiene el ítem con `productCode`, `title`, `unitPrice` |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-07: Crear preferencia Mercado Pago

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Creación de preferencia MP con token válido |
| **Objetivo**       | Verificar que el backend crea orden en Oracle y preferencia en MP |
| **Datos entrada**  | Token JWT + body con ítem(s) |
| **Procedimiento**  | `POST /api/payments/create-preference` con Authorization |
| **Resultado esperado** | HTTP 200, JSON con `preferenceId`, `initPoint`, `sandboxInitPoint`, `externalReference` |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

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

---

## CP-08: Compra sin token

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Crear preferencia sin token → debe retornar 401 |
| **Objetivo**       | Verificar que el endpoint es seguro |
| **Datos entrada**  | Sin header Authorization |
| **Procedimiento**  | `POST /api/payments/create-preference` sin JWT |
| **Resultado esperado** | HTTP 401 o 403 |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-09: Carrito vacío en checkout

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Checkout con carrito vacío muestra error |
| **Objetivo**       | Verificar validación frontend antes de llamar al backend |
| **Datos entrada**  | Usuario logueado + carrito vacío |
| **Procedimiento**  | Limpiar localStorage['cart'], ir a vista_carrito.html, clic en "Pagar" |
| **Resultado esperado** | Alert "Tu carrito está vacío" — NO se llama al backend |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-10: Redirección a Mercado Pago

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Frontend redirige a Mercado Pago Sandbox |
| **Objetivo**       | Verificar que se redirige a `sandboxInitPoint` |
| **Datos entrada**  | Usuario logueado + carrito con ítem |
| **Procedimiento**  | Clic en "Pagar con Mercado Pago" en vista_carrito.html |
| **Resultado esperado** | Redirección a `https://sandbox.mercadopago.com.ar/checkout/...` |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-11: Registro de orden en Oracle

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Orden guardada en base de datos Oracle |
| **Objetivo**       | Verificar que la tabla ORDENES tiene el registro |
| **Datos entrada**  | Después de ejecutar CP-07 |
| **Procedimiento**  | Ejecutar SQL en Oracle SQL Developer o similar |
| **Resultado esperado** | Fila en ORDENES con EXTERNAL_REFERENCE del CP-07, STATUS='CREATED', MP_PREFERENCE_ID no nulo |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

**SQL de validación:**
```sql
SELECT ID_ORDEN, ID_USUARIO, EXTERNAL_REFERENCE, BUYER_EMAIL, TOTAL, STATUS, MP_PREFERENCE_ID, CREATED_AT
FROM ORDENES
ORDER BY ID_ORDEN DESC;

SELECT ID_ITEM, ID_ORDEN, PRODUCT_CODE, TITLE, QUANTITY, UNIT_PRICE, SUBTOTAL
FROM ORDEN_ITEMS
ORDER BY ID_ITEM DESC;
```

---

## CP-12: Webhook Mercado Pago

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Webhook recibido y procesado |
| **Objetivo**       | Verificar que el webhook actualiza el estado de la orden |
| **Datos entrada**  | URL ngrok + pago simulado en sandbox MP |
| **Procedimiento**  | Configurar `MP_NOTIFICATION_URL`, ejecutar pago sandbox, revisar logs |
| **Resultado esperado** | Log "Webhook recibido de Mercado Pago", ORDENES.STATUS actualizado |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-13: Token inválido en checkout

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Checkout con token inválido → 401 |
| **Objetivo**       | Verificar que el backend rechaza tokens manipulados |
| **Datos entrada**  | Token manipulado `"Bearer FAKE_TOKEN_INVALIDO"` |
| **Procedimiento**  | `POST /api/payments/create-preference` con token falso |
| **Resultado esperado** | HTTP 401 o 403 |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |

---

## CP-14: Pruebas unitarias automatizadas

| Campo              | Valor |
|--------------------|-------|
| **Nombre**         | Ejecución de pruebas unitarias Maven |
| **Objetivo**       | Verificar que JwtUtil, AuthService y PaymentService tienen cobertura básica |
| **Datos entrada**  | Sin conexión a Oracle ni Mercado Pago |
| **Procedimiento**  | `.\mvnw.cmd test` |
| **Resultado esperado** | BUILD SUCCESS, pruebas: JwtUtilTest (5), AuthServiceTest (5), PaymentServiceValidationTest (6) |
| **Resultado obtenido** | _(completar al ejecutar)_ |
| **Estado**         | 🔄 Pendiente |
