package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.model.EnumLookup;
import com.csit321g1.ana.aura.model.LabeledEnum;

import java.time.LocalDate;
import java.util.Locale;

/** Helpers for the optional search/filter query parameters on the list endpoints. */
final class Filters {

    private Filters() {
    }

    /** Parses an enum query parameter such as ?status=Under Review; null/blank means "no filter". */
    static <E extends Enum<E> & LabeledEnum> E parseEnum(Class<E> type, String param, String raw) {
        try {
            return EnumLookup.parse(type, raw);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid value '" + raw + "' for '" + param + "'.");
        }
    }

    static void checkRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("The 'from' date must not be after the 'to' date.");
        }
    }

    static boolean inRange(LocalDate value, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return true;
        }
        if (value == null) {
            return false;
        }
        return (from == null || !value.isBefore(from)) && (to == null || !value.isAfter(to));
    }

    /** Case-insensitive "contains" over any of the given fields; a blank query matches everything. */
    static boolean matches(String query, String... fields) {
        String q = Text.clean(query);
        if (q == null) {
            return true;
        }
        String needle = q.toLowerCase(Locale.ROOT);
        for (String f : fields) {
            if (f != null && f.toLowerCase(Locale.ROOT).contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
