package com.sharingan_comics.sharingan_comics.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ORDENES")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_ORDEN")
    private Long idOrden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_USUARIO", nullable = false)
    private Usuario usuario;

    @Column(name = "EXTERNAL_REFERENCE", nullable = false, unique = true, length = 120)
    private String externalReference;

    @Column(name = "BUYER_EMAIL", nullable = false, length = 120)
    private String buyerEmail;

    @Column(name = "TOTAL", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "STATUS", nullable = false, length = 40)
    @Builder.Default
    private String status = "CREATED";

    @Column(name = "MP_PREFERENCE_ID", length = 120)
    private String mpPreferenceId;

    @Column(name = "MP_PAYMENT_ID", length = 120)
    private String mpPaymentId;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrdenItem> items = new ArrayList<>();

    public void addItem(OrdenItem item) {
        items.add(item);
        item.setOrden(this);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
