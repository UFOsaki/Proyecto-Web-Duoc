package com.sharingan_comics.sharingan_comics.service;

import com.sharingan_comics.sharingan_comics.dto.*;
import com.sharingan_comics.sharingan_comics.model.Usuario;
import com.sharingan_comics.sharingan_comics.repository.UsuarioRepository;
import com.sharingan_comics.sharingan_comics.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        // Validar duplicados
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Ya existe una cuenta con este correo.");
        }
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Ya existe una cuenta con este nombre de usuario.");
        }

        // Crear usuario con password hasheado
        Usuario usuario = Usuario.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role("CUSTOMER")
                .build();

        usuario = usuarioRepository.save(usuario);

        // Generar token
        String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getEmail(), usuario.getRole());

        return new AuthResponse(
                token,
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }

    public AuthResponse login(LoginRequest request) {
        // Buscar por username o email
        Usuario usuario = usuarioRepository
                .findByUsernameOrEmail(request.usernameOrEmail(), request.usernameOrEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuario o contraseña incorrectos."));

        // Validar password
        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos.");
        }

        // Generar token
        String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getEmail(), usuario.getRole());

        return new AuthResponse(
                token,
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }

    public ProfileResponse getProfile(Usuario usuario) {
        return new ProfileResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getPhone(),
                usuario.getRole()
        );
    }

    public ProfileResponse updateProfile(Usuario usuario, String phone) {
        if (phone != null) {
            usuario.setPhone(phone);
        }
        usuarioRepository.save(usuario);

        return new ProfileResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getPhone(),
                usuario.getRole()
        );
    }
}
