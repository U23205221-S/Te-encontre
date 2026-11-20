package org.sync_astra.backendjava.util;

/**
 * Normalizes personal names for privacy-minimized public displays.
 */
public final class NameUtils {

    private NameUtils() {
    }

    /**
     * Extracts only the given first name ("nombre de pila") from a full name.
     */
    public static String extractFirstName(String fullName) {
        if (fullName == null) {
            return "Familiar";
        }
        String trimmed = fullName.trim();
        if (trimmed.isEmpty()) {
            return "Familiar";
        }
        String[] parts = trimmed.split("\\s+");
        return parts[0];
    }

    /**
     * Masks an 8-digit DNI keeping only the last 4 digits visible.
     */
    public static String maskDni(String dni) {
        if (dni == null || dni.length() < 4) {
            return "****";
        }
        return "****" + dni.substring(dni.length() - 4);
    }
}
