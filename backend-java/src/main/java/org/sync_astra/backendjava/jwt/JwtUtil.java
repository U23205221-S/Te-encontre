package org.sync_astra.backendjava.jwt;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.sync_astra.backendjava.service.auth.MainUser;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    @Value("${spring.application.security.jwt.secret-key}")
    private String secret;

    @Value("${spring.application.security.jwt.expiration}")
    private long expiration; // Tiempo del Access Token (ej. 15 min en milisegundos)

    @Value("${spring.application.security.jwt.refresh-token.expiration}")
    private long refreshExpiration; // Tiempo del Refresh Token (ej. 7 días en milisegundos)

    /**
     * Genera el ACCESS TOKEN (Vida corta, contiene datos útiles para la sesión)
     */
    public String generateToken(Authentication authentication) {
        MainUser mainUser = (MainUser) authentication.getPrincipal();
        Map<String, Object> extraClaims = new HashMap<>();

        // Inyectamos solo la información relevante de tu entidad actual
        extraClaims.put("uuid", mainUser.getUuid());
        extraClaims.put("dni", mainUser.getDni());

        // Usamos getUsername() que ahora contiene el 'userName' real de tu BD
        return buildToken(extraClaims, mainUser.getUsername(), expiration);
    }

    /**
     * Genera el REFRESH TOKEN (Vida larga, poca info)
     */
    public String generateRefreshToken(Authentication authentication) {
        MainUser mainUser = (MainUser) authentication.getPrincipal();
        Map<String, Object> claims = new HashMap<>();

        claims.put("uuid", mainUser.getUuid());

        return buildToken(claims, mainUser.getUsername(), refreshExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expirationTimeInMillis) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        Instant now = Instant.now();
        Instant expirationInstant = now.plusMillis(expirationTimeInMillis);

        return Jwts.builder()
                .setSubject(subject) // El subject será tu userName
                .addClaims(extraClaims)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expirationInstant))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails, Instant lastPasswordChange) {
        final String username = extractUsername(token);

        if (!username.equals(userDetails.getUsername()) || isTokenExpired(token)) {
            return false;
        }

        final Instant issuedAt = extractIssuedAt(token);
        return lastPasswordChange == null || !issuedAt.isBefore(lastPasswordChange);
    }

    // --- Métodos de Extracción ---

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractUserUuid(String token) {
        Object uuid = extractAllClaims(token).get("uuid");
        return uuid != null ? uuid.toString() : null;
    }

    public String extractUserDni(String token) {
        return (String) extractAllClaims(token).get("dni");
    }

    public Instant extractIssuedAt(String token) {
        return extractAllClaims(token).getIssuedAt().toInstant();
    }

    public Instant extractExpiration(String token) {
        return extractAllClaims(token).getExpiration().toInstant();
    }

    public long getExpirationTime(String token) {
        return extractExpiration(token).toEpochMilli();
    }

    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).isBefore(Instant.now());
    }

    private Claims extractAllClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
