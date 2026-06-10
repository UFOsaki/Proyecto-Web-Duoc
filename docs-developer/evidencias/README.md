# Evidencias — Integración Clerk con Sharingan Comics

Esta carpeta almacena las capturas de pantalla y evidencias de prueba de la integración Clerk.

## Estructura de evidencias

```
docs-developer/evidencias/
├── README.md                          ← Este archivo
├── clerk-dashboard-mfa.png            ← MFA habilitado en Clerk Dashboard
├── clerk-google-login.png             ← Login con Google
├── clerk-2fa-flow.png                 ← Flujo de autenticación 2FA
├── frontend-usuario-autenticado.png   ← Navbar con usuario y badge 2FA
├── api-profile-response.png           ← GET /api/auth/profile (Bearer ocultado)
├── oracle-usuario-clerk.png           ← Usuario Clerk en tabla USUARIOS Oracle
├── oracle-rol-customer.png            ← Rol CUSTOMER en Oracle
├── payment-preference-response.png    ← POST /api/payments/create-preference
├── oracle-orden-usuario.png           ← Orden en ORDENES con ID_USUARIO
├── mercadopago-redirect.png           ← Redirección a sandbox Mercado Pago
├── logs-sin-tokens.png                ← Logs Spring Boot sin tokens
├── prueba-sin-token-401.png           ← Sin token → 401
├── prueba-customer-403.png            ← CUSTOMER en endpoint admin → 403
└── prueba-logout.png                  ← Estado limpio tras logout
```

## Checklist de evidencias

| # | Evidencia | Archivo | Estado |
|---|-----------|---------|--------|
| 1 | Clerk Dashboard con MFA activo | `clerk-dashboard-mfa.png` | ⬜ Pendiente |
| 2 | Login con Google | `clerk-google-login.png` | ⬜ Pendiente |
| 3 | Flujo 2FA (input código TOTP) | `clerk-2fa-flow.png` | ⬜ Pendiente |
| 4 | Navbar usuario autenticado con badge 2FA | `frontend-usuario-autenticado.png` | ⬜ Pendiente |
| 5 | GET /api/auth/profile (token Bearer ocultado) | `api-profile-response.png` | ⬜ Pendiente |
| 6 | Usuario Clerk en Oracle USUARIOS | `oracle-usuario-clerk.png` | ⬜ Pendiente |
| 7 | Rol CUSTOMER en Oracle | `oracle-rol-customer.png` | ⬜ Pendiente |
| 8 | POST /api/payments/create-preference exitoso | `payment-preference-response.png` | ⬜ Pendiente |
| 9 | Orden en ORDENES con ID_USUARIO | `oracle-orden-usuario.png` | ⬜ Pendiente |
| 10 | Redirección a Mercado Pago sandbox | `mercadopago-redirect.png` | ⬜ Pendiente |
| 11 | Logs Spring Boot sin tokens JWT | `logs-sin-tokens.png` | ⬜ Pendiente |
| 12 | Prueba negativa: sin token → 401 | `prueba-sin-token-401.png` | ⬜ Pendiente |
| 13 | Prueba negativa: CUSTOMER → endpoint admin → 403 | `prueba-customer-403.png` | ⬜ Pendiente |
| 14 | Logout: localStorage limpio | `prueba-logout.png` | ⬜ Pendiente |

## Instrucciones para capturar evidencias

### Cómo capturar capturas de pantalla seguras:
- **Ocultar siempre:** tokens Bearer completos, API keys, contraseñas, datos de Oracle Wallet.
- **Usar:** barra negra o blur sobre información sensible.
- **Mantener visible:** status HTTP, estructura JSON, IDs de usuario (no completos), roles.

### Para captura de logs (Evidencia 11):
1. Ejecutar una autenticación Clerk mientras el servidor está corriendo.
2. Capturar la consola de Spring Boot.
3. Verificar que no aparecen strings con formato `eyJ...` (Base64url de JWT).
4. Si aparecen, hay un bug de logging que debe corregirse.

### Para captura de Oracle (Evidencias 6, 7, 9):
```sql
-- Evidencia 6: Usuario Clerk
SELECT ID_USUARIO, USERNAME, EMAIL, ROLE, AUTH_PROVIDER, 
       SUBSTR(CLERK_USER_ID, 1, 10) || '...' AS CLERK_ID_TRUNCADO,
       MFA_ENABLED, CREATED_AT
FROM USUARIOS
WHERE AUTH_PROVIDER = 'CLERK'
ORDER BY CREATED_AT DESC;

-- Evidencia 9: Orden asociada
SELECT O.ID_ORDEN, O.STATUS, O.TOTAL, O.CREATED_AT,
       U.USERNAME, U.AUTH_PROVIDER
FROM ORDENES O
JOIN USUARIOS U ON O.ID_USUARIO = U.ID_USUARIO
ORDER BY O.CREATED_AT DESC
FETCH FIRST 5 ROWS ONLY;
```

## Criterio de aprobación

La integración se considera **aprobada** cuando:
- ✅ Las evidencias 1-14 están completadas.
- ✅ Ningún token JWT aparece en logs.
- ✅ Usuarios Clerk se crean en Oracle sin PASSWORD_HASH.
- ✅ Roles son asignados desde Oracle, no desde Clerk.
- ✅ Mercado Pago funciona con usuario Clerk autenticado.
- ✅ 2FA es requerido para usuarios con MFA activo en Clerk.
