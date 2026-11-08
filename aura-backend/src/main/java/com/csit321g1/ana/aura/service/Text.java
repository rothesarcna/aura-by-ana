package com.csit321g1.ana.aura.service;

import java.util.List;
import java.util.Objects;

/** Small string helpers shared by the services. */
final class Text {

    private Text() {
    }

    /** Trims; returns null for null or blank input. */
    static String clean(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Shortens long text for use in history messages and summaries. */
    static String snippet(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.trim().replaceAll("\\s+", " ");
        return t.length() <= max ? t : t.substring(0, Math.max(0, max - 1)).trim() + "\u2026";
    }

    private static String show(Object o) {
        return o == null ? "none" : String.valueOf(o);
    }

    /** Adds "label: before -> after" to out when the two values differ. */
    static void diff(List<String> out, String label, Object before, Object after) {
        if (!Objects.equals(before, after)) {
            out.add(label + ": " + show(before) + " \u2192 " + show(after));
        }
    }

    /** Adds just the label when the two values differ (for long text such as descriptions). */
    static void diffQuiet(List<String> out, String label, Object before, Object after) {
        if (!Objects.equals(before, after)) {
            out.add(label);
        }
    }
}
