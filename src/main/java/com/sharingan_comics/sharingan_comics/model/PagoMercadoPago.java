package com.sharingan_comics.sharingan_comics.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "PAGOS_MP")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PagoMercadoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_PAGO")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ORDEN")
    private Orden orden;

    @Column(name = "MP_PAYMENT_ID", length = 120)
    private String mpPaymentId;

    @Column(name = "MP_STATUS", length = 80)
    private String mpStatus;

    @Column(name = "MP_STATUS_DETAIL", length = 120)
    private String mpStatusDetail;

    @Column(name = "MP_PAYMENT_TYPE", length = 80)
    private String mpPaymentType;

    @Lob
    @Column(name = "RAW_NOTIFICATION")
    private String rawNotification;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
