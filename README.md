# Sharingan Comics 🎌

Tienda online de mangas y cómics, desarrollada con HTML/CSS/JS (frontend) y Spring Boot (backend).

## Estructura del proyecto

```
Proyecto-Web-Duoc/
├── pom.xml                         ← Maven (raíz — NO mover)
├── src/main/
│   ├── java/.../sharingan_comics/  ← Backend Spring Boot
│   │   ├── controller/             ← REST endpoints (Auth + Proxy)
│   │   ├── service/                ← Lógica de negocio
│   │   ├── repository/             ← Acceso a datos (JPA)
│   │   ├── model/                  ← Entidades (Usuario)
│   │   ├── dto/                    ← DTOs (Request/Response)
│   │   ├── security/               ← JWT + Spring Security
│   │   └── config/                 ← CORS config
│   └── resources/
│       ├── application.yml         ← Config (usa env vars)
│       └── static/                 ← FUENTE PRINCIPAL del frontend
├── docs/                           ← GitHub Pages (copia de static/)
├── database/                       ← Scripts SQL (Oracle)
├── wallet/                         ← Oracle Wallet (NO versionada)
├── scripts/                        ← Scripts de utilidad
├── docs-developer/                 ← Documentación técnica
└── archive/                        ← Código obsoleto archivado
```

## Requisitos previos

- Java 21
- Maven 3.9+
- Oracle Wallet (`Wallet_sharingan.zip`)
- Node.js (no requerido — frontend estático)
- Live Server (VS Code extension) para frontend local

## Configuración rápida

### 1. Variables de entorno

```bash
# Base de datos
ORACLE_DB_USERNAME=ADMIN
ORACLE_DB_PASSWORD=tu_contraseña_oracle
TNS_ADMIN=C:/ruta/a/wallet/extraída
ORACLE_DB_TNS_ALIAS=sharingan_medium

# Seguridad
JWT_SECRET=tu_clave_secreta_de_al_menos_256_bits

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxx
MP_SUCCESS_URL=http://localhost:8080/payment-success.html
MP_FAILURE_URL=http://localhost:8080/payment-failure.html
MP_PENDING_URL=http://localhost:8080/payment-pending.html
# MP_NOTIFICATION_URL=https://tu-ngrok.app/api/payments/webhook
```

### 2. Oracle Wallet

1. Descargar `Wallet_sharingan.zip` desde Oracle Cloud Console.
2. Extraer en una carpeta **fuera del repositorio** (ej: `C:/Workspace/oracle-wallet/`).
3. Configurar `TNS_ADMIN` apuntando a esa carpeta.
4. **Nunca subir la Wallet al repositorio.**

### 3. Base de datos

```bash
# Ejecutar en SQL Developer conectado via Wallet
database/schema.sql
```

### 4. Backend

```bash
# Desde la raíz del proyecto
./mvnw spring-boot:run
# El backend corre en http://localhost:8080
```

### 5. Frontend (Live Server)

1. Abrir `src/main/resources/static/index.html` en VS Code.
2. Click derecho → "Open with Live Server".
3. Se abre en `http://127.0.0.1:5500/...`

### 6. GitHub Pages

```bash
# Sincronizar frontend → docs
.\scripts\copy-frontend.ps1

# Configurar en GitHub:
# Settings → Pages → Source: Deploy from branch
# Branch: main (o Smoke) → Folder: /docs
```

## Endpoints de autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Iniciar sesión |
| GET | `/api/auth/profile` | Bearer JWT | Ver perfil |
| PUT | `/api/auth/profile` | Bearer JWT | Actualizar perfil |
| POST | `/api/auth/logout` | No | Cerrar sesión |

## APIs externas

| Servicio | URL |
|----------|-----|
| Catálogo mangas | `https://api-rest-manga.onrender.com/images` |
| Mercado Pago | `https://ms-sharingan-comics-pay-mercado-pago.onrender.com` |

## Probar registro/login

```bash
# Registrar
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test1234"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"test@test.com","password":"Test1234"}'

# Profile (usar token del login)
curl -H "Authorization: Bearer TOKEN_AQUI" \
  http://localhost:8080/api/auth/profile
```

## Despliegue en Render y Configuración de Clerk

### 1. Variables de entorno en Render

Para desplegar el backend en Render, configure las siguientes variables de entorno:

| Variable | Descripción / Valor recomendado |
|----------|---------------------------------|
| `PORT` | Puerto del servidor (ej: `8080`) |
| `ORACLE_DB_USERNAME` | Usuario de base de datos Oracle (ej: `ADMIN`) |
| `ORACLE_DB_PASSWORD` | Contraseña de la base de datos Oracle |
| `ORACLE_DB_TNS_ALIAS` | Alias TNS del Oracle Wallet (ej: `sharingan_medium`) |
| `TNS_ADMIN` | Carpeta local/contenedor donde se ubica la wallet (ej: `/etc/secrets` o similar) |
| `JAVA_TOOL_OPTIONS` | Opción JVM para indicar TNS Admin: `-Doracle.net.tns_admin=/etc/secrets` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acceso de Mercado Pago (producción o Sandbox) |
| `JWT_SECRET` | Clave secreta para JWT local (HMAC-256) |
| `CLERK_ENABLED` | Activar autenticación Clerk (`true` / `false`) |
| `CLERK_ISSUER` | Emisor de Clerk (ej: `https://tender-coral-13.clerk.accounts.dev`) |
| `CLERK_JWKS_URL` | URL JWKS de Clerk (ej: `https://tender-coral-13.clerk.accounts.dev/.well-known/jwks.json`) |
| `CLERK_SECRET_KEY` | Clave secreta privada de Clerk (nunca en frontend) |
| `ALLOWED_ORIGINS` | Orígenes CORS: `https://ufosaki.github.io,https://ufosaki.github.io/Proyecto-Web-Duoc,https://sharingan-comics-clerk.onrender.com,http://localhost:8080,http://127.0.0.1:5501` |
| `MP_SUCCESS_URL` | URL de éxito de Mercado Pago (ej: `https://ufosaki.github.io/Proyecto-Web-Duoc/payment-success.html`) |
| `MP_FAILURE_URL` | URL de error de Mercado Pago (ej: `https://ufosaki.github.io/Proyecto-Web-Duoc/payment-failure.html`) |
| `MP_PENDING_URL` | URL pendiente de Mercado Pago (ej: `https://ufosaki.github.io/Proyecto-Web-Duoc/payment-pending.html`) |
| `MP_NOTIFICATION_URL` | URL de webhook para Mercado Pago |

### 2. Configuración en Clerk Dashboard

Para que el inicio de sesión de Clerk redirija correctamente y acepte las peticiones del frontend aislado, configure las siguientes **Allowed Origins** y **Redirect URLs** en el Clerk Dashboard (`dashboard.clerk.com`):

```txt
https://sharingan-comics-clerk.onrender.com
https://sharingan-comics-clerk.onrender.com/
https://sharingan-comics-clerk.onrender.com/index.html
https://ufosaki.github.io
https://ufosaki.github.io/Proyecto-Web-Duoc/
http://localhost:8080
http://localhost:8080/
http://localhost:8080/index.html
http://127.0.0.1:5501
http://127.0.0.1:5501/
```

## Seguridad y Normativa

- ❌ No subir Wallet ni credenciales.
- ❌ No hardcodear passwords.
- ❌ No guardar passwords en localStorage.
- ✅ BCrypt para hash de contraseñas locales.
- ✅ JWT stateless para sesiones.
- ✅ Variables de entorno para configuración sensible.
- ✅ `.gitignore` protege wallet/, .env, application.properties.
- ✅ Cumplimiento con ISO 27001, ISO 25010, Ley 21.719, Ley 21.663, Ley 21.459 y Ley 19.628.