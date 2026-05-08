# Flujo de Mercado Pago — Sharingan Comics

## Estado actual
La integración utiliza el SDK oficial de Mercado Pago para Java (`com.mercadopago:sdk-java`). Todo el proceso de creación de la preferencia de pago está gestionado por el backend (Spring Boot), asegurando que el Access Token y los precios permanezcan seguros en el servidor.

## Backend Integrado
El backend corre nativamente en `http://localhost:8080` (o el host donde se despliegue).

## Flujo de Vida del Pago

1. **Usuario Logueado**: El usuario navega el catálogo e ingresa productos al carrito (almacenado temporalmente en `localStorage`).
2. **Checkout**: El usuario presiona "Checkout". El frontend `cart.js` valida que exista un `authToken` (JWT) en `localStorage` y construye el payload con los ítems.
3. **Petición al Backend (`POST /api/payments/create-preference`)**:
   - El frontend envía el payload con un header `Authorization: Bearer <token>`.
   - `SecurityConfig` y `JwtFilter` validan el JWT.
   - `PaymentController` recibe la solicitud autenticada y se la pasa a `PaymentService`.
4. **Validación y Persistencia (BD Oracle)**:
   - `PaymentService` valida que el `buyerEmail` del carrito coincida con el del JWT (o pertenezca a la misma sesión).
   - Crea un registro de la `Orden` en estado `CREATED` y almacena los ítems.
   - Genera un `externalReference` único para identificar la orden durante el callback.
5. **SDK Mercado Pago**:
   - Se crea el request al API de MP. Se configuran las URLs de retorno (`back_urls`) y el webhook (`notification_url`).
   - Se obtiene el `preferenceId` y las URLs de redirección (`initPoint` y `sandboxInitPoint`).
   - La `Orden` se actualiza con este `preferenceId`.
6. **Redirección al Medio de Pago**:
   - El backend devuelve la respuesta al frontend.
   - `cart.js` redirige al usuario a la URL de pago de Mercado Pago.
7. **Resolución (Webhooks y URLs de Retorno)**:
   - Mercado Pago procesa el pago de forma asíncrona.
   - Envía notificaciones (vía HTTP POST) a `POST /api/payments/webhook`. Este endpoint público recibe el evento, consulta el estado real en Mercado Pago, y actualiza el `STATUS` de la orden a `APPROVED` (o `REJECTED`, `PENDING`, etc.). También se guarda un registro en la tabla `PAGOS_MP`.
   - Paralelamente, Mercado Pago redirige el navegador del cliente a la `success-url`, `failure-url` o `pending-url` (ej: `payment-success.html`).
8. **Limpieza del Carrito**:
   - Al cargar `payment-success.html`, el script en el frontend limpia el `localStorage.cart`, ya que la compra fue procesada correctamente.

## Configuración y Variables de Entorno

Para que este flujo funcione localmente o en producción, se requiere:
- `MERCADOPAGO_ACCESS_TOKEN`: El token secreto de la cuenta vendedora de Mercado Pago (ej. `APP_USR-XXXXXX` o `TEST-XXXXXX`).
- `MP_SUCCESS_URL`: `http://localhost:8080/payment-success.html`
- `MP_FAILURE_URL`: `http://localhost:8080/payment-failure.html`
- `MP_PENDING_URL`: `http://localhost:8080/payment-pending.html`
- `MP_NOTIFICATION_URL`: Si se prueba localmente con ngrok, debe apuntar a la URL pública (ej: `https://abcd.ngrok-free.app/api/payments/webhook`).

> Importante: El `notification_url` (Webhook) necesita ser accesible desde internet para que Mercado Pago pueda entregar la notificación asíncrona del cambio de estado.
