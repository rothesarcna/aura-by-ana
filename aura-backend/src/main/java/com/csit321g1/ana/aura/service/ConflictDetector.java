package com.csit321g1.ana.aura.service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** Rule-based check: two comments about the same topic that ask for opposite things. */
final class ConflictDetector {
    private ConflictDetector() {
    }

    private static final List<String[]> OPPOSITES = List.of(
            new String[]{"add", "remove"}, new String[]{"increase", "decrease"},
            new String[]{"expand", "shorten"}, new String[]{"include", "exclude"},
            new String[]{"use", "avoid"}, new String[]{"formal", "informal"},
            new String[]{"more", "less"}, new String[]{"longer", "shorter"},
            new String[]{"keep", "remove"}, new String[]{"merge", "split"});

    private static final Set<String> STOP = Set.of(
            "the", "and", "for", "are", "your", "you", "this", "that", "with", "please", "should", "would", "could");

    private static Set<String> words(String s) {
        if (s == null) return Set.of();
        return Arrays.stream(s.toLowerCase(Locale.ROOT).split("[^a-z]+"))
                .filter(w -> w.length() > 2 && !STOP.contains(w))
                .collect(Collectors.toSet());
    }

    /** Opposite verbs plus at least two shared topic words. */
    static boolean conflicts(String a, String b) {
        Set<String> wa = words(a);
        Set<String> wb = words(b);
        for (String[] p : OPPOSITES) {
            boolean opposite = (wa.contains(p[0]) && wb.contains(p[1])) || (wa.contains(p[1]) && wb.contains(p[0]));
            if (!opposite) continue;
            Set<String> shared = new HashSet<>(wa);
            shared.retainAll(wb);
            shared.remove(p[0]);
            shared.remove(p[1]);
            if (shared.size() >= 2) return true;
        }
        return false;
    }
}