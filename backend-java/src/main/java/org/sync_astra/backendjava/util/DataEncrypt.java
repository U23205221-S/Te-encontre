package org.sync_astra.backendjava.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Converter
public class DataEncrypt implements AttributeConverter<String, String> {

    @Value("${app.encryption.algorithm}")
    private String ALGORITMO;
    // Nota: Esta llave debería venir de una variable de entorno segura o un Vault
    @Value("${app.encryption.secret-key}")
    private String LLAVE_SECRETA;

    private SecretKeySpec generarLlave() {
        try {
            // Aplicamos SHA-256 para garantizar que la llave siempre tenga 32 bytes (AES-256)
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(LLAVE_SECRETA.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Error al generar la llave criptográfica", e);
        }
    }

    @Override
    public String convertToDatabaseColumn(String datoSensible) {
        if (datoSensible == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.ENCRYPT_MODE, generarLlave());
            return Base64.getEncoder().encodeToString(cipher.doFinal(datoSensible.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Error al encriptar: " + e.getMessage(), e);
        }
    }

    @Override
    public String convertToEntityAttribute(String datoCifrado) {
        if (datoCifrado == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.DECRYPT_MODE, generarLlave());
            return new String(cipher.doFinal(Base64.getDecoder().decode(datoCifrado)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error al desencriptar: " + e.getMessage(), e);
        }
    }
}