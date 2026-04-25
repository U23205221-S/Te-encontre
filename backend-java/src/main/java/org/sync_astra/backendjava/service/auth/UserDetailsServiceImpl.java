package org.sync_astra.backendjava.service.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.sync_astra.backendjava.model.Users;
import org.sync_astra.backendjava.repository.UserRepository;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @NullMarked
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String dni) throws UsernameNotFoundException {

        // 1. Buscamos al usuario usando el parámetro 'email' contra el campo 'userName'
        Users user = userRepository.findByDni(dni)
                .orElseThrow(() -> new UsernameNotFoundException("No se encontró el usuario con el email: " + dni));

        // 2. Como es un login de sesión simple sin sistema de roles,
        // pasamos una colección vacía. Spring Security lo maneja sin problemas.
        Collection<GrantedAuthority> authorities = Collections.emptyList();

        // 3. Retornamos el MainUser armado
        return MainUser.build(user, authorities);
    }
}