-- ============================================================
-- Migración: 2026_clerk_auth.sql
-- Proyecto : Sharingan Comics
-- Propósito: Agregar soporte de Clerk (identidad externa, 2FA/MFA)
--            a la tabla USUARIOS sin destruir usuarios locales.
-- Base datos: Oracle Autonomous Database (via Wallet)
-- Fecha     : 2026-06
-- Autor     : Sharingan Comics Dev Team
-- ============================================================
-- INSTRUCCIONES DE EJECUCIÓN:
--   Ejecutar UNA SOLA VEZ contra el esquema ADMIN.
--   Si la columna ya existe Oracle lanzará ORA-01430 — ignorar ese error.
--   Verificar con: SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME='USUARIOS';
-- ============================================================

-- -----------------------------------------------------------
-- 1. CLERK_USER_ID
--    Identificador único del usuario en Clerk (sub del JWT).
--    Permite NULL: usuarios locales no tienen clerk_user_id.
--    Índice único excluye NULLs en Oracle (comportamiento nativo).
-- -----------------------------------------------------------
ALTER TABLE USUARIOS ADD (
    CLERK_USER_ID VARCHAR2(150)
);

COMMENT ON COLUMN USUARIOS.CLERK_USER_ID IS
    'ID del usuario en Clerk (campo "sub" del JWT de Clerk). '
    || 'NULL para usuarios locales. Relaciona el usuario interno con Clerk.';

-- Índice único funcional que ignora NULLs (Oracle: NULL no duplica índice único)
CREATE UNIQUE INDEX IDX_USUARIOS_CLERK_ID
    ON USUARIOS(CLERK_USER_ID);

-- -----------------------------------------------------------
-- 2. AUTH_PROVIDER
--    Indica el origen de autenticación del usuario.
--    Valores esperados: LOCAL, CLERK, GOOGLE.
--    DEFAULT 'LOCAL' mantiene compatibilidad con registros existentes.
-- -----------------------------------------------------------
ALTER TABLE USUARIOS ADD (
    AUTH_PROVIDER VARCHAR2(40) DEFAULT 'LOCAL' NOT NULL
);

COMMENT ON COLUMN USUARIOS.AUTH_PROVIDER IS
    'Origen de autenticación. Valores: LOCAL (JWT propio), CLERK (Clerk genérico), '
    || 'GOOGLE (social login via Clerk). Fuente: backend Spring Boot al sincronizar usuario.';

-- -----------------------------------------------------------
-- 3. MFA_ENABLED
--    Indicador observacional: si el usuario tiene MFA activo.
--    La fuente real de verdad del MFA es Clerk Dashboard/metadata.
--    Este campo es solo referencia local para auditoría/UI.
-- -----------------------------------------------------------
ALTER TABLE USUARIOS ADD (
    MFA_ENABLED NUMBER(1) DEFAULT 0 NOT NULL
);

COMMENT ON COLUMN USUARIOS.MFA_ENABLED IS
    'Indicador local de MFA (0=inactivo, 1=activo). '
    || 'La fuente real de verdad es Clerk. Se actualiza al sincronizar usuario. '
    || 'Cumple ISO 27001 A.9.4.2 (autenticación segura).';

-- -----------------------------------------------------------
-- 4. LAST_LOGIN_AT
--    Marca de tiempo del último login exitoso (trazabilidad/auditoría).
--    Cumple ISO 27001 A.12.4.1 (registro de eventos).
--    Cumple Ley 21.663 (registro de accesos relevantes).
-- -----------------------------------------------------------
ALTER TABLE USUARIOS ADD (
    LAST_LOGIN_AT TIMESTAMP
);

COMMENT ON COLUMN USUARIOS.LAST_LOGIN_AT IS
    'Timestamp del último inicio de sesión exitoso. '
    || 'Actualizado por UsuarioSyncService al autenticar con Clerk o JWT local. '
    || 'Soporte a auditoría ISO 27001 A.12.4.1.';

-- -----------------------------------------------------------
-- 5. TERMS_ACCEPTED_AT (Opcional — Ley 21.719 / GDPR preparación)
--    Fecha en que el usuario aceptó los términos y condiciones.
--    Cumple principio de consentimiento (Ley 21.719 art. 12).
-- -----------------------------------------------------------
ALTER TABLE USUARIOS ADD (
    TERMS_ACCEPTED_AT TIMESTAMP
);

COMMENT ON COLUMN USUARIOS.TERMS_ACCEPTED_AT IS
    'Timestamp en que el usuario aceptó los Términos y Condiciones. '
    || 'NULL si aún no ha aceptado o si se registró antes de esta versión. '
    || 'Cumple principio de consentimiento Ley 21.719 (protección datos personales).';

-- -----------------------------------------------------------
-- 6. PRIVACY_ACCEPTED_AT (Opcional — Ley 21.719)
--    Fecha en que aceptó la política de privacidad.
-- -----------------------------------------------------------
ALTER TABLE USUARIOS ADD (
    PRIVACY_ACCEPTED_AT TIMESTAMP
);

COMMENT ON COLUMN USUARIOS.PRIVACY_ACCEPTED_AT IS
    'Timestamp en que el usuario aceptó la Política de Privacidad. '
    || 'NULL si aún no ha aceptado. '
    || 'Cumple principio de finalidad del tratamiento Ley 21.719.';

-- -----------------------------------------------------------
-- 7. PASSWORD_HASH — hacer nullable para usuarios Clerk
--    Los usuarios que se registren exclusivamente via Clerk
--    no deben tener password_hash (minimización de datos, Ley 21.719).
--    IMPORTANTE: ejecutar sólo si la columna es NOT NULL actualmente.
--    Si ya es nullable, Oracle lanzará error — ignorar.
-- -----------------------------------------------------------
ALTER TABLE USUARIOS MODIFY (
    PASSWORD_HASH VARCHAR2(255) NULL
);

COMMENT ON COLUMN USUARIOS.PASSWORD_HASH IS
    'Hash BCrypt de contraseña local. '
    || 'NULL para usuarios autenticados exclusivamente vía Clerk. '
    || 'NUNCA almacenar contraseña en texto plano. '
    || 'Minimización de datos: Ley 21.719 art. 3 lit. c.';

-- -----------------------------------------------------------
-- 8. Verificación post-migración (ejecutar para confirmar)
-- -----------------------------------------------------------
-- SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
-- FROM USER_TAB_COLUMNS
-- WHERE TABLE_NAME = 'USUARIOS'
-- ORDER BY COLUMN_ID;

-- -----------------------------------------------------------
-- 9. Índice para búsqueda por AUTH_PROVIDER (consultas de auditoría)
-- -----------------------------------------------------------
CREATE INDEX IDX_USUARIOS_AUTH_PROVIDER ON USUARIOS(AUTH_PROVIDER);

-- -----------------------------------------------------------
-- FIN DE MIGRACIÓN
-- Estado esperado tras ejecutar:
--   USUARIOS.CLERK_USER_ID    -> VARCHAR2(150) NULL, UNIQUE
--   USUARIOS.AUTH_PROVIDER    -> VARCHAR2(40) NOT NULL DEFAULT 'LOCAL'
--   USUARIOS.MFA_ENABLED      -> NUMBER(1) NOT NULL DEFAULT 0
--   USUARIOS.LAST_LOGIN_AT    -> TIMESTAMP NULL
--   USUARIOS.TERMS_ACCEPTED_AT -> TIMESTAMP NULL
--   USUARIOS.PRIVACY_ACCEPTED_AT -> TIMESTAMP NULL
--   USUARIOS.PASSWORD_HASH    -> VARCHAR2(255) NULL (era NOT NULL)
-- -----------------------------------------------------------
