package org.sync_astra.backendjava.service.auth;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.sync_astra.backendjava.model.Users;

import java.util.Collection;
import java.util.UUID;

@Getter
public class MainUser extends User {

    // Campos extra extraídos directamente de tu entidad Users actual
    private final UUID uuid;

    public MainUser(String username,
                    String password,
                    boolean enabled,
                    boolean accountNonExpired,
                    boolean credentialsNonExpired,
                    boolean accountNonLocked,
                    Collection<? extends GrantedAuthority> authorities,
                    UUID uuid) {

        // Spring Security usará el 'username' como el identificador principal de la sesión
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);

        this.uuid = uuid;
    }

    public static MainUser build(Users user, Collection<? extends GrantedAuthority> authorities) {

        // Como la entidad actual no tiene un campo de estado (ej. "ACTIVO"),
        // lo seteamos en true por defecto para permitir el login.
        boolean enabled = true;

        return new MainUser(
                // 1. Principal: Usamos el USERNAME para iniciar sesión (ya que no hay email)
                user.getDni(),

                // 2. Contraseña: El hash de tu entidad
                user.getPasswordHash(),

                // 3. Banderas de seguridad
                enabled,
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked

                // 4. Roles/Permisos transformados
                authorities,

                // 5. Campos personalizados para tener disponibles en sesión / JWT
                user.getUuid()
        );
    }
}
