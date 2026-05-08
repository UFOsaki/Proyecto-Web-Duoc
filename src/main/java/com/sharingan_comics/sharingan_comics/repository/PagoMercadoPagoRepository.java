package com.sharingan_comics.sharingan_comics.repository;

import com.sharingan_comics.sharingan_comics.model.PagoMercadoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PagoMercadoPagoRepository extends JpaRepository<PagoMercadoPago, Long> {
}
