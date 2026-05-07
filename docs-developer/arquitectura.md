# Arquitectura — Sharingan Comics

## Diagrama general

```
┌────────────────────────────────────────────────┐
│                  FRONTEND                       │
│  (HTML + CSS + JS — Live Server / GitHub Pages) │
│                                                 │
│  index.html → catálogo (manga API)             │
│  login.html → POST /api/auth/login             │
│  signup.html → POST /api/auth/register         │
│  profile.html → GET /api/auth/profile          │
│  cart → checkout → Mercado Pago backend        │
└────────────┬───────────────────────────────────┘
             │ HTTP (fetch)
             ▼
┌────────────────────────────────────────────────┐
│              BACKEND (Spring Boot)              │
│              http://localhost:8080              │
│                                                 │
│  AuthController     → register, login, profile │
│  MangaProxyController → proxy manga API        │
│  ImageProxyController → proxy imágenes         │
│                                                 │
│  SecurityConfig → JWT stateless                │
│  JwtFilter → valida Bearer token               │
│  AuthService → BCrypt + JPA                    │
└────────────┬───────────────────────────────────┘
             │ JDBC + Oracle Wallet (TCPS)
             ▼
┌────────────────────────────────────────────────┐
│           ORACLE AUTONOMOUS DB                  │
│           (via Wallet + TNS)                    │
│                                                 │
│  USUARIOS: id, username, email, password_hash, │
│            phone, role, created_at, updated_at  │
└────────────────────────────────────────────────┘
```

## Capas del backend

| Capa | Responsabilidad |
|------|-----------------|
| `controller/` | Recibe HTTP requests, delega a service |
| `service/` | Lógica de negocio (register, login, BCrypt) |
| `repository/` | Acceso a datos JPA |
| `model/` | Entidades JPA mapeadas a Oracle |
| `dto/` | Objetos de transferencia (request/response) |
| `security/` | JWT, filtro de auth, Spring Security config |
| `config/` | CORS, beans generales |

## Flujo de datos

1. **Frontend** hace `fetch()` a `/api/auth/*`
2. **Spring Security** intercepta → `JwtFilter` valida token
3. **Controller** recibe request → llama **Service**
4. **Service** ejecuta lógica + accede a **Repository**
5. **Repository** consulta **Oracle** via JPA + Wallet
6. Respuesta JSON vuelve al frontend
