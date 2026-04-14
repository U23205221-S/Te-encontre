package org.sync_astra.backendjava.service.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisAuthService {

    private final StringRedisTemplate redisTemplate;

    // Prefijos exclusivos para manejar la vigencia de los tokens
    private static final String ACCESS_TOKEN_PREFIX = "auth:access:";
    private static final String REFRESH_TOKEN_PREFIX = "auth:refresh:";

    /**
     * Guarda el token (Access o Refresh) en Redis.
     * El registro se auto-eliminará cuando el TTL llegue a cero (expiración natural).
     */
    public void saveTokenInRedis(String userName, String token, long expirationInMillis, boolean isRefresh) {
        String prefix = isRefresh ? REFRESH_TOKEN_PREFIX : ACCESS_TOKEN_PREFIX;
        String key = prefix + userName;

        long ttl = expirationInMillis - System.currentTimeMillis();

        if (ttl > 0) {
            redisTemplate.opsForValue().set(key, token, ttl, TimeUnit.MILLISECONDS);
            log.info("Token {} guardado en Redis para: {}. TTL: {} seg",
                    isRefresh ? "REFRESH" : "ACCESS", userName, ttl / 1000);
        }
    }

    /**
     * Valida que el Access Token recibido sea exactamente el que está vivo en Redis.
     */
    public boolean isTokenValidInRedis(String userName, String token) {
        String key = ACCESS_TOKEN_PREFIX + userName;
        String storedToken = redisTemplate.opsForValue().get(key);
        return storedToken != null && storedToken.equals(token);
    }

    /**
     * Recupera el Refresh Token.
     * Usado en el endpoint de /refresh para validar que el usuario tiene un token válido para renovar.
     */
    public String getRefreshToken(String userName) {
        return redisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + userName);
    }

    /**
     * LOGOUT TOTAL
     * Elimina manualmente los tokens de Redis antes de su expiración natural.
     * Esto invalida inmediatamente cualquier token JWT que el cliente aún tenga en su poder.
     */
    public void deleteAllUserSessions(String userName) {
        String accessKey = ACCESS_TOKEN_PREFIX + userName;
        String refreshKey = REFRESH_TOKEN_PREFIX + userName;

        redisTemplate.delete(accessKey);
        redisTemplate.delete(refreshKey);

        log.info("Se han eliminado manualmente las sesiones en Redis para: {}", userName);
    }
}