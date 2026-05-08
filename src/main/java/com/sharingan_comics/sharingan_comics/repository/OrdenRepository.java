package com.sharingan_comics.sharingan_comics.repository;

import com.sharingan_comics.sharingan_comics.model.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrdenRepository extends JpaRepository<Orden, Long> {
    Optional<Orden> findByExternalReference(String externalReference);
}
