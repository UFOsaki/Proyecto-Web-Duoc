# Flujo de Mercado Pago — Sharingan Comics

## Estado actual

El frontend construye el payload de checkout y lo envía al backend de Mercado Pago en Render.

## Backend externo

```
https://ms-sharingan-comics-pay-mercado-pago.onrender.com
```

## Flujo

```
1. Usuario agrega productos al carrito (localStorage)
2. Click "Checkout" en el carrito
3. Frontend verifica que el usuario esté logueado
4. Obtiene email desde loggedInUser (localStorage)
5. Construye payload:
   {
     buyerEmail: "user@email.com",
     items: [
       {
         productCode: "MNG-EVA-001",
         title: "Evangelion",
         description: "Manga Evangelion",
         quantity: 1,
         unitPrice: 1
       }
     ]
   }
6. POST al backend de Mercado Pago
7. Backend genera preferencia de pago
8. Redirige al checkout de Mercado Pago
```

## Integración con autenticación

- El `buyerEmail` debe venir del usuario autenticado (no de prompt manual).
- Si el usuario no está logueado, el checkout debe redirigir a login.
- El carrito NO se borra hasta que el pago esté confirmado.

## Próximos pasos

1. Implementar callback de éxito/fallo desde Mercado Pago.
2. Registrar compras en Oracle (tabla COMPRAS futura).
3. Manejar webhooks de confirmación de pago.
