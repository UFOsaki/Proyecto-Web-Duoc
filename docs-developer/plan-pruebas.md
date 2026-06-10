# Plan de Pruebas — Sharingan Comics
## Integración de Mercado Pago con Spring Boot + Oracle + JWT

---

## 1. Objetivo

Validar el flujo completo de pago con Mercado Pago en el sistema Sharingan Comics, asegurando que:

- El backend Spring Boot se conecta correctamente a Oracle Autonomous Database.
- El sistema JWT de autenticación funciona correctamente.
- El endpoint `POST /api/payments/create-preference` crea órdenes en Oracle y preferencias en Mercado Pago.
- El frontend redirige al portal de pago de Mercado Pago.
- El webhook recibe y procesa notificaciones de Mercado Pago.
- Las páginas de retorno (success/failure/pending) funcionan correctamente.

---

## 2. Alcance

| Componente                  | Incluido | Excluido |
|----------------------------|----------|----------|
| Autenticación JWT           | ✅        |          |
| Registro de usuarios        | ✅        |          |
| Perfil autenticado          | ✅        |          |
| Creación de preferencia MP  | ✅        |          |
| Creación de orden en Oracle | ✅        |          |
| Webhook Mercado Pago        | ✅        |          |
| Catálogo de productos       | ✅ (carga)|          |
| Carrito de compras          | ✅        |          |
| Inventario / Cloudinary     |          | ❌        |
| Clerk (auth externo)        |          | ❌        |

---

## 3. Descripción del Proyecto

**Sharingan Comics** es una tienda online de mangas y cómics.

- **Backend:** Spring Boot 3.4.5 + Java 17 + Maven
- **Base de datos:** Oracle Autonomous Database (via Wallet TNS)
- **Autenticación:** JWT propio (jjwt 0.12.6)
- **Pago:** Mercado Pago SDK Java 2.1.28
- **Frontend:** HTML/CSS/JS estático servido desde Spring Boot
- **GitHub Pages:** Copia en `docs/`

---

## 4. Funcionalidades a Probar

1. Registro de usuario (`POST /api/auth/register`)
2. Login JWT (`POST /api/auth/login`)
3. Perfil autenticado (`GET /api/auth/profile`)
4. Catálogo de mangas (externo via proxy)
5. Agregar producto al carrito (frontend/localStorage)
6. Crear preferencia de pago (`POST /api/payments/create-preference`)
7. Redirección a Mercado Pago Sandbox
8. Retorno desde Mercado Pago (success/failure/pending)
9. Webhook Mercado Pago (`POST /api/payments/webhook`)
10. Registro de orden en Oracle
11. Pruebas de seguridad: sin token, token inválido, carrito vacío

---

## 5. Integraciones Externas

| Integración           | URL / Servicio                                | Modo      |
|----------------------|-----------------------------------------------|-----------|
| Oracle Autonomous DB | jdbc:oracle:thin:@sharingan_medium (via Wallet)| Producción cloud |
| Mercado Pago         | api.mercadopago.com                           | Sandbox   |
| API Mangas           | https://api-rest-manga.onrender.com           | Producción|
| Ngrok (webhook)      | https://xxx.ngrok-free.app                    | Local dev |

---

## 6. Roles y Responsabilidades

| Rol              | Responsabilidad                                   |
|-----------------|---------------------------------------------------|
| Desarrollador    | Implementar correcciones y ejecutar pruebas       |
| Evaluador        | Revisar evidencias y validar criterios de aceptación |

---

## 7. Cronograma

| Fase                        | Fecha       | Estado   |
|----------------------------|-------------|----------|
| Auditoría y correcciones    | 2026-06-10  | ✅ Completado |
| Pruebas unitarias           | 2026-06-10  | ✅ Completado |
| Pruebas manuales con backend| 2026-06-10  | 🔄 Pendiente ejecución |
| Pruebas frontend            | 2026-06-10  | 🔄 Pendiente ejecución |
| Pruebas webhook (ngrok)     | Por definir | 🔄 Pendiente |
| Entrega y evaluación        | Por definir | ⏳        |

---

## 8. Riesgos

| Riesgo                                    | Impacto | Mitigación                              |
|------------------------------------------|---------|-----------------------------------------|
| Oracle Wallet no disponible localmente    | Alto    | Documentar variables de entorno claras  |
| Access Token MP Sandbox inválido          | Alto    | Verificar en panel Mercado Pago         |
| CORS bloqueando peticiones desde frontend | Medio   | Bean CORS configurado con orígenes completos |
| Webhook no recibido sin dominio público   | Medio   | Usar ngrok para pruebas locales         |
| Token JWT expirado durante prueba         | Bajo    | Expiración de 24h configurada           |

---

## 9. Criterios de Aceptación

| Criterio                                                          | Estado |
|------------------------------------------------------------------|--------|
| Spring Boot inicia sin errores con Oracle                        | 🔄     |
| `POST /api/auth/register` devuelve 201 con token                 | 🔄     |
| `POST /api/auth/login` devuelve 200 con token                    | 🔄     |
| `GET /api/auth/profile` devuelve 401 sin token                   | 🔄     |
| `GET /api/auth/profile` devuelve 200 con token válido            | 🔄     |
| `POST /api/payments/create-preference` devuelve JSON con preferenceId | 🔄 |
| Orden creada en tabla ORDENES de Oracle                          | 🔄     |
| Ítems creados en tabla ORDEN_ITEMS de Oracle                     | 🔄     |
| Frontend redirige a sandboxInitPoint de Mercado Pago             | 🔄     |
| `payment-success.html` limpia carrito correctamente              | 🔄     |
| Pruebas unitarias ejecutan sin errores                           | 🔄     |

---

## 10. Comandos para Correr el Backend

### Variables de entorno necesarias (PowerShell)

```powershell
$env:ORACLE_DB_USERNAME      = "ADMIN"
$env:ORACLE_DB_PASSWORD      = "TU_CLAVE_REAL"
$env:ORACLE_DB_TNS_ALIAS     = "sharingan_medium"
$env:TNS_ADMIN               = "C:/ruta/al/wallet"
$env:JAVA_TOOL_OPTIONS       = "-Doracle.net.tns_admin=C:/ruta/al/wallet"
$env:MERCADOPAGO_ACCESS_TOKEN = "APP_USR-TU-TOKEN-SANDBOX"
$env:JWT_SECRET              = "sharingan-comics-jwt-secret-local-development-2026-very-secure-key-32chars"
$env:MP_SUCCESS_URL          = "http://localhost:8080/payment-success.html"
$env:MP_FAILURE_URL          = "http://localhost:8080/payment-failure.html"
$env:MP_PENDING_URL          = "http://localhost:8080/payment-pending.html"
$env:MP_NOTIFICATION_URL     = ""  # Dejar vacío o poner URL de ngrok
```

### Arrancar el backend

```powershell
.\mvnw.cmd spring-boot:run
```

### Ejecutar pruebas unitarias

```powershell
.\mvnw.cmd test -pl . -Dtest="JwtUtilTest,AuthServiceTest,PaymentServiceValidationTest"
```

### Para webhook con ngrok

```powershell
ngrok http 8080
# Luego:
$env:MP_NOTIFICATION_URL = "https://TU-ID.ngrok-free.app/api/payments/webhook"
# Reiniciar Spring Boot
```
