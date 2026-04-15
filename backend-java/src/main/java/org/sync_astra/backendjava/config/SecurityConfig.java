package org.sync_astra.backendjava.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.sync_astra.backendjava.jwt.JwtAuthenticationFilter;
import org.sync_astra.backendjava.jwt.JwtEntryPoint;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // <--- ¡ESTA ES LA LLAVE MÁGICA! Activa @PreAuthorize
@RequiredArgsConstructor // Necesario para inyectar el filtro más adelante
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter; // Lo crearemos en el próximo paso
    private final JwtEntryPoint jwtEntryPoint;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:5175"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)

                // Agrega el manejador de errores para cuando un usuario no autenticado intente acceder a una ruta protegida
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(jwtEntryPoint))

                // 1. FUNDAMENTAL PARA JWT: Le decimos a Spring que no guarde sesiones (Stateless)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // --- RUTAS PÚBLICAS ---
                        .requestMatchers(
                                "/api/auth/register", // Habilitamos todo lo de auth (register, pre-login, login)
                                "/api/auth/login",
                                "/api/auth/refresh-token",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api/v1/uploads/badge/**"

                        ).permitAll()

                        // --- RUTAS PROTEGIDAS ---
                        .anyRequest().authenticated()
                );

        // 2. AGREGA EL FILTRO A LA CADENA
        // Le decimos a Spring: "Ejecuta MI filtro antes de que intentes hacer tu autenticación tradicional"
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 3. NUEVO: Exponemos el AuthenticationManager para poder usarlo en tu servicio de Login
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
