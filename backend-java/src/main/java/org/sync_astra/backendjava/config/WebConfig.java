package org.sync_astra.backendjava.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Obtenemos la ruta absoluta de la carpeta de subidas en la raíz del monorepo
        String uploadPath = Paths.get( "uploads", "badge")
                .toAbsolutePath()
                .toUri()
                .toString();

        // Mapeamos la URL lógica a la carpeta física
        registry.addResourceHandler("/api/v1/uploads/badge/**")
                .addResourceLocations(uploadPath + "/");
    }
}
