package org.sync_astra.backendjava.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Converter
public class DataEncrypt implements AttributeConverter<String, String> {

    @Value("${app.encryption.algorithm}")
    private String ALGORITMO;
    // Nota: Esta llave debería venir de una variable de entorno segura o un Vault
    @Value("${app.encryption.secret-key}")
    private String LLAVE_SECRETA;

    @Override
    public String convertToDatabaseColumn(String datoSensible) {
        if (datoSensible == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            SecretKeySpec key = new SecretKeySpec(LLAVE_SECRETA.getBytes(), "AES");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            return Base64.getEncoder().encodeToString(cipher.doFinal(datoSensible.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Error al encriptar: " + e.getMessage());
        }
    }

    @Override
    public String convertToEntityAttribute(String datoCifrado) {
        if (datoCifrado == null) return null;
        try {
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            SecretKeySpec key = new SecretKeySpec(LLAVE_SECRETA.getBytes(), "AES");
            cipher.init(Cipher.DECRYPT_MODE, key);
            return new String(cipher.doFinal(Base64.getDecoder().decode(datoCifrado)));
        } catch (Exception e) {
            throw new RuntimeException("Error al desencriptar: " + e.getMessage());
        }
    }
}