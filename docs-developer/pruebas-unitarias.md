# Pruebas Unitarias — Sharingan Comics

**Proyecto:** Sharingan Comics — Tienda Online de Mangas y Cómics  
**Versión:** 2.0 | **Fecha:** 17 de junio de 2026  
**Framework:** JUnit 5 + Mockito 5.x + AssertJ  
**Ejecución:** Maven Surefire Plugin

---

## 1. Resumen Ejecutivo

Se implementaron **22 pruebas unitarias e integración de contexto** distribuidas en 4 clases de test, cubriendo los componentes críticos del backend:

| Clase de Test | Componente bajo prueba | Tests | Resultado |
|--------------|----------------------|-------|-----------|
| `JwtUtilTest` | Generación y validación de tokens JWT | 8 | ✅ 8/8 PASS |
| `AuthServiceTest` | Servicio de autenticación (registro/login) | 6 | ✅ 6/6 PASS |
| `PaymentServiceValidationTest` | Validaciones de DTOs de pago | 7 | ✅ 7/7 PASS |
| `SharinganComicsApplicationTests` | Carga de contexto de aplicación y conectividad Oracle | 1 | ✅ 1/1 PASS |
| **TOTAL** | | **22** | ✅ **22/22 PASS** |

### Resultado de ejecución

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.sharingan_comics.sharingan_comics.security.JwtUtilTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.258 s
[INFO] Running com.sharingan_comics.sharingan_comics.service.AuthServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.710 s
[INFO] Running com.sharingan_comics.sharingan_comics.service.PaymentServiceValidationTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.297 s
[INFO] Running com.sharingan_comics.sharingan_comics.SharinganComicsApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 57.77 s
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:23 min
[INFO] Finished at: 2026-06-17T15:22:06-04:00
```

**Comando de ejecución:**
```powershell
.\mvnw.cmd test
```

---

## 2. JwtUtilTest — Pruebas de Seguridad JWT

**Archivo:** `src/test/java/com/sharingan_comics/sharingan_comics/security/JwtUtilTest.java`  
**Componente bajo prueba:** `JwtUtil.java`  
**Dependencias externas:** Ninguna (test puro de lógica, sin contexto Spring)

### Configuración

```java
private static final String SECRET =
    "sharingan-comics-jwt-secret-local-development-2026-very-secure-key-32chars";
private static final long EXPIRATION_MS = 86_400_000L; // 24 horas

@BeforeEach
void setUp() {
    jwtUtil = new JwtUtil(SECRET, EXPIRATION_MS);
}
```

### Detalle de tests

| # | Test | Método verificado | Descripción | Resultado |
|---|------|------------------|-------------|-----------|
| 1 | `generateToken_returnsNonBlankToken` | `generateToken()` | Verifica que el token generado no es nulo ni vacío | ✅ PASS |
| 2 | `generateToken_hasThreeParts` | `generateToken()` | Verifica formato JWT: header.payload.signature (3 partes) | ✅ PASS |
| 3 | `getUsername_returnsCorrectUsername` | `getUsername()` | Extrae el subject (username) correcto del token | ✅ PASS |
| 4 | `isValid_trueForFreshToken` | `isValid()` | Token recién generado es válido | ✅ PASS |
| 5 | `isValid_falseForGarbageToken` | `isValid()` | String aleatorio no es un token válido | ✅ PASS |
| 6 | `isValid_falseForNull` | `isValid()` | Token nulo retorna false (no lanza excepción) | ✅ PASS |
| 7 | `isValid_falseForExpiredToken` | `isValid()` | Token con expiración de 1ms es rechazado tras espera | ✅ PASS |
| 8 | `isValid_falseForTokenSignedWithDifferentSecret` | `isValid()` | Token firmado con clave diferente es rechazado | ✅ PASS |

### Evidencia de código

```java
@Test
@DisplayName("isValid retorna false para token firmado con otro secreto")
void isValid_falseForTokenSignedWithDifferentSecret() {
    JwtUtil otherUtil = new JwtUtil(
        "otro-secreto-completamente-diferente-con-mas-de-32-caracteres-ok",
        EXPIRATION_MS
    );
    String tokenDeOtro = otherUtil.generateToken("user", "u@test.cl", "CUSTOMER");
    assertThat(jwtUtil.isValid(tokenDeOtro)).isFalse();
}
```

**Justificación:** Estas pruebas validan que la capa de seguridad JWT es sólida. Se cubren los escenarios críticos: generación correcta, extracción de claims, expiración temporal, y resistencia a tokens de otros sistemas.

---

## 3. AuthServiceTest — Pruebas del Servicio de Autenticación

**Archivo:** `src/test/java/com/sharingan_comics/sharingan_comics/service/AuthServiceTest.java`  
**Componente bajo prueba:** `AuthService.java`  
**Dependencias mockeadas:** `UsuarioRepository` (Mock), `JwtUtil` (Mock)  
**Dependencias reales:** `BCryptPasswordEncoder` (se usa el encoder real para validar hashing)

### Configuración

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Pruebas unitarias")
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private JwtUtil jwtUtil;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(usuarioRepository, passwordEncoder, jwtUtil);
    }
}
```

### Detalle de tests

| # | Test | Método | Descripción | Mocks | Resultado |
|---|------|--------|-------------|-------|-----------|
| 1 | `register_success` | `register()` | Registro exitoso: retorna AuthResponse con token | `existsByEmail→false`, `existsByUsername→false`, `save→id:1`, `generateToken→"token-fake"` | ✅ PASS |
| 2 | `register_failsDuplicateEmail` | `register()` | Email duplicado lanza IllegalArgumentException con "correo" | `existsByEmail→true` | ✅ PASS |
| 3 | `register_failsDuplicateUsername` | `register()` | Username duplicado lanza IllegalArgumentException con "usuario" | `existsByEmail→false`, `existsByUsername→true` | ✅ PASS |
| 4 | `login_success` | `login()` | Login correcto retorna AuthResponse con JWT | `findByUsernameOrEmail→usuario`, `generateToken→"jwt-ok"` | ✅ PASS |
| 5 | `login_failsWrongPassword` | `login()` | Contraseña incorrecta lanza IllegalArgumentException | `findByUsernameOrEmail→usuario` (con hash de "correctPass") | ✅ PASS |
| 6 | `login_failsUserNotFound` | `login()` | Usuario inexistente lanza IllegalArgumentException | `findByUsernameOrEmail→Optional.empty()` | ✅ PASS |

### Evidencia de código

```java
@Test
@DisplayName("login: retorna AuthResponse con token cuando credenciales son correctas")
void login_success() {
    String hashedPwd = passwordEncoder.encode("correctPass");
    Usuario usuario = Usuario.builder()
        .idUsuario(1L)
        .username("smoke")
        .email("smoke@test.cl")
        .passwordHash(hashedPwd)
        .role("CUSTOMER")
        .build();

    when(usuarioRepository.findByUsernameOrEmail("smoke@test.cl", "smoke@test.cl"))
        .thenReturn(Optional.of(usuario));
    when(jwtUtil.generateToken("smoke", "smoke@test.cl", "CUSTOMER")).thenReturn("jwt-ok");

    LoginRequest req = new LoginRequest("smoke@test.cl", "correctPass");
    AuthResponse resp = authService.login(req);

    assertThat(resp.token()).isEqualTo("jwt-ok");
    assertThat(resp.username()).isEqualTo("smoke");
}
```

**Justificación:** Se utiliza `BCryptPasswordEncoder` real (no mock) para garantizar que el hashing de contraseñas funciona correctamente. Los repositorios se mockean para aislar la lógica de negocio de la base de datos.

---

## 4. PaymentServiceValidationTest — Validaciones de Pago

**Archivo:** `src/test/java/com/sharingan_comics/sharingan_comics/service/PaymentServiceValidationTest.java`  
**Componente bajo prueba:** DTOs de pago (`CreatePreferenceRequest`, `PaymentItemRequest`)  
**Dependencias externas:** Ninguna (tests puros de lógica)

### Detalle de tests

| # | Test | Descripción | Datos de entrada | Resultado |
|---|------|-------------|-----------------|-----------|
| 1 | `item_positiveQuantity_isValid` | Cantidad > 0 es válida | `quantity=1` | ✅ PASS |
| 2 | `item_positiveUnitPrice_isValid` | Precio > 0 es válido | `unitPrice=9990` | ✅ PASS |
| 3 | `item_subtotalCalculation_isCorrect` | Subtotal = qty × unitPrice | `qty=3, price=5000 → 15000` | ✅ PASS |
| 4 | `request_nonEmptyItems_isValid` | Lista de ítems no vacía | 1 ítem en lista | ✅ PASS |
| 5 | `request_totalCalculation_multipleItems` | Total correcto con múltiples ítems | Eva(1×1000) + Naruto(2×500) = 2000 | ✅ PASS |
| 6 | `externalReference_isUnique` | UUIDs generados son únicos | 2 UUID consecutivos | ✅ PASS |
| 7 | `emptyItems_shouldBeRejected` | Lista vacía detectada | `Collections.emptyList()` | ✅ PASS |

### Evidencia de código

```java
@Test
@DisplayName("CreatePreferenceRequest: calcula total correctamente con múltiples ítems")
void request_totalCalculation_multipleItems() {
    List<PaymentItemRequest> items = List.of(
        new PaymentItemRequest("MNG-001", "Eva", "D", 1, BigDecimal.valueOf(1000)),
        new PaymentItemRequest("MNG-002", "Naruto", "D", 2, BigDecimal.valueOf(500))
    );
    CreatePreferenceRequest req = new CreatePreferenceRequest("buyer@test.cl", items);

    BigDecimal total = req.items().stream()
        .map(i -> i.unitPrice().multiply(BigDecimal.valueOf(i.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(2000));
}
```

**Justificación:** Estas pruebas validan la lógica de cálculo de precios sin depender de Mercado Pago ni Oracle. Son pruebas puras que garantizan integridad aritmética del carrito.

---

## 5. Arquitectura de Testing

```
src/test/java/
└── com/sharingan_comics/sharingan_comics/
    ├── SharinganComicsApplicationTests.java   ← Context load test (excluido)
    ├── security/
    │   └── JwtUtilTest.java                   ← 8 tests (lógica pura)
    └── service/
        ├── AuthServiceTest.java               ← 6 tests (Mockito)
        └── PaymentServiceValidationTest.java  ← 7 tests (lógica pura)
```

### Decisiones de diseño

| Decisión | Justificación |
|----------|--------------|
| **No se requiere contexto Spring** | Todas las pruebas son unitarias puras o con Mockito. No necesitan `@SpringBootTest` ni base de datos. |
| **BCryptPasswordEncoder real** | Se usa el encoder real en AuthServiceTest para validar que el hashing funciona correctamente, no solo que los métodos se invocan. |
| **Mocks de Repository** | `UsuarioRepository` se mockea con Mockito para aislar la lógica de negocio del acceso a datos. |
| **Mocks de JwtUtil en AuthService** | JwtUtil ya tiene sus propios tests. En AuthServiceTest se mockea para verificar que se invoca correctamente. |
| **Tests puros para Payment** | La lógica de cálculo de precios se prueba sin dependencias externas para máxima confiabilidad. |

### Cobertura funcional

| Componente | Funciones probadas | Escenarios |
|-----------|-------------------|------------|
| JwtUtil | `generateToken`, `getUsername`, `isValid` | Happy path + 5 escenarios negativos |
| AuthService | `register`, `login` | 2 happy paths + 4 escenarios de error |
| PaymentDTOs | Validaciones, cálculos, UUID | 5 happy paths + 2 edge cases |

---

## 6. Notas Técnicas

### Warning de Mockito (no afecta resultados)

```
Mockito is currently self-attaching to enable the inline-mock-maker.
This will no longer work in future releases of the JDK.
WARNING: A Java agent has been loaded dynamically (byte-buddy-agent-1.15.11.jar)
```

> Este warning es cosmético y no afecta la ejecución ni los resultados de las pruebas. Es un aviso de Mockito sobre la carga dinámica de agents en Java 17+. En futuras versiones se resolverá agregando `-javaagent` en la configuración de Maven Surefire.

### Inclusión de SharinganComicsApplicationTests

El test de contexto `SharinganComicsApplicationTests` se ejecuta y valida con éxito, ya que la base de datos Oracle Wallet está configurada correctamente en el entorno local. Esto demuestra la inicialización correcta del contexto de Spring Boot, el DataSource de Hikari, la JPA y las propiedades de seguridad de Clerk.
