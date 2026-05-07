# Flujo de Login — Sharingan Comics

## Flujo completo

```
Usuario → login.html → POST /api/auth/login → AuthController
    → AuthService.login()
        → UsuarioRepository.findByUsernameOrEmail()
        → BCrypt.matches(password, hash)
        → JwtUtil.generateToken()
    → AuthResponse { token, userId, username, email, role }
    → Frontend guarda en localStorage:
        - authToken
        - isLoggedIn = "true"
        - loggedInUser = { userId, username, email, role }
```

## Registro

```
Usuario → signup.html → POST /api/auth/register → AuthController
    → AuthService.register()
        → Validar duplicados (email, username)
        → BCrypt.encode(password)
        → UsuarioRepository.save()
        → JwtUtil.generateToken()
    → AuthResponse { token, userId, username, email, role }
    → Redirige a profile.html
```

## Perfil

```
profile.html → GET /api/auth/profile
    Headers: { Authorization: "Bearer <token>" }
    → JwtFilter valida token
    → AuthController.getProfile(@AuthenticationPrincipal usuario)
    → AuthService.getProfile()
    → ProfileResponse { userId, username, email, phone, role }
```

## Logout

```
Frontend → borra authToken, isLoggedIn, loggedInUser de localStorage
→ (Opcional) POST /api/auth/logout → responde OK
→ Redirige a index.html
```

## Seguridad

- **Contraseñas**: Nunca se guardan planas. BCrypt hash en Oracle.
- **JWT**: Token stateless con expiración de 24h.
- **localStorage**: Solo guarda token y datos públicos del usuario. Nunca password.
- **Endpoints protegidos**: `/api/auth/profile` requiere `Authorization: Bearer <token>`.
