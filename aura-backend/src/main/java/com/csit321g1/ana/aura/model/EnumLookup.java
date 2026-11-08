package com.csit321g1.ana.aura.model;

import java.util.Locale;

/**
 * Lenient enum parsing so the API accepts "Under Review", "UNDER_REVIEW", "under-review"
 * and "underreview" for the same value.
 */
public final class EnumLookup {

    private EnumLookup() {
    }

    private static String normalize(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    /** Returns null for null/blank input; throws IllegalArgumentException for an unknown value. */
    public static <E extends Enum<E> & LabeledEnum> E parse(Class<E> type, String input) {
        if (input == null || input.isBlank()) {
            return null;
        }
        String wanted = normalize(input);
        for (E candidate : type.getEnumConstants()) {
            if (normalize(candidate.name()).equals(wanted) || normalize(candidate.getLabel()).equals(wanted)) {
                return candidate;
            }
        }
        throw new IllegalArgumentException("Unknown " + type.getSimpleName() + ": " + input);
    }
}
