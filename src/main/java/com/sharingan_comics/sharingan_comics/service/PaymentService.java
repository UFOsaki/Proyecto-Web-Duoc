package com.sharingan_comics.sharingan_comics.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferencePayerRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preference.Preference;
import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceRequest;
import com.sharingan_comics.sharingan_comics.dto.payment.CreatePreferenceResponse;
import com.sharingan_comics.sharingan_comics.dto.payment.PaymentItemRequest;
import com.sharingan_comics.sharingan_comics.model.Orden;
import com.sharingan_comics.sharingan_comics.model.OrdenItem;
import com.sharingan_comics.sharingan_comics.model.PagoMercadoPago;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.repository.OrdenRepository;
import com.sharingan_comics.sharingan_comics.repository.PagoMercadoPagoRepository;
import com.sharingan_comics.sharingan_comics.repository.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrdenRepository ordenRepository;
    private final PagoMercadoPagoRepository pagoMercadoPagoRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${mercadopago.access-token}")
    private String mpAccessToken;

    @Value("${mercadopago.success-url}")
    private String mpSuccessUrl;

    @Value("${mercadopago.failure-url}")
    private String mpFailureUrl;

    @Value("${mercadopago.pending-url}")
    private String mpPendingUrl;

    @Value("${mercadopago.notification-url}")
    private String mpNotificationUrl;

    @PostConstruct
    public void init() {
        if (mpAccessToken != null && !mpAccessToken.trim().isEmpty()) {
            MercadoPagoConfig.setAccessToken(mpAccessToken);
            log.info("Mercado Pago SDK inicializado correctamente.");
        } else {
            log.warn("MERCADOPAGO_ACCESS_TOKEN no está configurado. Los pagos fallarán.");
        }
    }

    @Transactional
    public CreatePreferenceResponse createPreference(CreatePreferenceRequest request, String usernameAuthenticated) {
        if (mpAccessToken == null || mpAccessToken.trim().isEmpty()) {
            throw new RuntimeException("El backend no tiene configurado el token de Mercado Pago.");
        }

        Usuario usuario = usuarioRepository.findByUsername(usernameAuthenticated)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));

        if (!usuario.getEmail().equalsIgnoreCase(request.buyerEmail())) {
            log.warn("El email del carrito ({}) no coincide con el del token JWT ({}).", request.buyerEmail(), usuario.getEmail());
            // Opcionalmente se puede bloquear: throw new RuntimeException("Email no coincide con sesión");
        }

        String externalReference = UUID.randomUUID().toString();
        BigDecimal total = BigDecimal.ZERO;
        List<PreferenceItemRequest> mpItems = new ArrayList<>();

        Orden orden = Orden.builder()
                .usuario(usuario)
                .buyerEmail(request.buyerEmail())
                .externalReference(externalReference)
                .status("CREATED")
                .build();

        for (PaymentItemRequest itemReq : request.items()) {
            BigDecimal subtotal = itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            total = total.add(subtotal);

            OrdenItem ordenItem = OrdenItem.builder()
                    .productCode(itemReq.productCode())
                    .title(itemReq.title())
                    .description(itemReq.description())
                    .quantity(itemReq.quantity())
                    .unitPrice(itemReq.unitPrice())
                    .subtotal(subtotal)
                    .build();
            
            orden.addItem(ordenItem);

            PreferenceItemRequest mpItem = PreferenceItemRequest.builder()
                    .id(itemReq.productCode())
                    .title(itemReq.title())
                    .description(itemReq.description())
                    .quantity(itemReq.quantity())
                    .currencyId("CLP")
                    .unitPrice(itemReq.unitPrice())
                    .build();
            mpItems.add(mpItem);
        }
        
        orden.setTotal(total);
        ordenRepository.save(orden); // Guarda Orden y OrdenItems (Cascade)

        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success(mpSuccessUrl)
                .pending(mpPendingUrl)
                .failure(mpFailureUrl)
                .build();

        PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                .items(mpItems)
                .payer(PreferencePayerRequest.builder().email(request.buyerEmail()).build())
                .backUrls(backUrls)
                .autoReturn("approved")
                .externalReference(externalReference)
                .notificationUrl(mpNotificationUrl != null && !mpNotificationUrl.isEmpty() ? mpNotificationUrl : null)
                .build();

        try {
            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(preferenceRequest);

            orden.setMpPreferenceId(preference.getId());
            ordenRepository.save(orden);

            return new CreatePreferenceResponse(
                    preference.getId(),
                    preference.getInitPoint(),
                    preference.getSandboxInitPoint(),
                    externalReference,
                    "Preferencia creada correctamente"
            );

        } catch (MPException | MPApiException e) {
            log.error("Error al crear preferencia en Mercado Pago: {}", e.getMessage(), e);
            throw new RuntimeException("Error al comunicarse con Mercado Pago: " + e.getMessage());
        }
    }

    @Transactional
    public void processWebhook(Map<String, String> payload) {
        log.info("Webhook recibido de Mercado Pago: {}", payload);
        
        String topic = payload.get("topic");
        String type = payload.get("type");
        String paymentId = null;

        // Mercado Pago puede enviar "topic=payment" (API antigua) o "type=payment" (API nueva)
        if ("payment".equals(topic) || "payment".equals(type)) {
            paymentId = payload.get("id");
            if (paymentId == null && payload.containsKey("data.id")) {
                paymentId = payload.get("data.id");
            }
        }

        if (paymentId != null) {
            try {
                com.mercadopago.client.payment.PaymentClient paymentClient = new com.mercadopago.client.payment.PaymentClient();
                com.mercadopago.resources.payment.Payment payment = paymentClient.get(Long.parseLong(paymentId));
                
                String externalReference = payment.getExternalReference();
                if (externalReference != null) {
                    Orden orden = ordenRepository.findByExternalReference(externalReference).orElse(null);
                    if (orden != null) {
                        orden.setStatus(payment.getStatus().toUpperCase());
                        orden.setMpPaymentId(paymentId);
                        ordenRepository.save(orden);

                        PagoMercadoPago pagoMp = PagoMercadoPago.builder()
                                .orden(orden)
                                .mpPaymentId(paymentId)
                                .mpStatus(payment.getStatus())
                                .mpStatusDetail(payment.getStatusDetail())
                                .mpPaymentType(payment.getPaymentTypeId())
                                .rawNotification(payload.toString())
                                .build();
                        pagoMercadoPagoRepository.save(pagoMp);
                        log.info("Orden {} actualizada a status {}", orden.getIdOrden(), payment.getStatus());
                    } else {
                        log.warn("Orden con external_reference {} no encontrada para el paymentId {}", externalReference, paymentId);
                    }
                }
            } catch (Exception e) {
                log.error("Error procesando pago {} desde webhook: {}", paymentId, e.getMessage(), e);
            }
        }
    }
}
