# Plan de Pruebas — Sharingan Comics

**Proyecto:** Sharingan Comics — Tienda Online de Mangas y Cómics  
**Versión del documento:** 2.0  
**Fecha:** 17 de junio de 2026  
**Equipo:** Grupo Sharingan Comics — Duoc UC  
**Rama:** Smoke / main

---

## 1. Objetivo de las Pruebas

Validar de forma integral el correcto funcionamiento del sistema **Sharingan Comics**, garantizando que:

1. **Autenticación dual** (JWT local + Clerk con 2FA/MFA y Google) opera correctamente y de forma segura.
2. **Gestión de usuarios** — registro, login, perfil y logout funcionan sin errores.
3. **Pasarela de pago Mercado Pago** — creación de preferencias, redirección al portal sandbox, procesamiento de webhooks y registro de órdenes en Oracle.
4. **Catálogo de productos** — la API externa de mangas se consume correctamente a través del proxy backend.
5. **Seguridad** — tokens JWT se validan adecuadamente, endpoints protegidos rechazan accesos no autorizados, y no se expone información sensible en logs ni respuestas.
6. **Integridad de datos** — las entidades (Usuarios, Órdenes, Ítems, Pagos) se persisten correctamente en Oracle Autonomous Database.
7. **Frontend** — las páginas HTML/CSS/JS interactúan correctamente con el backend y gestionan el carrito en `localStorage`.

---

## 2. Alcance

### 2.1 Funcionalidades incluidas

| Módulo | Componente | Tipo de prueba |
|--------|-----------|----------------|
| Autenticación Local | Registro, Login, Logout, Perfil | Unitaria + Manual |
| Autenticación Clerk | Login Clerk, Login Google, 2FA/MFA | Integración + Manual |
| Seguridad JWT | Generación, validación, expiración | Unitaria |
| Filtro de seguridad | JwtFilter (dual: local + Clerk) | Unitaria |
| Pasarela de pago | Crear preferencia, Webhook MP | Unitaria + Integración |
| Base de datos | Persistencia en Oracle (USUARIOS, ORDENES, ORDEN_ITEMS, PAGOS_MP) | Integración |
| Catálogo | Proxy API mangas externa | Integración |
| Frontend | Carga catálogo, carrito, checkout, login/signup UI | Manual |
| Seguridad | Acceso sin token, token inválido, escalamiento roles | Manual |

### 2.2 Funcionalidades excluidas

| Componente | Razón de exclusión |
|-----------|-------------------|
| Inventario/Cloudinary | No implementado en esta iteración |
| Panel de administración (CRUD productos) | Endpoints admin aún no expuestos |
| Despliegue en producción Render | Fuera de alcance de pruebas locales |

---

## 3. Descripción General del Proyecto

**Sharingan Comics** es una tienda online de mangas y cómics desarrollada como proyecto académico para Duoc UC.

### Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Spring Boot | 3.4.5 |
| Lenguaje | Java | 17 |
| Build | Maven | 3.9+ |
| Base de datos | Oracle Autonomous Database | Cloud (via Wallet TNS) |
| Autenticación local | JWT (jjwt) | 0.12.6 |
| Autenticación externa | Clerk | v5+ |
| Pasarela de pago | Mercado Pago SDK Java | 2.1.28 |
| Frontend | HTML / CSS / JavaScript | Estático |
| Seguridad | Spring Security + BCrypt | 6.x |
| ORM | Spring Data JPA + Hibernate | 6.x |

### Arquitectura del sistema

```
┌──────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│   Frontend   │────▶│  Spring Boot (8080)  │────▶│  Oracle ADB Cloud  │
│  HTML/CSS/JS │     │  ┌─ AuthController   │     │  ┌─ USUARIOS       │
│  localStorage│     │  ├─ PaymentController│     │  ├─ ORDENES        │
└──────────────┘     │  ├─ MangaProxy       │     │  ├─ ORDEN_ITEMS    │
                     │  ├─ JwtFilter        │     │  └─ PAGOS_MP       │
                     │  └─ SecurityConfig   │     └────────────────────┘
                     └─────────┬────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌───────┐ ┌──────────┐
              │ Clerk    │ │ MP    │ │ API      │
              │ (Auth    │ │ (Pago │ │ Mangas   │
              │  2FA/MFA)│ │ SDK)  │ │ Render   │
              └──────────┘ └───────┘ └──────────┘
```

---

## 4. Funcionalidades a Probar

### 4.1 Autenticación y usuarios

| # | Funcionalidad | Endpoint / Componente | Tipo |
|---|--------------|----------------------|------|
| F-01 | Registro de usuario local | `POST /api/auth/register` | Unitaria + Manual |
| F-02 | Login con JWT local | `POST /api/auth/login` | Unitaria + Manual |
| F-03 | Obtener perfil autenticado | `GET /api/auth/profile` | Manual |
| F-04 | Alias de perfil (Clerk) | `GET /api/auth/me` | Manual |
| F-05 | Actualizar perfil (teléfono) | `PUT /api/auth/profile` | Manual |
| F-06 | Logout stateless | `POST /api/auth/logout` | Manual |

### 4.2 Seguridad

| # | Funcionalidad | Descripción | Tipo |
|---|--------------|-------------|------|
| F-07 | Generación JWT | Token con subject, claims, firma HMAC | Unitaria |
| F-08 | Validación JWT | Verificar firma, expiración, formato | Unitaria |
| F-09 | Rechazo token inválido | Token manipulado → 401 | Unitaria + Manual |
| F-10 | Rechazo token expirado | Token expirado → 401 | Unitaria |
| F-11 | Acceso sin token | Endpoint protegido → 401 | Manual |
| F-12 | Control de roles | CUSTOMER no accede a /api/admin/** | Manual |

### 4.3 Pasarela de pago (Mercado Pago)

| # | Funcionalidad | Endpoint / Componente | Tipo |
|---|--------------|----------------------|------|
| F-13 | Crear preferencia de pago | `POST /api/payments/create-preference` | Unitaria + Manual |
| F-14 | Validaciones de request | Items, precios, emails | Unitaria |
| F-15 | Recepción webhook | `POST /api/payments/webhook` | Integración |
| F-16 | Registro de orden en Oracle | Tabla ORDENES + ORDEN_ITEMS | Integración |
| F-17 | Redirección a sandbox MP | Frontend → sandboxInitPoint | Manual |

### 4.4 Catálogo y frontend

| # | Funcionalidad | Descripción | Tipo |
|---|--------------|-------------|------|
| F-18 | Proxy API mangas | `GET /api/mangas` → API externa | Integración |
| F-19 | Carga de catálogo | Cards con imagen, título, precio | Manual |
| F-20 | Carrito (localStorage) | Agregar, listar, eliminar | Manual |
| F-21 | Checkout con pago | Flujo completo hasta MP sandbox | Manual |
| F-22 | Páginas de retorno | success/failure/pending HTML | Manual |

### 4.5 Autenticación Clerk (integración externa)

| # | Funcionalidad | Descripción | Tipo |
|---|--------------|-------------|------|
| F-23 | Login con Clerk | UI Clerk → token → backend | Integración |
| F-24 | Login con Google (social) | OAuth via Clerk | Integración |
| F-25 | MFA/2FA con TOTP | Código 6 dígitos post-login | Integración |
| F-26 | Sincronización usuario Oracle | UsuarioSyncService | Integración |
| F-27 | Asociación LOCAL → CLERK | Email matching sin duplicados | Integración |

---

## 5. Integraciones Externas a Validar

| # | Servicio externo | Tipo | URL / Recurso | Propósito | Modo |
|---|-----------------|------|---------------|-----------|------|
| INT-01 | Oracle Autonomous Database | Base de datos | `jdbc:oracle:thin:@sharingan_medium` (via Wallet TNS) | Persistencia de usuarios, órdenes, pagos | Producción cloud |
| INT-02 | Mercado Pago | Pasarela de pago | `api.mercadopago.com` | Creación de preferencias, procesamiento de pagos | Sandbox (TEST) |
| INT-03 | API REST Mangas | API catálogo | `https://api-rest-manga.onrender.com/images` | Obtener catálogo de mangas para el frontend | Producción |
| INT-04 | Clerk | Autenticación | Clerk Dashboard + JWKS endpoint | Login social, MFA/2FA, validación de tokens | Desarrollo |
| INT-05 | Google OAuth | Login social | Via Clerk (social provider) | Autenticación con cuenta Google | Desarrollo |
| INT-06 | Ngrok | Túnel HTTP | `https://xxx.ngrok-free.app` | Exponer localhost para webhook de MP | Local dev |

---

## 6. Roles y Responsabilidades del Equipo

| Rol | Persona | Responsabilidad |
|-----|---------|----------------|
| Desarrollador Backend / Líder técnico | Equipo Sharingan | Implementar correcciones, ejecutar pruebas unitarias, configurar integraciones |
| Desarrollador Frontend | Equipo Sharingan | Validar UI, carrito, flujo checkout, capturas de pantalla |
| QA / Tester | Equipo Sharingan | Diseñar casos de prueba, ejecutar pruebas manuales, documentar evidencias |
| DBA | Equipo Sharingan | Verificar integridad de datos en Oracle, ejecutar consultas SQL de validación |
| Evaluador | Docente Duoc UC | Revisar evidencias, validar criterios de aceptación, evaluar calidad técnica |

---

## 7. Cronograma de Pruebas

| Fase | Fecha | Duración | Estado |
|------|-------|----------|--------|
| Preparación de entorno y configuración | 2026-06-10 | 1 día | ✅ Completado |
| Desarrollo de pruebas unitarias (JUnit 5 + Mockito) | 2026-06-10 – 2026-06-11 | 2 días | ✅ Completado |
| Ejecución de pruebas unitarias | 2026-06-17 | 1 día | ✅ Completado (21/21 tests OK) |
| Pruebas manuales de API (PowerShell/curl) | 2026-06-17 | 1 día | ✅ Completado |
| Pruebas de integración con Oracle | 2026-06-17 | 1 día | ✅ Completado |
| Pruebas de integración Mercado Pago (sandbox) | 2026-06-17 | 1 día | ✅ Completado |
| Pruebas de integración Clerk (2FA + Google) | 2026-06-17 | 1 día | ✅ Completado |
| Pruebas de frontend (navegador) | 2026-06-17 | 1 día | ✅ Completado |
| Pruebas de seguridad (tokens, roles) | 2026-06-17 | 1 día | ✅ Completado |
| Documentación de evidencias y análisis | 2026-06-17 | 1 día | ✅ Completado |
| Entrega final | 2026-06-17 | — | ✅ Entregado |

---

## 8. Riesgos Identificados

| # | Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|--------|-------------|---------|-----------|--------|
| R-01 | Oracle Wallet no disponible en máquina local | Media | Alto | Documentar variables de entorno claramente. Tener Wallet respaldado fuera del repo. | ✅ Mitigado |
| R-02 | Access Token de Mercado Pago Sandbox expirado o inválido | Media | Alto | Verificar vigencia en panel MP antes de ejecutar pruebas. Usar tokens de prueba. | ✅ Mitigado |
| R-03 | CORS bloqueando peticiones del frontend al backend | Alta | Medio | Bean `CorsConfigurationSource` configurado con 7 orígenes explícitos. | ✅ Mitigado |
| R-04 | Webhook no recibido sin dominio público (localhost) | Alta | Medio | Usar Ngrok para exponer localhost. Documentar proceso. | ✅ Mitigado |
| R-05 | Token JWT expirado durante sesión de pruebas | Baja | Bajo | Expiración configurada en 24h. Regenerar token si necesario. | ✅ Mitigado |
| R-06 | API externa de mangas no disponible (Render cold start) | Media | Medio | Reintentar después de 30-60 segundos. Documentar timeout. | ✅ Mitigado |
| R-07 | Clerk no configurado en entorno local | Baja | Medio | Sistema funciona con `clerk.enabled=false`. JWT local sigue operativo. | ✅ Mitigado |
| R-08 | Dependencia de Mockito con Java 17+ warnings | Baja | Bajo | Warnings de byte-buddy no afectan ejecución de tests. Son informativos. | ✅ Aceptado |

---

## 9. Criterios de Aceptación

| # | Criterio | Verificación | Estado |
|---|---------|-------------|--------|
| CA-01 | Spring Boot inicia sin errores con Oracle conectado | Log: `Started SharinganComicsApplication` + HikariPool | ✅ Aprobado |
| CA-02 | `POST /api/auth/register` devuelve HTTP 201 con token | JSON con `token`, `userId`, `username`, `email`, `role` | ✅ Aprobado |
| CA-03 | `POST /api/auth/login` devuelve HTTP 200 con token | JSON con `token` no nulo | ✅ Aprobado |
| CA-04 | `GET /api/auth/profile` devuelve 401 sin token | HTTP 401 Unauthorized | ✅ Aprobado |
| CA-05 | `GET /api/auth/profile` devuelve 200 con token válido | JSON con datos del usuario | ✅ Aprobado |
| CA-06 | `POST /api/payments/create-preference` devuelve preferenceId | JSON con `preferenceId`, `sandboxInitPoint`, `externalReference` | ✅ Aprobado |
| CA-07 | Orden creada correctamente en tabla ORDENES de Oracle | Fila con `EXTERNAL_REFERENCE`, `STATUS='CREATED'`, `MP_PREFERENCE_ID` | ✅ Aprobado |
| CA-08 | Ítems creados correctamente en tabla ORDEN_ITEMS | Filas con `PRODUCT_CODE`, `QUANTITY`, `UNIT_PRICE`, `SUBTOTAL` | ✅ Aprobado |
| CA-09 | Frontend redirige a sandboxInitPoint de Mercado Pago | Navegador abre checkout de MP sandbox | ✅ Aprobado |
| CA-10 | `payment-success.html` limpia carrito correctamente | `localStorage['cart']` se vacía | ✅ Aprobado |
| CA-11 | Todas las pruebas unitarias ejecutan sin errores | `BUILD SUCCESS` — 21 tests, 0 failures, 0 errors | ✅ Aprobado |
| CA-12 | Token inválido es rechazado con 401 | No se autentica, Spring Security retorna 401 | ✅ Aprobado |
| CA-13 | Token expirado es rechazado | `isValid()` retorna false | ✅ Aprobado |
| CA-14 | Login con Clerk funciona end-to-end | Usuario sincronizado en Oracle con `AUTH_PROVIDER='CLERK'` | ✅ Aprobado |
| CA-15 | MFA/2FA funcional con Clerk | Badge 2FA visible, `MFA_ENABLED=1` en Oracle | ✅ Aprobado |
| CA-16 | No se exponen tokens ni contraseñas en logs | Búsqueda de `eyJ` y passwords en logs — sin resultados | ✅ Aprobado |

---

## 10. Herramientas Utilizadas

| Herramienta | Propósito |
|------------|-----------|
| JUnit 5 | Framework de pruebas unitarias |
| Mockito 5.x | Mocking de dependencias (Repository, JwtUtil) |
| AssertJ | Assertions fluidas y descriptivas |
| Maven Surefire | Ejecución de pruebas automatizadas |
| PowerShell / curl | Pruebas manuales de API REST |
| Chrome DevTools (Network) | Inspección de requests HTTP del frontend |
| Oracle SQL Developer | Validación de datos en Oracle ADB |
| Ngrok | Túnel para webhook de Mercado Pago |
| Mercado Pago Sandbox | Simulación de pagos |
| Clerk Dashboard | Configuración de auth social y MFA |

---

## 11. Comandos para Ejecutar Pruebas

### Variables de entorno (PowerShell)

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
$env:MP_NOTIFICATION_URL     = ""
```

### Arrancar backend

```powershell
.\mvnw.cmd spring-boot:run
```

### Ejecutar pruebas unitarias

```powershell
.\mvnw.cmd test "-Dtest=JwtUtilTest,AuthServiceTest,PaymentServiceValidationTest"
```

### Webhook con Ngrok

```powershell
ngrok http 8080
$env:MP_NOTIFICATION_URL = "https://TU-ID.ngrok-free.app/api/payments/webhook"
# Reiniciar Spring Boot
```
