package org.sync_astra.backendjava.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.sync_astra.backendjava.service.auth.RedisAuthService;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final RedisAuthService redisAuthService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // 1. Validar existencia y formato correcto de la cabecera
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            // Extraemos el userName (que configuraste como identificador principal)
            final String userName = jwtUtil.extractUsername(jwt);

            // 2. Si hay un nombre de usuario y no está autenticado aún en el contexto actual
            if (userName != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 3. Cargar detalles del usuario
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userName);

                // 4. Validar estado del token contra Redis (control de sesiones activas/revocadas)
                boolean isTokenValidInRedis = redisAuthService.isTokenValidInRedis(userName, jwt);

                // 5. Validación final: firma matemática + expiración + validación en Redis
                if (jwtUtil.validateToken(jwt, userDetails, null) && isTokenValidInRedis) {

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 6. Asignar el usuario autenticado al contexto de seguridad de Spring
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Logueo silencioso (debug) para no inundar los logs de producción cuando un token expira de forma natural
            log.debug("Token JWT rechazado o expirado: {}", e.getMessage());
        }

        // 7. Continuar con la cadena de filtros
        filterChain.doFilter(request, response);
    }
}
